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
      <div class="spacer" />
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> New Article
      </el-button>
    </div>

    <!-- Article list -->
    <div v-loading="loading" class="articles-grid">
      <div v-if="articles.length === 0 && !loading" class="empty-state">
        <el-empty description="No articles yet. Create the first one." :image-size="80" />
      </div>
      <div v-for="a in articles" :key="a.id" class="article-card" @click="openView(a)">
        <div class="article-header">
          <span class="article-cat">{{ a.category }}</span>
          <el-tag v-if="!a.is_published" type="warning" size="small">Draft</el-tag>
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
          <el-button size="small" plain :type="a.is_published ? 'warning' : 'success'" @click="togglePublish(a)">
            {{ a.is_published ? 'Unpublish' : 'Publish' }}
          </el-button>
          <el-popconfirm v-if="auth.user?.role === 'admin'" title="Delete this article?" confirm-button-type="danger" @confirm="deleteArticle(a)">
            <template #reference>
              <el-button size="small" plain type="danger"><el-icon><Delete /></el-icon></el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- View / Edit dialog -->
    <el-dialog
      v-model="dialogOpen"
      :title="viewMode ? currentArticle?.title : (editingId ? 'Edit Article' : 'New Article')"
      width="720px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <!-- View mode -->
      <div v-if="viewMode && currentArticle" class="article-view">
        <div class="av-meta">
          <span class="av-cat">{{ currentArticle.category }}</span>
          <span>{{ currentArticle.author_name }}</span>
          <span class="dot">·</span>
          <span>{{ fmtDate(currentArticle.updated_at) }}</span>
          <span v-if="currentArticle.tags" class="dot">·</span>
          <span v-if="currentArticle.tags" class="av-tags">{{ currentArticle.tags }}</span>
        </div>
        <div class="av-content">{{ currentArticle.content }}</div>
        <template v-if="auth.user?.role !== 'user'">
          <el-divider />
          <el-button @click="openEdit(currentArticle)"><el-icon><Edit /></el-icon> Edit Article</el-button>
        </template>
      </div>

      <!-- Edit / Create mode -->
      <el-form v-else :model="form" label-position="top">
        <el-form-item label="Title *">
          <el-input v-model="form.title" placeholder="Article title" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="Category *" style="flex:1">
            <el-select v-model="form.category" style="width:100%">
              <el-option v-for="c in categories" :key="c" :value="c" :label="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="Tags (comma-separated)" style="flex:2">
            <el-input v-model="form.tags" placeholder="vpn, remote work, password" />
          </el-form-item>
          <el-form-item label="Status" style="flex:1">
            <el-select v-model="form.is_published" style="width:100%">
              <el-option :value="1" label="Published" />
              <el-option :value="0" label="Draft" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Content *">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="14"
            placeholder="Write the article content here…"
          />
        </el-form-item>
        <el-alert v-if="formError" :title="formError" type="error" show-icon :closable="false" />
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">{{ viewMode ? 'Close' : 'Cancel' }}</el-button>
        <el-button v-if="!viewMode" type="primary" :loading="saving" @click="saveArticle">
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

const auth = useAuthStore();

const articles       = ref([]);
const loading        = ref(false);
const search         = ref('');
const filterCategory = ref('');

const dialogOpen     = ref(false);
const viewMode       = ref(false);
const editingId      = ref(null);
const saving         = ref(false);
const formError      = ref('');
const currentArticle = ref(null);

const categories = ['General', 'Hardware', 'Software', 'Network', 'Access', 'Security', 'Policies'];

const emptyForm = () => ({ title:'', content:'', category:'General', tags:'', is_published: 1 });
const form = ref(emptyForm());

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (search.value)         params.search = search.value;
    if (filterCategory.value) params.category = filterCategory.value;
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
    viewMode.value = true;
    dialogOpen.value = true;
  } catch {}
}

function openCreate() {
  editingId.value = null;
  viewMode.value = false;
  form.value = emptyForm();
  formError.value = '';
  dialogOpen.value = true;
}

function openEdit(a) {
  editingId.value = a.id;
  viewMode.value = false;
  form.value = { title: a.title, content: a.content, category: a.category, tags: a.tags || '', is_published: a.is_published };
  formError.value = '';
  dialogOpen.value = true;
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
    dialogOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to save article';
  } finally {
    saving.value = false;
  }
}

async function togglePublish(a) {
  try {
    await api.put(`/kb/${a.id}`, { is_published: a.is_published ? 0 : 1 });
    ElMessage.success(a.is_published ? 'Article unpublished' : 'Article published');
    await load();
  } catch { ElMessage.error('Failed to update'); }
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
}

.article-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  padding: 18px 20px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(12px);
}
.article-card:hover { border-color: #00c7d4; background: rgba(255,255,255,0.08); }

.article-header { display:flex; align-items:center; justify-content:space-between; }
.article-cat {
  font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;
  color: #00c7d4; background: rgba(0,199,212,0.12); padding:2px 8px; border-radius:4px;
}
.article-title { font-size:14px; font-weight:700; color: #f1f5f9; line-height:1.4; }
.article-excerpt { font-size:12.5px; color: rgba(255,255,255,0.5); line-height:1.5; flex:1;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.article-meta { display:flex; align-items:center; gap:5px; font-size:11.5px; color: rgba(255,255,255,0.38); }
.article-meta .el-icon { font-size:12px; }
.dot { color: rgba(255,255,255,0.2); }

.article-actions {
  display:flex; gap:6px; margin-top:4px;
  padding-top:10px; border-top: 1px solid rgba(255,255,255,0.08);
}

.empty-state { grid-column: 1/-1; text-align:center; padding:60px 0; }

/* View mode */
.article-view { padding:4px 0; }
.av-meta { display:flex; align-items:center; gap:8px; font-size:12.5px; color: rgba(255,255,255,0.5); margin-bottom:20px; flex-wrap:wrap; }
.av-cat { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color: #00c7d4; background: rgba(0,199,212,0.12); padding:2px 8px; border-radius:4px; }
.av-tags { font-size:12px; color: rgba(255,255,255,0.4); }
.av-content { color: rgba(255,255,255,0.85); line-height:1.8; white-space:pre-wrap; font-size:14px; }

/* Edit form */
.form-row { display:flex; gap:14px; }
</style>
