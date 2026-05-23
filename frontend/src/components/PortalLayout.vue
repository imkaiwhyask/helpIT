<template>
  <div class="portal-app">
    <!-- Top navigation bar -->
    <header class="portal-nav">
      <RouterLink to="/portal" class="nav-brand">
        <img src="@/assets/helpit_logo.png" alt="helpIT" class="nav-logo" />
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
.portal-app { min-height: 100vh; display: flex; flex-direction: column; background: #fafafa; }

.portal-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: #0288d1;
  box-shadow: 0 4px 5px rgba(0,0,0,0.14), 0 1px 10px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.20);
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 24px;
}

.nav-brand { display: flex; align-items: center; text-decoration: none; }
.nav-logo { height: 40px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }

.nav-links { display: flex; align-items: center; gap: 4px; margin-left: auto; }

.nav-link {
  text-decoration: none;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 2px;
  transition: background 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 13px;
}
.nav-link:hover { background: rgba(255,255,255,0.12); color: #fff; }
.nav-link.router-link-active { color: #fff; background: rgba(255,255,255,0.18); }

.nav-link-submit {
  background: rgba(255,255,255,0.2);
  color: #fff !important;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255,255,255,0.4);
}
.nav-link-submit:hover { background: rgba(255,255,255,0.3) !important; }

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 2px;
  transition: background 0.15s;
}
.nav-user:hover { background: rgba(255,255,255,0.12); }

.nav-avatar {
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.portal-main { flex: 1; }
</style>
