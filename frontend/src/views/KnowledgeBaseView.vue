<template>
  <div class="kb-page">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-input v-model="search" placeholder="Search articles…" clearable style="width:260px" @input="load">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filterCategory" placeholder="All Categories" clearable style="width:180px" @change="load">
        <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
      </el-select>
      <el-select v-model="filterVisibility" placeholder="All Visibility" clearable style="width:160px" @change="load">
        <el-option value="public"   label="Public" />
        <el-option value="internal" label="Internal" />
        <el-option value="draft"    label="Draft" />
      </el-select>
      <div class="spacer" />
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> New Article
      </el-button>
    </div>

    <!-- Article grid -->
    <transition-group name="card-list" tag="div" class="articles-grid" v-loading="loading">
      <div v-if="articles.length === 0 && !loading" key="empty" class="empty-state">
        <el-empty description="No articles yet. Create the first one." :image-size="80" />
      </div>
      <div v-for="a in articles" :key="a.id" class="article-card" @click="openView(a)">
        <div class="article-header">
          <span class="article-cat">{{ a.category }}</span>
          <span :class="['vis-badge', 'vis-' + a.visibility]">{{ visLabel(a.visibility) }}</span>
        </div>
        <div class="article-title">{{ a.title }}</div>
        <div class="article-excerpt">{{ a.excerpt }}</div>
        <div class="article-meta">
          <span>{{ a.author_name }}</span>
          <span class="dot">·</span>
          <span>{{ fmtDate(a.updated_at) }}</span>
          <span class="dot">·</span>
          <el-icon><View /></el-icon>
          <span>{{ a.view_count }}</span>
        </div>
        <div class="article-actions" @click.stop>
          <el-button size="small" plain @click="openEdit(a)"><el-icon><Edit /></el-icon> Edit</el-button>
          <el-popconfirm v-if="auth.user?.role === 'admin'" title="Delete this article?" confirm-button-type="danger" @confirm="deleteArticle(a)">
            <template #reference>
              <el-button size="small" plain type="danger"><el-icon><Delete /></el-icon></el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </transition-group>

    <!-- View dialog (read-only) -->
    <el-dialog
      v-model="viewDialogOpen"
      :title="currentArticle?.title"
      width="760px"
      :close-on-click-modal="true"
      top="4vh"
    >
      <div v-if="currentArticle" class="article-view">
        <div class="av-meta">
          <span class="article-cat">{{ currentArticle.category }}</span>
          <span :class="['vis-badge', 'vis-' + currentArticle.visibility]">{{ visLabel(currentArticle.visibility) }}</span>
          <span class="dot">·</span>
          <span>{{ currentArticle.author_name }}</span>
          <span class="dot">·</span>
          <span>{{ fmtDate(currentArticle.updated_at) }}</span>
          <span v-if="currentArticle.tags" class="av-tags">· {{ currentArticle.tags }}</span>
        </div>
        <div class="av-content" v-html="currentArticle.content" />
        <div v-if="currentArticle.tags" class="av-tag-chips">
          <span v-for="tag in currentArticle.tags.split(',')" :key="tag" class="tag-chip">{{ tag.trim() }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogOpen = false">Close</el-button>
        <el-button type="primary" @click="openEdit(currentArticle); viewDialogOpen = false"><el-icon><Edit /></el-icon> Edit</el-button>
      </template>
    </el-dialog>

    <!-- Edit / Create dialog — full screen -->
    <el-dialog
      v-model="editDialogOpen"
      :title="editingId ? 'Edit Article' : 'New Article'"
      width="96vw"
      :close-on-click-modal="false"
      class="kb-fullscreen-dialog"
      top="2vh"
      @opened="editorReady = true"
      @closed="editorReady = false"
    >
      <el-form :model="form" label-position="top" class="edit-form">
        <el-form-item label="Title *">
          <el-input v-model="form.title" placeholder="Article title" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="Category *" style="flex:1">
            <el-select v-model="form.category" style="width:100%">
              <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="Visibility" style="flex:1">
            <el-select v-model="form.visibility" style="width:100%">
              <el-option value="public"   label="Public — visible to all users" />
              <el-option value="internal" label="Internal — IT staff only" />
              <el-option value="draft"    label="Draft — not published" />
            </el-select>
          </el-form-item>
          <el-form-item label="Tags (comma-separated)" style="flex:2">
            <el-input v-model="form.tags" placeholder="vpn, remote work, password" />
          </el-form-item>
        </div>
        <el-form-item label="Content *">
          <KbEditor v-if="editorReady" v-model="form.content" />
        </el-form-item>
        <el-alert v-if="formError" :title="formError" type="error" show-icon :closable="false" style="margin-top:8px" />
      </el-form>
      <template #footer>
        <el-button @click="editDialogOpen = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="saveArticle">
          {{ editingId ? 'Save Changes' : 'Create Article' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import KbEditor from '../components/KbEditor.vue';

const auth = useAuthStore();

const articles        = ref([]);
const loading         = ref(false);
const search          = ref('');
const filterCategory  = ref('');
const filterVisibility = ref('');

const viewDialogOpen  = ref(false);
const editDialogOpen  = ref(false);
const editorReady     = ref(false);
const editingId       = ref(null);
const saving          = ref(false);
const formError       = ref('');
const currentArticle  = ref(null);

const categories = ['General', 'Hardware', 'Software', 'Network', 'Access', 'Security', 'Policies'];

const emptyForm = () => ({ title: '', content: '', category: 'General', tags: '', visibility: 'public' });
const form = ref(emptyForm());

function visLabel(v) {
  return { public: 'Public', internal: 'Internal', draft: 'Draft' }[v] ?? v;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (search.value)          params.search = search.value;
    if (filterCategory.value)  params.category = filterCategory.value;
    if (filterVisibility.value) params.visibility = filterVisibility.value;
    const res = await api.get('/kb', { params });
    articles.value = res.data.articles;
  } finally {
    loading.value = false;
  }
}

async function openView(a) {
  try {
    const res = await api.get(`/kb/${a.id}`);
    currentArticle.value = res.data;
    viewDialogOpen.value = true;
  } catch {}
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = '';
  editDialogOpen.value = true;
}

async function openEdit(a) {
  editingId.value = a.id;
  formError.value = '';
  // List responses don't include full content — fetch the full article first.
  let full = a;
  if (!a.content) {
    try { full = (await api.get(`/kb/${a.id}`)).data; } catch {}
  }
  form.value = {
    title:      full.title,
    content:    full.content || '',
    category:   full.category,
    tags:       full.tags || '',
    visibility: full.visibility || 'public',
  };
  editDialogOpen.value = true;
}

async function saveArticle() {
  formError.value = '';
  if (!form.value.title.trim())   { formError.value = 'Title is required'; return; }
  if (!form.value.content.trim()) { formError.value = 'Content is required'; return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/kb/${editingId.value}`, form.value);
      ElMessage.success('Article updated');
    } else {
      await api.post('/kb', form.value);
      ElMessage.success('Article created');
    }
    editDialogOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to save article';
  } finally {
    saving.value = false;
  }
}

async function deleteArticle(a) {
  try {
    await api.delete(`/kb/${a.id}`);
    ElMessage.success('Article deleted');
    await load();
  } catch (e) { ElMessage.error(e.response?.data?.error || 'Failed to delete'); }
}

onMounted(load);
</script>

<style scoped>
.kb-page { padding: 0; }

.toolbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.spacer { flex:1; }

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  position: relative;
}

/* Card list transition */
.card-list-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.card-list-leave-active { transition: opacity 0.2s ease; }
.card-list-enter-from   { opacity: 0; transform: translateY(8px); }
.card-list-leave-to     { opacity: 0; }

.article-card {
  background: #fff;
  border-radius: 2px;
  padding: 18px 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20);
  transition: box-shadow 0.2s;
}
.article-card:hover {
  box-shadow: 0 8px 10px rgba(0,0,0,0.14), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px rgba(0,0,0,0.20);
}

.article-header { display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap; }
.article-cat {
  font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em;
  color: #2196F3; background: #E3F2FD; padding:2px 8px; border-radius:2px;
}

.vis-badge {
  font-size:10.5px; font-weight:500; text-transform:uppercase; letter-spacing:0.04em;
  padding:2px 7px; border-radius:2px;
}
.vis-public   { background: #e8f5e9; color: #2e7d32; }
.vis-internal { background: #e3f0ff; color: #2196F3; }
.vis-draft    { background: #fff8e1; color: #f57f17; }

.article-title   { font-size:14px; font-weight:500; color: rgba(0,0,0,0.87); line-height:1.4; }
.article-excerpt {
  font-size:12.5px; color: rgba(0,0,0,0.54); line-height:1.5; flex:1;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.article-meta { display:flex; align-items:center; gap:5px; font-size:11.5px; color: rgba(0,0,0,0.38); }
.article-meta .el-icon { font-size:12px; }
.dot { color: rgba(0,0,0,0.2); }

.article-actions {
  display:flex; gap:6px; margin-top:4px;
  padding-top:10px; border-top: 1px solid rgba(0,0,0,0.08);
}

.empty-state { grid-column: 1/-1; text-align:center; padding:60px 0; }

/* View mode */
.article-view { padding: 4px 0; }
.av-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: rgba(0,0,0,0.54);
  margin-bottom: 20px; flex-wrap: wrap;
}
.av-tags { font-size:12px; color: rgba(0,0,0,0.38); }

.av-content {
  color: rgba(0,0,0,0.87);
  line-height: 1.8;
  font-size: 14px;
  word-break: break-word;
}
/* Rich text styles for view mode */
.av-content :deep(h1) { font-size:22px; font-weight:500; margin:16px 0 10px; }
.av-content :deep(h2) { font-size:18px; font-weight:500; margin:14px 0 8px; }
.av-content :deep(h3) { font-size:15px; font-weight:500; margin:12px 0 6px; }
.av-content :deep(ul),
.av-content :deep(ol) { padding-left:22px; margin:0 0 10px; }
.av-content :deep(blockquote) { border-left:3px solid #2196F3; margin:12px 0; padding:8px 16px; background:#f5f7fa; color:rgba(0,0,0,0.54); }
.av-content :deep(code)       { background:#f0f0f0; padding:1px 5px; border-radius:2px; font-size:12.5px; font-family:monospace; }
.av-content :deep(pre)        { background:#1e1e1e; color:#d4d4d4; padding:14px 16px; border-radius:2px; overflow-x:auto; margin:12px 0; }
.av-content :deep(pre code)   { background:none; padding:0; }
.av-content :deep(img)        { max-width:100%; border-radius:2px; margin:8px 0; }
.av-content :deep(hr)         { border:none; border-top:1px solid rgba(0,0,0,0.15); margin:16px 0; }
.av-content :deep(p)          { margin:0 0 8px; }

.av-tag-chips { display:flex; gap:6px; flex-wrap:wrap; margin-top:20px; border-top:1px solid rgba(0,0,0,0.08); padding-top:16px; }
.tag-chip { background: #f5f5f5; color: rgba(0,0,0,0.54); font-size:12px; padding:3px 10px; border-radius:2px; }

/* Edit form */
.form-row { display:flex; gap:14px; }

/* Full-screen dialog */
:deep(.kb-fullscreen-dialog) {
  height: 94vh;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}
:deep(.kb-fullscreen-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
:deep(.kb-fullscreen-dialog .kb-doc-area) {
  min-height: calc(94vh - 280px);
}
</style>
