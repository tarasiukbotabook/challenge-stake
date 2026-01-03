# Исправления раздела "Лента"

## Проблема
В разделе "Лента" не загружались отчёты из базы данных, хотя они там были. Все челленджи всегда подсвечивались как активные.

## Найденные ошибки

### 1. Дублирование функции `showFeedReports`
**Проблема:** В файле `public/app.js` было две функции с именем `showFeedReports`:
- Первая (строки ~928-1020) - правильная async функция, которая загружает отчёты из БД
- Вторая (строки ~1020-1035) - неправильная синхронная функция, которая показывала только заглушку

JavaScript использует последнее определение функции, поэтому вторая функция перезаписывала первую.

**Решение:** Удалена вторая (неправильная) функция.

## Как работает исправленный код

### Переход в раздел "Лента"
1. Пользователь нажимает на кнопку "Лента" в нижнем меню
2. Вызывается `switchScreen('feed')`
3. `switchScreen` автоматически вызывает `showFeedReports()`

### Функция `showFeedReports()`
```javascript
window.showFeedReports = async function() {
  // 1. Активирует первую вкладку "Отчёты"
  tabs[0].classList.add('active');
  
  // 2. Показывает индикатор загрузки
  feedList.innerHTML = 'Загрузка отчётов...';
  
  // 3. Загружает отчёты из БД
  const reports = await client.query("challenges:getAllReports", {});
  
  // 4. Отображает отчёты или пустое состояние
  if (reports.length === 0) {
    // Показывает "Пока нет отчётов"
  } else {
    // Рендерит карточки отчётов
  }
}
```

### Функция `showChallenges('all')`
```javascript
window.showChallenges = function(type) {
  // 1. Активирует вторую вкладку "Все челленджи"
  tabs[1].classList.add('active');
  
  // 2. Вызывает loadChallenges('all')
  loadChallenges(type);
}
```

## Структура данных

### Отчёты (progressUpdates)
```javascript
{
  _id: "...",
  _creationTime: 1234567890,
  challengeId: "...",
  userId: "...",
  content: "Текст отчёта",
  imageUrl: "...", // опционально
  socialLink: "...", // опционально
  
  // Обогащённые данные из запроса:
  username: "ivan123",
  firstName: "Иван",
  challengeTitle: "Пробежать 50км"
}
```

### Челленджи (challenges)
```javascript
{
  _id: "...",
  userId: "...",
  title: "Название",
  description: "Описание",
  stakeAmount: 1000,
  donationsAmount: 500,
  deadline: "2026-02-01",
  status: "active", // active, completed, failed
  category: "health",
  
  // Обогащённые данные:
  username: "ivan123"
}
```

## Проверка работы

1. Откройте `test-feed.html` в браузере для проверки логики переключения вкладок
2. Запустите приложение: `npm run dev`
3. Перейдите в раздел "Лента"
4. По умолчанию должна быть активна вкладка "Отчёты"
5. Если в БД есть отчёты, они должны отображаться
6. При переключении на "Все челленджи" должны загружаться активные челленджи

## Дополнительные улучшения

### Добавлены console.log для отладки
- `console.log('=== switchScreen called:', screenName)`
- `console.log('=== showFeedReports called ===')`
- `console.log('Reports received:', reports.length, reports)`
- `console.log('=== showChallenges called:', type)`

Это поможет отслеживать работу функций в консоли браузера.

## Файлы изменены
- `public/app.js` - удалена дублирующая функция `showFeedReports`
