window.userStatuses = {};
window.statusUpdateInterval = null;
window.isPageVisible = true;

const STATUS_TYPES = {
  ONLINE: 'online',
  IDLE: 'idle',
  OFFLINE: 'offline'
};

const STATUS_TIMEOUT = 5 * 60 * 1000;
const STATUS_UPDATE_INTERVAL = 30000;

export function initStatusSystem() {
  console.log('Status system initialized');
  
  setupVisibilityTracking();
  startStatusUpdates();
  setupStatusListener();
}

function setupVisibilityTracking() {
  document.addEventListener('visibilitychange', () => {
    window.isPageVisible = !document.hidden;
    updateOwnStatus();
  });

  window.addEventListener('focus', () => {
    window.isPageVisible = true;
    updateOwnStatus();
  });

  window.addEventListener('blur', () => {
    window.isPageVisible = false;
    updateOwnStatus();
  });
}

async function updateOwnStatus() {
  if (!window.currentUserId || !window.dmsDB) return;

  const status = window.isPageVisible ? STATUS_TYPES.ONLINE : STATUS_TYPES.IDLE;
  
  try {
    const { doc, setDoc } = window.firebaseDB;
    await setDoc(doc(window.dmsDB, `users/${window.currentUserId}`), {
      status: status,
      lastSeen: Date.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

function startStatusUpdates() {
  updateOwnStatus();
  
  window.statusUpdateInterval = setInterval(() => {
    updateOwnStatus();
  }, STATUS_UPDATE_INTERVAL);
}

function setupStatusListener() {
  if (!window.currentUserId || !window.dmsDB) {
    setTimeout(setupStatusListener, 1000);
    return;
  }

  const { collection, onSnapshot } = window.firebaseDB;
  const usersRef = collection(window.dmsDB, 'users');
  
  onSnapshot(usersRef, (snapshot) => {
    snapshot.forEach((docSnap) => {
      const userId = docSnap.id;
      const userData = docSnap.data();
      
      if (userId === window.currentUserId) return;
      
      const status = calculateUserStatus(userData);
      window.userStatuses[userId] = status;
      
      updateStatusIndicators(userId, status);
    });
  });
}

function calculateUserStatus(userData) {
  if (!userData.lastSeen) return STATUS_TYPES.OFFLINE;
  
  const now = Date.now();
  const timeSinceLastSeen = now - userData.lastSeen;
  
  if (timeSinceLastSeen > STATUS_TIMEOUT) {
    return STATUS_TYPES.OFFLINE;
  }
  
  if (userData.status === STATUS_TYPES.ONLINE) {
    return STATUS_TYPES.ONLINE;
  }
  
  return STATUS_TYPES.IDLE;
}

function updateStatusIndicators(userId, status) {
  const indicators = document.querySelectorAll(`[data-status-user-id="${userId}"]`);
  
  indicators.forEach(indicator => {
    indicator.className = 'status-indicator';
    indicator.classList.add(`status-${status}`);
  });
}

export function createStatusIndicator(userId) {
  const indicator = document.createElement('div');
  indicator.className = 'status-indicator';
  indicator.dataset.statusUserId = userId;
  
  const status = window.userStatuses[userId] || STATUS_TYPES.OFFLINE;
  indicator.classList.add(`status-${status}`);
  
  return indicator;
}

export function addStatusToAvatar(avatarElement, userId) {
  if (!avatarElement) return;
  
  avatarElement.style.position = 'relative';
  
  const existingIndicator = avatarElement.querySelector('.status-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  const indicator = createStatusIndicator(userId);
  avatarElement.appendChild(indicator);
}

export function getUserStatus(userId) {
  return window.userStatuses[userId] || STATUS_TYPES.OFFLINE;
}

export function cleanupStatusSystem() {
  if (window.statusUpdateInterval) {
    clearInterval(window.statusUpdateInterval);
    window.statusUpdateInterval = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (window.currentUserId && window.dmsDB) {
      const { doc, setDoc } = window.firebaseDB;
      setDoc(doc(window.dmsDB, `users/${window.currentUserId}`), {
        status: STATUS_TYPES.OFFLINE,
        lastSeen: Date.now()
      }, { merge: true }).catch(console.error);
    }
  });
}
