const CONVEX_URL = "https://greedy-badger-196.convex.cloud";

// Simple Convex client using fetch
const client = {
  async query(functionName, args) {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: functionName,
        args: args || {},
        format: 'json',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Query failed');
    }
    
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.errorMessage || 'Query failed');
    }
    return data.value;
  },
  
  async mutation(functionName, args) {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: functionName,
        args: args || {},
        format: 'json',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Mutation failed');
    }
    
    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.errorMessage || 'Mutation failed');
    }
    return data.value;
  },
};

let currentUser = null;
let currentChallengeId = null;
let tg = null;

// Toast notifications
function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Haptic feedback
  if (tg) {
    tg.HapticFeedback.notificationOccurred(type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning');
  }
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Hide loading screen
function hideLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  const app = document.getElementById('app');
  
  if (!loadingScreen || !app) {
    console.error('Loading screen or app element not found');
    return;
  }
  
  loadingScreen.classList.add('fade-out');
  app.style.display = 'block';
  
  setTimeout(() => {
    if (loadingScreen.parentNode) {
      loadingScreen.remove();
    }
  }, 300);
}

// Screen navigation
function switchScreen(screenName) {
  console.log('=== switchScreen called:', screenName);
  
  const screens = document.querySelectorAll('.screen');
  const navBtns = document.querySelectorAll('.nav-btn:not(.nav-btn-add)');
  
  screens.forEach(screen => screen.classList.remove('active'));
  navBtns.forEach(btn => btn.classList.remove('active'));
  
  const targetScreen = document.getElementById(`${screenName}-screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  // Update active nav button
  const activeIndex = { main: 0, feed: 2 }[screenName];
  if (activeIndex !== undefined && navBtns[activeIndex]) {
    navBtns[activeIndex].classList.add('active');
  }
  
  // Load data for feed screen - показываем отчёты по умолчанию
  if (screenName === 'feed') {
    console.log('Loading feed reports immediately...');
    showFeedReports();
  }
  
  if (tg) {
    tg.HapticFeedback.impactOccurred('light');
  }
}

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
  console.log('=== Starting autoLogin ===');
  
  if (!tg) {
    console.log('Telegram WebApp not available');
    return false;
  }
  
  if (!tg.initDataUnsafe?.user) {
    console.log('No Telegram user data in initDataUnsafe');
    console.log('initDataUnsafe:', tg.initDataUnsafe);
    return false;
  }

  const telegramUser = tg.initDataUnsafe.user;
  console.log('Telegram user data:', {
    id: telegramUser.id,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    username: telegramUser.username,
    photo_url: telegramUser.photo_url,
  });

  try {
    console.log('Attempting login...');
    // Пытаемся войти
    const user = await client.query("users:loginTelegram", {
      telegramId: telegramUser.id.toString(),
    });
    
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    console.log('Login successful:', user);
    return true;
  } catch (error) {
    console.log('User not found, need to register');
    console.log('Login error:', error.message);
    
    // Если пользователя нет - регистрируем
    try {
      const registrationData = {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || `user${telegramUser.id}`,
        firstName: telegramUser.first_name || '',
        lastName: telegramUser.last_name || '',
      };
      
      // Добавляем photoUrl только если он есть
      if (telegramUser.photo_url) {
        registrationData.photoUrl = telegramUser.photo_url;
      }
      
      console.log('Attempting registration with data:', registrationData);
      
      const result = await client.mutation("users:registerTelegram", registrationData);
      
      currentUser = result;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      console.log('Registration successful:', result);
      
      // Показываем приветствие
      showToast(`Вы получили стартовый бонус $1000!`, 'success', `Добро пожаловать, ${telegramUser.first_name}! 🎉`);
      
      return true;
    } catch (regError) {
      console.error('=== Registration failed ===');
      console.error('Error:', regError);
      console.error('Error message:', regError.message);
      console.error('Error stack:', regError.stack);
      
      showToast(regError.message || 'Неизвестная ошибка', 'error', 'Ошибка регистрации');
      return false;
    }
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  console.log('=== App initialization started ===');
  
  const startTime = Date.now();
  const minLoadingTime = 800; // Минимальное время показа загрузки
  
  try {
    // Инициализируем Telegram
    console.log('Initializing Telegram...');
    const isTelegram = initTelegram();
    console.log('Telegram initialized:', isTelegram);
    
    // Автоматическая авторизация
    console.log('Starting auto login...');
    const loggedIn = await autoLogin();
    console.log('Login result:', loggedIn);
    
    if (loggedIn) {
      console.log('Loading user data...');
      await loadUserData(); // Ждем пока данные загрузятся
      console.log('Updating greeting...');
      updateGreeting();
    } else {
      // Если не в Telegram, показываем заглушку
      if (!isTelegram) {
        const greetingEl = document.getElementById('user-greeting');
        if (greetingEl) {
          greetingEl.textContent = 'Откройте приложение в Telegram для авторизации';
        }
      }
    }

    console.log('Setting up event listeners...');
    setupEventListeners();
    console.log('=== App initialization completed ===');
  } catch (error) {
    console.error('=== Initialization error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Убедимся что загрузка показывалась минимум minLoadingTime мс
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    console.log(`Elapsed time: ${elapsedTime}ms, waiting ${remainingTime}ms more...`);
    
    setTimeout(() => {
      console.log('Hiding loading screen...');
      hideLoading();
    }, remainingTime);
  }
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
  document.getElementById('donate-form').addEventListener('submit', handleDonate);
  document.getElementById('add-report-form').addEventListener('submit', handleAddReport);
  document.getElementById('add-report-form-page').addEventListener('submit', handleAddReportPage);
  
  // Превью фото
  document.getElementById('report-photo').addEventListener('change', handlePhotoPreview);
  document.getElementById('report-photo-page').addEventListener('change', handlePhotoPreviewPage);
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
    const stats = await client.query("users:getUserStats", { userId: currentUser.id });
    
    // Обновляем значения
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-active').textContent = stats.active;
    document.getElementById('user-balance').textContent = `$${stats.balance}`;
    
    // Показываем статистику с анимацией
    const statsEl = document.getElementById('stats-compact');
    if (statsEl) {
      statsEl.style.opacity = '1';
    }
    
    // Анимация чисел
    animateValue('stat-total', 0, stats.total, 800);
    animateValue('stat-completed', 0, stats.completed, 800);
    animateValue('stat-active', 0, stats.active, 800);
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
  
  // Определяем контейнер в зависимости от того, где мы находимся
  let container;
  if (type === 'my') {
    container = document.getElementById('challenges-list');
  } else {
    // Для 'all' всегда используем feed-list
    container = document.getElementById('feed-list');
  }
  
  if (!container) {
    console.error('Container not found for type:', type);
    return;
  }
  
  // Показываем индикатор загрузки
  container.innerHTML = `
    <div style="text-align: center; padding: 40px; opacity: 0.5;">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      <div>Загрузка...</div>
    </div>
  `;
  
  try {
    let challenges;
    if (type === 'my') {
      challenges = await client.query("challenges:getMy", { userId: currentUser.id });
    } else {
      challenges = await client.query("challenges:getAll", {});
    }
    displayChallenges(challenges, type === 'my', container);
  } catch (error) {
    console.error('Ошибка загрузки челленджей:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">❌</div>
        <div class="empty-text">Ошибка загрузки</div>
      </div>
    `;
  }
}

// Отображение челленджей
function displayChallenges(challenges, isMine, container) {
  if (!container) {
    container = document.getElementById('challenges-list');
  }
  
  if (challenges.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">🎯</div>
        <div class="empty-text">Пока нет челленджей</div>
        ${isMine ? '<button class="btn btn-primary" onclick="showCreateChallenge()" style="margin-top: 20px;">Создать первый челлендж</button>' : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = challenges.map((challenge, index) => {
    const deadline = new Date(challenge.deadline);
    const donationsAmount = challenge.donationsAmount || 0;
    const totalAmount = challenge.stakeAmount + donationsAmount;

    const statusBadge = {
      active: '<span class="challenge-badge badge-active">Активен</span>',
      completed: '<span class="challenge-badge badge-completed">Выполнен</span>',
      failed: '<span class="challenge-badge badge-failed">Провален</span>'
    };

    const actions = isMine && challenge.status === 'active' ? `
      <div class="challenge-actions">
        <button class="btn btn-sm btn-primary" onclick="window.showProgressModal('${challenge._id}')">
          Прогресс
        </button>
        <button class="btn btn-sm btn-success" onclick="window.completeChallenge('${challenge._id}')">
          Выполнен
        </button>
        <button class="btn btn-sm btn-danger" onclick="window.failChallenge('${challenge._id}')">
          Провален
        </button>
      </div>
    ` : !isMine && challenge.status === 'active' ? `
      <div class="challenge-actions">
        <button class="btn btn-sm btn-primary" onclick="window.showDonateModal('${challenge._id}')">
          💰 Поддержать
        </button>
      </div>
    ` : '';

    return `
      <div class="challenge-card ${challenge.status} animate-in" style="animation-delay: ${index * 0.1}s">
        <div class="challenge-header">
          <div class="challenge-title">${challenge.title}</div>
          ${statusBadge[challenge.status]}
        </div>
        <div class="challenge-description">${challenge.description || 'Без описания'}</div>
        <div class="challenge-meta">
          <span>${challenge.username || 'Вы'}</span>
          <span>${deadline.toLocaleDateString('ru-RU')}</span>
        </div>
        <div class="challenge-stake">
          <div style="font-size: 20px; font-weight: 700; color: #10b981;">$${totalAmount}</div>
          ${donationsAmount > 0 ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Ставка: $${challenge.stakeAmount} + Донаты: $${donationsAmount}</div>` : ''}
        </div>
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
    await client.mutation("challenges:create", challengeData);
    
    showToast('Ставка заморожена', 'success', 'Челлендж создан! 🎉');
    
    closeModal('create-modal');
    e.target.reset();
    await loadUserData();
  } catch (error) {
    console.error('Ошибка создания челленджа:', error);
    showToast(error.message || 'Ошибка создания челленджа', 'error');
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
    await client.mutation("challenges:complete", {
      challengeId: id,
      userId: currentUser.id
    });
    
    showToast('Ставка возвращена на ваш счет', 'success', 'Поздравляем! 🎉');
    
    await loadUserData();
  } catch (error) {
    console.error('Ошибка завершения челленджа:', error);
    showToast(error.message || 'Ошибка завершения челленджа', 'error');
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
    await client.mutation("challenges:fail", {
      challengeId: id,
      userId: currentUser.id
    });
    
    showToast('Средства переведены на благотворительность', 'info', 'Челлендж провален');
    
    await loadUserData();
  } catch (error) {
    console.error('Ошибка обработки провала:', error);
    showToast(error.message || 'Ошибка обработки провала', 'error');
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

// Показать модальное окно доната
window.showDonateModal = function(challengeId) {
  currentChallengeId = challengeId;
  document.getElementById('donate-modal').classList.add('active');
  if (tg) {
    tg.BackButton.show();
    tg.HapticFeedback.impactOccurred('light');
  }
}

// Показать экран добавления отчёта
window.showAddReportDirect = async function() {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  // Скрываем нижнее меню
  document.querySelector('.bottom-nav').style.display = 'none';
  
  // Загружаем активные челленджи пользователя
  try {
    const challenges = await client.query("challenges:getMy", { userId: currentUser.id });
    const activeChallenges = challenges.filter(c => c.status === 'active');
    
    if (activeChallenges.length === 0) {
      showToast('Сначала создайте челлендж', 'info');
      document.querySelector('.bottom-nav').style.display = 'flex';
      return;
    }
    
    const select = document.getElementById('report-challenge-page');
    select.innerHTML = '<option value="">Выберите челлендж</option>' + 
      activeChallenges.map(c => `<option value="${c._id}">${c.title}</option>`).join('');
    
    // Показываем экран
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('add-report-screen').classList.add('active');
    
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(closeAddReportScreen);
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка загрузки челленджей:', error);
    showToast('Ошибка загрузки челленджей', 'error');
    document.querySelector('.bottom-nav').style.display = 'flex';
  }
}

// Закрыть экран добавления отчёта
window.closeAddReportScreen = function() {
  document.querySelector('.bottom-nav').style.display = 'flex';
  switchScreen('feed');
  
  if (tg) {
    tg.BackButton.hide();
  }
}

// Превью фото для страницы
function handlePhotoPreviewPage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('photo-preview-page');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `
        <img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">
      `;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
}

// Превью фото
function handlePhotoPreview(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('photo-preview');
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `
        <img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">
      `;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
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
    await client.mutation("challenges:addProgress", progressData);
    
    showToast('Продолжайте в том же духе!', 'success', 'Прогресс добавлен! 🎉');
    
    closeModal('progress-modal');
    e.target.reset();
  } catch (error) {
    console.error('Ошибка добавления прогресса:', error);
    showToast(error.message || 'Ошибка добавления прогресса', 'error');
  }
}

// Пополнение баланса
async function handleAddBalance(e) {
  e.preventDefault();
  
  if (!currentUser) return;

  const amount = parseFloat(document.getElementById('balance-amount').value);

  try {
    await client.mutation("users:addBalance", {
      userId: currentUser.id,
      amount
    });
    
    showToast(`Баланс пополнен на $${amount}`, 'success', 'Баланс пополнен! 💰');
    
    closeModal('balance-modal');
    e.target.reset();
    await loadStats();
  } catch (error) {
    console.error('Ошибка пополнения баланса:', error);
    showToast(error.message || 'Ошибка пополнения баланса', 'error');
  }
}

// Донат на челлендж
async function handleDonate(e) {
  e.preventDefault();
  
  if (!currentUser || !currentChallengeId) return;

  const donateData = {
    challengeId: currentChallengeId,
    donorUserId: currentUser.id,
    amount: parseFloat(document.getElementById('donate-amount').value),
    message: document.getElementById('donate-message').value || undefined
  };

  try {
    await client.mutation("challenges:donate", donateData);
    
    showToast('Спасибо за поддержку!', 'success', 'Донат отправлен! 💰');
    
    closeModal('donate-modal');
    e.target.reset();
    await loadStats();
    
    // Обновляем список челленджей
    const feedList = document.getElementById('feed-list');
    if (feedList && feedList.innerHTML) {
      await loadChallenges('all');
    }
  } catch (error) {
    console.error('Ошибка доната:', error);
    showToast(error.message || 'Ошибка доната', 'error');
  }
}

// Добавление отчёта со страницы
async function handleAddReportPage(e) {
  e.preventDefault();
  
  if (!currentUser) return;

  const challengeId = document.getElementById('report-challenge-page').value;
  if (!challengeId) {
    showToast('Выберите челлендж', 'error');
    return;
  }

  const content = document.getElementById('report-content-page').value;
  const socialLink = document.getElementById('report-link-page').value || undefined;
  const photoFile = document.getElementById('report-photo-page').files[0];
  
  let imageUrl = undefined;
  
  // Если есть фото, конвертируем в base64
  if (photoFile) {
    try {
      imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      showToast('Ошибка загрузки фото', 'error');
      return;
    }
  }

  try {
    await client.mutation("challenges:addProgress", {
      challengeId,
      userId: currentUser.id,
      content,
      socialLink,
      imageUrl
    });
    
    showToast('Отчёт опубликован!', 'success', 'Отлично! 🎉');
    
    // Очищаем форму
    e.target.reset();
    document.getElementById('photo-preview-page').innerHTML = '';
    
    // Закрываем экран и переходим в ленту
    closeAddReportScreen();
    showFeedReports();
  } catch (error) {
    console.error('Ошибка добавления отчёта:', error);
    showToast(error.message || 'Ошибка добавления отчёта', 'error');
  }
}

// Добавление отчёта
async function handleAddReport(e) {
  e.preventDefault();
  
  if (!currentUser) return;

  const challengeId = document.getElementById('report-challenge').value;
  if (!challengeId) {
    showToast('Выберите челлендж', 'error');
    return;
  }

  const content = document.getElementById('report-content').value;
  const socialLink = document.getElementById('report-link').value || undefined;
  const photoFile = document.getElementById('report-photo').files[0];
  
  let imageUrl = undefined;
  
  // Если есть фото, конвертируем в base64 (для простоты, в продакшене лучше использовать хранилище)
  if (photoFile) {
    try {
      imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      showToast('Ошибка загрузки фото', 'error');
      return;
    }
  }

  try {
    await client.mutation("challenges:addProgress", {
      challengeId,
      userId: currentUser.id,
      content,
      socialLink,
      imageUrl
    });
    
    showToast('Отчёт опубликован!', 'success', 'Отлично! 🎉');
    
    closeModal('add-report-modal');
    e.target.reset();
    document.getElementById('photo-preview').innerHTML = '';
    
    // Переключаемся на ленту с отчётами
    switchScreen('feed');
    showFeedReports();
  } catch (error) {
    console.error('Ошибка добавления отчёта:', error);
    showToast(error.message || 'Ошибка добавления отчёта', 'error');
  }
}

// UI функции
window.showChallenges = function(type) {
  console.log('=== showChallenges called:', type);
  
  if (type === 'all') {
    // В ленте - переключаем на вкладку "Все челленджи"
    const tabs = document.querySelectorAll('#feed-screen .tab-btn');
    if (tabs.length >= 2) {
      tabs.forEach(tab => tab.classList.remove('active'));
      tabs[1].classList.add('active'); // Вторая вкладка
      console.log('Switched to "Все челленджи" tab');
    }
  }
  
  if (tg) tg.HapticFeedback.impactOccurred('light');
  loadChallenges(type);
}

// Показать отчёты в ленте
window.showFeedReports = async function() {
  console.log('=== showFeedReports called ===');
  
  const tabs = document.querySelectorAll('#feed-screen .tab-btn');
  if (tabs.length >= 2) {
    tabs.forEach(tab => tab.classList.remove('active'));
    tabs[0].classList.add('active'); // Первая вкладка
    console.log('Switched to "Отчёты" tab');
  }
  
  const feedList = document.getElementById('feed-list');
  
  if (!feedList) {
    console.error('feed-list element not found!');
    return;
  }
  
  // Показываем индикатор загрузки
  feedList.innerHTML = `
    <div style="text-align: center; padding: 40px; opacity: 0.5;">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      <div>Загрузка отчётов...</div>
    </div>
  `;
  
  try {
    console.log('Fetching reports...');
    const reports = await client.query("challenges:getAllReports", {});
    console.log('Reports received:', reports.length, reports);
    
    if (reports.length === 0) {
      feedList.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">📊</div>
          <div class="empty-text">Пока нет отчётов</div>
          <p style="opacity: 0.6; margin-top: 8px;">Будьте первым, кто опубликует отчёт о прогрессе!</p>
        </div>
      `;
    } else {
      console.log('Rendering reports...');
      feedList.innerHTML = reports.map((report, index) => {
        const date = new Date(report._creationTime);
        const dateStr = date.toLocaleDateString('ru-RU');
        
        // Аватарка: если есть photoUrl - показываем фото, иначе - первую букву
        const avatarHtml = report.photoUrl 
          ? `<img src="${report.photoUrl}" alt="${report.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
          : (report.firstName || report.username).charAt(0).toUpperCase();
        
        return `
          <div class="report-card animate-in" style="animation-delay: ${index * 0.1}s">
            <div class="report-header">
              <div class="report-user">
                <div class="report-avatar">${avatarHtml}</div>
                <div class="report-user-info">
                  <div class="report-username" onclick="showUserProfile('${report.userId}')">@${report.username}</div>
                  <div class="report-challenge">${report.challengeTitle}</div>
                  <div class="report-date">${dateStr}</div>
                </div>
              </div>
            </div>
            <div class="report-content">${report.content}</div>
            ${report.imageUrl ? `<img src="${report.imageUrl}" class="report-image">` : ''}
            ${report.socialLink ? `<a href="${report.socialLink}" target="_blank" class="report-link">Посмотреть пост →</a>` : ''}
          </div>
        `;
      }).join('');
      console.log('Reports rendered successfully');
    }
  } catch (error) {
    console.error('=== Error loading reports ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    feedList.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">❌</div>
        <div class="empty-text">Ошибка загрузки отчётов</div>
        <p style="opacity: 0.6; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
  
  if (tg) tg.HapticFeedback.impactOccurred('light');
}

// Эта функция удалена - используется async версия выше

window.switchScreen = switchScreen;

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

// Показать профиль пользователя
window.showUserProfile = async function(userId) {
  console.log('=== showUserProfile called:', userId);
  
  // Скрываем нижнее меню
  document.querySelector('.bottom-nav').style.display = 'none';
  
  // Показываем экран профиля
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('user-profile-screen').classList.add('active');
  
  // Показываем загрузку
  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      <div>Загрузка профиля...</div>
    </div>
  `;
  
  try {
    // Загружаем данные пользователя
    const stats = await client.query("users:getUserStats", { userId });
    const challenges = await client.query("challenges:getMy", { userId });
    
    // Получаем информацию о пользователе из первого челленджа или stats
    const user = {
      username: stats.username || 'Unknown',
      firstName: stats.firstName || '',
      photoUrl: stats.photoUrl || '',
      balance: stats.balance
    };
    
    // Аватарка
    const avatarHtml = user.photoUrl 
      ? `<img src="${user.photoUrl}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
      : (user.firstName || user.username).charAt(0).toUpperCase();
    
    profileContent.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${avatarHtml}</div>
        <h2 class="profile-username">@${user.username}</h2>
        ${user.firstName ? `<div class="profile-name">${user.firstName}</div>` : ''}
      </div>
      
      <div class="stats-compact" style="opacity: 1; margin: 20px 0;">
        <div class="stat-item">
          <div class="stat-number">${stats.total}</div>
          <div class="stat-text">Всего</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-number">${stats.completed}</div>
          <div class="stat-text">Выполнено</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-number">${stats.active}</div>
          <div class="stat-text">Активных</div>
        </div>
      </div>
      
      <div style="padding: 0 16px;">
        <h3 style="margin-bottom: 16px; font-size: 18px;">Челленджи</h3>
        <div id="user-challenges-list"></div>
      </div>
    `;
    
    // Отображаем челленджи
    const challengesList = document.getElementById('user-challenges-list');
    if (challenges.length === 0) {
      challengesList.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;">🎯</div>
          <div class="empty-text">Пока нет челленджей</div>
        </div>
      `;
    } else {
      displayChallenges(challenges, false, challengesList);
    }
    
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    profileContent.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">❌</div>
        <div class="empty-text">Ошибка загрузки профиля</div>
        <p style="opacity: 0.6; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
  
  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(closeUserProfile);
    tg.HapticFeedback.impactOccurred('light');
  }
}

// Закрыть профиль пользователя
window.closeUserProfile = function() {
  document.querySelector('.bottom-nav').style.display = 'flex';
  switchScreen('feed');
  
  if (tg) {
    tg.BackButton.hide();
  }
}
