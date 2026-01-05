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
    console.log('=== registerTelegram called ===');
    console.log('Args:', args);
    
    const existing = await ctx.db
      .query("users")
      .withIndex("by_telegram", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (existing) {
      console.log('User already exists:', existing._id);
      throw new Error("Пользователь уже зарегистрирован");
    }

    console.log('Creating new user...');
    
    try {
      const userId = await ctx.db.insert("users", {
        telegramId: args.telegramId,
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        photoUrl: args.photoUrl,
        balance: 1000, // Стартовый бонус
        premium: false,
        rating: 0, // Начальный рейтинг
      });

      console.log('User created successfully:', userId);

      return {
        id: userId,
        username: args.username,
        firstName: args.firstName,
        lastName: args.lastName,
        photoUrl: args.photoUrl,
        balance: 1000,
        premium: false,
        rating: 0,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
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
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      photoUrl: user.photoUrl || "",
      bio: user.bio || "",
      website: user.website || "",
      rating: user.rating || 0,
      isPrivate: user.isPrivate || false,
    };
  },
});


// Получить пользователя по username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
    };
  },
});

// Обновление профиля пользователя
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");
    
    // Проверяем уникальность username только если он изменился
    if (args.username && args.username !== user.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .first();
      
      if (existingUser) {
        return { success: false, error: "Это имя пользователя уже занято" };
      }
    }
    
    await ctx.db.patch(args.userId, {
      bio: args.bio !== undefined ? args.bio : user.bio,
      website: args.website !== undefined ? args.website : user.website,
      photoUrl: args.photoUrl !== undefined ? args.photoUrl : user.photoUrl,
      firstName: args.firstName !== undefined ? args.firstName : user.firstName,
      lastName: args.lastName !== undefined ? args.lastName : user.lastName,
      username: args.username || user.username,
    });
    
    return { success: true };
  },
});

// Пополнение баланса
export const addBalance = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");
    
    if (args.amount <= 0) {
      throw new Error("Сумма должна быть больше нуля");
    }
    
    // Обновляем баланс
    await ctx.db.patch(args.userId, {
      balance: user.balance + args.amount,
    });
    
    // Создаём транзакцию
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      description: `Пополнение баланса на $${args.amount}`,
    });
    
    // Создаём уведомление
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "balance",
      title: "Баланс пополнен",
      message: `На ваш счёт зачислено $${args.amount}`,
      amount: args.amount,
      isRead: false,
    });
    
    return { success: true, newBalance: user.balance + args.amount };
  },
});

// Регистрация по номеру телефона
export const registerByPhone = mutation({
  args: {
    phone: v.string(),
    username: v.string(),
    firstName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('=== registerByPhone called ===');
    console.log('Args:', { ...args, password: '***' });
    
    // Проверяем, существует ли пользователь с таким телефоном
    const existingByPhone = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();

    if (existingByPhone) {
      throw new Error("Пользователь с таким номером телефона уже существует");
    }

    // Проверяем, существует ли пользователь с таким username
    const existingByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingByUsername) {
      throw new Error("Имя пользователя уже занято");
    }

    console.log('Creating new user with phone...');
    
    try {
      const userId = await ctx.db.insert("users", {
        phone: args.phone,
        username: args.username,
        firstName: args.firstName,
        password: args.password, // В продакшене нужно хешировать!
        balance: 0, // Нулевой баланс при регистрации
        premium: false,
        rating: 0,
      });

      console.log('User created successfully:', userId);

      return { 
        id: userId, 
        username: args.username,
        firstName: args.firstName,
        phone: args.phone,
        balance: 0,
        rating: 0,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
});

// Авторизация по номеру телефона и паролю
export const loginByPhone = query({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('=== loginByPhone called ===');
    console.log('Phone:', args.phone);
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    if (user.password !== args.password) {
      throw new Error("Неверный пароль");
    }

    console.log('Login successful:', user._id);

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      phone: user.phone,
      balance: user.balance,
      premium: user.premium,
      rating: user.rating || 0,
    };
  },
});


// Обновить настройки конфиденциальности
export const updatePrivacy = mutation({
  args: {
    userId: v.id("users"),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Пользователь не найден");
    
    await ctx.db.patch(args.userId, {
      isPrivate: args.isPrivate,
    });
    
    return { success: true };
  },
});

// Получить приглашения в компании для пользователя
export const getCompanyInvites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("companyEmployees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "invited"))
      .collect();

    const invitesWithCompanies = await Promise.all(
      invites.map(async (invite) => {
        const company = await ctx.db.get(invite.companyId);
        const inviter = invite.invitedBy ? await ctx.db.get(invite.invitedBy) : null;
        
        return {
          _id: invite._id,
          companyId: invite.companyId,
          companyName: company?.name,
          companyLogo: company?.logoUrl,
          role: invite.role,
          inviterName: inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() : 'Компания',
          _creationTime: invite._creationTime,
        };
      })
    );

    return invitesWithCompanies;
  },
});
