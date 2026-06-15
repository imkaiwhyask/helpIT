<template>
  <header class="app-header">
    <div class="header-left">
      <img src="@/assets/helpit_logo.png" alt="helpIT" class="header-logo" />
      <div class="header-divider"></div>
      <div class="page-title">{{ pageTitle }}</div>
    </div>
    <div class="header-actions">
      <RouterLink to="/tickets/new">
        <el-button v-md1-ripple.dark class="header-btn" size="small">
          <el-icon><Plus /></el-icon> New Ticket
        </el-button>
      </RouterLink>
      <el-dropdown @command="handleCommand">
        <div class="user-chip">
          <div class="avatar-sm">{{ initials }}</div>
          <span>{{ auth.user?.name }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>{{ auth.user?.email }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">Sign Out</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const auth = useAuthStore();
const route = useRoute();

const titleMap = {
  '/dashboard':  'Dashboard',
  '/tickets':    'Tickets',
  '/tickets/new':'New Ticket',
  '/users':      'User Management',
  '/kb':         'Knowledge Base',
  '/reports':    'Reports',
};

const pageTitle = computed(() => {
  if (route.path.startsWith('/tickets/') && route.params.id) return `Ticket #${String(route.params.id).padStart(4, '0')}`;
  return titleMap[route.path] ?? 'helpIT';
});

const initials = computed(() => {
  return (auth.user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

function handleCommand(cmd) {
  if (cmd === 'logout') auth.logout();
}
</script>

<style scoped>
.app-header {
  background: #002d72;
  box-shadow: 0 4px 5px rgba(0,0,0,0.14), 0 1px 10px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.20);
  padding: 0 24px; height: 56px;
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  z-index: 10;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-logo {
  height: 36px;
  width: auto;
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}
.header-divider {
  width: 1px;
  height: 26px;
  background: rgba(255,255,255,0.35);
  flex-shrink: 0;
}
.page-title { font-size: 20px; font-weight: 500; color: #fff; letter-spacing: 0; }
.header-actions { display: flex; align-items: center; gap: 14px; }
.user-chip {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.9);
  padding: 4px 8px; border-radius: 2px; transition: background 0.15s;
}
.user-chip:hover { background: rgba(255,255,255,0.12); color: #fff; }
.avatar-sm {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--md1-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500; color: #fff;
}
/* header-btn global styles are in theme.css */
</style>
