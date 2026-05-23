<template>
  <div class="my-tickets-page">
    <div class="page-header">
      <h2 class="page-title">My Requests</h2>
      <RouterLink to="/portal/tickets/new">
        <el-button type="primary" style="background:#4f46e5;border-color:#4f46e5">
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

    <div class="ticket-list" v-loading="loading">
      <div
        v-for="t in tickets"
        :key="t.id"
        class="ticket-row"
        @click="$router.push(`/portal/tickets/${t.id}`)"
      >
        <div class="tr-id">#{{ String(t.id).padStart(4,'0') }}</div>
        <div class="tr-info">
          <div class="tr-title">{{ t.title }}</div>
          <div class="tr-meta">{{ t.category }}<span v-if="t.subcategory"> · {{ t.subcategory }}</span> &middot; Submitted {{ fmtDate(t.created_at) }}</div>
        </div>
        <div class="tr-right">
          <span :class="['sta','sta-'+t.status]">{{ fmtStatus(t.status) }}</span>
          <el-icon class="tr-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div v-if="!loading && !tickets.length" class="empty">
        <el-empty description="No requests found">
          <el-button type="primary" @click="$router.push('/portal/tickets/new')" style="background:#4f46e5;border-color:#4f46e5">
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
import { ref, onMounted } from 'vue';
import api from '../../api';

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
    if (search.value)      params.search = search.value;
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

onMounted(fetchTickets);
</script>

<style scoped>
.my-tickets-page { max-width: 860px; margin: 0 auto; padding: 36px 24px; }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.page-title { font-size:20px; font-weight:700; color:#111827; }
.filters { display:flex; gap:10px; margin-bottom:20px; }

.ticket-list { display:flex; flex-direction:column; gap:10px; }

.ticket-row {
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:16px 20px;
  display:flex;
  align-items:center;
  gap:16px;
  cursor:pointer;
  transition:box-shadow 0.15s, border-color 0.15s;
}
.ticket-row:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08); border-color:#d1d5db; }

.tr-id { font-family:monospace; font-size:12px; color:#9ca3af; font-weight:600; min-width:52px; }
.tr-info { flex:1; min-width:0; }
.tr-title { font-size:14px; font-weight:600; color:#111827; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tr-meta { font-size:12px; color:#9ca3af; }

.tr-right { display:flex; align-items:center; gap:12px; }
.tr-arrow { color:#d1d5db; font-size:14px; }

.sta { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
.sta-open        { background:#eff6ff; color:#2563eb; }
.sta-in_progress { background:#f5f3ff; color:#7c3aed; }
.sta-on_hold     { background:#fff7ed; color:#ea580c; }
.sta-resolved    { background:#f0fdf4; color:#16a34a; }
.sta-closed      { background:#f9fafb; color:#6b7280; }

.pager { display:flex; justify-content:center; margin-top:20px; }
.empty { padding:48px 0; }
</style>
