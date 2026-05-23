<template>
  <div class="reports-page">

    <div class="page-header">
      <div>
        <h2 class="page-title">Technician Performance</h2>
        <p class="page-sub">Ticket volume, resolution rate, and SLA compliance per technician</p>
      </div>
      <el-select v-model="days" style="width:160px" @change="load">
        <el-option :value="7"  label="Last 7 days" />
        <el-option :value="14" label="Last 14 days" />
        <el-option :value="30" label="Last 30 days" />
        <el-option :value="90" label="Last 90 days" />
      </el-select>
    </div>

    <!-- Summary stat cards -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Total Tickets</div>
        <div class="stat-value">{{ totals.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resolved</div>
        <div class="stat-value text-green">{{ totals.resolved }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">SLA Breached</div>
        <div class="stat-value text-red">{{ totals.breached }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg SLA Compliance</div>
        <div class="stat-value">{{ totals.sla_pct !== null ? totals.sla_pct + '%' : '—' }}</div>
      </div>
    </div>

    <!-- Technician table -->
    <div class="card" v-loading="loading">
      <el-table :data="technicians" style="width:100%" :empty-text="'No technician data for this period'">

        <el-table-column label="Technician" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="avatar">{{ initials(row.name) }}</div>
              <div>
                <div class="uname">{{ row.name }}</div>
                <div class="uemail">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="department" label="Dept" width="130" />

        <el-table-column label="Assigned" width="90" align="center">
          <template #default="{ row }">{{ row.total_assigned }}</template>
        </el-table-column>

        <el-table-column label="Resolved" width="90" align="center">
          <template #default="{ row }">
            <span class="text-green fw">{{ row.resolved }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Open" width="80" align="center">
          <template #default="{ row }">{{ row.open }}</template>
        </el-table-column>

        <el-table-column label="SLA Breached" width="110" align="center">
          <template #default="{ row }">
            <span :class="row.breached > 0 ? 'text-red fw' : 'text-muted'">{{ row.breached }}</span>
          </template>
        </el-table-column>

        <el-table-column label="SLA Compliance" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.sla_compliance !== null" class="compliance-wrap">
              <el-progress
                :percentage="row.sla_compliance"
                :color="complianceColor(row.sla_compliance)"
                :stroke-width="6"
                :show-text="false"
                style="width:70px"
              />
              <span class="comp-pct">{{ row.sla_compliance }}%</span>
            </div>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="Avg Resolution" width="130" align="center">
          <template #default="{ row }">
            <span v-if="row.avg_resolution_hours !== null">{{ fmtHours(row.avg_resolution_hours) }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <!-- Trend chart -->
    <div class="card chart-card" v-loading="trendLoading">
      <div class="chart-title">Ticket Trend (last {{ days }} days)</div>
      <apexchart v-if="trendSeries.length" type="bar" height="220" :options="trendOptions" :series="trendSeries" />
      <el-empty v-else-if="!trendLoading" description="No data" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';

const technicians  = ref([]);
const loading      = ref(false);
const trendLoading = ref(false);
const days         = ref(30);
const trendSeries  = ref([]);
const trendCategories = ref([]);

const totals = computed(() => {
  const t = technicians.value;
  const total    = t.reduce((s, r) => s + (r.total_assigned || 0), 0);
  const resolved = t.reduce((s, r) => s + (r.resolved || 0), 0);
  const breached = t.reduce((s, r) => s + (r.breached || 0), 0);
  const withData = t.filter(r => r.sla_compliance !== null);
  const sla_pct  = withData.length ? Math.round(withData.reduce((s, r) => s + r.sla_compliance, 0) / withData.length) : null;
  return { total, resolved, breached, sla_pct };
});

const trendOptions = computed(() => ({
  chart: { toolbar: { show: false }, background: 'transparent', foreColor: 'rgba(0,0,0,0.54)', theme: { mode: 'light' } },
  plotOptions: { bar: { borderRadius: 2, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  colors: ['#0288d1', '#2e7d32', '#c62828'],
  xaxis: { categories: trendCategories.value, labels: { style: { fontSize: '11px', colors: 'rgba(0,0,0,0.54)' } } },
  yaxis: { labels: { style: { fontSize: '11px', colors: 'rgba(0,0,0,0.54)' } } },
  legend: { position: 'top', fontSize: '12px', labels: { colors: 'rgba(0,0,0,0.54)' } },
  grid: { borderColor: 'rgba(0,0,0,0.12)' },
  tooltip: { theme: 'light' },
}));

function initials(name) {
  return (name||'').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
}
function fmtHours(h) {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  return `${(h/24).toFixed(1)}d`;
}
function complianceColor(pct) {
  if (pct >= 90) return '#2e7d32';
  if (pct >= 70) return '#f57f17';
  return '#c62828';
}

async function load() {
  loading.value = true;
  trendLoading.value = true;
  try {
    const [techRes, trendRes] = await Promise.all([
      api.get('/reports/technicians', { params: { days: days.value } }),
      api.get('/reports/trends',      { params: { days: days.value } }),
    ]);

    technicians.value = techRes.data.technicians;

    const trends = trendRes.data.trends;
    trendCategories.value = trends.map(r => r.date.slice(5));
    trendSeries.value = [
      { name: 'Created',  data: trends.map(r => r.created) },
      { name: 'Resolved', data: trends.map(r => r.resolved) },
      { name: 'Breached', data: trends.map(r => r.breached) },
    ];
  } finally {
    loading.value = false;
    trendLoading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.reports-page { display:flex; flex-direction:column; gap:20px; }

.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.page-title { font-size:20px; font-weight:500; color: rgba(0,0,0,0.87); margin-bottom:4px; }
.page-sub { font-size:13px; color: rgba(0,0,0,0.54); }

.stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.stat-card {
  background: #fff;
  border-radius:2px; padding:18px 20px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.stat-label { font-size:12px; color: rgba(0,0,0,0.54); font-weight:500; margin-bottom:6px; }
.stat-value { font-size:26px; font-weight:400; color: rgba(0,0,0,0.87); }
.text-green { color: #2e7d32; }
.text-red   { color: #c62828; }
.text-muted { color: rgba(0,0,0,0.38); }
.fw { font-weight:500; }

.card {
  background: #fff;
  border-radius:2px; overflow:hidden;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.chart-card { padding:20px 24px; }
.chart-title { font-size:14px; font-weight:500; color: rgba(0,0,0,0.87); margin-bottom:16px; }

.user-cell { display:flex; align-items:center; gap:10px; }
.avatar {
  width:32px; height:32px;
  background: #0288d1;
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:500; color:#fff; flex-shrink:0;
}
.uname  { font-size:13px; font-weight:500; color: rgba(0,0,0,0.87); }
.uemail { font-size:11.5px; color: rgba(0,0,0,0.54); }

.compliance-wrap { display:flex; align-items:center; gap:8px; justify-content:center; }
.comp-pct { font-size:12px; font-weight:500; color: rgba(0,0,0,0.87); min-width:32px; }
</style>
