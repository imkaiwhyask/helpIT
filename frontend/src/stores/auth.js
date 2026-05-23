import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('helpit_token'));
  const user  = ref(JSON.parse(localStorage.getItem('helpit_user') || 'null'));
  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    token.value = res.data.token;
    user.value  = res.data.user;
    localStorage.setItem('helpit_token', res.data.token);
    localStorage.setItem('helpit_user', JSON.stringify(res.data.user));

    // Role-based redirect
    router.push(res.data.user.role === 'user' ? '/portal' : '/dashboard');
  }

  function logout() {
    token.value = null;
    user.value  = null;
    localStorage.removeItem('helpit_token');
    localStorage.removeItem('helpit_user');
    router.push('/login');
  }

  return { token, user, isAuthenticated, login, logout };
});
