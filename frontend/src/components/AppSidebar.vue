<template>
  <aside class="sidebar">
    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        @mousedown="createRipple"
      >
        <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
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

function createRipple(event) {
  const el = event.currentTarget;
  const existing = el.querySelector('.md-ripple');
  if (existing) existing.remove();

  const diameter = Math.max(el.clientWidth, el.clientHeight);
  const radius = diameter / 2;
  const rect = el.getBoundingClientRect();

  const ripple = document.createElement('span');
  ripple.classList.add('md-ripple');
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top  = `${event.clientY - rect.top  - radius}px`;
  el.appendChild(ripple);

  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

const auth = useAuthStore();

const initials = computed(() => {
  const name = auth.user?.name || '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard',      icon: 'Odometer',     roles: null           },
  { to: '/tickets',   label: 'Tickets',         icon: 'Tickets',      roles: null           },
  { to: '/users',     label: 'User Management', icon: 'UserFilled',   roles: ['admin']      },
  { to: '/kb',        label: 'Knowledge Base',  icon: 'Document',     roles: null           },
  { to: '/reports',   label: 'Reports',         icon: 'DataAnalysis', roles: null           },
];

const navItems = computed(() =>
  allNavItems.filter(item => !item.roles || item.roles.includes(auth.user?.role))
);
</script>

<style scoped>
/* ─── Shell ─────────────────────────────────────────────────────── */
.sidebar {
  width: 57px;
  background: #fff;
  border-right: 1px solid rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
  overflow: hidden;
  will-change: width;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}
.sidebar:hover { width: 240px; }

/* ─── Nav ────────────────────────────────────────────────────────── */
.nav { flex: 1; padding: 4px 0; }

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 0 12px 17px;
  text-decoration: none;
  color: rgba(0,0,0,0.54);
  font-size: 14px;
  font-weight: 500;
  border-left: 3px solid transparent;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s;
}
.nav-item:hover {
  background: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.87);
}
.nav-item:active { background: rgba(0,0,0,0.1); }
.nav-item.router-link-active {
  background: rgba(0,45,114,0.08);
  color: #002d72;
  border-left-color: #002d72;
}
.nav-item.router-link-active:hover { background: rgba(0,45,114,0.13); }

/* MD1 ink ripple */
.nav-item :deep(.md-ripple) {
  position: absolute;
  border-radius: 50%;
  background: rgba(0,0,0,0.12);
  transform: scale(0);
  pointer-events: none;
  animation: md-ripple 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.nav-item.router-link-active :deep(.md-ripple) {
  background: rgba(0,45,114,0.2);
}

@keyframes md-ripple {
  to { transform: scale(4); opacity: 0; }
}

.nav-icon { font-size: 18px; flex-shrink: 0; }

/* Label slides in alongside the sidebar width transition */
.nav-label {
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  margin-left: 0;
  white-space: nowrap;
  transition: max-width    0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity      0.2s  cubic-bezier(0.4, 0, 0.2, 1),
              margin-left  0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar:hover .nav-label {
  max-width: 180px;
  opacity: 1;
  margin-left: 14px;
}

/* ─── Footer ─────────────────────────────────────────────────────── */
.sidebar-footer {
  padding: 14px 0 14px 11px;
  border-top: 1px solid rgba(0,0,0,0.12);
  flex-shrink: 0;
  overflow: hidden;
}
.user-info { display: flex; align-items: center; }

.avatar {
  width: 34px; height: 34px; flex-shrink: 0;
  background: var(--md1-primary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 500; color: #fff;
}

.user-details {
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  margin-left: 0;
  white-space: nowrap;
  transition: max-width    0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity      0.2s  cubic-bezier(0.4, 0, 0.2, 1),
              margin-left  0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar:hover .user-details {
  max-width: 160px;
  opacity: 1;
  margin-left: 10px;
}

.user-name { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.87); }
.user-role { font-size: 11px; color: rgba(0,0,0,0.38); text-transform: capitalize; margin-top: 1px; }
</style>
