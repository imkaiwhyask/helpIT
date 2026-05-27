<template>
  <div class="my-tickets-page">
    <div class="page-header">
      <h2 class="page-title">My Requests</h2>
      <RouterLink to="/portal/tickets/new">
        <el-button type="primary">
          <el-icon><Plus /></el-icon> New Request
        </el-button>
      </RouterLink>
    </div>

    <div class="filters">
      <el-input v-model="search" placeholder="Search requests…" clearable style="width:260px" @input="debouncedFetch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="Status" clearable style="width:140px" @change="fetchTickets">
        <el-option value="open"        label="Open" />
        <el-option value="in_progress" label="In Progress" />
        <el-option value="on_hold"     label="On Hold" />
        <el-option value="resolved"    label="Resolved" />
        <el-option value="closed"      label="Closed" />
      </el-select>
    </div>

    <div v-loading="loading">
      <TransitionGroup name="list" tag="div" class="ticket-list">
        <div
          v-for="(t, i) in tickets"
          :key="t.id"
          class="ticket-row"
          v-md1-ripple.dark
          :style="{ '--i': i }"
          @click="goToTicket(t, $event)"
        >
          <div class="tr-id">#{{ t.id }}</div>
          <div class="tr-info">
            <div class="tr-title">{{ t.title }}</div>
            <div class="tr-meta">{{ t.category }}<span v-if="t.subcategory"> · {{ t.subcategory }}</span> &middot; Submitted {{ fmtDate(t.created_at) }}</div>
          </div>
          <div class="tr-right">
            <span :class="['sta','sta-'+t.status]">{{ fmtStatus(t.status) }}</span>
            <el-icon class="tr-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="!loading && !tickets.length" class="empty">
        <el-empty description="No requests found">
          <el-button type="primary" @click="$router.push('/portal/tickets/new')">
            Submit your first request
          </el-button>
        </el-empty>
      </div>
    </div>

    <div v-if="total > limit" class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="limit"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchTickets"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../api';

const router = useRouter();

const tickets = ref([]);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('');
const page = ref(1);
const limit = 15;
const total = ref(0);

async function fetchTickets() {
  loading.value = true;
  try {
    const params = { page: page.value, limit };
    if (search.value)       params.search = search.value;
    if (statusFilter.value) params.status = statusFilter.value;
    const res = await api.get('/tickets', { params });
    tickets.value = res.data.tickets;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

let timer;
function debouncedFetch() { clearTimeout(timer); timer = setTimeout(fetchTickets, 350); }

function fmtStatus(s) {
  return { open:'Open', in_progress:'In Progress', on_hold:'On Hold', resolved:'Resolved', closed:'Closed' }[s] || s;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function goToTicket(t, event) {
  if (!document.startViewTransition) {
    router.push(`/portal/tickets/${t.id}`);
    return;
  }
  const row = event.currentTarget;
  row.style.viewTransitionName = 'ticket-shared';

  const vt = document.startViewTransition(async () => {
    await router.push(`/portal/tickets/${t.id}`);
    await nextTick();
  });

  vt.finished.finally(() => {
    row.style.viewTransitionName = '';
  });
}

onMounted(fetchTickets);
</script>

<style scoped>
.my-tickets-page { max-width: 860px; margin: 0 auto; padding: 36px 24px; }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-title { font-size:20px; font-weight:500; color: rgba(0,0,0,0.87); }
.filters { display:flex; gap:10px; margin-bottom:20px; }

.ticket-list { display:flex; flex-direction:column; gap:8px; }

.ticket-row {
  background: #fff;
  border-radius:2px;
  padding:16px 20px;
  display:flex;
  align-items:center;
  gap:16px;
  cursor:pointer;
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.ticket-row:hover {
  box-shadow: 0 6px 10px rgba(0,0,0,0.14), 0 1px 18px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.20);
  transform: translateY(-1px);
}

.tr-id { font-family:monospace; font-size:12px; color: rgba(0,0,0,0.38); font-weight:500; min-width:52px; }
.tr-info { flex:1; min-width:0; }
.tr-title { font-size:14px; font-weight:500; color: rgba(0,0,0,0.87); margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tr-meta { font-size:12px; color: rgba(0,0,0,0.54); }

.tr-right { display:flex; align-items:center; gap:12px; }
.tr-arrow {
  color: rgba(0,0,0,0.38);
  font-size:14px;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.ticket-row:hover .tr-arrow {
  color: #2196F3;
  transform: translateX(5px);
}

.sta { display:inline-block; padding:3px 10px; border-radius:2px; font-size:11px; font-weight:500; white-space:nowrap; }
.sta-open        { background: #E3F2FD; color: #1976D2; }
.sta-in_progress { background: #ede7f6; color: #4527a0; }
.sta-on_hold     { background: #fff3e0; color: #e65100; }
.sta-resolved    { background: #c8e6c9; color: #2e7d32; }
.sta-closed      { background: #eceff1; color: #546e7a; }

.pager { display:flex; justify-content:center; margin-top:20px; }
.empty { padding:48px 0; }

/* TransitionGroup stagger */
.list-enter-active {
  transition:
    opacity 0.32s cubic-bezier(0, 0, 0.2, 1),
    transform 0.32s cubic-bezier(0, 0, 0.2, 1);
  transition-delay: calc(var(--i) * 40ms);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.list-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.4, 0, 1, 1),
    transform 0.2s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
