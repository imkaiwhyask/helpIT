<template>
  <aside class="sidebar">
    <div class="logo">
      <!-- H-mark with teal crossbar -->
      <svg width="32" height="26" viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="11" height="46" rx="4" fill="white"/>
        <rect x="45" y="0" width="11" height="46" rx="4" fill="white"/>
        <rect x="0" y="17" width="56" height="12" rx="4" fill="url(#sb)"/>
        <circle cx="14" cy="23" r="3.5" fill="white" opacity="0.9"/>
        <circle cx="28" cy="23" r="3.5" fill="white" opacity="0.9"/>
        <circle cx="42" cy="23" r="3.5" fill="white" opacity="0.9"/>
        <defs>
          <linearGradient id="sb" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
            <stop stop-color="#00d4e0"/>
            <stop offset="1" stop-color="#0080c6"/>
          </linearGradient>
        </defs>
      </svg>
      <span class="logo-text">help<em>IT</em></span>
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
  width: 240px;
  min-width: 240px;
  background: #0f172a;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 18px;
  border-bottom: 1px solid #1e293b;
}
.logo-text {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #fff;
  letter-spacing: -0.5px;
}
.logo-text em { font-style: italic; color: #00c7d4; }

.nav { flex: 1; padding: 12px 0; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}
.nav-item:hover {
  background: #1e293b;
  color: #e2e8f0;
}
.nav-item.router-link-active {
  background: #1e293b;
  color: #fff;
  border-left-color: #2563eb;
}
.nav-item .el-icon { font-size: 17px; }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1e293b;
}
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px;
  height: 34px;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}
.user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.user-role { font-size: 11px; color: #64748b; text-transform: capitalize; margin-top: 1px; }
</style>
