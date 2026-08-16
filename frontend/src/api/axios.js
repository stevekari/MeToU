import axios from 'axios';
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080" ||
  "http://localhost:10000";
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every request once the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected, log the user out and send them to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
