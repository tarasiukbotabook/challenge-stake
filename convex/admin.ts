import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Получить статистику пользователей
export const getUsersStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const challenges = await ctx.db.query("challenges").collect();
    const reports = await ctx.db.query("progressUpdates").collect();
    
    return {
      totalUsers: users.length,
      totalChallenges: challenges.length,
      totalReports: reports.length,
      activeChallenges: challenges.filter(c => c.status === 'active').length,
      completedChallenges: challenges.filter(c => c.status === 'completed').length,
      failedChallenges: challenges.filter(c => c.status === 'failed').length,
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
    status: v.string(), // 'verified' or 'fake'
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Отчёт не найден");
    
    await ctx.db.patch(args.reportId, {
      verificationStatus: args.status,
    });
    
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
