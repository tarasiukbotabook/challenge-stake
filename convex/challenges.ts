import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    stakeAmount: v.number(),
    deadline: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: "Пользователь не найден" };
    }

    if (args.stakeAmount < 1) {
      return { success: false, error: "Минимальная ставка - $1" };
    }

    if (user.balance < args.stakeAmount) {
      return { 
        success: false, 
        error: "Недостаточно средств на балансе",
        currentBalance: user.balance,
        requiredAmount: args.stakeAmount
      };
    }

    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      stakeAmount: args.stakeAmount,
      donationsAmount: 0,
      deadline: args.deadline,
      category: args.category,
      tags: args.tags || [],
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
    
    // Начисляем рейтинг за создание челленджа (+10 баллов)
    const currentRating = user.rating || 0;
    await ctx.db.patch(args.userId, {
      rating: currentRating + 10,
    });

    // Создаём уведомление о начислении рейтинга
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "rating",
      title: "Рейтинг увеличен",
      message: "Вы получили +10 баллов рейтинга за создание цели",
      amount: 10,
      isRead: false,
    });

    return { success: true, challengeId };
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
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
        };
      })
    );

    return enriched;
  },
});

export const getMy = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Обогащаем данными пользователя
    const user = await ctx.db.get(args.userId);
    
    return challenges.map(challenge => ({
      ...challenge,
      username: user?.username || "Unknown",
      firstName: user?.firstName || "",
      photoUrl: user?.photoUrl || "",
    }));
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
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const updateId = await ctx.db.insert("progressUpdates", {
      challengeId: args.challengeId,
      userId: args.userId,
      content: args.content,
      socialLink: args.socialLink,
      imageUrl: args.imageUrl,
      tags: args.tags || [],
      likesCount: 0,
      verifyVotes: 0,
      fakeVotes: 0,
      verificationStatus: "pending",
    });

    // Начисляем рейтинг за создание отчёта (+1 балл)
    const user = await ctx.db.get(args.userId);
    if (user) {
      const currentRating = user.rating || 0;
      await ctx.db.patch(args.userId, {
        rating: currentRating + 1,
      });
    }

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
    progressUpdateId: v.optional(v.id("progressUpdates")),
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

    // Получаем владельца челленджа для уведомления
    const challengeOwner = await ctx.db.get(challenge.userId);

    // Списываем с баланса донора
    await ctx.db.patch(args.donorUserId, {
      balance: donor.balance - args.amount,
    });

    // Добавляем донат
    const donationId = await ctx.db.insert("donations", {
      challengeId: args.challengeId,
      progressUpdateId: args.progressUpdateId,
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

    // Отправляем уведомление владельцу челленджа
    if (challengeOwner?.telegramId) {
      const donorName = donor.firstName || donor.username || "Аноним";
      const notificationMessage = args.message
        ? `💰 <b>Новый донат!</b>\n\nОт: @${donorName}\nСумма: $${args.amount}\nСообщение: "${args.message}"\n\nЧеллендж: ${challenge.title}`
        : `💰 <b>Новый донат!</b>\n\nОт: @${donorName}\nСумма: $${args.amount}\n\nЧеллендж: ${challenge.title}`;

      // Планируем отправку уведомления (используем scheduler)
      await ctx.scheduler.runAfter(0, "telegram:sendNotification" as any, {
        telegramId: challengeOwner.telegramId,
        message: notificationMessage,
      });
    }

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
          donorPhotoUrl: donor?.photoUrl || "",
        };
      })
    );

    return enriched;
  },
});

export const getReportDonations = query({
  args: { progressUpdateId: v.id("progressUpdates") },
  handler: async (ctx, args) => {
    const allDonations = await ctx.db
      .query("donations")
      .collect();
    
    const donations = allDonations.filter(d => d.progressUpdateId === args.progressUpdateId);

    const enriched = await Promise.all(
      donations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorUserId);
        return {
          ...donation,
          donorUsername: donor?.username || "Anonymous",
          donorFirstName: donor?.firstName || "",
          donorPhotoUrl: donor?.photoUrl || "",
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
    
    // Получаем все донаты один раз
    const allDonations = await ctx.db.query("donations").collect();

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const user = await ctx.db.get(report.userId);
        const challenge = await ctx.db.get(report.challengeId);
        
        // Фильтруем донаты для этого конкретного отчёта
        const donations = allDonations.filter(d => d.progressUpdateId === report._id);
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        
        return {
          ...report,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          challengeTitle: challenge?.title || "Unknown",
          donationsAmount: totalDonations,
          verifyVotes: report.verifyVotes || 0,
          fakeVotes: report.fakeVotes || 0,
        };
      })
    );

    return enriched;
  },
});

export const getUserReports = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Получаем все челленджи пользователя
    const userChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const challengeIds = userChallenges.map(c => c._id);
    
    // Получаем все отчёты по этим челленджам
    const allReports = await ctx.db
      .query("progressUpdates")
      .order("desc")
      .collect();
    
    const userReports = allReports.filter(report => 
      challengeIds.includes(report.challengeId)
    );
    
    // Получаем все донаты один раз
    const allDonations = await ctx.db.query("donations").collect();
    
    const enriched = await Promise.all(
      userReports.map(async (report) => {
        const user = await ctx.db.get(report.userId);
        const challenge = await ctx.db.get(report.challengeId);
        
        // Фильтруем донаты для этого конкретного отчёта
        const donations = allDonations.filter(d => d.progressUpdateId === report._id);
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        
        return {
          ...report,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          challengeTitle: challenge?.title || "Unknown",
          donationsAmount: totalDonations,
          verifyVotes: report.verifyVotes || 0,
          fakeVotes: report.fakeVotes || 0,
        };
      })
    );

    return enriched;
  },
});

// Голосование за отчёт (верифицированный или фейк)
export const voteReport = mutation({
  args: {
    progressUpdateId: v.id("progressUpdates"),
    userId: v.id("users"),
    voteType: v.string(), // 'verify' or 'fake'
    reason: v.optional(v.string()), // Причина для 'fake'
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.progressUpdateId);
    if (!report) throw new Error("Отчёт не найден");
    
    // Проверяем, голосовал ли уже пользователь
    const existingVote = await ctx.db
      .query("reportVotes")
      .withIndex("by_user_and_report", (q) => 
        q.eq("userId", args.userId).eq("progressUpdateId", args.progressUpdateId)
      )
      .first();
    
    if (existingVote) {
      // Если голос такой же - убираем
      if (existingVote.voteType === args.voteType) {
        await ctx.db.delete(existingVote._id);
        
        // Уменьшаем счётчик
        if (args.voteType === 'verify') {
          await ctx.db.patch(args.progressUpdateId, {
            verifyVotes: Math.max(0, (report.verifyVotes || 0) - 1),
          });
        } else {
          await ctx.db.patch(args.progressUpdateId, {
            fakeVotes: Math.max(0, (report.fakeVotes || 0) - 1),
          });
        }
        
        return { voted: false, voteType: null };
      } else {
        // Меняем тип голоса
        await ctx.db.patch(existingVote._id, {
          voteType: args.voteType,
          ...(args.reason && { reason: args.reason }),
        });
        
        // Обновляем счётчики
        if (args.voteType === 'verify') {
          await ctx.db.patch(args.progressUpdateId, {
            verifyVotes: (report.verifyVotes || 0) + 1,
            fakeVotes: Math.max(0, (report.fakeVotes || 0) - 1),
          });
        } else {
          await ctx.db.patch(args.progressUpdateId, {
            fakeVotes: (report.fakeVotes || 0) + 1,
            verifyVotes: Math.max(0, (report.verifyVotes || 0) - 1),
          });
        }
        
        return { voted: true, voteType: args.voteType };
      }
    } else {
      // Добавляем новый голос
      await ctx.db.insert("reportVotes", {
        progressUpdateId: args.progressUpdateId,
        userId: args.userId,
        voteType: args.voteType,
        ...(args.reason && { reason: args.reason }),
      });
      
      // Увеличиваем счётчик
      if (args.voteType === 'verify') {
        await ctx.db.patch(args.progressUpdateId, {
          verifyVotes: (report.verifyVotes || 0) + 1,
        });
      } else {
        await ctx.db.patch(args.progressUpdateId, {
          fakeVotes: (report.fakeVotes || 0) + 1,
        });
      }
      
      return { voted: true, voteType: args.voteType };
    }
  },
});

// Проверить голос пользователя
export const checkReportVote = query({
  args: {
    progressUpdateId: v.id("progressUpdates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("reportVotes")
      .withIndex("by_user_and_report", (q) => 
        q.eq("userId", args.userId).eq("progressUpdateId", args.progressUpdateId)
      )
      .first();
    
    return vote ? { voteType: vote.voteType } : null;
  },
});

// Получить активные челленджи пользователя
export const getUserActiveChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();
    
    return challenges;
  },
});

// Создать отчёт (алиас для addProgress)
export const createReport = mutation({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    content: v.string(),
    socialLink: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Челлендж не найден");
    if (challenge.userId !== args.userId) throw new Error("Нет доступа");
    if (challenge.status !== "active") throw new Error("Челлендж неактивен");

    const updateId = await ctx.db.insert("progressUpdates", {
      challengeId: args.challengeId,
      userId: args.userId,
      content: args.content,
      socialLink: args.socialLink,
      imageUrl: args.imageUrl,
      tags: args.tags || [],
      likesCount: 0,
      verifyVotes: 0,
      fakeVotes: 0,
      verificationStatus: "pending",
    });

    // Начисляем рейтинг за создание отчёта (+1 балл)
    const user = await ctx.db.get(args.userId);
    if (user) {
      const currentRating = user.rating || 0;
      await ctx.db.patch(args.userId, {
        rating: currentRating + 1,
      });

      // Создаём уведомление о начислении рейтинга
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "rating",
        title: "Рейтинг увеличен",
        message: "Вы получили +1 балл рейтинга за публикацию отчёта",
        amount: 1,
        isRead: false,
      });
    }

    return { updateId };
  },
});

// Получить список всех отчётов (алиас для getAllReports)
export const listReports = query({
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("progressUpdates")
      .order("desc")
      .take(50);
    
    const allDonations = await ctx.db.query("donations").collect();

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const user = await ctx.db.get(report.userId);
        const challenge = await ctx.db.get(report.challengeId);
        
        const donations = allDonations.filter(d => d.progressUpdateId === report._id);
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        
        return {
          ...report,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          challengeTitle: challenge?.title || "Unknown",
          donationsAmount: totalDonations,
          verifyVotes: report.verifyVotes || 0,
          fakeVotes: report.fakeVotes || 0,
        };
      })
    );

    return enriched;
  },
});

// Получить список всех челленджей (алиас для getAll)
export const listChallenges = query({
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      challenges.map(async (challenge) => {
        const user = await ctx.db.get(challenge.userId);
        
        // Подсчитываем количество участников (уникальных пользователей с отчётами)
        const allReports = await ctx.db
          .query("progressUpdates")
          .collect();
        
        const challengeReports = allReports.filter(r => r.challengeId === challenge._id);
        const uniqueUsers = new Set(challengeReports.map(r => r.userId));
        
        return {
          ...challenge,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          participantsCount: uniqueUsers.size,
        };
      })
    );

    return enriched;
  },
});


// Получить цель по ID
export const getById = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return null;

    const user = await ctx.db.get(challenge.userId);
    
    return {
      ...challenge,
      username: user?.username || 'unknown',
      firstName: user?.firstName,
      photoUrl: user?.photoUrl,
    };
  },
});

// Получить отчёты по цели
export const getChallengeReports = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("progressUpdates")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .collect();

    const allDonations = await ctx.db.query("donations").collect();

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const user = await ctx.db.get(report.userId);
        const challenge = await ctx.db.get(report.challengeId);
        
        const donations = allDonations.filter(d => d.progressUpdateId === report._id);
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        
        return {
          ...report,
          username: user?.username || "Unknown",
          firstName: user?.firstName || "",
          photoUrl: user?.photoUrl || "",
          challengeTitle: challenge?.title || "Unknown",
          donationsAmount: totalDonations,
          verifyVotes: report.verifyVotes || 0,
          fakeVotes: report.fakeVotes || 0,
        };
      })
    );

    return enriched;
  },
});

// Получить уведомления о донатах для пользователя
export const getUserDonationNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Получаем все отчёты пользователя
    const userReports = await ctx.db
      .query("progressUpdates")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const reportIds = userReports.map(r => r._id);

    // Получаем все донаты к отчётам пользователя
    const allDonations = await ctx.db.query("donations").collect();
    const userDonations = allDonations.filter(d => 
      d.progressUpdateId && reportIds.includes(d.progressUpdateId)
    );

    // Обогащаем данные информацией о донаторе
    const enriched = await Promise.all(
      userDonations.map(async (donation) => {
        const donor = await ctx.db.get(donation.donorUserId);
        const report = await ctx.db.get(donation.progressUpdateId!);
        const challenge = report ? await ctx.db.get(report.challengeId) : null;
        
        return {
          _id: donation._id,
          _creationTime: donation._creationTime,
          amount: donation.amount,
          message: donation.message,
          donorUsername: donor?.username || "Unknown",
          donorUserId: donation.donorUserId,
          challengeTitle: challenge?.title || "Unknown",
          reportContent: report?.content || "",
        };
      })
    );

    // Сортируем по времени (новые первыми)
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Удалить отчёт (прогресс-апдейт)
export const deleteProgressUpdate = mutation({
  args: {
    progressUpdateId: v.id("progressUpdates"),
  },
  handler: async (ctx, args) => {
    const progressUpdate = await ctx.db.get(args.progressUpdateId);
    
    if (!progressUpdate) {
      throw new Error("Отчёт не найден");
    }

    // Снимаем рейтинг за удаление отчёта (-1 балл)
    const user = await ctx.db.get(progressUpdate.userId);
    if (user) {
      const currentRating = user.rating || 0;
      await ctx.db.patch(progressUpdate.userId, {
        rating: Math.max(0, currentRating - 1), // Не даём рейтингу уйти в минус
      });

      // Создаём уведомление о снятии рейтинга
      await ctx.db.insert("notifications", {
        userId: progressUpdate.userId,
        type: "rating",
        title: "Рейтинг уменьшен",
        message: "С вас снято -1 балл рейтинга за удаление отчёта",
        amount: -1,
        isRead: false,
      });
    }

    // Удаляем отчёт
    await ctx.db.delete(args.progressUpdateId);

    // Удаляем все голоса за этот отчёт
    const votes = await ctx.db
      .query("reportVotes")
      .filter((q) => q.eq(q.field("progressUpdateId"), args.progressUpdateId))
      .collect();
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Удаляем все донаты к этому отчёту
    const donations = await ctx.db
      .query("donations")
      .filter((q) => q.eq(q.field("progressUpdateId"), args.progressUpdateId))
      .collect();
    
    for (const donation of donations) {
      await ctx.db.delete(donation._id);
    }

    return { success: true };
  },
});

// Удалить цель
export const deleteChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    
    if (!challenge) {
      throw new Error("Цель не найдена");
    }

    // Снимаем рейтинг за удаление цели (-10 баллов)
    const user = await ctx.db.get(challenge.userId);
    if (user) {
      const currentRating = user.rating || 0;
      await ctx.db.patch(challenge.userId, {
        rating: Math.max(0, currentRating - 10), // Не даём рейтингу уйти в минус
      });

      // Создаём уведомление о снятии рейтинга
      await ctx.db.insert("notifications", {
        userId: challenge.userId,
        type: "rating",
        title: "Рейтинг уменьшен",
        message: "С вас снято -10 баллов рейтинга за удаление цели",
        amount: -10,
        isRead: false,
      });
    }

    // Удаляем все отчёты по этой цели
    const reports = await ctx.db
      .query("progressUpdates")
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .collect();
    
    for (const report of reports) {
      // Удаляем голоса за отчёт
      const votes = await ctx.db
        .query("reportVotes")
        .filter((q) => q.eq(q.field("progressUpdateId"), report._id))
        .collect();
      
      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
      
      // Удаляем донаты к отчёту
      const donations = await ctx.db
        .query("donations")
        .filter((q) => q.eq(q.field("progressUpdateId"), report._id))
        .collect();
      
      for (const donation of donations) {
        await ctx.db.delete(donation._id);
      }
      
      await ctx.db.delete(report._id);
    }

    // Удаляем донаты к цели
    const challengeDonations = await ctx.db
      .query("donations")
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .collect();
    
    for (const donation of challengeDonations) {
      await ctx.db.delete(donation._id);
    }

    // Удаляем транзакции
    const transactions = await ctx.db.query("transactions").collect();
    const challengeTransactions = transactions.filter(t => t.challengeId === args.challengeId);
    
    for (const transaction of challengeTransactions) {
      await ctx.db.delete(transaction._id);
    }

    // Удаляем саму цель
    await ctx.db.delete(args.challengeId);

    return { success: true };
  },
});
