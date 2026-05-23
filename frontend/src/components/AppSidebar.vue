<template>
  <aside class="sidebar">
    <div class="logo">
      <img src="@/assets/helpit_logo.png" alt="helpIT" class="logo-img" />
    </div>

    <nav class="nav">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar">{{ initials }}</div>
        <div class="user-details">
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="user-role">{{ auth.user?.role }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const initials = computed(() => {
  const name = auth.user?.name || '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const navItems = [
  { to: '/dashboard', label: 'Dashboard',        icon: 'Odometer' },
  { to: '/tickets',   label: 'Tickets',           icon: 'Tickets' },
  { to: '/users',     label: 'User Management',   icon: 'UserFilled' },
  { to: '/kb',        label: 'Knowledge Base',    icon: 'Document' },
  { to: '/reports',   label: 'Reports',           icon: 'DataAnalysis' },
];
</script>

<style scoped>
.sidebar {
  width: 240px; min-width: 240px;
  background: #050c18;
  border-right: 1px solid rgba(255,255,255,0.08);
  color: rgba(241,245,249,0.6);
  display: flex; flex-direction: column; height: 100vh;
}
.logo {
  display: flex; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo-img { height: 48px; width: auto; object-fit: contain; }
.nav { flex: 1; padding: 12px 0; }
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 20px; text-decoration: none;
  color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}
.nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
.nav-item.router-link-active { background: rgba(0,199,212,0.1); color: #00c7d4; border-left-color: #00c7d4; }
.nav-item .el-icon { font-size: 17px; }
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px; height: 34px; flex-shrink: 0;
  background: linear-gradient(135deg, #0080c6, #00c7d4);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #fff;
}
.user-name { font-size: 13px; font-weight: 600; color: #f1f5f9; }
.user-role { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: capitalize; margin-top: 1px; }
</style>
