import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Регистрация через Telegram
export const registerTelegram = mutation({
  args: {
    telegramId: v.string(),
    username: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_telegram", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (existing) {
      throw new Error("Пользователь уже зарегистрирован");
    }

    const userId = await ctx.db.insert("users", {
      telegramId: args.telegramId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      photoUrl: args.photoUrl,
      balance: 1000, // Стартовый бонус
      premium: false,
    });

    return {
      id: userId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      photoUrl: args.photoUrl,
      balance: 1000,
      premium: false,
    };
  },
});

// Вход через Telegram
export const loginTelegram = query({
  args: {
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      balance: user.balance,
      premium: user.premium,
    };
  },
});

// Старые методы для совместимости
export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      password: args.password,
      balance: 0,
      premium: false,
    });

    return { userId, username: args.username };
  },
});

export const login = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || user.password !== args.password) {
      throw new Error("Неверный email или пароль");
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      premium: user.premium,
    };
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const addBalance = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");

    await ctx.db.patch(args.userId, {
      balance: user.balance + args.amount,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      description: "Пополнение баланса",
    });

    return { success: true };
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");

    const allChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const completed = allChallenges.filter((c) => c.status === "completed").length;
    const failed = allChallenges.filter((c) => c.status === "failed").length;
    const active = allChallenges.filter((c) => c.status === "active").length;

    return {
      total: allChallenges.length,
      completed,
      failed,
      active,
      balance: user.balance,
      premium: user.premium,
    };
  },
});
