import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    telegramId: v.optional(v.string()),
    phone: v.optional(v.string()), // Номер телефона
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    balance: v.number(),
    premium: v.boolean(),
    rating: v.optional(v.number()), // Рейтинг пользователя
    role: v.optional(v.string()), // Роль пользователя
    isPrivate: v.optional(v.boolean()), // Скрытый профиль
    companyId: v.optional(v.id("companies")), // Связь с компанией
  }).index("by_email", ["email"])
    .index("by_telegram", ["telegramId"])
    .index("by_username", ["username"])
    .index("by_company", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    balance: v.number(),
    plan: v.string(), // 'free', 'starter', 'business', 'enterprise'
    employeesLimit: v.number(), // Лимит сотрудников
    challengesLimit: v.number(), // Лимит активных челленджей
  }).index("by_email", ["email"]),

  companyEmployees: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.string(), // 'admin', 'manager', 'employee'
    status: v.string(), // 'active', 'invited', 'suspended'
    invitedBy: v.optional(v.id("users")),
  }).index("by_company", ["companyId"])
    .index("by_user", ["userId"])
    .index("by_company_and_user", ["companyId", "userId"]),

  companyChallenges: defineTable({
    companyId: v.id("companies"),
    challengeId: v.id("challenges"),
    createdBy: v.id("users"), // Кто создал (admin/manager)
    assignedTo: v.optional(v.array(v.id("users"))), // Кому назначен
    isTeamChallenge: v.boolean(), // Командный или индивидуальный
    reward: v.optional(v.number()), // Награда за выполнение
    rewardType: v.optional(v.string()), // 'bonus', 'gift', 'recognition'
  }).index("by_company", ["companyId"])
    .index("by_challenge", ["challengeId"])
    .index("by_creator", ["createdBy"]),

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
    tags: v.optional(v.array(v.string())), // Теги
    verificationType: v.string(),
    completedAt: v.optional(v.string()),
    isCompanyChallenge: v.optional(v.boolean()), // Корпоративный челлендж
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  donations: defineTable({
    challengeId: v.id("challenges"),
    progressUpdateId: v.optional(v.id("progressUpdates")),
    donorUserId: v.id("users"),
    amount: v.number(),
    message: v.optional(v.string()),
  }).index("by_challenge", ["challengeId"])
    .index("by_donor", ["donorUserId"]),

  progressUpdates: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    socialLink: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Теги
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
    reason: v.optional(v.string()), // Причина для голоса 'fake'
  }).index("by_report", ["progressUpdateId"])
    .index("by_user", ["userId"])
    .index("by_user_and_report", ["userId", "progressUpdateId"]),
  
  likes: defineTable({
    progressUpdateId: v.id("progressUpdates"),
    userId: v.id("users"),
  }).index("by_user", ["userId"])
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

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // 'rating', 'balance', 'donation', 'challenge', 'report'
    title: v.string(),
    message: v.string(),
    amount: v.optional(v.number()), // Для уведомлений о балансе/рейтинге
    isRead: v.boolean(),
    relatedId: v.optional(v.string()), // ID связанной сущности
  }).index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"]),
});
