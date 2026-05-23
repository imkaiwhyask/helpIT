<template>
  <div>
    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <el-icon :style="{ color: s.color }"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ data ? data.stats[s.key] : '–' }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <!-- SLA Compliance -->
      <div class="card chart-wide">
        <div class="card-header">
          <h3>SLA Compliance – Last 7 Days</h3>
          <span class="card-sub">% of tickets resolved within SLA</span>
        </div>
        <apexchart v-if="slaReady" type="area" height="220" :options="slaOptions" :series="slaSeries" />
        <div v-else class="chart-empty">Loading…</div>
      </div>

      <!-- Tickets by Priority -->
      <div class="card chart-narrow">
        <div class="card-header"><h3>Open by Priority</h3></div>
        <apexchart v-if="slaReady" type="bar" height="220" :options="priorityOptions" :series="prioritySeries" />
      </div>
    </div>

    <!-- Status donut + Recent tickets -->
    <div class="charts-row">
      <div class="card chart-narrow">
        <div class="card-header"><h3>Tickets by Status</h3></div>
        <apexchart v-if="slaReady" type="donut" height="240" :options="statusOptions" :series="statusSeries" />
      </div>

      <!-- Recent tickets -->
      <div class="card chart-wide">
        <div class="card-header">
          <h3>Recent Tickets</h3>
          <RouterLink to="/tickets" class="see-all">See all</RouterLink>
        </div>
        <el-table :data="recentTickets" size="small" style="width:100%" @row-click="goTicket">
          <el-table-column label="#" width="60">
            <template #default="{ row }">
              <span class="ticket-id">#{{ String(row.id).padStart(4,'0') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="Title" min-width="160" show-overflow-tooltip />
          <el-table-column label="Priority" width="90">
            <template #default="{ row }">
              <span :class="['badge', 'pri-' + row.priority]">{{ row.priority }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="100">
            <template #default="{ row }">
              <span :class="['badge', 'sta-' + row.status]">{{ fmtStatus(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="SLA" width="90">
            <template #default="{ row }">
              <span :class="['badge', 'sla-' + slaStatus(row)]">{{ fmtSla(row) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const data = ref(null);

const statCards = [
  { key: 'open',           label: 'Open',            icon: 'FolderOpened',  color: '#2563eb', bg: '#eff6ff' },
  { key: 'in_progress',   label: 'In Progress',     icon: 'Loading',       color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'on_hold',       label: 'On Hold',         icon: 'VideoPause',    color: '#d97706', bg: '#fffbeb' },
  { key: 'overdue',       label: 'Overdue',         icon: 'Warning',       color: '#dc2626', bg: '#fef2f2' },
  { key: 'resolved_today',label: 'Resolved Today',  icon: 'CircleCheck',   color: '#16a34a', bg: '#f0fdf4' },
];

const slaReady = computed(() => !!data.value);

const slaOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
  dataLabels: { enabled: false },
  xaxis: { categories: data.value?.sla_compliance.map(d => d.date) || [] },
  yaxis: { min: 0, max: 100, labels: { formatter: v => v + '%' } },
  colors: ['#2563eb'],
  tooltip: { y: { formatter: v => (v ?? 'N/A') + '%' } },
  grid: { borderColor: '#f1f5f9' },
  markers: { size: 4 },
}));

const slaSeries = computed(() => [{
  name: 'SLA Compliance',
  data: data.value?.sla_compliance.map(d => d.rate) || [],
}]);

const priorityOptions = {
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 4, distributed: true } },
  legend: { show: false },
  dataLabels: { enabled: false },
  xaxis: { categories: ['Critical', 'High', 'Medium', 'Low'] },
  colors: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
  grid: { borderColor: '#f1f5f9' },
};

const prioritySeries = computed(() => [{
  name: 'Open',
  data: [
    data.value?.by_priority.critical || 0,
    data.value?.by_priority.high || 0,
    data.value?.by_priority.medium || 0,
    data.value?.by_priority.low || 0,
  ],
}]);

const statusOptions = {
  labels: ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
  colors: ['#2563eb', '#7c3aed', '#f97316', '#16a34a', '#6b7280'],
  legend: { position: 'bottom', fontSize: '12px' },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '60%' } } },
};

const statusSeries = computed(() => [
  data.value?.by_status.open || 0,
  data.value?.by_status.in_progress || 0,
  data.value?.by_status.on_hold || 0,
  data.value?.by_status.resolved || 0,
  data.value?.by_status.closed || 0,
]);

const recentTickets = computed(() => data.value?.recent_tickets || []);

function slaStatus(row) {
  if (['resolved', 'closed'].includes(row.status)) return row.sla_resolution_breached ? 'breached' : 'met';
  const now = Date.now();
  const due = new Date(row.resolution_due).getTime();
  const created = new Date(row.created_at).getTime();
  if (now > due) return 'breached';
  if ((now - created) / (due - created) > 0.8) return 'risk';
  return 'ok';
}

function fmtSla(row) {
  const s = slaStatus(row);
  return { ok: 'On Track', risk: 'At Risk', breached: 'Breached', met: 'Met' }[s] || s;
}

function fmtStatus(s) {
  return { open: 'Open', in_progress: 'In Progress', on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed' }[s] || s;
}

function goTicket(row) { router.push(`/tickets/${row.id}`); }

onMounted(async () => {
  const res = await api.get('/dashboard/stats');
  data.value = res.data;
});
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.stat-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }

.charts-row { display: flex; gap: 16px; margin-bottom: 20px; }
.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.chart-wide { flex: 2; min-width: 0; }
.chart-narrow { flex: 1; min-width: 0; }

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-header h3 { font-size: 14px; font-weight: 600; color: #0f172a; }
.card-sub { font-size: 12px; color: #94a3b8; }
.see-all { font-size: 12px; color: #2563eb; text-decoration: none; }

.chart-empty { height: 220px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }

.ticket-id { font-family: monospace; font-size: 12px; color: #64748b; }

/* Badges */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
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
