# 🤖 Настройка Telegram Mini App

## 📱 Что такое Telegram Mini App?

Telegram Mini App - это веб-приложение, которое запускается внутри Telegram и имеет доступ к данным пользователя (имя, username, ID) для бесшовной авторизации.

## 🚀 Быстрая настройка

### Шаг 1: Создайте бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Введите название бота: `Challenge Stake`
4. Введите username бота: `challenge_stake_bot` (или любой доступный)
5. Сохраните токен бота (понадобится позже)

### Шаг 2: Настройте Mini App

1. Отправьте команду `/newapp` в @BotFather
2. Выберите вашего бота
3. Введите название приложения: `Challenge Stake`
4. Введите описание: `Достигай целей публично с денежными ставками`
5. Загрузите иконку (512x512 px)
6. Загрузите GIF демонстрацию (опционально)
7. **Введите URL приложения**: `https://ваш-домен.com` (или для теста: `https://localhost:3000`)

### Шаг 3: Деплой приложения

#### Вариант A: Vercel (рекомендуется)

```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel

# Скопируйте URL (например: https://challenge-stake.vercel.app)
```

#### Вариант B: Netlify

```bash
# Сборка
npm run build

# Загрузите папку dist на Netlify
```

#### Вариант C: Cloudflare Pages

```bash
# Подключите репозиторий к Cloudflare Pages
# Build command: npm run build
# Build output: dist
```

### Шаг 4: Обновите URL в BotFather

1. Отправьте `/myapps` в @BotFather
2. Выберите ваше приложение
3. Нажмите "Edit Web App URL"
4. Введите ваш продакшн URL

### Шаг 5: Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите кнопку "Открыть приложение" (или отправьте команду `/start`)
3. Приложение откроется внутри Telegram
4. Авторизация произойдет автоматически! 🎉

## 🧪 Локальное тестирование

### Вариант 1: ngrok (рекомендуется)

```bash
# Установите ngrok
brew install ngrok  # macOS
# или скачайте с https://ngrok.com

# Запустите приложение
npm run dev

# В другом терминале запустите ngrok
ngrok http 3000

# Скопируйте HTTPS URL (например: https://abc123.ngrok.io)
# Используйте его в BotFather
```

### Вариант 2: Telegram Web App Debug

1. Откройте https://web.telegram.org/k/
2. Откройте DevTools (F12)
3. В Console введите:
```javascript
Telegram.WebApp.initData = "query_id=...&user=..." // Ваши тестовые данные
```

## 🎨 Кастомизация

### Настройка темы

Приложение автоматически адаптируется под тему Telegram пользователя:

```javascript
// В app.js уже настроено
tg.themeParams.bg_color        // Цвет фона
tg.themeParams.text_color      // Цвет текста
tg.themeParams.button_color    // Цвет кнопок
```

### Кнопка "Назад"

```javascript
// Показать кнопку
tg.BackButton.show();

// Скрыть кнопку
tg.BackButton.hide();

// Обработчик
tg.BackButton.onClick(() => {
  // Ваш код
});
```

### Haptic Feedback (вибрация)

```javascript
// Легкая вибрация
tg.HapticFeedback.impactOccurred('light');

// Средняя вибрация
tg.HapticFeedback.impactOccurred('medium');

// Сильная вибрация
tg.HapticFeedback.impactOccurred('heavy');

// Уведомления
tg.HapticFeedback.notificationOccurred('success');
tg.HapticFeedback.notificationOccurred('warning');
tg.HapticFeedback.notificationOccurred('error');
```

### Алерты и подтверждения

```javascript
// Простой алерт
tg.showAlert('Сообщение');

// Подтверждение
tg.showConfirm('Вы уверены?', (confirmed) => {
  if (confirmed) {
    // Действие
  }
});

// Popup с кнопками
tg.showPopup({
  title: 'Заголовок',
  message: 'Сообщение',
  buttons: [
    { id: 'ok', type: 'ok', text: 'OK' },
    { id: 'cancel', type: 'cancel' }
  ]
}, (buttonId) => {
  console.log('Нажата кнопка:', buttonId);
});
```

## 🔐 Безопасность

### Проверка initData

В продакшене обязательно проверяйте подпись `initData`:

```javascript
// На сервере (Node.js)
const crypto = require('crypto');

function validateTelegramWebAppData(initData, botToken) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}
```

## 📱 Функции Telegram Mini App

### Доступные данные пользователя

```javascript
const user = tg.initDataUnsafe.user;
console.log(user.id);              // Telegram ID
console.log(user.first_name);      // Имя
console.log(user.last_name);       // Фамилия
console.log(user.username);        // Username
console.log(user.language_code);   // Язык (ru, en, etc)
console.log(user.is_premium);      // Telegram Premium
```

### Управление приложением

```javascript
// Развернуть на весь экран
tg.expand();

// Закрыть приложение
tg.close();

// Готовность приложения
tg.ready();

// Включить/выключить подтверждение закрытия
tg.enableClosingConfirmation();
tg.disableClosingConfirmation();
```

### Main Button (кнопка внизу)

```javascript
// Показать кнопку
tg.MainButton.setText('Создать челлендж');
tg.MainButton.show();

// Обработчик
tg.MainButton.onClick(() => {
  // Действие
});

// Скрыть кнопку
tg.MainButton.hide();

// Показать загрузку
tg.MainButton.showProgress();
tg.MainButton.hideProgress();
```

## 🎯 Примеры использования

### Поделиться челленджем

```javascript
const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(challengeUrl)}&text=${encodeURIComponent('Смотри мой челлендж!')}`;
tg.openTelegramLink(shareUrl);
```

### Открыть ссылку

```javascript
// Внутри Telegram
tg.openTelegramLink('https://t.me/channel');

// Внешняя ссылка
tg.openLink('https://example.com');
```

### Отправить данные боту

```javascript
tg.sendData(JSON.stringify({
  action: 'challenge_completed',
  challengeId: '123'
}));
```

## 🐛 Отладка

### Проверка окружения

```javascript
if (window.Telegram?.WebApp) {
  console.log('Запущено в Telegram');
  console.log('Platform:', tg.platform);
  console.log('Version:', tg.version);
} else {
  console.log('Запущено вне Telegram');
}
```

### Логирование

```javascript
// Все данные Telegram
console.log('Telegram WebApp:', tg);
console.log('Init Data:', tg.initData);
console.log('Init Data Unsafe:', tg.initDataUnsafe);
console.log('Theme Params:', tg.themeParams);
```

## 📚 Полезные ссылки

- **Документация Telegram Mini Apps**: https://core.telegram.org/bots/webapps
- **BotFather**: https://t.me/BotFather
- **Примеры**: https://github.com/telegram-mini-apps
- **SDK**: https://github.com/Telegram-Mini-Apps/telegram-apps

## 🎉 Готово!

Теперь ваше приложение работает как Telegram Mini App с:
- ✅ Бесшовной авторизацией
- ✅ Адаптацией под тему Telegram
- ✅ Haptic Feedback
- ✅ Нативными алертами
- ✅ Кнопкой "Назад"

**Откройте бота и наслаждайтесь!** 🚀
