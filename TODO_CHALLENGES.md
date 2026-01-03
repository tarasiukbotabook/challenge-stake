# TODO: Добавить аватарки в челленджи

## Что уже сделано ✅

1. **Донаты в отчётах**
   - Отчёты показывают сумму собранных донатов
   - Формат: "💰 Собрано донатов: $500"

2. **Улучшена функция getMy в Convex**
   - Теперь возвращает username, firstName, photoUrl
   - Данные готовы для отображения

3. **Добавлены стили для challenge-owner**
   - `.challenge-owner` - контейнер
   - `.challenge-owner-avatar` - аватарка 32x32px
   - `.challenge-owner-username` - никнейм с hover эффектом

## Что нужно доделать 🔧

### Добавить блок challenge-owner в displayChallenges

В файле `public/app.js`, функция `displayChallenges` (строка ~497):

**Найти:**
```javascript
return `
  <div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s">
    <div class="challenge-header">
      <div class="challenge-title">${challenge.title}</div>
      ${statusBadge[challenge.status]}
    </div>
```

**Заменить на:**
```javascript
return `
  <div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s">
    <div class="challenge-owner">
      <div class="challenge-owner-avatar">${challenge.photoUrl ? `<img src="${challenge.photoUrl}" alt="${challenge.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : (challenge.firstName || challenge.username || 'U').charAt(0).toUpperCase()}</div>
      <div class="challenge-owner-username" onclick="showUserProfile('${challenge.userId}')">@${challenge.username || 'Unknown'}</div>
    </div>
    <div class="challenge-header">
      <div class="challenge-title">${challenge.title}</div>
      ${statusBadge[challenge.status]}
    </div>
```

**Также изменить:**
```javascript
<div class="challenge-meta">
  <span>${challenge.username || 'Вы'}</span>
  <span>${deadline.toLocaleDateString('ru-RU')}</span>
</div>
```

**На:**
```javascript
<div class="challenge-meta">
  <span>${deadline.toLocaleDateString('ru-RU')}</span>
</div>
```

**И изменить:**
```javascript
<div style="font-size: 20px; font-weight: 700; color: #10b981;">${totalAmount}</div>
${donationsAmount > 0 ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Ставка: ${challenge.stakeAmount} + Донаты: ${donationsAmount}</div>` : ''}
```

**На:**
```javascript
<div style="font-size: 20px; font-weight: 700; color: #10b981;">$${totalAmount}</div>
${donationsAmount > 0 ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Ставка: $${challenge.stakeAmount} + Донаты: $${donationsAmount}</div>` : ''}
```

## Результат

После этих изменений челленджи будут выглядеть как в Instagram:

```
┌─────────────────────────────────┐
│ 🖼️ @username                    │ ← Аватарка и никнейм
├─────────────────────────────────┤
│ Название челленджа   [Активен]  │
│ Описание челленджа              │
│ 04.01.2026                      │
│ $1500                           │
│ Ставка: $1000 + Донаты: $500    │
│ [Кнопки действий]               │
└─────────────────────────────────┘
```

## Проблема с @Unknown

Если в профиле показывается @Unknown, проверьте консоль браузера (F12).
Должны быть логи:
```
Loading user stats for: [userId]
Stats received: {username: "...", ...}
User data: {username: "...", ...}
```

Если username пустой, проблема в базе данных - нужно проверить, что у пользователя есть username.
