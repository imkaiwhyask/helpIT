<template>
  <div class="create-page">
    <div class="card">
      <h2 class="form-title">Submit New Ticket</h2>

      <el-form :model="form" label-position="top" @submit.prevent="submit">

        <el-form-item label="Subject *">
          <el-input v-model="form.title" placeholder="Brief description of the issue" size="large" />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="Provide as much detail as possible: steps to reproduce, error messages, affected users…"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="Category *">
            <el-select v-model="form.category" placeholder="Select category" @change="form.subcategory = ''" style="width:100%">
              <el-option v-for="c in categories" :key="c.name" :value="c.name" :label="c.name" />
            </el-select>
          </el-form-item>

          <el-form-item label="Subcategory">
            <el-select v-model="form.subcategory" placeholder="Select subcategory" style="width:100%" :disabled="!form.category">
              <el-option v-for="s in subcategories" :key="s" :value="s" :label="s" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="Priority *">
            <el-select v-model="form.priority" style="width:100%">
              <el-option value="low"      label="Low – general request, no urgency" />
              <el-option value="medium"   label="Medium – affects productivity" />
              <el-option value="high"     label="High – significant impact" />
              <el-option value="critical" label="Critical – system outage / all users" />
            </el-select>
          </el-form-item>

          <el-form-item label="Assign To">
            <el-select v-model="form.assigned_to" placeholder="Unassigned" clearable style="width:100%">
              <el-option v-for="u in technicians" :key="u.id" :value="u.id" :label="u.name" />
            </el-select>
          </el-form-item>
        </div>

        <!-- SLA hint -->
        <div class="sla-hint">
          <el-icon><Clock /></el-icon>
          <span><strong>SLA:</strong> {{ slaHint }}</span>
        </div>

        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-bottom:16px" />

        <div class="form-actions">
          <RouterLink to="/tickets"><el-button>Cancel</el-button></RouterLink>
          <el-button type="primary" native-type="submit" :loading="loading">Submit Ticket</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';

const router = useRouter();
const form = ref({
  title: '',
  description: '',
  category: 'Hardware',
  subcategory: '',
  priority: 'medium',
  assigned_to: null,
});
const loading = ref(false);
const error = ref('');
const technicians = ref([]);

const categories = [
  { name: 'Hardware',  subs: ['Laptop/PC','Printer','Monitor','Keyboard/Mouse','Server','Mobile Device','Other'] },
  { name: 'Software',  subs: ['Windows/macOS','Microsoft Office','Email/Calendar','ERP/CRM','Antivirus','Other'] },
  { name: 'Network',   subs: ['WiFi','VPN','LAN','Internet','DNS','Other'] },
  { name: 'Access',    subs: ['User Account','Password Reset','Permissions','Badge/Physical','Other'] },
  { name: 'Other',     subs: ['General Request','Information','Other'] },
];

const subcategories = computed(() => {
  return categories.find(c => c.name === form.value.category)?.subs || [];
});

const SLA_INFO = {
  critical: { response: '1 hour',  resolution: '4 hours' },
  high:     { response: '4 hours', resolution: '8 hours' },
  medium:   { response: '8 hours', resolution: '24 hours' },
  low:      { response: '24 hours',resolution: '72 hours' },
};

const slaHint = computed(() => {
  const s = SLA_INFO[form.value.priority];
  return `Response within ${s.response}, resolution within ${s.resolution}`;
});

async function submit() {
  if (!form.value.title.trim()) {
    error.value = 'Subject is required';
    return;
  }
  error.value = '';
  loading.value = true;
  try {
    const res = await api.post('/tickets', {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      subcategory: form.value.subcategory,
      priority: form.value.priority,
      assigned_to: form.value.assigned_to,
    });
    ElMessage.success('Ticket submitted');
    router.push(`/tickets/${res.data.id}`);
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to create ticket';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const res = await api.get('/users');
  technicians.value = res.data;
});
</script>

<style scoped>
.create-page { max-width: 760px; margin: 0 auto; }
.card { background: #fff; border-radius: 10px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.form-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sla-hint {
  display: flex; align-items: center; gap: 8px;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
  padding: 10px 14px; font-size: 13px; color: #1d4ed8; margin-bottom: 20px;
}
.form-actions { display: flex; gap: 10px; justify-content: flex-end; }
</style>
