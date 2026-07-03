import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

if (apiBaseUrl.startsWith('http')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  if (!apiBaseUrl.endsWith('/api')) {
    apiBaseUrl += '/api';
  }
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Emit an event so React can handle SPA logout/navigation without full reload
      try { window.dispatchEvent(new CustomEvent('api:unauthorized')); } catch (e) { /* ignore */ }
    }
    return Promise.reject(error);
  }
);

export default api;
