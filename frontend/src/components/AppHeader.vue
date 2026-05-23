<template>
  <header class="app-header">
    <div class="page-title">{{ pageTitle }}</div>
    <div class="header-actions">
      <RouterLink to="/tickets/new">
        <el-button type="primary" size="small">
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
  '/dashboard': 'Dashboard',
  '/tickets':   'Tickets',
  '/tickets/new': 'New Ticket',
  '/users':     'User Management',
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
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}
.header-actions { display: flex; align-items: center; gap: 14px; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.user-chip:hover { background: #f1f5f9; }
.avatar-sm {
  width: 28px;
  height: 28px;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
</style>
