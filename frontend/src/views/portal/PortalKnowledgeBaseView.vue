<template>
  <div class="kb-portal">

    <!-- Hero -->
    <div class="kb-hero">
      <h2 class="kb-hero-title">Help Center</h2>
      <p class="kb-hero-sub">Find answers, guides, and policies to solve issues on your own.</p>
      <el-input
        v-model="search"
        placeholder="Search help articles…"
        clearable
        size="large"
        class="kb-search"
        @input="load"
      >
        <template #prefix><el-icon style="color:#6b7280"><Search /></el-icon></template>
      </el-input>
    </div>

    <div class="kb-body">
      <!-- Category filter chips -->
      <div class="cat-chips">
        <span
          v-for="c in ['All', ...categories]"
          :key="c"
          :class="['chip', filterCategory === (c === 'All' ? '' : c) && 'chip-active']"
          @click="filterCategory = c === 'All' ? '' : c; load()"
        >{{ c }}</span>
      </div>

      <!-- Articles -->
      <div v-loading="loading" class="articles-list">
        <div v-if="articles.length === 0 && !loading" class="empty-state">
          <el-empty description="No articles found." :image-size="70" />
        </div>

        <div
          v-for="a in articles"
          :key="a.id"
          class="article-row"
          @click="openArticle(a)"
        >
          <div class="article-icon-wrap">
            <el-icon class="article-icon"><Document /></el-icon>
          </div>
          <div class="article-info">
            <div class="article-title">{{ a.title }}</div>
            <div class="article-excerpt">{{ a.excerpt }}</div>
            <div class="article-meta">
              <span class="article-cat-badge">{{ a.category }}</span>
              <span class="dot">·</span>
              <span>{{ fmtDate(a.updated_at) }}</span>
              <span class="dot">·</span>
              <el-icon style="font-size:12px"><View /></el-icon>
              <span>{{ a.view_count }}</span>
            </div>
          </div>
          <el-icon class="row-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- Article detail dialog -->
    <el-dialog
      v-model="articleOpen"
      :title="activeArticle?.title"
      width="660px"
      top="5vh"
    >
      <div v-if="activeArticle" class="article-detail">
        <div class="ad-meta">
          <span class="article-cat-badge">{{ activeArticle.category }}</span>
          <span class="dot">·</span>
          <span>{{ activeArticle.author_name }}</span>
          <span class="dot">·</span>
          <span>{{ fmtDate(activeArticle.updated_at) }}</span>
        </div>
        <div class="ad-content">{{ activeArticle.content }}</div>
        <div v-if="activeArticle.tags" class="ad-tags">
          <span v-for="tag in activeArticle.tags.split(',')" :key="tag" class="tag-chip">{{ tag.trim() }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="articleOpen = false">Close</el-button>
        <el-button type="primary" @click="$router.push('/portal/tickets/new')">Still need help? Submit a Request</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../api';

const articles       = ref([]);
const loading        = ref(false);
const search         = ref('');
const filterCategory = ref('');
const articleOpen    = ref(false);
const activeArticle  = ref(null);

const categories = ['General', 'Hardware', 'Software', 'Network', 'Access', 'Security', 'Policies'];

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

async function openArticle(a) {
  try {
    const res = await api.get(`/kb/${a.id}`);
    activeArticle.value = res.data;
    articleOpen.value = true;
  } catch {}
}

onMounted(load);
</script>

<style scoped>
.kb-portal { min-height: 100vh; display:flex; flex-direction:column; background: #070d1a; }

.kb-hero {
  background: linear-gradient(150deg, #0d1e30 0%, #0a2840 55%, #063040 100%);
  padding: 48px 24px 56px;
  text-align:center;
}
.kb-hero-title { font-size:26px; font-weight:700; color:#fff; margin-bottom:8px; }
.kb-hero-sub   { font-size:14px; color:rgba(255,255,255,0.6); margin-bottom:24px; }
.kb-search { max-width:520px; margin:0 auto; display:block; }
:deep(.kb-search .el-input__wrapper) {
  padding:8px 16px; border-radius:8px;
  box-shadow:0 4px 24px rgba(0,0,0,0.25) !important; border:none !important;
}

.kb-body { flex:1; max-width:760px; margin:0 auto; width:100%; padding:32px 24px; }

.cat-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; }
.chip {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.6); cursor:pointer; padding:5px 14px;
  border-radius:20px; font-size:12.5px; font-weight:500; transition:all 0.15s;
}
.chip:hover { border-color: #00c7d4; color: #00c7d4; }
.chip-active { background: rgba(0,199,212,0.15); color: #00c7d4; border-color: #00c7d4; }

.articles-list { display:flex; flex-direction:column; gap:8px; }
.empty-state { text-align:center; padding:40px 0; }

.article-row {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10);
  border-radius:10px; padding:16px 18px; display:flex; align-items:center; gap:14px;
  cursor:pointer; backdrop-filter: blur(12px); transition:border-color 0.15s, background 0.15s;
}
.article-row:hover { border-color: #00c7d4; background: rgba(255,255,255,0.08); }

.article-icon-wrap {
  background: rgba(0,199,212,0.12); border-radius:10px;
  width:40px; height:40px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.article-icon { font-size:20px; color: #00c7d4; }

.article-info { flex:1; min-width:0; }
.article-title { font-size:14px; font-weight:600; color: #f1f5f9; margin-bottom:3px; }
.article-excerpt {
  font-size:12.5px; color: rgba(255,255,255,0.5); margin-bottom:6px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.article-meta { display:flex; align-items:center; gap:5px; font-size:11.5px; color: rgba(255,255,255,0.38); }
.article-cat-badge {
  font-size:10.5px; font-weight:700; text-transform:uppercase;
  background: rgba(0,199,212,0.12); color: #00c7d4; padding:1px 7px; border-radius:3px;
}
.dot { color: rgba(255,255,255,0.2); }
.row-arrow { font-size:14px; color: rgba(255,255,255,0.25); flex-shrink:0; }
.article-row:hover .row-arrow { color: #00c7d4; }

/* Detail dialog */
.article-detail { padding:4px 0; }
.ad-meta { display:flex; align-items:center; gap:8px; margin-bottom:20px; font-size:12.5px; color: rgba(255,255,255,0.5); flex-wrap:wrap; }
.ad-content { color: rgba(255,255,255,0.85); line-height:1.8; white-space:pre-wrap; font-size:14px; }
.ad-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:20px; }
.tag-chip { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); font-size:12px; padding:3px 10px; border-radius:4px; }
</style>
