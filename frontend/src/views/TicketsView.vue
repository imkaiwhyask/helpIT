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

      <!-- Merge button — appears when 2+ tickets selected and user is staff -->
      <el-button
        v-if="isItStaff && selectedTickets.length >= 2"
        type="warning"
        @click="openMergeDialog"
      >
        Merge Selected ({{ selectedTickets.length }})
      </el-button>

      <RouterLink to="/tickets/new">
        <el-button type="primary"><el-icon><Plus /></el-icon> New Ticket</el-button>
      </RouterLink>
    </div>

    <!-- Table -->
    <div class="card">
      <el-table
        ref="tableRef"
        :data="tickets"
        v-loading="loading"
        style="width:100%"
        row-class-name="clickable-row"
        @row-click="onRowClick"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="44" />

        <el-table-column label="#" width="90">
          <template #default="{ row }">
            <span class="tid">#{{ row.id }}</span>
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

    <!-- Merge dialog -->
    <el-dialog v-model="mergeDialog" title="Merge Duplicate Tickets" width="500px" :close-on-click-modal="false" @closed="mergeTargetId = null">
      <p style="font-size:13px;color:rgba(0,0,0,0.6);margin-bottom:16px">
        Select the ticket to <strong>keep open</strong>. The rest will be merged into it and closed.
      </p>

      <el-radio-group v-model="mergeTargetId" style="width:100%">
        <div
          v-for="t in selectedTickets"
          :key="t.id"
          :class="['merge-row', mergeTargetId === t.id && 'merge-row-selected']"
          @click="mergeTargetId = t.id"
        >
          <el-radio :value="t.id" @click.stop />
          <div class="merge-row-info">
            <span class="merge-tid">#{{ t.id }}</span>
            <span class="merge-title">{{ t.title }}</span>
          </div>
          <div class="merge-row-badges">
            <span :class="['badge','pri-'+t.priority]">{{ t.priority }}</span>
            <span :class="['badge','sta-'+t.status]">{{ fmtStatus(t.status) }}</span>
          </div>
        </div>
      </el-radio-group>

      <p v-if="mergeTargetId" style="font-size:12px;color:rgba(0,0,0,0.5);margin-top:14px">
        {{ selectedTickets.length - 1 }} ticket{{ selectedTickets.length - 1 > 1 ? 's' : '' }} will be closed and merged into
        <strong>#{{ mergeTargetId }}</strong>.
      </p>

      <template #footer>
        <el-button @click="mergeDialog = false">Cancel</el-button>
        <el-button type="warning" :loading="merging" :disabled="!mergeTargetId" @click="mergeTickets">
          Merge
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route  = useRoute();
const auth   = useAuthStore();

const isItStaff = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'technician');

const tableRef = ref(null);
const tickets  = ref([]);
const loading  = ref(false);
const total    = ref(0);
const page     = ref(1);
const limit    = 20;

const selectedTickets = ref([]);
const mergeDialog     = ref(false);
const mergeTargetId   = ref(null);
const merging         = ref(false);

const filters = ref({ search: '', status: '', priority: '', category: '' });

const statusOptions = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold',     label: 'On Hold' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
];
const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High' },
  { value: 'medium',   label: 'Medium' },
  { value: 'low',      label: 'Low' },
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
    total.value   = res.data.total;
  } finally {
    loading.value = false;
  }
}

let debounceTimer;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchTickets, 350);
}

function onSelectionChange(rows) {
  selectedTickets.value = rows;
}

function onRowClick(row, column) {
  if (column?.type === 'selection') return;
  router.push(`/tickets/${row.id}`);
}

function openMergeDialog() {
  mergeTargetId.value = selectedTickets.value[0]?.id ?? null;
  mergeDialog.value   = true;
}

async function mergeTickets() {
  if (!mergeTargetId.value) return;
  merging.value = true;
  const sourceIds = selectedTickets.value.filter(t => t.id !== mergeTargetId.value).map(t => t.id);
  try {
    const res = await api.post(`/tickets/${mergeTargetId.value}/merge`, { source_ids: sourceIds });
    mergeDialog.value = false;
    tableRef.value?.clearSelection();
    await fetchTickets();
    ElMessage.success(res.data.message);
  } catch (e) {
    ElMessage.error(e.response?.data?.error || 'Merge failed');
  } finally {
    merging.value = false;
  }
}

function getSlaStatus(row) {
  if (['resolved', 'closed'].includes(row.status)) return row.sla_resolution_breached ? 'breached' : 'met';
  const now     = Date.now();
  const due     = new Date(row.resolution_due).getTime();
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

onMounted(() => {
  if (route.query.status) filters.value.status = route.query.status;
  fetchTickets();
});
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
  border-radius: 2px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}

.tid { font-family: monospace; font-size: 12px; color: rgba(0,0,0,0.38); font-weight: 500; }
.ticket-title { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.87); }

.pagination { padding: 14px 16px; display: flex; justify-content: flex-end; }

/* Merge dialog rows */
.merge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 2px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.merge-row:hover { border-color: rgba(0,0,0,0.3); }
.merge-row-selected { border-color: #e6a23c; border-width: 2px; background: #fdf6ec; }
.merge-row-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; }
.merge-tid { font-family: monospace; font-size: 11px; color: rgba(0,0,0,0.38); flex-shrink: 0; }
.merge-title { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.87); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.merge-row-badges { display: flex; gap: 4px; flex-shrink: 0; }
</style>
