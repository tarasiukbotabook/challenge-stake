import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Создаём тестовых пользователей
    const users = [
      {
        username: "alex_fitness",
        firstName: "Александр",
        lastName: "Петров",
        bio: "Фитнес-энтузиаст, люблю бегать по утрам 🏃‍♂️",
        website: "https://instagram.com/alex_fitness",
        photoUrl: "https://i.pravatar.cc/150?img=12",
        balance: 500,
        premium: false,
        rating: 45,
      },
      {
        username: "maria_yoga",
        firstName: "Мария",
        lastName: "Иванова",
        bio: "Инструктор йоги, медитация и здоровый образ жизни 🧘‍♀️",
        website: "https://yoga-maria.com",
        photoUrl: "https://i.pravatar.cc/150?img=5",
        balance: 750,
        premium: true,
        rating: 67,
      },
      {
        username: "dmitry_dev",
        firstName: "Дмитрий",
        lastName: "Смирнов",
        bio: "Разработчик, изучаю новые технологии 💻",
        photoUrl: "https://i.pravatar.cc/150?img=33",
        balance: 1200,
        premium: false,
        rating: 89,
      },
      {
        username: "anna_art",
        firstName: "Анна",
        lastName: "Козлова",
        bio: "Художница, рисую акварелью 🎨",
        website: "https://anna-art.com",
        photoUrl: "https://i.pravatar.cc/150?img=9",
        balance: 300,
        premium: false,
        rating: 34,
      },
      {
        username: "sergey_chef",
        firstName: "Сергей",
        lastName: "Волков",
        bio: "Шеф-повар, люблю экспериментировать с рецептами 👨‍🍳",
        photoUrl: "https://i.pravatar.cc/150?img=15",
        balance: 600,
        premium: true,
        rating: 56,
      },
    ];

    const userIds = [];
    for (const user of users) {
      const userId = await ctx.db.insert("users", user);
      userIds.push(userId);
    }

    // Создаём цели для пользователей
    const challenges = [
      {
        userId: userIds[0],
        title: "Пробежать марафон",
        description: "Хочу пробежать свой первый марафон 42км за 4 часа",
        stakeAmount: 100,
        donationsAmount: 25,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Спорт",
        tags: ["бег", "марафон", "фитнес"],
        verificationType: "photo",
      },
      {
        userId: userIds[0],
        title: "Отжиматься 100 раз",
        description: "Научиться отжиматься 100 раз подряд",
        stakeAmount: 50,
        donationsAmount: 15,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Спорт",
        tags: ["отжимания", "сила"],
        verificationType: "photo",
      },
      {
        userId: userIds[1],
        title: "Медитация каждый день",
        description: "Медитировать по 20 минут каждый день в течение месяца",
        stakeAmount: 75,
        donationsAmount: 40,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Здоровье",
        tags: ["медитация", "йога", "осознанность"],
        verificationType: "photo",
      },
      {
        userId: userIds[1],
        title: "Стойка на руках",
        description: "Научиться стоять на руках 30 секунд",
        stakeAmount: 60,
        donationsAmount: 0,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        category: "Спорт",
        tags: ["йога", "баланс"],
        verificationType: "photo",
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: userIds[2],
        title: "Выучить TypeScript",
        description: "Пройти курс по TypeScript и создать pet-project",
        stakeAmount: 150,
        donationsAmount: 30,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Образование",
        tags: ["программирование", "typescript", "обучение"],
        verificationType: "link",
      },
      {
        userId: userIds[2],
        title: "Читать по книге в неделю",
        description: "Прочитать 12 книг за 3 месяца",
        stakeAmount: 80,
        donationsAmount: 0,
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "failed",
        category: "Образование",
        tags: ["чтение", "книги"],
        verificationType: "photo",
      },
      {
        userId: userIds[3],
        title: "Нарисовать 30 картин",
        description: "Рисовать по одной картине каждый день в течение месяца",
        stakeAmount: 90,
        donationsAmount: 55,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Творчество",
        tags: ["рисование", "акварель", "искусство"],
        verificationType: "photo",
      },
      {
        userId: userIds[4],
        title: "Освоить 20 новых рецептов",
        description: "Приготовить 20 блюд, которые никогда не готовил",
        stakeAmount: 120,
        donationsAmount: 70,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        category: "Кулинария",
        tags: ["готовка", "рецепты", "еда"],
        verificationType: "photo",
      },
    ];

    const challengeIds = [];
    for (const challenge of challenges) {
      const challengeId = await ctx.db.insert("challenges", challenge);
      challengeIds.push(challengeId);
    }

    // Создаём отчёты для активных целей
    const reports = [
      {
        challengeId: challengeIds[0],
        userId: userIds[0],
        content: "Первая тренировка! Пробежал 10км за 55 минут. Чувствую себя отлично! 💪",
        verifyVotes: 5,
        fakeVotes: 0,
        likesCount: 8,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[0],
        userId: userIds[0],
        content: "Сегодня увеличил дистанцию до 15км. Ноги болят, но не сдаюсь! 🏃‍♂️",
        verifyVotes: 3,
        fakeVotes: 0,
        likesCount: 6,
        verificationStatus: "pending",
      },
      {
        challengeId: challengeIds[1],
        userId: userIds[0],
        content: "День 1: Сделал 30 отжиманий. Начало положено! 💪",
        verifyVotes: 4,
        fakeVotes: 0,
        likesCount: 5,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[2],
        userId: userIds[1],
        content: "Утренняя медитация на рассвете. Невероятное ощущение спокойствия 🧘‍♀️",
        verifyVotes: 7,
        fakeVotes: 0,
        likesCount: 12,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[2],
        userId: userIds[1],
        content: "Неделя медитаций позади! Заметила, что стала спокойнее реагировать на стресс ✨",
        verifyVotes: 6,
        fakeVotes: 0,
        likesCount: 10,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[3],
        userId: userIds[1],
        content: "Наконец-то! Простояла на руках 35 секунд! Цель достигнута! 🎉",
        verifyVotes: 10,
        fakeVotes: 0,
        likesCount: 15,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[4],
        userId: userIds[2],
        content: "Прошёл первые 3 модуля курса. TypeScript оказался проще, чем думал!",
        socialLink: "https://github.com/dmitry/typescript-project",
        verifyVotes: 4,
        fakeVotes: 0,
        likesCount: 7,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[4],
        userId: userIds[2],
        content: "Создал свой первый проект на TypeScript - todo app с типизацией 🚀",
        socialLink: "https://github.com/dmitry/typescript-todo",
        verifyVotes: 8,
        fakeVotes: 0,
        likesCount: 11,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[6],
        userId: userIds[3],
        content: "Картина #5 - закат на море. Акварель, 30x40см 🎨",
        verifyVotes: 9,
        fakeVotes: 0,
        likesCount: 14,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[6],
        userId: userIds[3],
        content: "Картина #12 - горный пейзаж. Экспериментировала с новой техникой 🏔️",
        verifyVotes: 7,
        fakeVotes: 0,
        likesCount: 13,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[7],
        userId: userIds[4],
        content: "Рецепт #3 - Тайский том ям! Получилось очень острым, но вкусным 🍜",
        verifyVotes: 6,
        fakeVotes: 0,
        likesCount: 9,
        verificationStatus: "verified",
      },
      {
        challengeId: challengeIds[7],
        userId: userIds[4],
        content: "Рецепт #8 - Французский луковый суп. Классика! 🧅",
        verifyVotes: 5,
        fakeVotes: 0,
        likesCount: 8,
        verificationStatus: "verified",
      },
    ];

    for (const report of reports) {
      await ctx.db.insert("progressUpdates", report);
    }

    // Создаём несколько донатов
    await ctx.db.insert("donations", {
      challengeId: challengeIds[0],
      donorUserId: userIds[1],
      amount: 15,
      message: "Так держать! Ты молодец! 💪",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[0],
      donorUserId: userIds[2],
      amount: 10,
      message: "Удачи на марафоне!",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[2],
      donorUserId: userIds[0],
      amount: 20,
      message: "Медитация - это сила! 🧘‍♀️",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[2],
      donorUserId: userIds[3],
      amount: 20,
      message: "Вдохновляешь! ✨",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[6],
      donorUserId: userIds[1],
      amount: 25,
      message: "Твои картины прекрасны! 🎨",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[6],
      donorUserId: userIds[4],
      amount: 30,
      message: "Продолжай творить!",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[7],
      donorUserId: userIds[2],
      amount: 35,
      message: "Обожаю твои рецепты! 👨‍🍳",
    });

    await ctx.db.insert("donations", {
      challengeId: challengeIds[7],
      donorUserId: userIds[3],
      amount: 35,
      message: "Когда откроешь ресторан? 😄",
    });

    return {
      success: true,
      message: `Создано ${users.length} пользователей, ${challenges.length} целей и ${reports.length} отчётов`,
    };
  },
});
