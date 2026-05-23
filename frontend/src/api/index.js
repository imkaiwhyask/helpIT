import axios from 'axios';
import router from '../router';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('helpit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('helpit_token');
      localStorage.removeItem('helpit_user');
      router.push('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
