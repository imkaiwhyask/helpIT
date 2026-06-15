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
              <el-icon style="color: #6b7280"><Search /></el-icon>
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
            <div class="card-desc">
              Look up policies or read FAQs to fix issues on your own
            </div>
          </div>
          <el-icon class="card-arrow"><ArrowRight /></el-icon>
        </div>

        <div class="action-card" @click="$router.push('/portal/tickets/new')">
          <div class="card-icon-wrap card-icon-wrap--primary">
            <el-icon class="card-icon"><Plus /></el-icon>
          </div>
          <div class="card-text">
            <div class="card-title">Submit a Request</div>
            <div class="card-desc">
              Having trouble? Contact the IT support team
            </div>
          </div>
          <el-icon class="card-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- Recent requests -->
      <div v-if="recentTickets.length" class="recent-section">
        <div class="recent-header">
          <h3 class="recent-title">My Recent Requests</h3>
          <RouterLink to="/portal/tickets" class="view-all"
            >View all</RouterLink
          >
        </div>
        <div class="recent-list">
          <div
            v-for="t in recentTickets"
            :key="t.id"
            class="recent-item"
            @click="$router.push(`/portal/tickets/${t.id}`)"
          >
            <div class="recent-id">#{{ t.id }}</div>
            <div class="recent-info">
              <div class="recent-subject">{{ t.title }}</div>
              <div class="recent-meta">
                {{ t.category }} · {{ fmtDate(t.created_at) }}
              </div>
            </div>
            <span :class="['sta-badge', 'sta-' + t.status]">{{
              fmtStatus(t.status)
            }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="loaded" class="empty-requests">
        <el-empty
          description="No requests yet. Submit your first one!"
          :image-size="80"
        >
          <el-button type="primary" @click="$router.push('/portal/tickets/new')"
            >Submit a Request</el-button
          >
        </el-empty>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import api from "../../api";

const router = useRouter();
const auth = useAuthStore();

const searchQuery = ref("");
const recentTickets = ref([]);
const loaded = ref(false);

const firstName = computed(() => (auth.user?.name || "").split(" ")[0]);

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push(
      `/portal/tickets?search=${encodeURIComponent(searchQuery.value.trim())}`,
    );
  }
}

function fmtStatus(s) {
  return (
    {
      open: "Open",
      in_progress: "In Progress",
      on_hold: "On Hold",
      resolved: "Resolved",
      closed: "Closed",
    }[s] || s
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

onMounted(async () => {
  try {
    const res = await api.get("/tickets?limit=5");
    recentTickets.value = res.data.tickets;
  } finally {
    loaded.value = true;
  }
});
</script>

<style scoped>
.portal-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Hero ── */
.hero {
  position: relative;
  background: #2c3e50;
  padding: 60px 24px 68px;
  overflow: hidden;
  text-align: center;
}

.deco {
  position: absolute;
  pointer-events: none;
}
.deco-dots-left {
  width: 120px;
  height: 120px;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.15) 1px,
    transparent 1px
  );
  background-size: 12px 12px;
  bottom: 24px;
  left: 48px;
}
.deco-dots-right {
  width: 120px;
  height: 120px;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 1px,
    transparent 1px
  );
  background-size: 12px 12px;
  top: 24px;
  right: 80px;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 680px;
  margin: 0 auto;
}
.hero-title {
  font-size: 30px;
  font-weight: 400;
  color: #fff;
  margin-bottom: 28px;
}

.search-wrap {
  max-width: 560px;
  margin: 0 auto;
}
.hero-search {
  width: 100%;
}
:deep(.hero-search .el-input__wrapper) {
  padding: 8px 16px;
  border-radius: 2px;
  background: #fff !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2) !important;
  border: none !important;
}
:deep(.hero-search .el-input__inner) {
  font-size: 15px;
}

/* ── Cards ── */
.cards-section {
  flex: 1;
  background: #fafafa;
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
  background: #fff;
  border-radius: 2px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  width: 320px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px -2px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2);
}
.action-card:hover {
  box-shadow:
    0 8px 10px rgba(0, 0, 0, 0.14),
    0 3px 14px rgba(0, 0, 0, 0.12),
    0 5px 5px rgba(0, 0, 0, 0.2);
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: #fff0e6;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-icon-wrap--primary {
  background: #fff0e6;
}
.card-icon {
  font-size: 22px;
  color: #002d72;
}
.card-icon-wrap--primary .card-icon {
  color: #002d72;
}

.card-text {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
}
.card-desc {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.54);
  line-height: 1.45;
}

.card-arrow {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.38);
  flex-shrink: 0;
}
.action-card:hover .card-arrow {
  color: #002d72;
}

/* ── Recent requests ── */
.recent-section {
  max-width: 720px;
  margin: 0 auto;
}
.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.recent-title {
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}
.view-all {
  font-size: 13px;
  color: #002d72;
  text-decoration: none;
}
.view-all:hover {
  text-decoration: underline;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recent-item {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.recent-item:hover {
  box-shadow:
    0 4px 5px rgba(0, 0, 0, 0.14),
    0 1px 10px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.recent-id {
  font-family: monospace;
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.38);
  font-weight: 500;
  min-width: 44px;
}
.recent-info {
  flex: 1;
  min-width: 0;
}
.recent-subject {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-meta {
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.54);
  margin-top: 2px;
}

.sta-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.sta-open {
  background: #fff0e6;
  color: #1565c0;
}
.sta-in_progress {
  background: #ede7f6;
  color: #4527a0;
}
.sta-on_hold {
  background: #fff3e0;
  color: #e65100;
}
.sta-resolved {
  background: #c8e6c9;
  color: #2e7d32;
}
.sta-closed {
  background: #eceff1;
  color: #546e7a;
}

.empty-requests {
  text-align: center;
  padding: 40px 0;
}
</style>
