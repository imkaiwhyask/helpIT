<template>
  <div class="portal-home">

    <!-- Hero section -->
    <section class="hero">
      <div class="deco deco-dots-left"></div>
      <div class="deco deco-dots-right"></div>

      <div class="hero-content">
        <h1 class="hero-title">Hi {{ firstName }}, how can we help you?</h1>
        <div class="search-wrap">
          <el-input
            v-model="searchQuery"
            placeholder="Search for solutions, services, and tickets…"
            size="large"
            class="hero-search"
            clearable
            @keyup.enter="doSearch"
          >
            <template #prefix>
              <el-icon style="color:#6b7280"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </section>

    <!-- Action cards -->
    <section class="cards-section">
      <div class="cards-row">
        <div class="action-card" @click="$router.push('/portal/kb')">
          <div class="card-icon-wrap">
            <el-icon class="card-icon"><Document /></el-icon>
          </div>
          <div class="card-text">
            <div class="card-title">Browse Help Articles</div>
            <div class="card-desc">Look up policies or read FAQs to fix issues on your own</div>
          </div>
          <el-icon class="card-arrow"><ArrowRight /></el-icon>
        </div>

        <div class="action-card" @click="$router.push('/portal/tickets/new')">
          <div class="card-icon-wrap card-icon-wrap--primary">
            <el-icon class="card-icon"><Plus /></el-icon>
          </div>
          <div class="card-text">
            <div class="card-title">Submit a Request</div>
            <div class="card-desc">Having trouble? Contact the IT support team</div>
          </div>
          <el-icon class="card-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- Recent requests -->
      <div v-if="recentTickets.length" class="recent-section">
        <div class="recent-header">
          <h3 class="recent-title">My Recent Requests</h3>
          <RouterLink to="/portal/tickets" class="view-all">View all</RouterLink>
        </div>
        <div class="recent-list">
          <div
            v-for="t in recentTickets"
            :key="t.id"
            class="recent-item"
            @click="$router.push(`/portal/tickets/${t.id}`)"
          >
            <div class="recent-id">#{{ String(t.id).padStart(4,'0') }}</div>
            <div class="recent-info">
              <div class="recent-subject">{{ t.title }}</div>
              <div class="recent-meta">{{ t.category }} · {{ fmtDate(t.created_at) }}</div>
            </div>
            <span :class="['sta-badge', 'sta-' + t.status]">{{ fmtStatus(t.status) }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="loaded" class="empty-requests">
        <el-empty description="No requests yet. Submit your first one!" :image-size="80">
          <el-button type="primary" @click="$router.push('/portal/tickets/new')">Submit a Request</el-button>
        </el-empty>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import api from '../../api';

const router = useRouter();
const auth = useAuthStore();

const searchQuery = ref('');
const recentTickets = ref([]);
const loaded = ref(false);

const firstName = computed(() => (auth.user?.name || '').split(' ')[0]);

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/portal/tickets?search=${encodeURIComponent(searchQuery.value.trim())}`);
  }
}

function fmtStatus(s) {
  return { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed' }[s] || s;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

onMounted(async () => {
  try {
    const res = await api.get('/tickets?limit=5');
    recentTickets.value = res.data.tickets;
  } finally {
    loaded.value = true;
  }
});
</script>

<style scoped>
.portal-home { min-height: 100vh; display: flex; flex-direction: column; }

/* ── Hero ── */
.hero {
  position: relative;
  background: linear-gradient(150deg, #0d1e30 0%, #0a2840 55%, #063040 100%);
  padding: 60px 24px 68px;
  overflow: hidden;
  text-align: center;
}

.deco { position: absolute; pointer-events: none; }
.deco-dots-left {
  width: 120px; height: 120px;
  background-image: radial-gradient(circle, rgba(0,199,212,0.18) 1px, transparent 1px);
  background-size: 12px 12px;
  bottom: 24px; left: 48px;
}
.deco-dots-right {
  width: 120px; height: 120px;
  background-image: radial-gradient(circle, rgba(0,199,212,0.12) 1px, transparent 1px);
  background-size: 12px 12px;
  top: 24px; right: 80px;
}

.hero-content { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
.hero-title {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 28px;
  letter-spacing: -0.3px;
}

.search-wrap { max-width: 560px; margin: 0 auto; }
.hero-search { width: 100%; }
:deep(.hero-search .el-input__wrapper) {
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.25) !important;
  border: none !important;
}
:deep(.hero-search .el-input__inner) { font-size: 15px; }

/* ── Cards ── */
.cards-section {
  flex: 1;
  background: #070d1a;
  padding: 48px 24px;
}

.cards-row {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.action-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  width: 320px;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: border-color 0.15s, background 0.15s;
}
.action-card:hover {
  border-color: #00c7d4;
  background: rgba(255,255,255,0.08);
}

.card-icon-wrap {
  width: 44px; height: 44px; flex-shrink: 0;
  background: rgba(0,199,212,0.12);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.card-icon-wrap--primary { background: rgba(0,199,212,0.12); }
.card-icon { font-size: 22px; color: #00c7d4; }
.card-icon-wrap--primary .card-icon { color: #00c7d4; }

.card-text { flex: 1; min-width: 0; }
.card-title { font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px; }
.card-desc  { font-size: 12.5px; color: rgba(255,255,255,0.5); line-height: 1.45; }

.card-arrow { font-size: 14px; color: rgba(255,255,255,0.25); flex-shrink: 0; }
.action-card:hover .card-arrow { color: #00c7d4; }

/* ── Recent requests ── */
.recent-section { max-width: 720px; margin: 0 auto; }
.recent-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.recent-title { font-size: 15px; font-weight: 600; color: #f1f5f9; }
.view-all { font-size: 13px; color: #00c7d4; text-decoration: none; }
.view-all:hover { text-decoration: underline; }

.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.recent-item:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.07); }

.recent-id { font-family: monospace; font-size: 11.5px; color: rgba(255,255,255,0.38); font-weight: 600; min-width: 44px; }
.recent-info { flex: 1; min-width: 0; }
.recent-subject { font-size: 13.5px; font-weight: 500; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recent-meta { font-size: 11.5px; color: rgba(255,255,255,0.4); margin-top: 2px; }

/* Status badges — use global classes from theme.css; keep wrapper for specificity */
.sta-badge {
  display: inline-block; padding: 2px 9px; border-radius: 4px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.sta-open        { background: rgba(37,99,235,0.15); color: #60a5fa; }
.sta-in_progress { background: rgba(124,58,237,0.15); color: #a78bfa; }
.sta-on_hold     { background: rgba(234,88,12,0.15); color: #fb923c; }
.sta-resolved    { background: rgba(22,163,74,0.15); color: #4ade80; }
.sta-closed      { background: rgba(100,116,139,0.15); color: #94a3b8; }

.empty-requests { text-align: center; padding: 40px 0; }

</style>
