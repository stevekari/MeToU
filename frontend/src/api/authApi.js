import api from './axios';

export function register(username, email, password) {
  return api.post('/auth/register', { username, email, password }).then((res) => res.data);
}

export function login(username, password) {
  return api.post('/auth/login', { username, password }).then((res) => res.data);
}
