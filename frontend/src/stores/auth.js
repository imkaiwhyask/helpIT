import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  // Token lives in httpOnly cookie — not accessible from JS
  // Only user profile is stored in localStorage for UI use
  const user = ref(JSON.parse(localStorage.getItem('helpit_user') || 'null'));
  const isAuthenticated = computed(() => !!user.value);

  function setUser(u) {
    user.value = u;
    localStorage.setItem('helpit_user', JSON.stringify(u));
  }

  async function login(email, password, rememberMe = false) {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    setUser(res.data.user);

    if (res.data.user.must_change_password) {
      router.push('/change-password');
    } else {
      router.push(res.data.user.role === 'user' ? '/portal' : '/dashboard');
    }
  }

  async function changePassword(newPassword) {
    const res = await api.post('/auth/change-password', { new_password: newPassword });
    setUser(res.data.user);
    router.push(res.data.user.role === 'user' ? '/portal' : '/dashboard');
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed even if server call fails
    }
    user.value = null;
    localStorage.removeItem('helpit_user');
    router.push('/login');
  }

  async function fetchMe() {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      user.value = null;
      localStorage.removeItem('helpit_user');
    }
  }

  return { user, isAuthenticated, login, changePassword, logout, fetchMe };
});
