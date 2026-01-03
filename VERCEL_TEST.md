# 🚀 Тестирование на Vercel

## ✅ Что уже на GitHub

Все последние изменения загружены:
- ✅ Новая цветовая схема (синий/фиолетовый)
- ✅ Исправлена регистрация через Telegram
- ✅ Правильный Convex URL
- ✅ Отображение аватарки и имени
- ✅ Детальное логирование

**Последний коммит**: `69cd018` - Fix Convex URL and regenerate API

## 🔗 Ссылки

- **GitHub**: https://github.com/tarasiukbotabook/challenge-stake
- **Convex Dashboard**: https://dashboard.convex.dev/d/greedy-badger-196
- **Convex URL**: `https://greedy-badger-196.convex.cloud`

## 🚀 Деплой на Vercel

### Автоматический (рекомендуется)

1. Подключите репозиторий к Vercel:
   - Откройте https://vercel.com/new
   - Выберите `tarasiukbotabook/challenge-stake`
   - Нажмите "Import"

2. Настройки проекта:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. Environment Variables:
   ```
   VITE_CONVEX_URL = https://greedy-badger-196.convex.cloud
   ```

4. Нажмите "Deploy"

### Через CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel

# Следуйте инструкциям
# Когда спросит про environment variables, добавьте:
# VITE_CONVEX_URL = https://greedy-badger-196.convex.cloud
```

## 🧪 Что тестировать на Vercel

### 1. Откройте приложение в браузере
- Проверьте новый дизайн (синий/фиолетовый)
- Должен быть темный фон
- Должна быть аватарка (пустая)

### 2. Откройте в Telegram Mini App

**Что должно работать:**
- ✅ Автоматическая регистрация
- ✅ Отображение вашего имени
- ✅ Отображение аватарки (или инициалов)
- ✅ Приветствие "Привет, [Ваше имя]! 👋"
- ✅ Стартовый бонус 1000₽
- ✅ Алерт "Добро пожаловать!"

### 3. Проверьте в Convex Dashboard
https://dashboard.convex.dev/d/greedy-badger-196

- Откройте таблицу `users`
- Должна появиться ваша запись с:
  - `telegramId`
  - `username`
  - `firstName`
  - `lastName`
  - `photoUrl` (если есть)
  - `balance: 1000`

## 🐛 Если ошибка

### 1. Откройте консоль браузера (F12)

Должны быть логи:
```
=== Starting autoLogin ===
Telegram user data: { id: ..., first_name: ... }
Attempting registration with data: { ... }
Registration successful: { ... }
```

### 2. Проверьте Convex Dashboard

- Откройте "Logs"
- Должны быть логи:
```
=== registerTelegram called ===
Args: { telegramId: ..., username: ... }
User created successfully: ...
```

### 3. Если все еще ошибка

Скопируйте:
1. Текст ошибки из алерта
2. Логи из консоли браузера
3. Логи из Convex Dashboard

И пришлите мне!

## 📱 Настройка Telegram бота

После успешного деплоя:

1. Откройте @BotFather
2. Отправьте `/myapps`
3. Выберите ваше приложение
4. "Edit Web App URL"
5. Введите URL с Vercel (например: `https://challenge-stake.vercel.app`)

## ✅ Чеклист

- [ ] Задеплоено на Vercel
- [ ] Environment variable добавлена
- [ ] Открывается в браузере
- [ ] Новый дизайн отображается
- [ ] URL обновлен в @BotFather
- [ ] Открывается в Telegram
- [ ] Регистрация работает
- [ ] Имя отображается
- [ ] Аватарка отображается
- [ ] Баланс 1000₽
- [ ] Запись в Convex создана

## 🎯 Ожидаемый результат

После открытия в Telegram вы должны увидеть:

```
┌─────────────────────────────────┐
│  [👤]  Ваше Имя Фамилия         │
│        Привет, Имя! 👋          │
├─────────────────────────────────┤
│  Ваш баланс                     │
│  1000₽                          │
│  [💳 Пополнить]                 │
├─────────────────────────────────┤
│  [0]      [0]                   │
│  Всего    Выполнено             │
│  [0]      [0]                   │
│  Провалено Активных             │
├─────────────────────────────────┤
│  [Мои челленджи] [Все]          │
├─────────────────────────────────┤
│  🎯 Пока нет челленджей         │
│  [Создать первый челлендж]      │
└─────────────────────────────────┘
```

И алерт:
```
Добро пожаловать, [Ваше имя]! 🎉

Вы получили стартовый бонус 1000₽!
```

---

**Удачи с тестированием!** 🚀

Если что-то не работает - пришлите скриншот и логи!
