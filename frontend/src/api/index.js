import axios from 'axios';
import router from '../router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send httpOnly cookie on every request
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      router.push('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
