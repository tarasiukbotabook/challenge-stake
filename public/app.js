import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://charming-toad-571.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

let currentUser = null;
let currentChallengeId = null;
let tg = null;

// Инициализация Telegram Mini App
function initTelegram() {
  if (window.Telegram?.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    // Настройка темы
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#17212b');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#232e3c');
    
    // Настройка кнопки "Назад"
    tg.BackButton.onClick(() => {
      const modals = document.querySelectorAll('.modal.active');
      if (modals.length > 0) {
        modals.forEach(modal => modal.classList.remove('active'));
        tg.BackButton.hide();
      }
    });
    
    console.log('Telegram WebApp initialized', tg.initDataUnsafe);
    return true;
  }
  console.log('Running outside Telegram');
  return false;
}

// Автоматическая авторизация через Telegram
async function autoLogin() {
  if (!tg || !tg.initDataUnsafe?.user) {
    console.log('No Telegram user data');
    return false;
  }

  const telegramUser = tg.initDataUnsafe.user;
  console.log('Telegram user:', telegramUser);

  try {
    // Пытаемся войти
    const user = await client.query(api.users.loginTelegram, {
      telegramId: telegramUser.id.toString(),
    });
    
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    console.log('Login successful:', user);
    return true;
  } catch (error) {
    console.log('User not found, registering...', error);
    
    // Если пользователя нет - регистрируем
    try {
      const result = await client.mutation(api.users.registerTelegram, {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || `user${telegramUser.id}`,
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
        photoUrl: telegramUser.photo_url || undefined,
      });
      
      currentUser = result;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      console.log('Registration successful:', result);
      
      // Показываем приветствие
      if (tg) {
        tg.showAlert(`Добро пожаловать, ${telegramUser.first_name}! 🎉\n\nВы получили стартовый бонус 1000₽!`);
      }
      
      return true;
    } catch (regError) {
      console.error('Registration failed:', regError);
      if (tg) {
        tg.showAlert('Ошибка регистрации: ' + regError.message);
      }
      return false;
    }
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  // Инициализируем Telegram
  const isTelegram = initTelegram();
  
  // Автоматическая авторизация
  const loggedIn = await autoLogin();
  
  if (loggedIn) {
    await loadUserData();
    updateGreeting();
  } else {
    // Если не в Telegram, показываем заглушку
    if (!isTelegram) {
      document.getElementById('user-greeting').textContent = 
        'Откройте приложение в Telegram для авторизации';
    }
  }

  setupEventListeners();
});

// Обновление приветствия и аватарки
function updateGreeting() {
  if (tg?.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    const firstName = user.first_name || 'Пользователь';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Обновляем имя
    document.getElementById('user-name').textContent = fullName;
    document.getElementById('user-greeting').textContent = `Привет, ${firstName}! 👋`;
    
    // Обновляем аватарку
    const avatarEl = document.getElementById('user-avatar');
    
    // Пытаемся получить фото профиля через Telegram API
    if (user.photo_url) {
      avatarEl.innerHTML = `<img src="${user.photo_url}" alt="${fullName}">`;
    } else {
      // Если нет фото, показываем инициалы
      const initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();
      avatarEl.textContent = initials;
    }
    
    console.log('User data updated:', { fullName, user });
  } else {
    console.log('No Telegram user data available');
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  document.getElementById('create-challenge-form').addEventListener('submit', handleCreateChallenge);
  document.getElementById('add-balance-form').addEventListener('submit', handleAddBalance);
  document.getElementById('add-progress-form').addEventListener('submit', handleAddProgress);
}

// Загрузка данных пользователя
async function loadUserData() {
  if (!currentUser) return;
  
  await loadStats();
  await loadChallenges('my');
}

// Загрузка статистики
async function loadStats() {
  if (!currentUser) return;
  
  try {
    const stats = await client.query(api.users.getUserStats, { userId: currentUser.id });
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-failed').textContent = stats.failed;
    document.getElementById('stat-active').textContent = stats.active;
    document.getElementById('user-balance').textContent = `${stats.balance}₽`;
    
    // Анимация чисел
    animateValue('stat-total', 0, stats.total, 1000);
    animateValue('stat-completed', 0, stats.completed, 1000);
    animateValue('stat-failed', 0, stats.failed, 1000);
    animateValue('stat-active', 0, stats.active, 1000);
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
}

// Анимация чисел
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Загрузка челленджей
async function loadChallenges(type) {
  if (!currentUser) return;
  
  try {
    let challenges;
    if (type === 'my') {
      challenges = await client.query(api.challenges.getMy, { userId: currentUser.id });
    } else {
      challenges = await client.query(api.challenges.getAll);
    }
    displayChallenges(challenges, type === 'my');
  } catch (error) {
    console.error('Ошибка загрузки челленджей:', error);
  }
}

// Отображение челленджей
function displayChallenges(challenges, isMine) {
  const container = document.getElementById('challenges-list');
  
  if (challenges.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">Пока нет челленджей</div>
        ${isMine ? '<button class="btn btn-primary" onclick="showCreateChallenge()">Создать первый челлендж</button>' : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = challenges.map((challenge, index) => {
    const deadline = new Date(challenge.deadline);
    const categoryEmoji = {
      health: '🏃',
      learning: '📚',
      business: '💼',
      habits: '🎯',
      creative: '🎨',
      other: '📌'
    };

    const statusBadge = {
      active: '<span class="challenge-badge badge-active">Активен</span>',
      completed: '<span class="challenge-badge badge-completed">Выполнен</span>',
      failed: '<span class="challenge-badge badge-failed">Провален</span>'
    };

    const actions = isMine && challenge.status === 'active' ? `
      <div class="challenge-actions">
        <button class="btn btn-sm btn-primary" onclick="window.showProgressModal('${challenge._id}')">
          📝
        </button>
        <button class="btn btn-sm btn-success" onclick="window.completeChallenge('${challenge._id}')">
          ✅
        </button>
        <button class="btn btn-sm btn-danger" onclick="window.failChallenge('${challenge._id}')">
          ❌
        </button>
      </div>
    ` : '';

    return `
      <div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s">
        <div class="challenge-header">
          <div class="challenge-title">${categoryEmoji[challenge.category] || '📌'} ${challenge.title}</div>
          ${statusBadge[challenge.status]}
        </div>
        <div class="challenge-description">${challenge.description || 'Без описания'}</div>
        <div class="challenge-meta">
          <span>👤 ${challenge.username || 'Вы'}</span>
          <span>📅 ${deadline.toLocaleDateString('ru-RU')}</span>
        </div>
        <div class="challenge-stake">${challenge.stakeAmount}₽</div>
        ${actions}
      </div>
    `;
  }).join('');
}

// Создание челленджа
async function handleCreateChallenge(e) {
  e.preventDefault();
  
  if (!currentUser) {
    if (tg) tg.showAlert('Необходима авторизация');
    return;
  }

  const challengeData = {
    userId: currentUser.id,
    title: document.getElementById('challenge-title').value,
    description: document.getElementById('challenge-description').value,
    category: document.getElementById('challenge-category').value,
    stakeAmount: parseFloat(document.getElementById('challenge-stake').value),
    deadline: document.getElementById('challenge-deadline').value
  };

  try {
    await client.mutation(api.challenges.create, challengeData);
    
    if (tg) {
      tg.showAlert('Челлендж создан! Ставка заморожена. 🎉');
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    closeModal('create-modal');
    e.target.reset();
    await loadUserData();
  } catch (error) {
    console.error('Ошибка создания челленджа:', error);
    if (tg) {
      tg.showAlert(error.message || 'Ошибка создания челленджа');
      tg.HapticFeedback.notificationOccurred('error');
    }
  }
}

// Завершение челленджа
window.completeChallenge = async function(id) {
  if (!currentUser) return;

  const confirmed = tg 
    ? await new Promise(resolve => {
        tg.showConfirm('Вы уверены, что выполнили этот челлендж?', resolve);
      })
    : confirm('Вы уверены, что выполнили этот челлендж?');

  if (!confirmed) return;

  try {
    await client.mutation(api.challenges.complete, {
      challengeId: id,
      userId: currentUser.id
    });
    
    if (tg) {
      tg.showAlert('Поздравляем! Ставка возвращена на ваш счет. 🎉');
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    await loadUserData();
  } catch (error) {
    console.error('Ошибка завершения челленджа:', error);
    if (tg) {
      tg.showAlert(error.message || 'Ошибка завершения челленджа');
      tg.HapticFeedback.notificationOccurred('error');
    }
  }
}

// Провал челленджа
window.failChallenge = async function(id) {
  if (!currentUser) return;

  const confirmed = tg
    ? await new Promise(resolve => {
        tg.showConfirm('Вы признаете провал? Деньги уйдут на благотворительность.', resolve);
      })
    : confirm('Вы признаете провал? Деньги уйдут на благотворительность.');

  if (!confirmed) return;

  try {
    await client.mutation(api.challenges.fail, {
      challengeId: id,
      userId: currentUser.id
    });
    
    if (tg) {
      tg.showAlert('Челлендж провален. Средства переведены на благотворительность.');
      tg.HapticFeedback.notificationOccurred('warning');
    }
    
    await loadUserData();
  } catch (error) {
    console.error('Ошибка обработки провала:', error);
    if (tg) {
      tg.showAlert(error.message || 'Ошибка обработки провала');
      tg.HapticFeedback.notificationOccurred('error');
    }
  }
}

// Показать модальное окно прогресса
window.showProgressModal = function(challengeId) {
  currentChallengeId = challengeId;
  document.getElementById('progress-modal').classList.add('active');
  if (tg) {
    tg.BackButton.show();
    tg.HapticFeedback.impactOccurred('light');
  }
}

// Добавление прогресса
async function handleAddProgress(e) {
  e.preventDefault();
  
  if (!currentUser || !currentChallengeId) return;

  const progressData = {
    challengeId: currentChallengeId,
    userId: currentUser.id,
    content: document.getElementById('progress-content').value,
    socialLink: document.getElementById('progress-social').value || undefined
  };

  try {
    await client.mutation(api.challenges.addProgress, progressData);
    
    if (tg) {
      tg.showAlert('Прогресс добавлен! 🎉');
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    closeModal('progress-modal');
    e.target.reset();
  } catch (error) {
    console.error('Ошибка добавления прогресса:', error);
    if (tg) {
      tg.showAlert(error.message || 'Ошибка добавления прогресса');
      tg.HapticFeedback.notificationOccurred('error');
    }
  }
}

// Пополнение баланса
async function handleAddBalance(e) {
  e.preventDefault();
  
  if (!currentUser) return;

  const amount = parseFloat(document.getElementById('balance-amount').value);

  try {
    await client.mutation(api.users.addBalance, {
      userId: currentUser.id,
      amount
    });
    
    if (tg) {
      tg.showAlert('Баланс пополнен! 💰');
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    closeModal('balance-modal');
    e.target.reset();
    await loadStats();
  } catch (error) {
    console.error('Ошибка пополнения баланса:', error);
    if (tg) {
      tg.showAlert(error.message || 'Ошибка пополнения баланса');
      tg.HapticFeedback.notificationOccurred('error');
    }
  }
}

// UI функции
window.showChallenges = function(type) {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  if (type === 'my') {
    tabs[0].classList.add('active');
  } else {
    tabs[1].classList.add('active');
  }
  
  if (tg) tg.HapticFeedback.impactOccurred('light');
  loadChallenges(type);
}

window.showCreateChallenge = function() {
  document.getElementById('create-modal').classList.add('active');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('challenge-deadline').min = tomorrow.toISOString().split('T')[0];
  
  if (tg) {
    tg.BackButton.show();
    tg.HapticFeedback.impactOccurred('medium');
  }
}

window.showAddBalance = function() {
  document.getElementById('balance-modal').classList.add('active');
  if (tg) {
    tg.BackButton.show();
    tg.HapticFeedback.impactOccurred('light');
  }
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
  if (tg) {
    tg.BackButton.hide();
  }
}
