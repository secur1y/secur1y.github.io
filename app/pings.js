window.mentionCounts = {};
window.serverMentionCounts = {};

export function updateMentionBadge(elementId, count) {
  const element = document.getElementById(elementId) || 
                  document.querySelector(`[data-server-id="${elementId}"]`) || 
                  document.querySelector(`[data-chat-id="${elementId}"]`);
  
  if (!element) return;
  
  let badge = element.querySelector('.mention-badge');
  
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'mention-badge';
      element.appendChild(badge);
    }
    badge.textContent = count > 9 ? '9+' : count;
  } else if (badge) {
    badge.remove();
  }
}

export function processMentions(text) {
  if (!text) return '';
  return text.replace(/@(\w+)/g, (match) => {
    return `<span class="mention">${match}</span>`;
  });
}

export function countMentionsInMessage(text, messageUserId) {
  if (!text || !window.Clerk || !window.Clerk.user) return 0;
  
  const currentUsername = window.Clerk.user.username || window.Clerk.user.firstName || 'User';
  const currentUserId = window.currentUserId;
  
  if (messageUserId === currentUserId) return 0;
  
  if (text.includes(`@${currentUsername}`)) {
    return 1;
  }
  
  return 0;
}

function playPingSound() {
  const audio = document.getElementById('notificationSound');
  if (audio) {
    audio.play().catch(e => console.log('Could not play sound:', e));
  }
}

export function notifyMention(chatId, channelId, serverId) {
  const isViewingChat = window.currentChatId === chatId;
  const isViewingChannel = window.currentChannelId === channelId && window.currentServerId === serverId;
  
  if (!isViewingChat && !isViewingChannel) {
    playPingSound();
  }
}

export function updateServerMentionCount(serverId) {
  let totalMentions = 0;
  
  Object.keys(window.mentionCounts).forEach(key => {
    if (key.startsWith(serverId + '_')) {
      totalMentions += window.mentionCounts[key] || 0;
    }
  });
  
  window.serverMentionCounts[serverId] = totalMentions;
  updateMentionBadge(serverId, totalMentions);
}

export function clearChatMentions(chatId) {
  window.mentionCounts[chatId] = 0;
  updateMentionBadge(chatId, 0);
}

export function clearChannelMentions(serverId, channelId) {
  const channelKey = `${serverId}_${channelId}`;
  window.mentionCounts[channelKey] = 0;
  updateServerMentionCount(serverId);
}

export function setChatMentionCount(chatId, count) {
  window.mentionCounts[chatId] = count;
  updateMentionBadge(chatId, count);
}

export function setChannelMentionCount(serverId, channelId, count) {
  const channelKey = `${serverId}_${channelId}`;
  window.mentionCounts[channelKey] = count;
  updateServerMentionCount(serverId);
}

export function getMentionCount(key) {
  return window.mentionCounts[key] || 0;
}

export function getServerMentionCount(serverId) {
  return window.serverMentionCounts[serverId] || 0;
}

export function initPingSystem() {
  console.log('Ping notification system initialized');
  window.mentionCounts = {};
  window.serverMentionCounts = {};
}

if (typeof window !== 'undefined') {
  initPingSystem();
}
