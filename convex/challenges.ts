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

    await ctx.db.patch(args.userId, {
      balance: user.balance + challenge.stakeAmount,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      challengeId: args.challengeId,
      amount: challenge.stakeAmount,
      type: "refund",
      description: "Возврат ставки за выполненный челлендж",
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

    const platformFee = challenge.stakeAmount * 0.05;
    const charityAmount = challenge.stakeAmount - platformFee;

    await ctx.db.insert("transactions", {
      userId: args.userId,
      challengeId: args.challengeId,
      amount: charityAmount,
      type: "charity",
      description: "Перевод на благотворительность",
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
  },
  handler: async (ctx, args) => {
    const updateId = await ctx.db.insert("progressUpdates", {
      challengeId: args.challengeId,
      userId: args.userId,
      content: args.content,
      socialLink: args.socialLink,
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
