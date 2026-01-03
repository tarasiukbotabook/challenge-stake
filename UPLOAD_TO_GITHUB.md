# 🚀 Загрузка на GitHub - Пошаговая инструкция

## ✅ Что уже сделано

- ✅ Git репозиторий инициализирован
- ✅ Все файлы добавлены
- ✅ Сделано 2 коммита:
  - `🎉 Initial commit: Challenge Stake - Telegram Mini App`
  - `📚 Update README and add GitHub setup guide`

## 📝 Следующие шаги

### 1️⃣ Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Заполните форму:
   ```
   Repository name: challenge-stake
   Description: 🎯 Telegram Mini App для достижения целей с денежными ставками
   Visibility: ✅ Public (рекомендуется)
   
   ❌ НЕ добавляйте:
   - README (уже есть)
   - .gitignore (уже есть)
   - License (уже есть)
   ```
3. Нажмите **"Create repository"**

### 2️⃣ Подключите remote и загрузите код

После создания репозитория выполните команды:

```bash
# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/challenge-stake.git

# Переименуйте ветку в main
git branch -M main

# Загрузите код
git push -u origin main
```

### 3️⃣ Настройте репозиторий

#### Добавьте Topics (теги)
Settings → General → Topics

Добавьте:
```
telegram-mini-app
telegram-bot
convex
vite
javascript
glassmorphism
challenge-tracker
goal-setting
productivity
gamification
```

#### Добавьте About
Settings → General → About

```
Website: https://challenge-stake.vercel.app (после деплоя)
Topics: (теги выше)
```

#### Настройте GitHub Pages (опционально)
Settings → Pages → Source: GitHub Actions

### 4️⃣ Добавьте бейджи в README

Замените `YOUR_USERNAME` на ваш username в README.md:

```markdown
![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/challenge-stake?style=social)
![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/challenge-stake?style=social)
```

Затем:
```bash
git add README.md
git commit -m "📝 Update badges with username"
git push
```

## 🎨 Создайте Social Preview

1. Settings → General → Social preview → Edit
2. Создайте картинку 1280x640px с:
   - Логотипом 🎯
   - Названием "Challenge Stake"
   - Слоганом "Достигай целей публично"
   - Скриншотом приложения
3. Загрузите картинку

## 🔐 Настройте Secrets для CI/CD

Settings → Secrets and variables → Actions → New repository secret

Добавьте (после деплоя на Vercel):
```
VERCEL_TOKEN - токен Vercel
VERCEL_ORG_ID - ID организации
VERCEL_PROJECT_ID - ID проекта
```

## 📱 Следующие шаги

### 1. Деплой на Vercel
```bash
npm i -g vercel
vercel
```

### 2. Создайте Telegram бота
См. [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

### 3. Обновите ссылки
После деплоя обновите ссылки в README:
- Демо URL
- Telegram Bot URL

### 4. Поделитесь проектом
- ⭐ Попросите друзей поставить звезду
- 📢 Поделитесь в Twitter/X
- 🚀 Опубликуйте на Product Hunt
- 💬 Поделитесь в Reddit (r/SideProject)

## 🎉 Готово!

Ваш проект теперь на GitHub! 

**Ссылка на репозиторий:**
```
https://github.com/YOUR_USERNAME/challenge-stake
```

## 💡 Полезные команды Git

```bash
# Проверить статус
git status

# Посмотреть историю
git log --oneline

# Создать новую ветку
git checkout -b feature/new-feature

# Добавить изменения
git add .

# Сделать коммит
git commit -m "✨ Add new feature"

# Загрузить на GitHub
git push

# Обновить с GitHub
git pull
```

## 🎯 Эмодзи для коммитов

```
✨ :sparkles: - Новая фича
🐛 :bug: - Исправление бага
📚 :books: - Документация
🎨 :art: - Улучшение UI/дизайна
⚡ :zap: - Улучшение производительности
🔧 :wrench: - Конфигурация
🚀 :rocket: - Деплой
♻️ :recycle: - Рефакторинг
✅ :white_check_mark: - Тесты
🔒 :lock: - Безопасность
```

## 📞 Нужна помощь?

- 📖 [GitHub Docs](https://docs.github.com)
- 💬 [GitHub Community](https://github.community)
- 🐙 [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Удачи с вашим проектом!** 🚀
