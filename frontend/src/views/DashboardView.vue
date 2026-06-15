<template>
  <div>
    <!-- Stat cards -->
    <div class="stat-grid">
      <Md1StatCard
        v-for="s in statCards"
        :key="s.label"
        :label="s.label"
        :value="data ? data.stats[s.key] : '–'"
        :icon="s.icon"
        :color="s.color"
        :icon-bg="s.bg"
        @click="router.push(s.route)"
      />
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <!-- SLA Compliance — Md1Card demo -->
      <Md1Card class="chart-wide">
        <template #title>SLA Compliance – Last 7 Days</template>
        <template #subtitle>% of tickets resolved within SLA</template>
        <div class="chart-box">
          <Line v-if="data" :data="slaChartData" :options="slaChartOptions" />
          <div v-else class="chart-empty">Loading…</div>
        </div>
      </Md1Card>

      <!-- Tickets by Priority -->
      <Md1Card class="chart-narrow">
        <template #title>Open by Priority</template>
        <div class="chart-box">
          <Bar v-if="data" :data="priorityChartData" :options="priorityChartOptions" />
        </div>
      </Md1Card>
    </div>

    <!-- Status donut + Recent tickets -->
    <div class="charts-row">
      <Md1Card class="chart-narrow">
        <template #title>Tickets by Status</template>
        <div class="chart-box chart-box--donut">
          <Doughnut v-if="data" :data="statusChartData" :options="statusChartOptions" />
        </div>
      </Md1Card>

      <!-- Recent tickets -->
      <Md1Card class="chart-wide">
        <template #title>Recent Tickets</template>
        <template #menu>
          <RouterLink to="/tickets" class="see-all">See all</RouterLink>
        </template>
        <el-table :data="recentTickets" size="small" style="width:100%" @row-click="goTicket">
          <el-table-column label="#" width="90">
            <template #default="{ row }">
              <span class="ticket-id">#{{ row.id }}</span>
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
      </Md1Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import Md1Card from '../components/md1/Md1Card.vue';
import Md1StatCard from '../components/md1/Md1StatCard.vue';

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
);

const router = useRouter();
const data = ref(null);

const statCards = [
  { key: 'open',            label: 'Open',           icon: 'FolderOpened', color: '#1565c0', bg: '#fff0e6', route: '/tickets?status=open' },
  { key: 'in_progress',    label: 'In Progress',    icon: 'Loading',      color: '#4527a0', bg: '#ede7f6', route: '/tickets?status=in_progress' },
  { key: 'on_hold',        label: 'On Hold',        icon: 'VideoPause',   color: '#e65100', bg: '#fff3e0', route: '/tickets?status=on_hold' },
  { key: 'overdue',        label: 'Overdue',        icon: 'Warning',      color: '#c62828', bg: '#ffcdd2', route: '/tickets?status=open' },
  { key: 'resolved_today', label: 'Resolved Today', icon: 'CircleCheck',  color: '#2e7d32', bg: '#c8e6c9', route: '/tickets?status=resolved' },
];

// ── SLA Compliance (Line) ──────────────────────────────────────────
const slaChartData = computed(() => ({
  labels: data.value?.sla_compliance.map(d => d.date) ?? [],
  datasets: [{
    label: 'SLA Compliance',
    data: data.value?.sla_compliance.map(d => d.rate) ?? [],
    borderColor: '#002d72',
    backgroundColor: 'rgba(0,45,114,0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: '#002d72',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
  }],
}));

const slaChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: ctx => ctx.raw != null ? `SLA Compliance: ${ctx.raw}%` : 'N/A' },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(0,0,0,0.08)' }, ticks: { color: 'rgba(0,0,0,0.54)', font: { size: 11 } } },
    y: {
      min: 0, max: 100,
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: 'rgba(0,0,0,0.54)', font: { size: 11 }, callback: v => v + '%' },
    },
  },
};

// ── Open by Priority (Bar) ─────────────────────────────────────────
const priorityChartData = computed(() => ({
  labels: ['Critical', 'High', 'Medium', 'Low'],
  datasets: [{
    data: [
      data.value?.by_priority.critical ?? 0,
      data.value?.by_priority.high     ?? 0,
      data.value?.by_priority.medium   ?? 0,
      data.value?.by_priority.low      ?? 0,
    ],
    backgroundColor: ['#c62828', '#e65100', '#f57f17', '#2e7d32'],
    borderRadius: 2,
    barPercentage: 0.6,
  }],
}));

const priorityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: 'rgba(0,0,0,0.54)', font: { size: 11 } } },
    y: {
      grid: { color: 'rgba(0,0,0,0.08)' },
      ticks: { color: 'rgba(0,0,0,0.54)', font: { size: 11 }, precision: 0 },
    },
  },
};

// ── Tickets by Status (Doughnut) ───────────────────────────────────
const statusChartData = computed(() => ({
  labels: ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
  datasets: [{
    data: [
      data.value?.by_status.open        ?? 0,
      data.value?.by_status.in_progress ?? 0,
      data.value?.by_status.on_hold     ?? 0,
      data.value?.by_status.resolved    ?? 0,
      data.value?.by_status.closed      ?? 0,
    ],
    backgroundColor: ['#1565c0', '#4527a0', '#e65100', '#2e7d32', '#546e7a'],
    borderWidth: 0,
  }],
}));

const statusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: 'rgba(0,0,0,0.54)', font: { size: 12 }, padding: 12 },
    },
  },
};

// ── Recent tickets ─────────────────────────────────────────────────
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
  return { ok: 'On Track', risk: 'At Risk', breached: 'Breached', met: 'Met' }[slaStatus(row)] || '';
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
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 8px 10px rgba(0,0,0,0.14), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px rgba(0,0,0,0.20);
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
.see-all { font-size: 12px; color: var(--md1-primary); text-decoration: none; }

.chart-box { position: relative; height: 220px; }
.chart-box--donut { height: 240px; }
.chart-empty { height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.38); }

.ticket-id { font-family: monospace; font-size: 12px; color: rgba(0,0,0,0.38); }
</style>
