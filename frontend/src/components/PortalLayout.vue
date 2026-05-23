<template>
  <div class="portal-app">
    <!-- Top navigation bar -->
    <header class="portal-nav">
      <RouterLink to="/portal" class="nav-brand">
        <svg width="28" height="23" viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="11" height="46" rx="4" fill="white"/>
          <rect x="45" y="0" width="11" height="46" rx="4" fill="white"/>
          <rect x="0" y="17" width="56" height="12" rx="4" fill="url(#pl)"/>
          <circle cx="14" cy="23" r="3.5" fill="white" opacity="0.9"/>
          <circle cx="28" cy="23" r="3.5" fill="white" opacity="0.9"/>
          <circle cx="42" cy="23" r="3.5" fill="white" opacity="0.9"/>
          <defs>
            <linearGradient id="pl" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
              <stop stop-color="#00d4e0"/>
              <stop offset="1" stop-color="#0080c6"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="nav-name">help<em>IT</em></span>
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/portal/tickets" class="nav-link">My Requests</RouterLink>
        <RouterLink to="/portal/kb" class="nav-link">Help Center</RouterLink>
        <RouterLink to="/portal/tickets/new" class="nav-link nav-link-submit">
          <el-icon><Plus /></el-icon> Submit Request
        </RouterLink>
      </nav>

      <el-dropdown @command="handleCmd">
        <div class="nav-user">
          <div class="nav-avatar">{{ initials }}</div>
          <span class="nav-username">{{ auth.user?.name?.split(' ')[0] }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>{{ auth.user?.email }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">Sign Out</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="portal-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const initials = computed(() => {
  return (auth.user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

function handleCmd(cmd) {
  if (cmd === 'logout') auth.logout();
}
</script>

<style scoped>
.portal-app { min-height: 100vh; display: flex; flex-direction: column; background: #f0f2f5; }

.portal-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 58px;
  background: #0d1e30;
  border-bottom: 1px solid #1a2f45;
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 24px;
}

.nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.nav-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
.nav-name em { font-style: italic; color: #00c7d4; }

.nav-links { display: flex; align-items: center; gap: 8px; margin-left: auto; }

.nav-link {
  text-decoration: none;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  transition: background 0.15s;
}
.nav-link:hover { background: rgba(255,255,255,0.1); color: #fff; }
.nav-link.router-link-active { color: #fff; background: rgba(255,255,255,0.15); }

.nav-link-submit {
  background: #4f46e5;
  color: #fff !important;
  display: flex;
  align-items: center;
  gap: 5px;
}
.nav-link-submit:hover { background: #4338ca !important; }

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}
.nav-user:hover { background: rgba(255,255,255,0.1); }

.nav-avatar {
  width: 28px;
  height: 28px;
  background: #4f46e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.portal-main { flex: 1; }
</style>
