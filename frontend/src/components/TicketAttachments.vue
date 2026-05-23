<template>
  <div class="attachments">
    <div class="att-header">
      <span class="att-title">Attachments</span>
      <span class="att-count" v-if="attachments.length">{{ attachments.length }}</span>
    </div>

    <div v-if="attachments.length" class="att-list">
      <div v-for="a in attachments" :key="a.id" class="att-item">
        <el-icon class="att-file-icon"><component :is="fileIcon(a.mimetype)" /></el-icon>
        <div class="att-info">
          <div class="att-name">{{ a.original_name }}</div>
          <div class="att-meta">{{ fmtSize(a.size) }} · {{ a.uploader_name }}</div>
        </div>
        <div class="att-actions">
          <el-button size="small" plain circle title="Download" @click="download(a)">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-popconfirm
            v-if="canDelete(a)"
            title="Delete this attachment?"
            confirm-button-type="danger"
            @confirm="deleteAtt(a)"
          >
            <template #reference>
              <el-button size="small" plain circle type="danger" title="Delete">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
    <div v-else class="att-empty">No attachments</div>

    <!-- Upload area -->
    <div
      v-if="!readonly"
      class="drop-zone"
      :class="{ 'drop-over': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <el-icon class="drop-icon"><Upload /></el-icon>
      <span>Click or drop files here <span class="size-hint">(max 10 MB)</span></span>
      <input ref="fileInput" type="file" multiple style="display:none" @change="onFileSelect" />
    </div>

    <div v-if="uploading" class="upload-progress">
      <el-icon class="spin"><Loading /></el-icon> Uploading…
    </div>
    <el-alert v-if="uploadError" :title="uploadError" type="error" show-icon :closable="true" @close="uploadError=''" style="margin-top:8px" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const props = defineProps({ ticketId: { type: Number, required: true }, readonly: { type: Boolean, default: false } });
const emit  = defineEmits(['updated']);

const auth = useAuthStore();
const attachments = ref([]);
const uploading   = ref(false);
const dragging    = ref(false);
const uploadError = ref('');
const fileInput   = ref(null);

function canDelete(a) {
  return auth.user?.role === 'admin' || auth.user?.id === a.uploaded_by;
}

function fileIcon(mime) {
  if (!mime) return 'Document';
  if (mime.startsWith('image/'))       return 'Picture';
  if (mime.includes('pdf'))            return 'Document';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Grid';
  if (mime.includes('zip'))            return 'FolderOpened';
  return 'Document';
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

async function load() {
  try {
    const res = await api.get(`/tickets/${props.ticketId}/attachments`);
    attachments.value = res.data;
  } catch {}
}

async function upload(file) {
  uploadError.value = '';
  if (file.size > 10 * 1024 * 1024) { uploadError.value = `${file.name} exceeds 10 MB limit`; return; }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/tickets/${props.ticketId}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await load();
    emit('updated');
  } catch (e) {
    uploadError.value = e.response?.data?.error || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onFileSelect(e) {
  Array.from(e.target.files).forEach(upload);
  e.target.value = '';
}

function onDrop(e) {
  dragging.value = false;
  Array.from(e.dataTransfer.files).forEach(upload);
}

function download(a) {
  const url = `/api/attachments/${a.id}/download`;
  const link = document.createElement('a');
  link.href = url;
  link.download = a.original_name;
  link.click();
}

async function deleteAtt(a) {
  try {
    await api.delete(`/attachments/${a.id}`);
    await load();
    emit('updated');
  } catch {}
}

onMounted(load);
defineExpose({ load });
</script>

<style scoped>
.attachments { display:flex; flex-direction:column; gap:10px; }

.att-header { display:flex; align-items:center; gap:8px; }
.att-title { font-size:13px; font-weight:500; color: rgba(0,0,0,0.87); }
.att-count {
  font-size:11px; font-weight:500; background: #e3f2fd; color: #1565c0;
  padding:1px 7px; border-radius:2px;
}

.att-list { display:flex; flex-direction:column; gap:6px; }
.att-item {
  background: #f5f5f5; border: 1px solid rgba(0,0,0,0.12);
  border-radius:2px; padding:8px 10px; display:flex; align-items:center; gap:10px;
}
.att-file-icon { font-size:18px; color: rgba(0,0,0,0.38); flex-shrink:0; }
.att-info { flex:1; min-width:0; }
.att-name { font-size:12.5px; font-weight:500; color: rgba(0,0,0,0.87); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.att-meta { font-size:11px; color: rgba(0,0,0,0.54); }
.att-actions { display:flex; gap:4px; }
.att-empty { font-size:12.5px; color: rgba(0,0,0,0.38); }

.drop-zone {
  border:2px dashed rgba(0,0,0,0.23); border-radius:2px; padding:14px 16px;
  text-align:center; cursor:pointer; font-size:12.5px; color: rgba(0,0,0,0.54);
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition:border-color 0.15s, background 0.15s;
}
.drop-zone:hover, .drop-over { border-color: #0288d1; color: #0288d1; background: rgba(2,136,209,0.04); }
.drop-icon { font-size:16px; }
.size-hint { color: rgba(0,0,0,0.38); font-size:11px; }

.upload-progress { display:flex; align-items:center; gap:8px; font-size:12.5px; color: rgba(0,0,0,0.54); }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { animation:spin 1s linear infinite; }
</style>
