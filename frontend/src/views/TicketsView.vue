<template>
  <div>
    <!-- Filter bar -->
    <div class="filter-bar">
      <el-input
        v-model="filters.search"
        placeholder="Search title or ID…"
        clearable
        style="width: 240px"
        @input="debouncedFetch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <el-select v-model="filters.status" placeholder="Status" clearable style="width:140px" @change="fetchTickets">
        <el-option v-for="s in statusOptions" :key="s.value" :value="s.value" :label="s.label" />
      </el-select>

      <el-select v-model="filters.priority" placeholder="Priority" clearable style="width:130px" @change="fetchTickets">
        <el-option v-for="p in priorityOptions" :key="p.value" :value="p.value" :label="p.label" />
      </el-select>

      <el-select v-model="filters.category" placeholder="Category" clearable style="width:140px" @change="fetchTickets">
        <el-option v-for="c in categoryOptions" :key="c" :value="c" :label="c" />
      </el-select>

      <div class="filter-spacer" />
      <RouterLink to="/tickets/new">
        <el-button type="primary"><el-icon><Plus /></el-icon> New Ticket</el-button>
      </RouterLink>
    </div>

    <!-- Table -->
    <div class="card">
      <el-table
        :data="tickets"
        v-loading="loading"
        style="width:100%"
        row-class-name="clickable-row"
        @row-click="row => router.push(`/tickets/${row.id}`)"
      >
        <el-table-column label="#" width="72">
          <template #default="{ row }">
            <span class="tid">#{{ String(row.id).padStart(4,'0') }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Subject" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="ticket-title">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="Category" width="120" />

        <el-table-column label="Priority" width="95">
          <template #default="{ row }">
            <span :class="['badge','pri-'+row.priority]">{{ row.priority }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Status" width="115">
          <template #default="{ row }">
            <span :class="['badge','sta-'+row.status]">{{ fmtStatus(row.status) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Assigned To" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.assigned_name || '—' }}</template>
        </el-table-column>

        <el-table-column label="Created" width="110">
          <template #default="{ row }">{{ fmtDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="Due" width="110">
          <template #default="{ row }">{{ fmtDate(row.resolution_due) }}</template>
        </el-table-column>

        <el-table-column label="SLA" width="95">
          <template #default="{ row }">
            <span :class="['badge','sla-'+getSlaStatus(row)]">{{ fmtSla(row) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchTickets"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const tickets = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const limit = 20;

const filters = ref({ search: '', status: '', priority: '', category: '' });

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
const categoryOptions = ['Hardware', 'Software', 'Network', 'Access', 'Other'];

async function fetchTickets() {
  loading.value = true;
  try {
    const params = { page: page.value, limit };
    if (filters.value.search)   params.search   = filters.value.search;
    if (filters.value.status)   params.status   = filters.value.status;
    if (filters.value.priority) params.priority = filters.value.priority;
    if (filters.value.category) params.category = filters.value.category;
    const res = await api.get('/tickets', { params });
    tickets.value = res.data.tickets;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

let debounceTimer;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchTickets, 350);
}

function getSlaStatus(row) {
  if (['resolved', 'closed'].includes(row.status)) return row.sla_resolution_breached ? 'breached' : 'met';
  const now = Date.now();
  const due = new Date(row.resolution_due).getTime();
  const created = new Date(row.created_at).getTime();
  if (now > due) return 'breached';
  if ((now - created) / (due - created) > 0.8) return 'risk';
  return 'ok';
}

function fmtSla(row) {
  return { ok: 'On Track', risk: 'At Risk', breached: 'Breached', met: 'Met' }[getSlaStatus(row)];
}

function fmtStatus(s) {
  return { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed' }[s] || s;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

onMounted(fetchTickets);
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-spacer { flex: 1; }

.card {
  background: #fff;
  border-radius: 10px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.tid { font-family: monospace; font-size: 12px; color: #64748b; font-weight: 600; }
.ticket-title { font-size: 13px; font-weight: 500; color: #1e293b; }

.pagination { padding: 14px 16px; display: flex; justify-content: flex-end; }

:global(.clickable-row) { cursor: pointer; }
:global(.clickable-row:hover td) { background: #f8fafc !important; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}
.pri-critical { background: #fef2f2; color: #dc2626; }
.pri-high     { background: #fff7ed; color: #ea580c; }
.pri-medium   { background: #fefce8; color: #ca8a04; }
.pri-low      { background: #f0fdf4; color: #16a34a; }
.sta-open        { background: #eff6ff; color: #2563eb; }
.sta-in_progress { background: #f5f3ff; color: #7c3aed; }
.sta-on_hold     { background: #fff7ed; color: #ea580c; }
.sta-resolved    { background: #f0fdf4; color: #16a34a; }
.sta-closed      { background: #f9fafb; color: #6b7280; }
.sla-ok      { background: #f0fdf4; color: #16a34a; }
.sla-risk    { background: #fffbeb; color: #d97706; }
.sla-breached{ background: #fef2f2; color: #dc2626; }
.sla-met     { background: #f0fdf4; color: #16a34a; }
</style>
