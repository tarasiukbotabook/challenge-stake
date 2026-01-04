import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    telegramId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    balance: v.number(),
    premium: v.boolean(),
  }).index("by_email", ["email"])
    .index("by_telegram", ["telegramId"]),

  challenges: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    stakeAmount: v.number(),
    donationsAmount: v.optional(v.number()), // Сумма донатов
    deadline: v.string(),
    status: v.string(), // 'active', 'completed', 'failed'
    category: v.string(),
    verificationType: v.string(),
    completedAt: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  donations: defineTable({
    challengeId: v.id("challenges"),
    progressUpdateId: v.optional(v.id("progressUpdates")),
    donorUserId: v.id("users"),
    amount: v.number(),
    message: v.optional(v.string()),
  }).index("by_challenge", ["challengeId"])
    .index("by_donor", ["donorUserId"])
    .index("by_progress", ["progressUpdateId"]),

  progressUpdates: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    socialLink: v.optional(v.string()),
    likesCount: v.optional(v.number()),
    verificationStatus: v.optional(v.string()), // 'pending', 'verified', 'fake'
    verifyVotes: v.optional(v.number()), // Количество голосов "подтверждён"
    fakeVotes: v.optional(v.number()), // Количество голосов "фейк"
  }).index("by_challenge", ["challengeId"])
    .index("by_status", ["verificationStatus"]),
  
  reportVotes: defineTable({
    progressUpdateId: v.id("progressUpdates"),
    userId: v.id("users"),
    voteType: v.string(), // 'verify' or 'fake'
  }).index("by_report", ["progressUpdateId"])
    .index("by_user", ["userId"])
    .index("by_user_and_report", ["userId", "progressUpdateId"]),
  
  likes: defineTable({
    progressUpdateId: v.id("progressUpdates"),
    userId: v.id("users"),
  }).index("by_progress", ["progressUpdateId"])
    .index("by_user", ["userId"])
    .index("by_user_and_progress", ["userId", "progressUpdateId"]),

  controllers: defineTable({
    challengeId: v.id("challenges"),
    controllerUserId: v.id("users"),
    status: v.string(), // 'pending', 'accepted', 'rejected'
  }).index("by_challenge", ["challengeId"])
    .index("by_controller", ["controllerUserId"]),

  transactions: defineTable({
    userId: v.id("users"),
    challengeId: v.optional(v.id("challenges")),
    amount: v.number(),
    type: v.string(), // 'stake', 'refund', 'charity', 'deposit'
    description: v.string(),
  }).index("by_user", ["userId"]),
});
