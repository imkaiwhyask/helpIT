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
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- FAB -->
    <button
      v-if="showFab"
      v-md1-ripple
      class="portal-fab"
      ref="fabEl"
      @click="fabClick"
      aria-label="Submit a request"
    >
      <el-icon class="portal-fab-icon"><Plus /></el-icon>
    </button>

    <!-- Morph overlay -->
    <div
      class="portal-fab-morph"
      :class="{ 'is-morphing': isMorphing, 'is-fading': isFading }"
      :style="morphStyle"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const initials = computed(() => {
  return (auth.user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

function handleCmd(cmd) {
  if (cmd === 'logout') auth.logout();
}

// FAB morph
const fabEl = ref(null);
const isMorphing = ref(false);
const isFading = ref(false);
const morphStyle = ref({});

const showFab = computed(() => route.path !== '/portal/tickets/new');

function fabClick() {
  const btn = fabEl.value;
  const rect = btn.getBoundingClientRect();
  morphStyle.value = {
    '--fab-x': (rect.left + rect.width / 2) + 'px',
    '--fab-y': (rect.top + rect.height / 2) + 'px',
  };

  isMorphing.value = true;
  isFading.value = false;

  setTimeout(() => router.push('/portal/tickets/new'), 360);

  setTimeout(() => {
    isMorphing.value = false;
    isFading.value = true;
    setTimeout(() => { isFading.value = false; }, 350);
  }, 700);
}
</script>

<style scoped>
.portal-app { min-height: 100vh; display: flex; flex-direction: column; background: #fafafa; }

.portal-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  background: #2196F3;
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
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 2px;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 13px;
}
.nav-link:hover { background: rgba(255,255,255,0.12); color: #fff; }
.nav-link.router-link-active { color: #fff; background: rgba(255,255,255,0.18); }

.nav-link-submit {
  background: #fff;
  color: #2196F3 !important;
  display: flex;
  align-items: center;
  gap: 5px;
  border: none;
}
.nav-link-submit:hover { background: rgba(255,255,255,0.88) !important; color: #e05800 !important; }

.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 2px;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-user:hover { background: rgba(255,255,255,0.12); }

.nav-avatar {
  width: 28px;
  height: 28px;
  background: #898D8E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.portal-main { flex: 1; }

/* Page transition — decelerate in, accelerate out */
.page-enter-active {
  transition: opacity 0.28s cubic-bezier(0, 0, 0.2, 1),
              transform 0.28s cubic-bezier(0, 0, 0.2, 1);
}
.page-leave-active {
  transition: opacity 0.18s cubic-bezier(0.4, 0, 1, 1);
}
.page-enter-from { opacity: 0; transform: translateY(20px); }
.page-leave-to   { opacity: 0; }

/* FAB */
.portal-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2196F3;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 10px rgba(0,0,0,0.14),
    0 1px 18px rgba(0,0,0,0.12),
    0 3px 5px rgba(0,0,0,0.2);
  transition:
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
  overflow: hidden;
}
.portal-fab:hover {
  box-shadow:
    0 12px 17px rgba(0,0,0,0.14),
    0 5px 22px rgba(0,0,0,0.12),
    0 7px 8px rgba(0,0,0,0.2);
  transform: scale(1.06);
}
.portal-fab-icon { font-size: 24px; pointer-events: none; }

/* Morph overlay */
.portal-fab-morph {
  position: fixed;
  inset: 0;
  background: #2196F3;
  z-index: 199;
  pointer-events: none;
  clip-path: circle(0% at var(--fab-x, 95%) var(--fab-y, 95%));
  opacity: 1;
}
.portal-fab-morph.is-morphing {
  clip-path: circle(160% at var(--fab-x) var(--fab-y));
  transition: clip-path 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
.portal-fab-morph.is-fading {
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
