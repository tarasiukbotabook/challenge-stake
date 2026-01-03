import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    stakeAmount: v.number(),
    deadline: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");

    if (user.balance < args.stakeAmount) {
      throw new Error("Недостаточно средств на балансе");
    }

    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      stakeAmount: args.stakeAmount,
      deadline: args.deadline,
      category: args.category,
      status: "active",
      verificationType: "social",
    });

    await ctx.db.patch(args.userId, {
      balance: user.balance - args.stakeAmount,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      challengeId,
      amount: -args.stakeAmount,
      type: "stake",
      description: "Ставка на челлендж",
    });

    return { challengeId };
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      challenges.map(async (challenge) => {
        const user = await ctx.db.get(challenge.userId);
        return {
          ...challenge,
          username: user?.username || "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const getMy = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const complete = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Челлендж не найден");
    if (challenge.userId !== args.userId) throw new Error("Нет доступа");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");

    await ctx.db.patch(args.challengeId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Возвращаем ставку + донаты
    const totalReturn = challenge.stakeAmount + (challenge.donationsAmount || 0);
    await ctx.db.patch(args.userId, {
      balance: user.balance + totalReturn,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      challengeId: args.challengeId,
      amount: totalReturn,
      type: "refund",
      description: `Возврат ставки + донаты за выполненный челлендж`,
    });

    return { success: true };
  },
});

export const fail = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Челлендж не найден");
    if (challenge.userId !== args.userId) throw new Error("Нет доступа");

    await ctx.db.patch(args.challengeId, {
      status: "failed",
    });

    // Ставка + донаты идут на благотворительность
    const totalAmount = challenge.stakeAmount + (challenge.donationsAmount || 0);
    const platformFee = totalAmount * 0.05;
    const charityAmount = totalAmount - platformFee;

    await ctx.db.insert("transactions", {
      userId: args.userId,
      challengeId: args.challengeId,
      amount: charityAmount,
      type: "charity",
      description: "Перевод на благотворительность (ставка + донаты)",
    });

    return { success: true };
  },
});

export const addProgress = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    content: v.string(),
    socialLink: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateId = await ctx.db.insert("progressUpdates", {
      challengeId: args.challengeId,
      userId: args.userId,
      content: args.content,
      socialLink: args.socialLink,
      imageUrl: args.imageUrl,
    });

    return { updateId };
  },
});

export const getProgress = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progressUpdates")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .collect();
  },
});

export const donate = mutation({
  args: {
    challengeId: v.id("challenges"),
    donorUserId: v.id("users"),
    amount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Челлендж не найден");
    if (challenge.status !== "active") throw new Error("Челлендж неактивен");

    const donor = await ctx.db.get(args.donorUserId);
    if (!donor) throw new Error("Пользователь не найден");

    if (donor.balance < args.amount) {
      throw new Error("Недостаточно средств на балансе");
    }

    // Списываем с баланса донора
    await ctx.db.patch(args.donorUserId, {
      balance: donor.balance - args.amount,
    });

    // Добавляем донат
    const donationId = await ctx.db.insert("donations", {
      challengeId: args.challengeId,
      donorUserId: args.donorUserId,
      amount: args.amount,
      message: args.message,
    });

    // Обновляем сумму донатов в челлендже
    const currentDonations = challenge.donationsAmount || 0;
    await ctx.db.patch(args.challengeId, {
      donationsAmount: currentDonations + args.amount,
    });

    // Транзакция
    await ctx.db.insert("transactions", {
      userId: args.donorUserId,
      challengeId: args.challengeId,
      amount: -args.amount,
      type: "donation",
      description: `Донат на челлендж: ${challenge.title}`,
    });

    return { donationId };
  },
});

export const getDonations = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const enriched = await Promise.all(
      donations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorUserId);
        return {
          ...donation,
          donorUsername: donor?.username || "Anonymous",
          donorFirstName: donor?.firstName || "",
        };
      })
    );

    return enriched;
  },
});

export const getAllReports = query({
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("progressUpdates")
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const user = await ctx.db.get(report.userId);
        const challenge = await ctx.db.get(report.challengeId);
        return {
          ...report,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          challengeTitle: challenge?.title || "Unknown",
        };
      })
    );

    return enriched;
  },
});
