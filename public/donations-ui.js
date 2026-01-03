// Показать донатеров отчёта (только для владельца отчёта или самого донатера)
window.showReportDonations = async function(reportId, reportOwnerId) {
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
    
    // Фильтруем донаты: показываем только те, где текущий пользователь - владелец отчёта или донатер
    const visibleDonations = donations.filter(donation => 
      currentUser.id === reportOwnerId || donation.donorUserId === currentUser.id
    );
    
    if (visibleDonations.length === 0) {
      showToast('Нет доступных донатов', 'info');
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
    
    const donationsList = visibleDonations.map(donation => {
      const avatarHtml = donation.donorPhotoUrl 
        ? `<img src="${donation.donorPhotoUrl}" alt="${donation.donorUsername}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : (donation.donorFirstName || donation.donorUsername).charAt(0).toUpperCase();
      
      const isMyDonation = donation.donorUserId === currentUser.id;
      
      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; overflow: hidden; flex-shrink: 0;">
            ${avatarHtml}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">@${donation.donorUsername}${isMyDonation ? ' (вы)' : ''}</div>
            ${donation.message ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 2px;">${donation.message}</div>` : ''}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #10b981;">$${donation.amount}</div>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${currentUser.id === reportOwnerId ? 'Ваши донаты' : 'Мои донаты'} (${visibleDonations.length})</h2>
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

// Показать донатеров челленджа (только для владельца челленджа или самого донатера)
window.showChallengeDonations = async function(challengeId, challengeOwnerId) {
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
    
    // Фильтруем донаты: показываем только те, где текущий пользователь - владелец челленджа или донатер
    const visibleDonations = donations.filter(donation => 
      currentUser.id === challengeOwnerId || donation.donorUserId === currentUser.id
    );
    
    if (visibleDonations.length === 0) {
      showToast('Нет доступных донатов', 'info');
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
    
    const donationsList = visibleDonations.map(donation => {
      const avatarHtml = donation.donorPhotoUrl 
        ? `<img src="${donation.donorPhotoUrl}" alt="${donation.donorUsername}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : (donation.donorFirstName || donation.donorUsername).charAt(0).toUpperCase();
      
      const isMyDonation = donation.donorUserId === currentUser.id;
      
      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; overflow: hidden; flex-shrink: 0;">
            ${avatarHtml}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">@${donation.donorUsername}${isMyDonation ? ' (вы)' : ''}</div>
            ${donation.message ? `<div style="font-size: 13px; opacity: 0.7; margin-top: 2px;">${donation.message}</div>` : ''}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #10b981;">$${donation.amount}</div>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${currentUser.id === challengeOwnerId ? 'Ваши донаты' : 'Мои донаты'} (${visibleDonations.length})</h2>
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
