<template>
  <div>
    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card" v-for="s in statCards" :key="s.label" :style="{ borderLeftColor: s.color }">
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
  { key: 'open',           label: 'Open',            icon: 'FolderOpened',  color: '#1565c0', bg: '#e3f2fd' },
  { key: 'in_progress',   label: 'In Progress',     icon: 'Loading',       color: '#4527a0', bg: '#ede7f6' },
  { key: 'on_hold',       label: 'On Hold',         icon: 'VideoPause',    color: '#e65100', bg: '#fff3e0' },
  { key: 'overdue',       label: 'Overdue',         icon: 'Warning',       color: '#c62828', bg: '#ffcdd2' },
  { key: 'resolved_today',label: 'Resolved Today',  icon: 'CircleCheck',   color: '#2e7d32', bg: '#c8e6c9' },
];

const slaReady = computed(() => !!data.value);

const slaOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false }, background: 'transparent', foreColor: 'rgba(0,0,0,0.54)' },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
  dataLabels: { enabled: false },
  xaxis: { categories: data.value?.sla_compliance.map(d => d.date) || [], labels: { style: { colors: 'rgba(0,0,0,0.54)' } } },
  yaxis: { min: 0, max: 100, labels: { formatter: v => v + '%', style: { colors: 'rgba(0,0,0,0.54)' } } },
  colors: ['#0288d1'],
  tooltip: { y: { formatter: v => (v ?? 'N/A') + '%' }, theme: 'light' },
  grid: { borderColor: 'rgba(0,0,0,0.12)' },
  markers: { size: 4 },
}));

const slaSeries = computed(() => [{
  name: 'SLA Compliance',
  data: data.value?.sla_compliance.map(d => d.rate) || [],
}]);

const priorityOptions = {
  chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', foreColor: 'rgba(0,0,0,0.54)' },
  plotOptions: { bar: { borderRadius: 2, distributed: true } },
  legend: { show: false },
  dataLabels: { enabled: false },
  xaxis: { categories: ['Critical', 'High', 'Medium', 'Low'], labels: { style: { colors: 'rgba(0,0,0,0.54)' } } },
  yaxis: { labels: { style: { colors: 'rgba(0,0,0,0.54)' } } },
  colors: ['#c62828', '#e65100', '#f57f17', '#2e7d32'],
  grid: { borderColor: 'rgba(0,0,0,0.12)' },
  tooltip: { theme: 'light' },
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
  colors: ['#1565c0', '#4527a0', '#e65100', '#2e7d32', '#546e7a'],
  legend: { position: 'bottom', fontSize: '12px', labels: { colors: 'rgba(0,0,0,0.54)' } },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '60%' } } },
  chart: { background: 'transparent', foreColor: 'rgba(0,0,0,0.54)' },
  tooltip: { theme: 'light' },
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
  border-radius: 2px;
  border-left: 3px solid transparent;
  padding: 18px 18px 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.stat-icon {
  width: 44px; height: 44px;
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.stat-value { font-size: 24px; font-weight: 400; color: rgba(0,0,0,0.87); }
.stat-label { font-size: 12px; color: rgba(0,0,0,0.54); margin-top: 2px; }

.charts-row { display: flex; gap: 16px; margin-bottom: 20px; }
.card {
  background: #fff;
  border-radius: 2px;
  padding: 20px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.chart-wide { flex: 2; min-width: 0; }
.chart-narrow { flex: 1; min-width: 0; }

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-header h3 { font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.87); }
.card-sub { font-size: 12px; color: rgba(0,0,0,0.54); }
.see-all { font-size: 12px; color: #0288d1; text-decoration: none; }

.chart-empty { height: 220px; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.38); }

.ticket-id { font-family: monospace; font-size: 12px; color: rgba(0,0,0,0.38); }
</style>
