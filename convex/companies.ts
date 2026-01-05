import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Регистрация компании
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Проверка существующей компании
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return { success: false, error: "Компания с таким email уже существует" };
    }

    // Создание компании с бесплатным планом
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      email: args.email,
      password: args.password, // В продакшене нужно хешировать!
      website: args.website,
      balance: 0,
      plan: "free",
      employeesLimit: 5,
      challengesLimit: 3,
    });

    return { success: true, companyId };
  },
});

// Вход компании
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!company || company.password !== args.password) {
      return { success: false, error: "Неверный email или пароль" };
    }

    return { success: true, companyId: company._id, company };
  },
});

// Получение информации о компании
export const getCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});

// Получение сотрудников компании
export const getEmployees = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const employeesWithUsers = await Promise.all(
      employees.map(async (emp) => {
        const user = await ctx.db.get(emp.userId);
        return {
          ...emp,
          username: user?.username,
          firstName: user?.firstName,
          lastName: user?.lastName,
          photoUrl: user?.photoUrl,
          rating: user?.rating || 0,
        };
      })
    );

    return employeesWithUsers;
  },
});

// Поиск пользователей для приглашения
export const searchUsers = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    const query = args.searchQuery.toLowerCase().trim();
    
    if (!query) {
      return [];
    }

    // Ищем по email
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", query))
      .first();

    if (byEmail) {
      return [{
        _id: byEmail._id,
        username: byEmail.username,
        email: byEmail.email,
        phone: byEmail.phone,
        firstName: byEmail.firstName,
        lastName: byEmail.lastName,
        photoUrl: byEmail.photoUrl,
        companyId: byEmail.companyId,
      }];
    }

    // Ищем по username
    const byUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", query))
      .first();

    if (byUsername) {
      return [{
        _id: byUsername._id,
        username: byUsername.username,
        email: byUsername.email,
        phone: byUsername.phone,
        firstName: byUsername.firstName,
        lastName: byUsername.lastName,
        photoUrl: byUsername.photoUrl,
        companyId: byUsername.companyId,
      }];
    }

    // Ищем по телефону
    const allUsers = await ctx.db.query("users").collect();
    const byPhone = allUsers.filter(u => u.phone && u.phone.includes(query));

    if (byPhone.length > 0) {
      return byPhone.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        firstName: u.firstName,
        lastName: u.lastName,
        photoUrl: u.photoUrl,
        companyId: u.companyId,
      }));
    }

    return [];
  },
});

// Приглашение сотрудника
export const inviteEmployee = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.string(),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Проверка лимита сотрудников
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      return { success: false, error: "Компания не найдена" };
    }

    const currentEmployees = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    if (currentEmployees.length >= company.employeesLimit) {
      return { success: false, error: "Достигнут лимит сотрудников" };
    }

    // Проверка существующего приглашения
    const existing = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company_and_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      return { success: false, error: "Сотрудник уже добавлен или приглашён" };
    }

    // Проверка, что пользователь не в другой компании
    const user = await ctx.db.get(args.userId);
    if (user?.companyId && user.companyId !== args.companyId) {
      return { success: false, error: "Пользователь уже работает в другой компании" };
    }

    // Создаём приглашение
    await ctx.db.insert("companyEmployees", {
      companyId: args.companyId,
      userId: args.userId,
      role: args.role,
      status: "invited",
      invitedBy: args.invitedBy,
    });

    // Создаём уведомление для пользователя
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "company_invite",
      title: "Приглашение в компанию",
      message: `Компания ${company.name} приглашает вас присоединиться к команде`,
      isRead: false,
      relatedId: args.companyId,
    });

    return { success: true };
  },
});

// Принятие приглашения
export const acceptInvite = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Находим приглашение
    const invite = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company_and_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId)
      )
      .first();

    if (!invite) {
      return { success: false, error: "Приглашение не найдено" };
    }

    if (invite.status !== "invited") {
      return { success: false, error: "Приглашение уже обработано" };
    }

    // Обновляем статус приглашения
    await ctx.db.patch(invite._id, {
      status: "active",
    });

    // Обновляем companyId у пользователя
    await ctx.db.patch(args.userId, {
      companyId: args.companyId,
    });

    return { success: true };
  },
});

// Отклонение приглашения
export const rejectInvite = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Находим приглашение
    const invite = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company_and_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId)
      )
      .first();

    if (!invite) {
      return { success: false, error: "Приглашение не найдено" };
    }

    // Удаляем приглашение
    await ctx.db.delete(invite._id);

    return { success: true };
  },
});

// Пополнение баланса компании
export const createChallenge = mutation({
  args: {
    companyId: v.id("companies"),
    createdBy: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    stakeAmount: v.number(),
    deadline: v.string(),
    assignedTo: v.optional(v.array(v.id("users"))),
    isTeamChallenge: v.boolean(),
    reward: v.optional(v.number()),
    rewardType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      return { success: false, error: "Компания не найдена" };
    }

    // Проверка лимита челленджей
    const activeChallenges = await ctx.db
      .query("companyChallenges")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const activeCount = activeChallenges.filter(async (cc) => {
      const challenge = await ctx.db.get(cc.challengeId);
      return challenge?.status === "active";
    }).length;

    if (activeCount >= company.challengesLimit) {
      return { success: false, error: "Достигнут лимит активных челленджей" };
    }

    // Проверка баланса компании
    if (args.stakeAmount > company.balance) {
      return {
        success: false,
        error: "Недостаточно средств на балансе компании",
        currentBalance: company.balance,
        requiredAmount: args.stakeAmount,
      };
    }

    // Создание челленджа
    const challengeId = await ctx.db.insert("challenges", {
      userId: args.createdBy,
      title: args.title,
      description: args.description,
      category: args.category,
      stakeAmount: args.stakeAmount,
      deadline: args.deadline,
      status: "active",
      verificationType: "company",
      isCompanyChallenge: true,
    });

    // Связь с компанией
    await ctx.db.insert("companyChallenges", {
      companyId: args.companyId,
      challengeId: challengeId,
      createdBy: args.createdBy,
      assignedTo: args.assignedTo,
      isTeamChallenge: args.isTeamChallenge,
      reward: args.reward,
      rewardType: args.rewardType,
    });

    // Списание со счёта компании
    await ctx.db.patch(args.companyId, {
      balance: company.balance - args.stakeAmount,
    });

    return { success: true, challengeId };
  },
});

// Получение челленджей компании
export const getChallenges = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const companyChallenges = await ctx.db
      .query("companyChallenges")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const challenges = await Promise.all(
      companyChallenges.map(async (cc) => {
        const challenge = await ctx.db.get(cc.challengeId);
        const creator = await ctx.db.get(cc.createdBy);
        
        // Получаем назначенных сотрудников
        const assigned = cc.assignedTo
          ? await Promise.all(
              cc.assignedTo.map(async (userId) => {
                const user = await ctx.db.get(userId);
                return {
                  userId,
                  username: user?.username,
                  firstName: user?.firstName,
                  photoUrl: user?.photoUrl,
                };
              })
            )
          : [];

        return {
          ...challenge,
          ...cc,
          creatorUsername: creator?.username,
          assignedEmployees: assigned,
        };
      })
    );

    return challenges;
  },
});

// Статистика компании
export const getStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("companyEmployees")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const companyChallenges = await ctx.db
      .query("companyChallenges")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const challenges = await Promise.all(
      companyChallenges.map((cc) => ctx.db.get(cc.challengeId))
    );

    const activeChallenges = challenges.filter((c) => c?.status === "active").length;
    const completedChallenges = challenges.filter((c) => c?.status === "completed").length;

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "active").length,
      totalChallenges: challenges.length,
      activeChallenges,
      completedChallenges,
    };
  },
});

// Пополнение баланса компании
export const addBalance = mutation({
  args: {
    companyId: v.id("companies"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      return { success: false, error: "Компания не найдена" };
    }

    await ctx.db.patch(args.companyId, {
      balance: company.balance + args.amount,
    });

    return { success: true };
  },
});
