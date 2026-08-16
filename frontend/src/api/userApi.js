import api from './axios';

export function getAllUsers() {
  return api.get('/users/all').then((res) => res.data);
}

export function searchUsers(query) {
  return api.get('/users/search', { params: { query } }).then((res) => res.data);
}

export function getMe() {
  return api.get('/users/me').then((res) => res.data);
}

export function updateProfile(payload) {
  return api.put('/users/me', payload).then((res) => res.data);
}
