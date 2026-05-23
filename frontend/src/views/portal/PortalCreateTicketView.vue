<template>
  <div class="create-page">
    <RouterLink to="/portal" class="breadcrumb">
      <el-icon><ArrowLeft /></el-icon> Back to Portal
    </RouterLink>

    <div class="card">
      <h2 class="form-title">Submit a Request</h2>
      <p class="form-sub">Describe your issue and our IT team will get back to you based on priority.</p>

      <el-form :model="form" label-position="top" @submit.prevent="submit">

        <el-form-item label="Subject *">
          <el-input v-model="form.title" placeholder="Brief description of the issue" size="large" maxlength="200" show-word-limit />
        </el-form-item>

        <!-- Category cards -->
        <el-form-item label="Category *">
          <div class="cat-grid">
            <div
              v-for="c in categories"
              :key="c.name"
              :class="['cat-card', form.category === c.name && 'cat-selected']"
              @click="form.category = c.name; form.subcategory = ''"
            >
              <div class="cat-icon-wrap">
                <el-icon class="cat-icon"><component :is="c.icon" /></el-icon>
              </div>
              <span class="cat-name">{{ c.name }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item v-if="subcategories.length" label="Subcategory">
          <el-select v-model="form.subcategory" placeholder="Select subcategory" style="width:100%">
            <el-option v-for="s in subcategories" :key="s" :value="s" :label="s" />
          </el-select>
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="Please describe your issue in detail: what happened, when it started, any error messages you see, how many people are affected…"
          />
        </el-form-item>

        <!-- Urgency -->
        <el-form-item label="Urgency Level">
          <div class="urgency-grid">
            <div
              v-for="u in urgencyLevels"
              :key="u.value"
              :class="['urgency-card', form.priority === u.value && 'urgency-selected', 'urgency-'+u.value]"
              @click="form.priority = u.value"
            >
              <div class="urgency-label">{{ u.label }}</div>
              <div class="urgency-desc">{{ u.desc }}</div>
            </div>
          </div>
        </el-form-item>

        <!-- SLA preview -->
        <div class="sla-bar">
          <el-icon><Clock /></el-icon>
          <span>Expected response within <strong>{{ slaResponse }}</strong> · Resolution within <strong>{{ slaResolution }}</strong></span>
        </div>

        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-bottom:16px" />

        <div class="form-actions">
          <RouterLink to="/portal"><el-button>Cancel</el-button></RouterLink>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            :disabled="!form.title.trim()"
            style="min-width:140px"
          >
            Submit Request
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../../api';

const router = useRouter();
const loading = ref(false);
const error = ref('');

const form = ref({
  title: '',
  description: '',
  category: 'Hardware',
  subcategory: '',
  priority: 'medium',
});

const categories = [
  { name: 'Hardware', icon: 'Monitor' },
  { name: 'Software', icon: 'Grid' },
  { name: 'Network',  icon: 'Share' },
  { name: 'Access',   icon: 'Lock' },
  { name: 'Other',    icon: 'List' },
];

const catSubs = {
  Hardware: ['Laptop/PC','Printer','Monitor','Keyboard/Mouse','Server','Mobile Device','Other'],
  Software: ['Windows/macOS','Microsoft Office','Email/Calendar','ERP/CRM','Antivirus','Other'],
  Network:  ['WiFi','VPN','LAN','Internet','DNS','Other'],
  Access:   ['User Account','Password Reset','Permissions','Badge/Physical','Other'],
  Other:    ['General Request','Information','Other'],
};

const subcategories = computed(() => catSubs[form.value.category] || []);

const urgencyLevels = [
  { value: 'low',      label: 'Low',      desc: 'Not urgent, whenever possible' },
  { value: 'medium',   label: 'Medium',   desc: 'Affects my work, I can manage' },
  { value: 'high',     label: 'High',     desc: 'Significantly impacting my work' },
  { value: 'critical', label: 'Urgent',   desc: "I'm completely blocked!" },
];

const SLA = {
  low:      { response: '24 hours', resolution: '72 hours' },
  medium:   { response: '8 hours',  resolution: '24 hours' },
  high:     { response: '4 hours',  resolution: '8 hours' },
  critical: { response: '1 hour',   resolution: '4 hours' },
};

const slaResponse   = computed(() => SLA[form.value.priority].response);
const slaResolution = computed(() => SLA[form.value.priority].resolution);

async function submit() {
  if (!form.value.title.trim()) { error.value = 'Subject is required'; return; }
  error.value = '';
  loading.value = true;
  try {
    const res = await api.post('/tickets', {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      subcategory: form.value.subcategory,
      priority: form.value.priority,
    });
    ElMessage.success('Request submitted successfully!');
    router.push(`/portal/tickets/${res.data.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to submit request. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.create-page { max-width: 720px; margin: 0 auto; padding: 36px 24px; }
.breadcrumb {
  display:inline-flex; align-items:center; gap:6px;
  color: #0288d1; font-size:13px; font-weight:500;
  text-decoration:none; margin-bottom:20px;
}
.breadcrumb:hover { text-decoration:underline; }

.card {
  background: #fff;
  border-radius:2px; padding:36px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}
.form-title { font-size:20px; font-weight:500; color: rgba(0,0,0,0.87); margin-bottom:6px; }
.form-sub { font-size:14px; color: rgba(0,0,0,0.54); margin-bottom:28px; }

.cat-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; }
.cat-card {
  border:1px solid rgba(0,0,0,0.23); border-radius:2px; padding:14px 8px 12px;
  text-align:center; cursor:pointer; transition:all 0.15s;
  display:flex; flex-direction:column; align-items:center; gap:8px; background: #fff;
}
.cat-card:hover { border-color: #0288d1; background: rgba(2,136,209,0.04); }
.cat-selected { border-color: #0288d1; border-width: 2px; background: #e3f2fd; }
.cat-icon-wrap {
  width:40px; height:40px;
  background: #f5f5f5; border-radius:2px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.cat-selected .cat-icon-wrap { background: rgba(2,136,209,0.12); }
.cat-icon { font-size:20px; color: rgba(0,0,0,0.38); }
.cat-selected .cat-icon { color: #0288d1; }
.cat-name { font-size:12px; font-weight:500; color: rgba(0,0,0,0.54); line-height:1; }
.cat-selected .cat-name { color: #0288d1; }

.urgency-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.urgency-card {
  border:1px solid rgba(0,0,0,0.23); border-radius:2px; padding:14px 12px;
  cursor:pointer; transition:all 0.15s; background: #fff;
}
.urgency-card:hover { border-color: rgba(0,0,0,0.54); }
.urgency-label { font-size:13px; font-weight:500; margin-bottom:4px; color: rgba(0,0,0,0.54); }
.urgency-desc { font-size:11px; color: rgba(0,0,0,0.38); line-height:1.3; }

.urgency-selected.urgency-low      { border-color: #2e7d32; border-width:2px; background: #f1f8e9; }
.urgency-selected.urgency-medium   { border-color: #0288d1; border-width:2px; background: #e3f2fd; }
.urgency-selected.urgency-high     { border-color: #f57f17; border-width:2px; background: #fff8e1; }
.urgency-selected.urgency-critical { border-color: #c62828; border-width:2px; background: #ffebee; }

.urgency-selected.urgency-low .urgency-label      { color: #2e7d32; }
.urgency-selected.urgency-medium .urgency-label   { color: #0288d1; }
.urgency-selected.urgency-high .urgency-label     { color: #f57f17; }
.urgency-selected.urgency-critical .urgency-label { color: #c62828; }

.sla-bar {
  background: #e3f2fd; border: 1px solid rgba(2,136,209,0.25); border-radius:2px;
  padding:10px 14px; font-size:13px; color: #1565c0; margin-bottom:20px;
  display:flex; align-items:center; gap:8px;
}

.form-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:8px; }
</style>
