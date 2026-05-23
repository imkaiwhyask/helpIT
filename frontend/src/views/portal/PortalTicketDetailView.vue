<template>
  <div class="ticket-page" v-if="ticket">
    <RouterLink to="/portal/tickets" class="breadcrumb">
      <el-icon><ArrowLeft /></el-icon> My Requests
    </RouterLink>

    <div class="ticket-hero">
      <div class="hero-left">
        <div class="ticket-num">#{{ String(ticket.id).padStart(4,'0') }}</div>
        <h2 class="ticket-title">{{ ticket.title }}</h2>
        <div class="ticket-meta">
          {{ ticket.category }}<span v-if="ticket.subcategory"> · {{ ticket.subcategory }}</span>
          · Submitted {{ fmtDatetime(ticket.created_at) }}
        </div>
      </div>
      <span :class="['sta','sta-'+ticket.status]">{{ fmtStatus(ticket.status) }}</span>
    </div>

    <div class="layout">
      <!-- Left: description + comments -->
      <div class="main-col">

        <div class="card" v-if="ticket.description">
          <div class="section-label">Description</div>
          <p class="desc-text">{{ ticket.description }}</p>
        </div>

        <!-- Comments thread -->
        <div class="card">
          <div class="section-label">Updates &amp; Comments</div>

          <div class="comments">
            <div v-for="c in ticket.comments" :key="c.id" class="comment">
              <div :class="['avatar', c.author_role === 'user' ? 'av-user' : 'av-it']">
                {{ (c.author_name||'?')[0].toUpperCase() }}
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <strong>{{ c.author_role === 'user' ? 'You' : c.author_name }}</strong>
                  <span class="c-role-tag" v-if="c.author_role !== 'user'">IT Support</span>
                  <span class="c-time">{{ fmtDatetime(c.created_at) }}</span>
                </div>
                <p class="c-text">{{ c.content }}</p>
              </div>
            </div>
            <div v-if="!ticket.comments?.length" class="no-comments">
              No updates yet. Our team is reviewing your request.
            </div>
          </div>

          <!-- Reply form (only if ticket is not closed) -->
          <div class="reply-form" v-if="!['resolved','closed'].includes(ticket.status)">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="Add additional information or reply to IT support…"
            />
            <el-button
              type="primary"
              size="small"
              :loading="submitting"
              :disabled="!newComment.trim()"
              style="background:#4f46e5;border-color:#4f46e5;margin-top:8px"
              @click="addComment"
            >
              Send Reply
            </el-button>
          </div>
          <div v-else class="resolved-notice">
            <el-icon><CircleCheck /></el-icon>
            This request has been {{ ticket.status }}. If you need further help, submit a new request.
          </div>
        </div>
      </div>

      <!-- Right: details panel -->
      <div class="sidebar">
        <div class="card">
          <div class="section-label">Request Details</div>
          <table class="info-table">
            <tr><td>Status</td><td><span :class="['sta','sta-'+ticket.status]">{{ fmtStatus(ticket.status) }}</span></td></tr>
            <tr><td>Category</td><td>{{ ticket.category }}</td></tr>
            <tr v-if="ticket.subcategory"><td>Subcategory</td><td>{{ ticket.subcategory }}</td></tr>
            <tr><td>Priority</td><td><span :class="['pri','pri-'+ticket.priority]">{{ ticket.priority }}</span></td></tr>
            <tr><td>Assigned To</td><td>{{ ticket.assigned_name || 'Pending assignment' }}</td></tr>
            <tr><td>Submitted</td><td>{{ fmtDatetime(ticket.created_at) }}</td></tr>
            <tr><td>Last Updated</td><td>{{ fmtDatetime(ticket.updated_at) }}</td></tr>
            <tr v-if="ticket.resolved_at"><td>Resolved</td><td>{{ fmtDatetime(ticket.resolved_at) }}</td></tr>
          </table>

          <div class="resolution-estimate">
            <el-icon><Clock /></el-icon>
            <span>Expected resolution: <strong>{{ fmtDatetime(ticket.resolution_due) }}</strong></span>
          </div>
        </div>

        <div class="card status-timeline">
          <div class="section-label">Timeline</div>
          <div class="steps">
            <div
              v-for="step in statusSteps"
              :key="step.status"
              :class="['step', isStepActive(step.status) && 'step-active', isStepDone(step.status) && 'step-done']"
            >
              <div class="step-dot"></div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <TicketAttachments
            v-if="ticket"
            :ticket-id="ticket.id"
            :readonly="['resolved','closed'].includes(ticket.status)"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="notFound" style="padding:60px;text-align:center">
    <el-result icon="warning" title="Request not found">
      <template #extra>
        <RouterLink to="/portal/tickets"><el-button>Back to My Requests</el-button></RouterLink>
      </template>
    </el-result>
  </div>

  <div v-else style="padding:60px"><el-skeleton :rows="6" animated /></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../../api';
import TicketAttachments from '../../components/TicketAttachments.vue';

const route = useRoute();
const ticket = ref(null);
const notFound = ref(false);
const newComment = ref('');
const submitting = ref(false);

const statusSteps = [
  { status: 'open',        label: 'Submitted' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'on_hold',     label: 'On Hold' },
  { status: 'resolved',    label: 'Resolved' },
];

const statusOrder = ['open','in_progress','on_hold','resolved','closed'];

function isStepDone(status) {
  if (!ticket.value) return false;
  const cur = statusOrder.indexOf(ticket.value.status);
  const step = statusOrder.indexOf(status);
  return step < cur;
}
function isStepActive(status) {
  return ticket.value?.status === status || (status === 'resolved' && ticket.value?.status === 'closed');
}

function fmtStatus(s) {
  return { open:'Open', in_progress:'In Progress', on_hold:'On Hold', resolved:'Resolved', closed:'Closed' }[s] || s;
}
function fmtDatetime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function load() {
  try {
    const res = await api.get(`/tickets/${route.params.id}`);
    ticket.value = res.data;
  } catch (e) {
    if (e.response?.status === 404 || e.response?.status === 403) notFound.value = true;
  }
}

async function addComment() {
  if (!newComment.value.trim()) return;
  submitting.value = true;
  try {
    await api.post(`/tickets/${ticket.value.id}/comments`, { content: newComment.value.trim(), is_internal: false });
    newComment.value = '';
    await load();
  } catch {
    ElMessage.error('Failed to send reply');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.ticket-page { max-width: 1000px; margin: 0 auto; padding: 36px 24px; }

.breadcrumb {
  display:inline-flex; align-items:center; gap:6px;
  color: #00c7d4; font-size:13px; font-weight:500;
  text-decoration:none; margin-bottom:20px;
}
.breadcrumb:hover { text-decoration:underline; }

.ticket-hero {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
  border-radius:14px; padding:24px 28px; margin-bottom:20px;
  display:flex; justify-content:space-between; align-items:flex-start; gap:16px;
  backdrop-filter: blur(12px);
}
.ticket-num { font-family:monospace; font-size:12px; color: rgba(255,255,255,0.4); margin-bottom:6px; }
.ticket-title { font-size:20px; font-weight:700; color: #f1f5f9; margin-bottom:6px; line-height:1.3; }
.ticket-meta { font-size:13px; color: rgba(255,255,255,0.4); }

.layout { display:flex; gap:18px; align-items:flex-start; }
.main-col { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
.sidebar { width:268px; flex-shrink:0; display:flex; flex-direction:column; gap:14px; }

.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius:12px; padding:22px; backdrop-filter: blur(12px); }
.section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color: rgba(255,255,255,0.4); margin-bottom:14px; }

.desc-text { font-size:14px; color: rgba(255,255,255,0.8); line-height:1.7; white-space:pre-wrap; }

.comments { display:flex; flex-direction:column; gap:14px; margin-bottom:20px; }
.comment { display:flex; gap:10px; }

.avatar {
  width:32px; height:32px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:#fff; flex-shrink:0;
}
.av-user { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
.av-it   { background: linear-gradient(135deg, #0080c6, #00c7d4); }

.comment-body {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius:10px; padding:10px 14px; flex:1;
}
.comment-meta { display:flex; align-items:baseline; gap:8px; margin-bottom:5px; font-size:12px; }
.comment-meta strong { color: #f1f5f9; }
.c-role-tag { background: rgba(0,128,198,0.2); color: #60a5fa; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:600; }
.c-time { color: rgba(255,255,255,0.38); margin-left:auto; }
.c-text { font-size:13px; color: rgba(255,255,255,0.8); line-height:1.5; }

.no-comments { text-align:center; color: rgba(255,255,255,0.4); font-size:13px; padding:24px 0; }

.reply-form { border-top: 1px solid rgba(255,255,255,0.08); padding-top:16px; }
.resolved-notice {
  display:flex; align-items:center; gap:8px;
  color: #4ade80; font-size:13px; font-weight:500;
  border-top: 1px solid rgba(255,255,255,0.08); padding-top:14px;
}

.info-table { width:100%; border-collapse:collapse; font-size:13px; }
.info-table td { padding:6px 0; vertical-align:top; }
.info-table td:first-child { color: rgba(255,255,255,0.45); width:45%; }
.info-table td:last-child { color: #f1f5f9; font-weight:500; }

.resolution-estimate {
  display:flex; align-items:center; gap:6px;
  font-size:12px; color: #60a5fa;
  background: rgba(0,128,198,0.10); border-radius:6px;
  padding:8px 12px; margin-top:14px;
}

/* Status timeline */
.steps { display:flex; flex-direction:column; gap:0; }
.step { display:flex; align-items:center; gap:12px; position:relative; padding:8px 0; }
.step:not(:last-child)::after {
  content:'';
  position:absolute;
  left:9px; top:28px;
  width:2px; height:24px;
  background: rgba(255,255,255,0.1);
}
.step-done::after { background: #00c7d4 !important; }

.step-dot {
  width:18px; height:18px;
  border-radius:50%;
  border:2px solid rgba(255,255,255,0.2);
  background: transparent;
  flex-shrink:0;
  transition:all 0.2s;
}
.step-done .step-dot  { background: #00c7d4; border-color: #00c7d4; }
.step-active .step-dot { background: transparent; border-color: #00c7d4; box-shadow:0 0 0 3px rgba(0,199,212,0.2); }

.step-label { font-size:13px; color: rgba(255,255,255,0.45); }
.step-done .step-label, .step-active .step-label { color: #f1f5f9; font-weight:600; }

/* Badges */
.sta { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
.sta-open        { background: rgba(37,99,235,0.15); color: #60a5fa; }
.sta-in_progress { background: rgba(124,58,237,0.15); color: #a78bfa; }
.sta-on_hold     { background: rgba(234,88,12,0.15); color: #fb923c; }
.sta-resolved    { background: rgba(22,163,74,0.15); color: #4ade80; }
.sta-closed      { background: rgba(100,116,139,0.15); color: #94a3b8; }

.pri { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; text-transform:capitalize; }
.pri-critical { background: rgba(220,38,38,0.15); color: #f87171; }
.pri-high     { background: rgba(234,88,12,0.15); color: #fb923c; }
.pri-medium   { background: rgba(234,179,8,0.15); color: #fbbf24; }
.pri-low      { background: rgba(22,163,74,0.15); color: #4ade80; }
</style>
