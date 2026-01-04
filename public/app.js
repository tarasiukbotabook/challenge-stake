const CONVEX_URL = "https://lovable-mongoose-763.convex.cloud";

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
    success: '',
    error: '',
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
  const activeIndex = { feed: 0, main: 2 }[screenName];
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
      
      // Загружаем ленту по умолчанию
      console.log('Loading feed...');
      switchScreen('feed');
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
    
    // Обработка роутинга ПОСЛЕ загрузки пользователя
    if (loggedIn) {
      console.log('Handling routing...');
      await handleRouting();
    }
    
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
  document.getElementById('challenge-image').addEventListener('change', handleChallengeImagePreview);
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
      <div style="font-size: 32px; margin-bottom: 12px;"></div>
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
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
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
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
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

    const donateButton = !isMine && challenge.status === 'active' ? `
      <button class="btn-donate" onclick="window.showDonateModal('${challenge._id}')">
        Поддержать
      </button>
    ` : '';

    return `
      <div class="challenge-card" data-challenge-id="${challenge._id}">
        <div class="challenge-owner">
          <div class="challenge-owner-avatar">${challenge.photoUrl ? `<img src="${challenge.photoUrl}" alt="${challenge.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : (challenge.firstName || challenge.username || 'U').charAt(0).toUpperCase()}</div>
          <div style="flex: 1; min-width: 0;">
            <div class="challenge-owner-username" onclick="showUserProfile('${challenge.userId}')">@${challenge.username || 'Unknown'}</div>
            <div class="challenge-meta">
              <span>${deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
              <span>•</span>
              <span>${statusBadge[challenge.status]}</span>
            </div>
          </div>
          <button class="btn-menu" onclick="showChallengeMenu('${challenge._id}', '${challenge.title.replace(/'/g, "\\'")}' )" title="Поделиться">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
        <div class="challenge-title" onclick="window.showChallengeDetail('${challenge._id}')" style="cursor: pointer; margin-top: 8px;">${challenge.title}</div>
        <div class="challenge-stake">
          <div class="challenge-stake-amount">
            <span class="currency">$</span>
            <span class="amount">${totalAmount}</span>
            ${donationsAmount > 0 ? `<span class="challenge-stake-details" style="cursor: pointer;" onclick="event.stopPropagation(); showChallengeDonations('${challenge._id}', '${challenge.userId}')" title="Посмотреть донатеров">(${challenge.stakeAmount} + ${donationsAmount})</span>` : ''}
          </div>
          ${donateButton}
        </div>
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

  const imageFile = document.getElementById('challenge-image').files[0];
  let imageUrl = undefined;
  
  // Если есть картинка, конвертируем в base64
  if (imageFile) {
    try {
      imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      console.error('Ошибка загрузки картинки:', error);
      showToast('Ошибка загрузки картинки', 'error');
      return;
    }
  }

  const challengeData = {
    userId: currentUser.id,
    title: document.getElementById('challenge-title').value,
    description: document.getElementById('challenge-description').value,
    category: document.getElementById('challenge-category').value,
    stakeAmount: parseFloat(document.getElementById('challenge-stake').value),
    deadline: document.getElementById('challenge-deadline').value,
    imageUrl
  };

  try {
    await client.mutation("challenges:create", challengeData);
    
    showToast('Ставка заморожена', 'success', 'Челлендж создан! 🎉');
    
    closeModal('create-modal');
    e.target.reset();
    document.getElementById('challenge-image-preview').innerHTML = '';
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

// Показать модальное окно доната из отчёта
window.showDonateModalFromReport = function(challengeId, reportId, username) {
  currentChallengeId = challengeId;
  window.currentReportId = reportId; // Сохраняем ID отчёта
  
  // Обновляем заголовок модального окна
  const modalTitle = document.querySelector('#donate-modal .modal-title');
  if (modalTitle) {
    modalTitle.textContent = `Поддержать @${username}`;
  }
  
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

// Превью картинки челленджа
function handleChallengeImagePreview(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('challenge-image-preview');
  
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
    
    showToast(`Баланс пополнен на $${amount}`, 'success', 'Баланс пополнен!');
    
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
  
  // Если донат из отчёта, добавляем progressUpdateId
  if (window.currentReportId) {
    donateData.progressUpdateId = window.currentReportId;
  }

  try {
    await client.mutation("challenges:donate", donateData);
    
    showToast('Спасибо за поддержку!', 'success', 'Донат отправлен!');
    
    closeModal('donate-modal');
    e.target.reset();
    
    // Сбрасываем заголовок модального окна и reportId
    const modalTitle = document.querySelector('#donate-modal .modal-title');
    if (modalTitle) {
      modalTitle.textContent = 'Поддержать челлендж';
    }
    window.currentReportId = null;
    
    await loadStats();
    
    // Обновляем ленту если мы на ней
    const feedScreen = document.getElementById('feed-screen');
    if (feedScreen && feedScreen.classList.contains('active')) {
      const feedList = document.getElementById('feed-list');
      // Проверяем, что отображается - отчёты или челленджи
      const reportCards = feedList.querySelectorAll('.report-card');
      if (reportCards.length > 0) {
        // Обновляем отчёты
        await showFeedReports();
      } else {
        // Обновляем челленджи
        await loadChallenges('all');
      }
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
      <div style="font-size: 32px; margin-bottom: 12px;"></div>
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
          <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
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
        
        // Проверяем, это не наш отчёт
        const canDonate = currentUser && report.userId !== currentUser.id;
        
        // Сумма донатов - всегда показываем, делаем кликабельной если есть донаты
        const donationsAmount = report.donationsAmount || 0;
        const donationsText = donationsAmount > 0 
          ? `<div style="font-size: 12px; opacity: 0.8; cursor: pointer; color: #10b981;" onclick="showReportDonations('${report._id}', '${report.userId}')">💰 Собрано: $${donationsAmount}</div>`
          : `<div style="font-size: 12px; opacity: 0.6;">Собрано: $0</div>`;
        
        return `
          <div class="report-card" data-report-id="${report._id}">
            <div class="report-header">
              <div class="report-user">
                <div class="report-avatar">${avatarHtml}</div>
                <div class="report-user-info">
                  <div class="report-username" onclick="showUserProfile('${report.userId}')">@${report.username}</div>
                  <div class="report-challenge">${report.challengeTitle}</div>
                  <div class="report-date">${dateStr}</div>
                </div>
              </div>
              <button class="btn-menu" onclick="showReportMenu('${report._id}', '${report.username}')" title="Поделиться">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
            </div>
            <div class="report-content">${report.content}</div>
            ${report.imageUrl ? `<img src="${report.imageUrl}" class="report-image">` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <button class="btn-like" onclick="toggleLike('${report._id}', this)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span class="like-count">${report.likesCount || 0}</span>
                </button>
                <button class="btn-vote btn-vote-verify" onclick="toggleReportVote('${report._id}', 'verify', this)" title="Подтверждён">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span class="vote-count">${report.verifyVotes || 0}</span>
                </button>
                <button class="btn-vote btn-vote-fake" onclick="toggleReportVote('${report._id}', 'fake', this)" title="Фейк">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(180deg);">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                  <span class="vote-count">${report.fakeVotes || 0}</span>
                </button>
                ${report.socialLink ? `<a href="${report.socialLink}" target="_blank" class="report-link">Посмотреть пост →</a>` : ''}
                ${donationsText}
              </div>
              ${canDonate ? `<button class="btn-donate" onclick="showDonateModalFromReport('${report.challengeId}', '${report._id}', '${report.username}')">Поддержать</button>` : ''}
            </div>
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
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
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
  
  const isOwnProfile = currentUser && userId === currentUser.id;
  
  // Показываем экран профиля
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('user-profile-screen').classList.add('active');
  
  // Обновляем активную кнопку в навигации
  const navBtns = document.querySelectorAll('.nav-btn:not(.nav-btn-add)');
  navBtns.forEach(btn => btn.classList.remove('active'));
  navBtns[1]?.classList.add('active'); // Кнопка профиля
  
  // Показываем загрузку
  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 32px; margin-bottom: 12px;"></div>
      <div>Загрузка профиля...</div>
    </div>
  `;
  
  try {
    // Загружаем данные пользователя
    console.log('Loading user stats for:', userId);
    const stats = await client.query("users:getUserStats", { userId });
    console.log('Stats received:', stats);
    
    const challenges = await client.query("challenges:getMy", { userId });
    console.log('Challenges received:', challenges.length);
    
    // Получаем информацию о пользователе из stats
    const user = {
      username: stats.username || 'Unknown',
      firstName: stats.firstName || '',
      photoUrl: stats.photoUrl || '',
      balance: stats.balance
    };
    
    console.log('User data:', user);
    
    // Аватарка
    const avatarHtml = user.photoUrl 
      ? `<img src="${user.photoUrl}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
      : (user.firstName || user.username).charAt(0).toUpperCase();
    
    // Баланс показываем только для своего профиля
    const balanceSection = isOwnProfile ? `
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px;">
        <div style="background: rgba(16, 185, 129, 0.1); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
          <span style="font-size: 14px; opacity: 0.7; margin-right: 8px;">Баланс:</span>
          <span style="font-size: 18px; font-weight: 700; color: #10b981;">$${user.balance}</span>
        </div>
        <button class="btn-icon" onclick="showAddBalance()" title="Пополнить">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    ` : '';
    
    // Кнопка настроек только для своего профиля
    const settingsButton = isOwnProfile ? `
      <button class="btn-icon" onclick="showProfileSettings()" title="Настройки профиля" style="position: absolute; top: 20px; right: 20px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
        </svg>
      </button>
    ` : '';
    
    // Био и сайт
    const bioSection = (stats.bio || stats.website) ? `
      <div style="padding: 0 20px; margin-top: 12px; text-align: center;">
        ${stats.bio ? `<p style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">${stats.bio}</p>` : ''}
        ${stats.website ? `<a href="${stats.website}" target="_blank" style="font-size: 14px; color: #8b5cf6; text-decoration: none;">🔗 ${stats.website.replace(/^https?:\/\//, '')}</a>` : ''}
      </div>
    ` : '';
    
    profileContent.innerHTML = `
      <div class="profile-header" style="position: relative;">
        ${settingsButton}
        <div class="profile-avatar">${avatarHtml}</div>
        <h2 class="profile-username" onclick="shareProfile('${user.username}')" style="cursor: pointer;">@${user.username}</h2>
        ${user.firstName ? `<div class="profile-name">${user.firstName}</div>` : ''}
        ${bioSection}
        ${balanceSection}
      </div>
      
      <div class="stats-compact" style="opacity: 1; margin: 20px 16px;">
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
      
      ${isOwnProfile ? `
        <div style="padding: 0 16px 16px;">
          <button class="btn btn-primary btn-block" onclick="showCreateChallenge()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Создать челлендж
          </button>
        </div>
      ` : ''}
      
      <div style="padding: 0;">
        <!-- Tabs -->
        <div class="tabs" style="padding: 16px; background: rgba(26, 31, 38, 0.3);">
          <button class="tab-btn active" onclick="showProfileTab('${userId}', 'challenges')">
            Челленджи
          </button>
          <button class="tab-btn" onclick="showProfileTab('${userId}', 'reports')">
            Отчёты
          </button>
        </div>
        
        <div id="profile-content-area"></div>
      </div>
    `;
    
    // Загружаем челленджи по умолчанию
    await showProfileTab(userId, 'challenges');
    
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
    profileContent.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
        <div class="empty-text">Ошибка загрузки профиля</div>
        <p style="opacity: 0.6; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
  
  if (tg) {
    tg.HapticFeedback.impactOccurred('light');
  }
}

// Показать свой профиль
window.showMyProfile = function() {
  if (currentUser) {
    showUserProfile(currentUser.id);
  } else {
    showToast('Необходима авторизация', 'error');
  }
}

// Лайкнуть отчёт
window.toggleLike = async function(reportId, buttonElement) {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    const result = await client.mutation("challenges:toggleLike", {
      progressUpdateId: reportId,
      userId: currentUser.id
    });
    
    // Обновляем UI
    const likeCount = buttonElement.querySelector('.like-count');
    const currentCount = parseInt(likeCount.textContent) || 0;
    
    if (result.liked) {
      buttonElement.classList.add('liked');
      likeCount.textContent = currentCount + 1;
    } else {
      buttonElement.classList.remove('liked');
      likeCount.textContent = Math.max(0, currentCount - 1);
    }
    
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка лайка:', error);
    showToast('Ошибка', 'error');
  }
}

// Голосовать за отчёт (подтверждён/фейк)
window.toggleReportVote = async function(reportId, voteType, buttonElement) {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    const result = await client.mutation("challenges:voteReport", {
      progressUpdateId: reportId,
      userId: currentUser.id,
      voteType: voteType
    });
    
    // Обновляем UI
    const voteCount = buttonElement.querySelector('.vote-count');
    const currentCount = parseInt(voteCount.textContent) || 0;
    
    // Находим обе кнопки голосования для этого отчёта
    const reportCard = buttonElement.closest('.report-card');
    const verifyBtn = reportCard.querySelector('.btn-vote-verify');
    const fakeBtn = reportCard.querySelector('.btn-vote-fake');
    
    if (result.voted) {
      // Голос добавлен или изменён
      if (voteType === 'verify') {
        verifyBtn.classList.add('voted');
        fakeBtn.classList.remove('voted');
        
        // Обновляем счётчики
        const verifyCount = verifyBtn.querySelector('.vote-count');
        const fakeCount = fakeBtn.querySelector('.vote-count');
        
        if (result.voteType === voteType) {
          // Новый голос
          verifyCount.textContent = currentCount + 1;
        } else {
          // Изменили голос с fake на verify
          verifyCount.textContent = currentCount + 1;
          fakeCount.textContent = Math.max(0, parseInt(fakeCount.textContent) - 1);
        }
      } else {
        fakeBtn.classList.add('voted');
        verifyBtn.classList.remove('voted');
        
        // Обновляем счётчики
        const verifyCount = verifyBtn.querySelector('.vote-count');
        const fakeCount = fakeBtn.querySelector('.vote-count');
        
        if (result.voteType === voteType) {
          // Новый голос
          fakeCount.textContent = currentCount + 1;
        } else {
          // Изменили голос с verify на fake
          fakeCount.textContent = currentCount + 1;
          verifyCount.textContent = Math.max(0, parseInt(verifyCount.textContent) - 1);
        }
      }
    } else {
      // Голос убран
      buttonElement.classList.remove('voted');
      voteCount.textContent = Math.max(0, currentCount - 1);
    }
    
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка голосования:', error);
    showToast('Ошибка', 'error');
  }
}


// Функции для шаринга
const APP_URL = window.location.origin;

// Поделиться профилем
window.shareProfile = function(username) {
  const url = `${APP_URL}/${username}`;
  copyToClipboard(url, `Ссылка на профиль ${username} скопирована!`);
}

// Поделиться челленджем
window.showChallengeMenu = function(challengeId, title) {
  const url = `${APP_URL}/challenge/${challengeId}`;
  copyToClipboard(url, `Ссылка на челлендж "${title}" скопирована!`);
}

// Поделиться отчётом
window.showReportMenu = function(reportId, username) {
  const url = `${APP_URL}/report/${reportId}`;
  copyToClipboard(url, `Ссылка на отчёт @${username} скопирована!`);
}

// Копировать в буфер обмена
function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMessage, 'success');
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    }).catch(err => {
      console.error('Ошибка копирования:', err);
      fallbackCopyToClipboard(text, successMessage);
    });
  } else {
    fallbackCopyToClipboard(text, successMessage);
  }
}

// Fallback для старых браузеров
function fallbackCopyToClipboard(text, successMessage) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showToast(successMessage, 'success');
    if (tg) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  } catch (err) {
    console.error('Fallback: Ошибка копирования', err);
    showToast('Не удалось скопировать ссылку', 'error');
  }
  
  document.body.removeChild(textArea);
}


// Роутинг
async function handleRouting() {
  const path = window.location.pathname;
  console.log('Current path:', path);
  
  // Главная страница
  if (path === '/' || path === '/index.html') {
    return;
  }
  
  // Профиль пользователя: /username
  if (path.startsWith('/') && !path.includes('/challenge/') && !path.includes('/report/') && path.length > 1) {
    const username = path.substring(1); // Убираем первый /
    if (username) {
      console.log('Opening profile for username:', username);
      
      try {
        // Ищем пользователя по username
        const user = await client.query("users:getUserByUsername", { username });
        await showUserProfile(user.id);
      } catch (error) {
        console.error('Error loading user profile:', error);
        showToast(`Пользователь ${username} не найден`, 'error');
      }
    }
    return;
  }
  
  // Челлендж: /challenge/[id]
  if (path.startsWith('/challenge/')) {
    const challengeId = path.replace('/challenge/', '');
    console.log('Opening challenge:', challengeId);
    
    try {
      // Переходим в ленту и показываем челлендж
      switchScreen('feed');
      await showChallenges('all');
      
      // Прокручиваем к челленджу (опционально)
      setTimeout(() => {
        const challengeCard = document.querySelector(`[data-challenge-id="${challengeId}"]`);
        if (challengeCard) {
          challengeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          challengeCard.style.animation = 'pulse 1s ease';
        }
      }, 500);
    } catch (error) {
      console.error('Error loading challenge:', error);
      showToast('Ошибка загрузки челленджа', 'error');
    }
    return;
  }
  
  // Отчёт: /report/[id]
  if (path.startsWith('/report/')) {
    const reportId = path.replace('/report/', '');
    console.log('Opening report:', reportId);
    
    try {
      // Переходим в ленту и показываем отчёты
      switchScreen('feed');
      await showFeedReports();
      
      // Прокручиваем к отчёту (опционально)
      setTimeout(() => {
        const reportCard = document.querySelector(`[data-report-id="${reportId}"]`);
        if (reportCard) {
          reportCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          reportCard.style.animation = 'pulse 1s ease';
        }
      }, 500);
    } catch (error) {
      console.error('Error loading report:', error);
      showToast('Ошибка загрузки отчёта', 'error');
    }
    return;
  }
}

// Добавляем data-атрибуты для идентификации карточек
// Это нужно добавить в функции отображения

// Показать детали челленджа
window.showChallengeDetail = async function(challengeId) {
  console.log('=== showChallengeDetail called:', challengeId);
  
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    // Загружаем данные челленджа
    const challenges = await client.query("challenges:getMy", { userId: currentUser.id });
    const challenge = challenges.find(c => c._id === challengeId);
    
    if (!challenge) {
      // Если это не наш челлендж, загружаем из общего списка
      const allChallenges = await client.query("challenges:getAll", {});
      const foundChallenge = allChallenges.find(c => c._id === challengeId);
      
      if (!foundChallenge) {
        showToast('Челлендж не найден', 'error');
        return;
      }
      
      // Показываем детали чужого челленджа (без кнопок управления)
      showChallengeDetailModal(foundChallenge, false);
      return;
    }
    
    // Показываем детали своего челленджа
    showChallengeDetailModal(challenge, true);
    
  } catch (error) {
    console.error('Ошибка загрузки челленджа:', error);
    showToast('Ошибка загрузки челленджа', 'error');
  }
}

// Показать модальное окно с деталями челленджа
// Показать модальное окно с деталями челленджа
async function showChallengeDetailModal(challenge, isMine) {
  const deadline = new Date(challenge.deadline);
  const donationsAmount = challenge.donationsAmount || 0;
  const totalAmount = challenge.stakeAmount + donationsAmount;
  
  const statusBadge = {
    active: '<span class="challenge-badge badge-active">Активен</span>',
    completed: '<span class="challenge-badge badge-completed">Выполнен</span>',
    failed: '<span class="challenge-badge badge-failed">Провален</span>'
  };
  
  // Кнопки управления только для своих активных челленджей
  const actionButtons = isMine && challenge.status === 'active' ? `
    <div style="display: flex; gap: 12px; margin-top: 20px;">
      <button class="btn btn-success" onclick="completeChallenge('${challenge._id}'); closeModal('challenge-detail-modal');" style="flex: 1;">
         Выполнен
      </button>
      <button class="btn btn-danger" onclick="failChallenge('${challenge._id}'); closeModal('challenge-detail-modal');" style="flex: 1;">
         Провален
      </button>
    </div>
  ` : '';
  
  // Создаем модальное окно если его еще нет
  let modal = document.getElementById('challenge-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'challenge-detail-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Детали челленджа</h2>
        <button class="close" onclick="closeModal('challenge-detail-modal')">✕</button>
      </div>
      
      <div style="padding: 20px;">
        <div class="challenge-owner" style="margin-bottom: 16px; padding: 0; border: none;">
          <div class="challenge-owner-avatar" style="width: 40px; height: 40px; font-size: 16px;">${challenge.photoUrl ? `<img src="${challenge.photoUrl}" alt="${challenge.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : (challenge.firstName || challenge.username || 'U').charAt(0).toUpperCase()}</div>
          <div class="challenge-owner-username" style="font-size: 15px; font-weight: 600; opacity: 1;" onclick="showUserProfile('${challenge.userId}'); closeModal('challenge-detail-modal');">@${challenge.username || 'Unknown'}</div>
        </div>
        
        ${challenge.imageUrl ? `<img src="${challenge.imageUrl}" style="width: 100%; border-radius: 12px; margin-bottom: 16px;">` : ''}
        
        <h3 style="font-size: 20px; margin-bottom: 8px;">${challenge.title}</h3>
        ${statusBadge[challenge.status]}
        
        <p style="margin: 16px 0; opacity: 0.8;">${challenge.description || 'Без описания'}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
          <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px;">
            <div style="font-size: 13px; opacity: 0.6;">Категория</div>
            <div style="font-size: 16px; margin-top: 4px;">${getCategoryName(challenge.category)}</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px;">
            <div style="font-size: 13px; opacity: 0.6;">Дедлайн</div>
            <div style="font-size: 16px; margin-top: 4px;">${deadline.toLocaleDateString('ru-RU')}</div>
          </div>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(16, 185, 129, 0.2);">
          <div style="font-size: 13px; opacity: 0.6; margin-bottom: 8px;">Сумма</div>
          <div style="font-size: 24px; font-weight: 700; color: #10b981;">$${totalAmount}</div>
          ${donationsAmount > 0 ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 4px;">Ставка: $${challenge.stakeAmount} + Донаты: $${donationsAmount}</div>` : ''}
        </div>
        
        <div id="challenge-reports-section" style="margin-top: 24px;">
          <h4 style="font-size: 16px; margin-bottom: 12px; opacity: 0.8;">История отчётов</h4>
          <div id="challenge-reports-list" style="text-align: center; padding: 20px; opacity: 0.5;">
            <div style="font-size: 24px; margin-bottom: 8px;"></div>
            <div style="font-size: 14px;">Загрузка...</div>
          </div>
        </div>
        
        ${actionButtons}
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  
  // Загружаем отчёты для этого челленджа
  loadChallengeReports(challenge._id);
  
  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => closeModal('challenge-detail-modal'));
    tg.HapticFeedback.impactOccurred('medium');
  }
}

// Загрузить отчёты для челленджа
async function loadChallengeReports(challengeId) {
  const reportsList = document.getElementById('challenge-reports-list');
  
  if (!reportsList) return;
  
  try {
    const reports = await client.query("challenges:getProgress", { challengeId });
    
    if (reports.length === 0) {
      reportsList.innerHTML = `
        <div style="text-align: center; padding: 20px; opacity: 0.5;">
          <div style="font-size: 32px; margin-bottom: 8px;"></div>
          <div style="font-size: 14px;">Пока нет отчётов</div>
        </div>
      `;
      return;
    }
    
    reportsList.innerHTML = reports.map((report, index) => {
      const date = new Date(report._creationTime);
      const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      
      return `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px; text-align: left;">
          <div style="font-size: 13px; opacity: 0.6; margin-bottom: 6px;">${dateStr}</div>
          <div style="font-size: 14px; line-height: 1.4;">${report.content}</div>
          ${report.imageUrl ? `<img src="${report.imageUrl}" style="width: 100%; border-radius: 8px; margin-top: 8px;">` : ''}
          ${report.socialLink ? `<a href="${report.socialLink}" target="_blank" style="display: inline-block; margin-top: 8px; font-size: 13px; color: #8b5cf6; text-decoration: none;">Посмотреть пост →</a>` : ''}
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Ошибка загрузки отчётов:', error);
    reportsList.innerHTML = `
      <div style="text-align: center; padding: 20px; opacity: 0.5;">
        <div style="font-size: 32px; margin-bottom: 8px;"></div>
        <div style="font-size: 14px;">Ошибка загрузки</div>
      </div>
    `;
  }
}

// Получить название категории
function getCategoryName(category) {
  const categories = {
    health: ' Здоровье и спорт',
    learning: ' Обучение',
    business: ' Бизнес',
    habits: ' Привычки',
    creative: ' Творчество',
    other: ' Другое'
  };
  return categories[category] || category;
}

// Показать настройки профиля
window.showProfileSettings = async function() {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    // Загружаем текущие данные профиля
    const stats = await client.query("users:getUserStats", { userId: currentUser.id });
    
    // Заполняем форму текущими значениями
    document.getElementById('profile-bio').value = stats.bio || '';
    document.getElementById('profile-website').value = stats.website || '';
    
    // Показываем модальное окно
    document.getElementById('profile-settings-modal').classList.add('active');
    
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => closeModal('profile-settings-modal'));
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
    showToast('Ошибка загрузки настроек', 'error');
  }
}

// Обработка формы настроек профиля
document.addEventListener('DOMContentLoaded', () => {
  const settingsForm = document.getElementById('profile-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleUpdateProfile);
  }
});

// Обновить профиль
async function handleUpdateProfile(e) {
  e.preventDefault();
  
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  const bio = document.getElementById('profile-bio').value.trim();
  const website = document.getElementById('profile-website').value.trim();
  
  try {
    await client.mutation("users:updateProfile", {
      userId: currentUser.id,
      bio: bio || undefined,
      website: website || undefined
    });
    
    showToast('Профиль обновлён!', 'success');
    
    closeModal('profile-settings-modal');
    
    // Обновляем отображение профиля
    await showUserProfile(currentUser.id);
    
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    showToast(error.message || 'Ошибка обновления профиля', 'error');
  }
}


// Показать донатеров отчёта
window.showReportDonations = async function(reportId) {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    const donations = await client.query("challenges:getReportDonations", { 
      progressUpdateId: reportId 
    });
    
    if (donations.length === 0) {
      showToast('Пока нет донатов', 'info');
      return;
    }
    
    // Создаем модальное окно для отображения донатеров
    let modal = document.getElementById('donations-list-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'donations-list-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
    
    const donationsList = donations.map(donation => {
      const avatarHtml = donation.donorPhotoUrl 
        ? `<img src="${donation.donorPhotoUrl}" alt="${donation.donorUsername}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : (donation.donorFirstName || donation.donorUsername).charAt(0).toUpperCase();
      
      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; overflow: hidden; flex-shrink: 0;">
            ${avatarHtml}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">@${donation.donorUsername}</div>
            ${donation.message ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 2px;">${donation.message}</div>` : ''}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #10b981;">$${donation.amount}</div>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Донатеры (${donations.length})</h2>
          <button class="close" onclick="closeModal('donations-list-modal')">✕</button>
        </div>
        <div style="padding: 20px; max-height: 60vh; overflow-y: auto;">
          ${donationsList}
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => closeModal('donations-list-modal'));
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка загрузки донатов:', error);
    showToast('Ошибка загрузки донатов', 'error');
  }
}

// Показать донатеров челленджа
window.showChallengeDonations = async function(challengeId) {
  if (!currentUser) {
    showToast('Необходима авторизация', 'error');
    return;
  }
  
  try {
    const donations = await client.query("challenges:getDonations", { 
      challengeId: challengeId 
    });
    
    if (donations.length === 0) {
      showToast('Пока нет донатов', 'info');
      return;
    }
    
    // Создаем модальное окно для отображения донатеров
    let modal = document.getElementById('donations-list-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'donations-list-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
    
    const donationsList = donations.map(donation => {
      const avatarHtml = donation.donorPhotoUrl 
        ? `<img src="${donation.donorPhotoUrl}" alt="${donation.donorUsername}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : (donation.donorFirstName || donation.donorUsername).charAt(0).toUpperCase();
      
      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; overflow: hidden; flex-shrink: 0;">
            ${avatarHtml}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">@${donation.donorUsername}</div>
            ${donation.message ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 2px;">${donation.message}</div>` : ''}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #10b981;">$${donation.amount}</div>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Донатеры (${donations.length})</h2>
          <button class="close" onclick="closeModal('donations-list-modal')">✕</button>
        </div>
        <div style="padding: 20px; max-height: 60vh; overflow-y: auto;">
          ${donationsList}
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => closeModal('donations-list-modal'));
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка загрузки донатов:', error);
    showToast('Ошибка загрузки донатов', 'error');
  }
}


// Переключение вкладок в профиле
window.showProfileTab = async function(userId, tab) {
  const isOwnProfile = currentUser && userId === currentUser.id;
  
  // Обновляем активную вкладку
  const tabs = document.querySelectorAll('#user-profile-screen .tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'challenges') {
    tabs[0]?.classList.add('active');
  } else {
    tabs[1]?.classList.add('active');
  }
  
  const contentArea = document.getElementById('profile-content-area');
  
  if (!contentArea) {
    console.error('profile-content-area not found');
    return;
  }
  
  // Показываем загрузку
  contentArea.innerHTML = `
    <div style="text-align: center; padding: 40px; opacity: 0.5;">
      <div style="font-size: 32px; margin-bottom: 12px;"></div>
      <div>Загрузка...</div>
    </div>
  `;
  
  try {
    if (tab === 'challenges') {
      // Загружаем челленджи
      const challenges = await client.query("challenges:getMy", { userId });
      
      if (challenges.length === 0) {
        contentArea.innerHTML = `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;"></div>
            <div class="empty-text">Пока нет челленджей</div>
          </div>
        `;
      } else {
        contentArea.innerHTML = '<div id="user-challenges-list" style="padding: 8px;"></div>';
        const challengesList = document.getElementById('user-challenges-list');
        displayChallenges(challenges, isOwnProfile, challengesList);
      }
    } else if (tab === 'reports') {
      // Загружаем отчёты пользователя
      const reports = await client.query("challenges:getUserReports", { userId });
      
      if (reports.length === 0) {
        contentArea.innerHTML = `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;"></div>
            <div class="empty-text">Пока нет отчётов</div>
          </div>
        `;
      } else {
        // Отображаем отчёты (используем тот же формат что и в ленте)
        contentArea.innerHTML = '<div id="user-reports-list" style="padding: 8px; display: flex; flex-direction: column; gap: 8px;"></div>';
        const reportsList = document.getElementById('user-reports-list');
        
        reportsList.innerHTML = reports.map(report => {
          const date = new Date(report._creationTime);
          const dateStr = date.toLocaleDateString('ru-RU');
          
          const avatarHtml = report.photoUrl 
            ? `<img src="${report.photoUrl}" alt="${report.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
            : (report.firstName || report.username).charAt(0).toUpperCase();
          
          const canDonate = currentUser && report.userId !== currentUser.id;
          const donationsAmount = report.donationsAmount || 0;
          const donationsText = donationsAmount > 0 
            ? `<div style="font-size: 12px; opacity: 0.8; cursor: pointer; color: #10b981;" onclick="showReportDonations('${report._id}', '${report.userId}')">💰 Собрано: $${donationsAmount}</div>`
            : `<div style="font-size: 12px; opacity: 0.6;">Собрано: $0</div>`;
          
          return `
            <div class="report-card" data-report-id="${report._id}">
              <div class="report-header">
                <div class="report-user">
                  <div class="report-avatar">${avatarHtml}</div>
                  <div class="report-user-info">
                    <div class="report-username" onclick="showUserProfile('${report.userId}')">@${report.username}</div>
                    <div class="report-challenge">${report.challengeTitle}</div>
                    <div class="report-date">${dateStr}</div>
                  </div>
                </div>
                <button class="btn-menu" onclick="showReportMenu('${report._id}', '${report.username}')" title="Поделиться">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>
              <div class="report-content">${report.content}</div>
              ${report.imageUrl ? `<img src="${report.imageUrl}" class="report-image">` : ''}
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <button class="btn-like" onclick="toggleLike('${report._id}', this)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span class="like-count">${report.likesCount || 0}</span>
                  </button>
                  <button class="btn-vote btn-vote-verify" onclick="toggleReportVote('${report._id}', 'verify', this)" title="Подтверждён">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    <span class="vote-count">${report.verifyVotes || 0}</span>
                  </button>
                  <button class="btn-vote btn-vote-fake" onclick="toggleReportVote('${report._id}', 'fake', this)" title="Фейк">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(180deg);">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    <span class="vote-count">${report.fakeVotes || 0}</span>
                  </button>
                  ${report.socialLink ? `<a href="${report.socialLink}" target="_blank" class="report-link">Посмотреть пост →</a>` : ''}
                  ${donationsText}
                </div>
                ${canDonate ? `<button class="btn-donate" onclick="showDonateModalFromReport('${report.challengeId}', '${report._id}', '${report.username}')">Поддержать</button>` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
    
    if (tg) {
      tg.HapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    contentArea.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></div>
        <div class="empty-text">Ошибка загрузки</div>
        <p style="opacity: 0.6; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
}
