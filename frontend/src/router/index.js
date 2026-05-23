import { createRouter, createWebHistory } from 'vue-router';

import LoginView from '../views/LoginView.vue';
// IT/Admin layout
import AppLayout from '../components/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import TicketsView from '../views/TicketsView.vue';
import TicketDetailView from '../views/TicketDetailView.vue';
import CreateTicketView from '../views/CreateTicketView.vue';
import UserManagementView from '../views/UserManagementView.vue';
import KnowledgeBaseView from '../views/KnowledgeBaseView.vue';
import ReportsView from '../views/ReportsView.vue';
// Self-service portal layout
import PortalLayout from '../components/PortalLayout.vue';
import PortalHomeView from '../views/portal/PortalHomeView.vue';
import PortalMyTicketsView from '../views/portal/PortalMyTicketsView.vue';
import PortalCreateTicketView from '../views/portal/PortalCreateTicketView.vue';
import PortalTicketDetailView from '../views/portal/PortalTicketDetailView.vue';
import PortalKnowledgeBaseView from '../views/portal/PortalKnowledgeBaseView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },

    // ── IT / Admin portal ──
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true, roles: ['admin', 'technician'] },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard',    component: DashboardView },
        { path: 'tickets',      component: TicketsView },
        { path: 'tickets/new',  component: CreateTicketView },
        { path: 'tickets/:id',  component: TicketDetailView },
        { path: 'users',        component: UserManagementView },
        { path: 'kb',           component: KnowledgeBaseView },
        { path: 'reports',      component: ReportsView },
      ],
    },

    // ── Self-service portal (requesters) ──
    {
      path: '/portal',
      component: PortalLayout,
      meta: { requiresAuth: true, roles: ['user'] },
      children: [
        { path: '',             component: PortalHomeView },
        { path: 'tickets',      component: PortalMyTicketsView },
        { path: 'tickets/new',  component: PortalCreateTicketView },
        { path: 'tickets/:id',  component: PortalTicketDetailView },
        { path: 'kb',           component: PortalKnowledgeBaseView },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem('helpit_token');
  const user  = JSON.parse(localStorage.getItem('helpit_user') || 'null');
  const role  = user?.role;

  if (!to.meta.public && !token) return '/login';

  if (to.path === '/login' && token) {
    return role === 'user' ? '/portal' : '/dashboard';
  }

  if (to.meta.roles && token && !to.meta.roles.includes(role)) {
    return role === 'user' ? '/portal' : '/dashboard';
  }
});

export default router;
