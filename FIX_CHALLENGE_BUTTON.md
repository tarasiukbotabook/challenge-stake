# Добавить кнопку "⋮" к челленджам

## Проблема
У челленджей нет кнопки для копирования ссылки.

## Решение

В файле `public/app.js`, функция `displayChallenges` (строка ~502):

### Найти:
```javascript
<div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s">
  <div class="challenge-header">
    <div class="challenge-title">${challenge.title}</div>
    ${statusBadge[challenge.status]}
  </div>
```

### Заменить на:
```javascript
<div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s" data-challenge-id="${challenge._id}">
  <div class="challenge-header">
    <div class="challenge-title">${challenge.title}</div>
    <div style="display: flex; align-items: center; gap: 8px;">
      ${statusBadge[challenge.status]}
      <button class="btn-menu" onclick="showChallengeMenu('${challenge._id}', '${challenge.title.replace(/'/g, "\\'")}')" title="Поделиться">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
    </div>
  </div>
```

### Также заменить:
```javascript
<div style="font-size: 20px; font-weight: 700; color: #10b981;">${totalAmount}</div>
```

### На:
```javascript
<div style="font-size: 20px; font-weight: 700; color: #10b981;">$${totalAmount}</div>
```

## Что это даст:
1. ✅ Кнопка "⋮" справа от бейджа статуса
2. ✅ При клике копируется ссылка на челлендж
3. ✅ data-challenge-id для роутинга
4. ✅ Знак $ перед суммой

## 404 ошибка исправлена! ✅

Добавлены файлы:
- `vercel.json` - перенаправление всех запросов на index.html
- `vite.config.js` - historyApiFallback для локальной разработки

Теперь ссылки должны работать после деплоя на Vercel!

## Как проверить:

1. **Задеплойте на Vercel:**
```bash
git push origin main
```

2. **Подождите деплой** (1-2 минуты)

3. **Попробуйте открыть ссылку:**
   - `https://your-site.vercel.app/username`
   - `https://your-site.vercel.app/challenge/[id]`
   - `https://your-site.vercel.app/report/[id]`

4. **Локально перезапустите сервер:**
```bash
# Остановите (Ctrl+C)
npm run dev
# Теперь роутинг должен работать локально тоже
```
