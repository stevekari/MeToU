import api from './axios';

export function startConversation(friendId) {
  return api.post('/conversations/start', { friendId }).then((res) => res.data);
}

export function getConversationDetails(conversationId) {
  if (!conversationId) return Promise.resolve(null);
  return api.get(`/conversations/${conversationId}`).then((res) => res.data).catch(() => null);
}

export function acceptChatRequest(conversationId) {
  if (!conversationId) return Promise.resolve(null);
  return api.post(`/conversations/${conversationId}/accept`).then((res) => res.data);
}

export function declineChatRequest(conversationId) {
  if (!conversationId) return Promise.resolve(null);
  return api.post(`/conversations/${conversationId}/decline`).then((res) => res.data);
}

export function getMyConversations() {
  return api.get('/conversations/mine').then((res) => Array.isArray(res.data) ? res.data : []).catch(() => []);
}


export function getMessages(conversationId) {
  if (!conversationId) return Promise.resolve([]);
  return api
    .get(`/conversations/${conversationId}/messages`)
    .then((res) => (Array.isArray(res.data) ? res.data : []))
    .catch(() => []);
}

export function sendMessageRest(conversationId, content, replyToId = null, replyToSenderName = null, replyToContent = null) {
  return api.post('/messages/send', {
    conversationId,
    content,
    replyToId,
    replyToSenderName,
    replyToContent
  }).then((res) => res.data);
}

export async function markConversationAsRead(conversationId) {
  if (!conversationId) return {};
  try {
    const res = await api.post(`/conversations/${conversationId}/read`);
    return res.data || {};
  } catch (err) {
    return {};
  }
}

export async function editMessage(messageId, content) {
  if (!messageId) return {};
  try {
    const res = await api.put(`/conversations/messages/${messageId}`, { content });
    return res.data || {};
  } catch (err) {
    return {};
  }
}

export async function deleteMessage(messageId) {
  if (!messageId) return {};
  try {
    const res = await api.delete(`/conversations/messages/${messageId}`);
    return res.data || {};
  } catch (err) {
    return {};
  }
}

export function uploadMediaFile(file, kind = 'file') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  return api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
}

export function getCalls() {
  return api.get('/conversations/calls').then((res) => Array.isArray(res.data) ? res.data : []).catch(() => []);
}
