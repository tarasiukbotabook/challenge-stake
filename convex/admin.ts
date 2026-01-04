import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Получить статистику пользователей
export const getUsersStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const challenges = await ctx.db.query("challenges").collect();
    const reports = await ctx.db.query("progressUpdates").collect();
    const transactions = await ctx.db.query("transactions").collect();
    const donations = await ctx.db.query("donations").collect();
    
    // Считаем общую сумму пополнений (deposit)
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Считаем общую сумму донатов
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    
    return {
      totalUsers: users.length,
      totalChallenges: challenges.length,
      totalReports: reports.length,
      activeChallenges: challenges.filter(c => c.status === 'active').length,
      completedChallenges: challenges.filter(c => c.status === 'completed').length,
      failedChallenges: challenges.filter(c => c.status === 'failed').length,
      totalDeposits: totalDeposits,
      totalDonations: totalDonations,
    };
  },
});

// Получить всех пользователей
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").collect();
    
    const enriched = await Promise.all(
      users.map(async (user) => {
        const challenges = await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        const reports = await ctx.db
          .query("progressUpdates")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect();
        
        return {
          ...user,
          challengesCount: challenges.length,
          reportsCount: reports.length,
          activeChallenges: challenges.filter(c => c.status === 'active').length,
        };
      })
    );
    
    return enriched;
  },
});

// Получить все отчёты для модерации
export const getAllReportsForModeration = query({
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("progressUpdates")
      .order("desc")
      .collect();
    
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
          verificationStatus: report.verificationStatus || "pending",
          verifyVotes: report.verifyVotes || 0,
          fakeVotes: report.fakeVotes || 0,
        };
      })
    );
    
    return enriched;
  },
});

// Обновить статус отчёта
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("progressUpdates"),
    status: v.string(), // 'verified', 'fake', or 'pending'
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Отчёт не найден");
    
    const user = await ctx.db.get(report.userId);
    if (!user) throw new Error("Пользователь не найден");
    
    const oldStatus = report.verificationStatus || "pending";
    const newStatus = args.status;
    
    // Обновляем статус отчёта
    await ctx.db.patch(args.reportId, {
      verificationStatus: newStatus,
    });
    
    // Управление рейтингом
    let ratingChange = 0;
    const currentRating = user.rating || 0;
    
    // Если меняем с pending на verified - добавляем баллы
    if (oldStatus === "pending" && newStatus === "verified") {
      ratingChange = 5; // +5 за подтверждённый отчёт
    }
    // Если меняем с pending на fake - снимаем баллы
    else if (oldStatus === "pending" && newStatus === "fake") {
      ratingChange = -10; // -10 за фейковый отчёт (в 2 раза больше)
    }
    // Если меняем с verified на fake - снимаем баллы и убираем ранее начисленные
    else if (oldStatus === "verified" && newStatus === "fake") {
      ratingChange = -15; // -5 (убираем начисленные) + -10 (штраф)
    }
    // Если меняем с fake на verified - добавляем баллы и убираем штраф
    else if (oldStatus === "fake" && newStatus === "verified") {
      ratingChange = 15; // +10 (убираем штраф) + +5 (награда)
    }
    // Если возвращаем на pending с verified - убираем начисленные баллы
    else if (oldStatus === "verified" && newStatus === "pending") {
      ratingChange = -5;
    }
    // Если возвращаем на pending с fake - убираем штраф
    else if (oldStatus === "fake" && newStatus === "pending") {
      ratingChange = 10;
    }
    
    // Обновляем рейтинг (не даём уйти в минус)
    if (ratingChange !== 0) {
      await ctx.db.patch(report.userId, {
        rating: Math.max(0, currentRating + ratingChange),
      });
    }
    
    return { success: true };
  },
});

// Получить детальную информацию о пользователе
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");
    
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const reports = await ctx.db
      .query("progressUpdates")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const donations = await ctx.db
      .query("donations")
      .withIndex("by_donor", (q) => q.eq("donorUserId", args.userId))
      .collect();
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return {
      user,
      challenges,
      reports,
      donations,
      transactions,
      stats: {
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter(c => c.status === 'active').length,
        completedChallenges: challenges.filter(c => c.status === 'completed').length,
        failedChallenges: challenges.filter(c => c.status === 'failed').length,
        totalReports: reports.length,
        totalDonations: donations.reduce((sum, d) => sum + d.amount, 0),
      },
    };
  },
});
