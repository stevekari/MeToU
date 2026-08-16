import api from './axios';

export function startConversation(friendId) {
  return api.post('/conversations/start', { friendId }).then((res) => res.data);
}

export function getMyConversations() {
  return api.get('/conversations/mine').then((res) => res.data);
}

export function getMessages(conversationId) {
  return api.get(`/conversations/${conversationId}/messages`).then((res) => res.data);
}

export function sendMessageRest(conversationId, content) {
  return api.post('/messages/send', { conversationId, content }).then((res) => res.data);
}
