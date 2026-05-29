import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

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
