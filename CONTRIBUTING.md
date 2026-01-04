# 🤝 Руководство по разработке

## Структура проекта

```
challenge-stake/
├── convex/              # Backend (Convex)
│   ├── schema.ts        # Схема базы данных
│   ├── users.ts         # Функции пользователей
│   ├── challenges.ts    # Функции челленджей и отчётов
│   ├── admin.ts         # Admin панель
│   └── telegram.ts      # Telegram уведомления
├── public/              # Frontend
│   ├── index.html       # Основное приложение
│   ├── admin.html       # Admin панель
│   ├── app.js           # Основная логика (~1500 строк)
│   ├── donations-ui.js  # UI системы донатов
│   └── style.css        # Стили "Wealth & Logic"
└── ...                  # Конфигурационные файлы
```

## Разработка

### Запуск локально

```bash
# Терминал 1: Convex backend
npm run convex:dev

# Терминал 2: Frontend
npm run dev
```

### Основные команды

```bash
npm run dev          # Запуск dev сервера (Vite)
npm run build        # Сборка для production
npm run preview      # Предпросмотр production build
npm run convex:dev   # Запуск Convex в dev режиме
```

## Архитектура

### Backend (Convex)

**schema.ts** - Определяет структуру данных:
- `users` - пользователи (Telegram ID, username, баланс)
- `challenges` - челленджи (title, stake, deadline, status)
- `reports` - отчёты о прогрессе (text, photo, likes)
- `donations` - донаты (amount, isAnonymous)

**Основные функции:**

```typescript
// users.ts
- getOrCreate(telegramId) - получить/создать пользователя
- getMy() - получить текущего пользователя
- updateProfile() - обновить профиль

// challenges.ts
- create() - создать челлендж
- getAll() - получить все активные челленджи
- getMy() - получить мои челленджи
- complete() - завершить челлендж
- fail() - провалить челлендж
- addReport() - добавить отчёт
- getAllReports() - получить все отчёты
- donate() - сделать донат
- toggleLike() - лайкнуть отчёт

// admin.ts
- getStats() - статистика
- getAllUsers() - все пользователи
- getPendingReports() - отчёты на модерации
- verifyReport() - подтвердить отчёт
- markReportAsFake() - отметить как фейк

// telegram.ts
- sendDonationNotification() - уведомление о донате
```

### Frontend (Vanilla JS)

**app.js** - Основная логика:
- Инициализация Telegram WebApp SDK
- Управление экранами (feed, profile, create, settings)
- CRUD операции через Convex
- UI обновления в реальном времени

**Основные функции:**

```javascript
// Навигация
switchScreen(screenName)

// Челленджи
displayChallenges(challenges, type)
handleCreateChallenge()
showChallengeDetail(challengeId)

// Отчёты
showFeedReports()
handleAddReport()

// Профиль
loadUserProfile(userId)
handleUpdateProfile()

// Донаты
showDonationModal(challengeId)
handleDonate()
```

**donations-ui.js** - UI системы донатов:
- Модальное окно донатов
- Выбор суммы
- Анонимность
- Обработка платежа

**style.css** - Дизайн "Wealth & Logic":
- Темно-зеленая цветовая схема
- Золотые и лаймовые акценты
- Адаптивный дизайн
- Анимации и переходы

## Дизайн-система

### Цвета

```css
/* Фон */
--bg-primary: #0a1612;
--bg-secondary: #0f1f1a;
--bg-card: rgba(15, 31, 26, 0.8);

/* Акценты */
--gold: #d4af37;        /* Статус, баланс */
--lime: #84cc16;        /* Кнопки, акценты */
--emerald: #10b981;     /* Деньги, успех */
--red: #ef4444;         /* Ошибки, провал */

/* Текст */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-muted: rgba(255, 255, 255, 0.5);
```

### Компоненты

**Кнопки:**
- `.btn-primary` - основная кнопка (лайм)
- `.btn-secondary` - второстепенная (серая)
- `.btn-danger` - опасное действие (красная)

**Карточки:**
- `.challenge-card` - карточка челленджа
- `.report-card` - карточка отчёта
- `.stat-card` - карточка статистики

**Модальные окна:**
- `.modal` - базовый модал
- `.modal-content` - контент модала

## Telegram Integration

### Инициализация

```javascript
import { initMiniApp } from '@telegram-apps/sdk';

const miniApp = initMiniApp();
miniApp.ready();
```

### Основные возможности

- `miniApp.close()` - закрыть приложение
- `miniApp.setHeaderColor()` - цвет хедера
- `miniApp.setBackgroundColor()` - цвет фона
- `miniApp.enableClosingConfirmation()` - подтверждение закрытия

### Haptic Feedback

```javascript
import { hapticFeedback } from '@telegram-apps/sdk';

hapticFeedback.impactOccurred('light');  // Легкая вибрация
hapticFeedback.impactOccurred('medium'); // Средняя
hapticFeedback.impactOccurred('heavy');  // Сильная
hapticFeedback.notificationOccurred('success'); // Успех
```

## Деплой

### Vercel

```bash
vercel
```

### Convex

Production deployment автоматически обновляется при push в main ветку.

Или вручную:
```bash
npx convex deploy
```

## Тестирование

### Локальное тестирование в Telegram

1. Запустите ngrok для туннеля:
```bash
ngrok http 5173
```

2. Обновите URL в [@BotFather](https://t.me/botfather)

3. Откройте бота в Telegram

### Admin панель

Откройте `/admin.html` для доступа к admin панели:
- Статистика пользователей
- Модерация отчётов
- Управление челленджами

## Полезные ссылки

- [Convex Docs](https://docs.convex.dev)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Vite Docs](https://vitejs.dev)
- [Vercel Docs](https://vercel.com/docs)

## Вопросы?

Создайте Issue на GitHub или напишите в Discussions.
