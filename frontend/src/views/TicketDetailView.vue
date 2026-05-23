<template>
  <div v-if="ticket" class="detail-layout">

    <!-- Left: main content -->
    <div class="main-col">
      <div class="card">
        <div class="ticket-header">
          <div>
            <div class="ticket-num">#{{ String(ticket.id).padStart(4,'0') }}</div>
            <h2 class="ticket-title-full">{{ ticket.title }}</h2>
          </div>
          <div class="header-badges">
            <span :class="['badge','pri-'+ticket.priority]">{{ ticket.priority }}</span>
            <span :class="['badge','sta-'+ticket.status]">{{ fmtStatus(ticket.status) }}</span>
          </div>
        </div>

        <div class="description-block">
          <div class="label">Description</div>
          <p class="description-text">{{ ticket.description || 'No description provided.' }}</p>
        </div>
      </div>

      <!-- Comments -->
      <div class="card">
        <h3 class="section-heading">Activity &amp; Comments</h3>

        <div class="comments-list">
          <div
            v-for="c in ticket.comments"
            :key="c.id"
            :class="['comment', c.is_internal ? 'comment-internal' : 'comment-public']"
          >
            <div class="comment-avatar">{{ (c.author_name||'?')[0].toUpperCase() }}</div>
            <div class="comment-body">
              <div class="comment-meta">
                <strong>{{ c.author_name }}</strong>
                <span v-if="c.is_internal" class="internal-tag">internal note</span>
                <span class="comment-time">{{ fmtDatetime(c.created_at) }}</span>
              </div>
              <div class="comment-text">{{ c.content }}</div>
            </div>
          </div>

          <div v-if="!ticket.comments?.length" class="no-comments">No comments yet.</div>
        </div>

        <div class="comment-form">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="Add a comment…"
          />
          <div class="comment-actions">
            <el-checkbox v-model="isInternal">Internal note</el-checkbox>
            <el-button type="primary" size="small" :loading="submitting" @click="addComment">
              Post Comment
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: sidebar details -->
    <div class="detail-sidebar">

      <!-- Status / Actions -->
      <div class="card">
        <div class="label">Status</div>
        <el-select v-model="editStatus" style="width:100%;margin-bottom:10px" @change="saveField('status', editStatus)">
          <el-option v-for="s in statusOpts" :key="s.value" :value="s.value" :label="s.label" />
        </el-select>

        <div class="label">Priority</div>
        <el-select v-model="editPriority" style="width:100%;margin-bottom:10px" @change="saveField('priority', editPriority)">
          <el-option v-for="p in priorityOpts" :key="p.value" :value="p.value" :label="p.label" />
        </el-select>

        <div class="label">Assigned To</div>
        <el-select v-if="isItStaff" v-model="editAssigned" style="width:100%" clearable placeholder="Unassigned" @change="saveAssigned">
          <el-option v-for="u in itStaff" :key="u.id" :value="u.id" :label="u.name" />
        </el-select>
        <div v-else class="readonly-value">{{ ticket.assigned_name || 'Unassigned' }}</div>
      </div>

      <!-- Ticket info -->
      <div class="card">
        <h4 class="section-heading">Details</h4>
        <table class="info-table">
          <tr><td>Category</td><td>{{ ticket.category }}</td></tr>
          <tr v-if="ticket.subcategory"><td>Subcategory</td><td>{{ ticket.subcategory }}</td></tr>
          <tr><td>Created by</td><td>{{ ticket.creator_name }}</td></tr>
          <tr><td>Created</td><td>{{ fmtDatetime(ticket.created_at) }}</td></tr>
          <tr><td>Updated</td><td>{{ fmtDatetime(ticket.updated_at) }}</td></tr>
          <tr v-if="ticket.resolved_at"><td>Resolved</td><td>{{ fmtDatetime(ticket.resolved_at) }}</td></tr>
        </table>

        <h4 class="section-heading" style="margin-top:16px">SLA</h4>
        <table class="info-table">
          <tr><td>Response Due</td><td>{{ fmtDatetime(ticket.response_due) }}</td></tr>
          <tr><td>Resolution Due</td><td>{{ fmtDatetime(ticket.resolution_due) }}</td></tr>
          <tr>
            <td>Status</td>
            <td><span :class="['badge','sla-'+slaStatus]">{{ fmtSla }}</span></td>
          </tr>
        </table>
      </div>

      <div class="card">
        <TicketAttachments :ticket-id="ticket.id" />
      </div>

      <div v-if="isAdmin" class="card danger-zone">
        <el-popconfirm title="Delete this ticket? This cannot be undone." @confirm="deleteTicket">
          <template #reference>
            <el-button type="danger" plain size="small" style="width:100%">Delete Ticket</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>
  </div>

  <div v-else-if="notFound" class="empty-state">
    <el-result icon="warning" title="Ticket not found">
      <template #extra>
        <RouterLink to="/tickets"><el-button>Back to Tickets</el-button></RouterLink>
      </template>
    </el-result>
  </div>

  <div v-else class="loading-state">
    <el-skeleton :rows="6" animated />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';
import TicketAttachments from '../components/TicketAttachments.vue';
import { useAuthStore } from '../stores/auth';

const route  = useRoute();
const router = useRouter();
const auth   = useAuthStore();
const isItStaff = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'technician');
const isAdmin   = computed(() => auth.user?.role === 'admin');
const ticket = ref(null);
const notFound = ref(false);
const allUsers = ref([]);

const newComment = ref('');
const isInternal = ref(false);
const submitting = ref(false);

const editStatus   = ref('');
const editPriority = ref('');
const editAssigned = ref(null);

const statusOpts = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold',     label: 'On Hold' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
];
const priorityOpts = [
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High' },
  { value: 'medium',   label: 'Medium' },
  { value: 'low',      label: 'Low' },
];

const itStaff = computed(() =>
  allUsers.value.filter(u => u.role === 'admin' || u.role === 'technician')
);

const slaStatus = computed(() => {
  if (!ticket.value) return 'ok';
  const t = ticket.value;
  if (['resolved','closed'].includes(t.status)) return t.sla_resolution_breached ? 'breached' : 'met';
  const now = Date.now(), due = new Date(t.resolution_due).getTime(), created = new Date(t.created_at).getTime();
  if (now > due) return 'breached';
  if ((now - created) / (due - created) > 0.8) return 'risk';
  return 'ok';
});

const fmtSla = computed(() => ({
  ok: 'On Track', risk: 'At Risk', breached: 'Breached', met: 'Met'
})[slaStatus.value]);

function fmtStatus(s) {
  return { open:'Open', in_progress:'In Progress', on_hold:'On Hold', resolved:'Resolved', closed:'Closed' }[s] || s;
}

function fmtDatetime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function load() {
  try {
    const [ticketRes, usersRes] = await Promise.all([
      api.get(`/tickets/${route.params.id}`),
      api.get('/users'),
    ]);
    ticket.value = ticketRes.data;
    allUsers.value = usersRes.data;
    editStatus.value   = ticket.value.status;
    editPriority.value = ticket.value.priority;
    editAssigned.value = ticket.value.assigned_to;
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true;
  }
}

async function saveField(field, value) {
  try {
    const res = await api.put(`/tickets/${ticket.value.id}`, { [field]: value });
    ticket.value = { ...ticket.value, ...res.data };
    // Re-fetch to get updated comments from status change log
    if (field === 'status') await load();
    ElMessage.success('Updated');
  } catch {
    ElMessage.error('Update failed');
  }
}

async function saveAssigned() {
  try {
    const res = await api.put(`/tickets/${ticket.value.id}`, { assigned_to: editAssigned.value });
    ticket.value = { ...ticket.value, ...res.data };
    await load();
    ElMessage.success('Assigned updated');
  } catch {
    ElMessage.error('Update failed');
  }
}

async function addComment() {
  if (!newComment.value.trim()) return;
  submitting.value = true;
  try {
    await api.post(`/tickets/${ticket.value.id}/comments`, {
      content: newComment.value.trim(),
      is_internal: isInternal.value,
    });
    newComment.value = '';
    isInternal.value = false;
    await load();
  } catch {
    ElMessage.error('Failed to post comment');
  } finally {
    submitting.value = false;
  }
}

async function deleteTicket() {
  await api.delete(`/tickets/${ticket.value.id}`);
  ElMessage.success('Ticket deleted');
  router.push('/tickets');
}

onMounted(load);
</script>

<style scoped>
.detail-layout { display: flex; gap: 20px; align-items: flex-start; }
.main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.detail-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }

.card {
  background: #fff;
  border-radius: 2px;
  padding: 20px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
}

.ticket-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; }
.ticket-num { font-size: 12px; color: rgba(0,0,0,0.38); font-family: monospace; margin-bottom: 4px; }
.ticket-title-full { font-size: 18px; font-weight: 500; color: rgba(0,0,0,0.87); line-height: 1.3; }
.header-badges { display: flex; gap: 6px; flex-shrink: 0; }

.description-block .label { font-size: 12px; font-weight: 500; color: rgba(0,0,0,0.54); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.description-text { font-size: 14px; color: rgba(0,0,0,0.87); line-height: 1.6; white-space: pre-wrap; }

.section-heading { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.87); margin-bottom: 12px; }

.comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.comment { display: flex; gap: 10px; }
.comment-internal .comment-body {
  background: #fffde7;
  border: 1px solid rgba(249,168,37,0.3);
  border-radius: 2px;
  padding: 8px 12px;
  flex: 1;
}
.comment-public .comment-body {
  background: #f5f5f5;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 2px;
  padding: 8px 12px;
  flex: 1;
}
.comment-avatar {
  width: 30px; height: 30px;
  background: #0288d1; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 500; color: #fff; flex-shrink: 0;
}
.comment-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; font-size: 12px; }
.comment-meta strong { color: rgba(0,0,0,0.87); }
.comment-time { color: rgba(0,0,0,0.38); margin-left: auto; }
.internal-tag { background: #fff8e1; color: #f57f17; border-radius: 2px; padding: 1px 5px; font-size: 10px; font-weight: 500; }
.comment-text { font-size: 13px; color: rgba(0,0,0,0.87); line-height: 1.5; }

.no-comments { text-align: center; color: rgba(0,0,0,0.38); font-size: 13px; padding: 20px 0; }

.comment-form { border-top: 1px solid rgba(0,0,0,0.12); padding-top: 16px; }
.comment-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }

.label { font-size: 12px; font-weight: 500; color: rgba(0,0,0,0.54); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }

.info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.info-table td { padding: 5px 0; vertical-align: top; }
.info-table td:first-child { color: rgba(0,0,0,0.54); width: 45%; }
.info-table td:last-child { color: rgba(0,0,0,0.87); font-weight: 500; }

.readonly-value { font-size: 13px; color: rgba(0,0,0,0.87); padding: 6px 0; }
.danger-zone { padding: 12px; }

.empty-state, .loading-state { padding: 40px; }
</style>
