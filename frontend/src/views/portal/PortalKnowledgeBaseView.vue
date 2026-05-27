<template>
  <div class="kb-portal">
    <!-- Hero -->
    <div class="kb-hero">
      <h2 class="kb-hero-title">Help Center</h2>
      <p class="kb-hero-sub">
        Find answers, guides, and policies to solve issues on your own.
      </p>
      <el-input
        v-model="search"
        placeholder="Search help articles…"
        clearable
        size="large"
        class="kb-search"
        @input="load"
      >
        <template #prefix
          ><el-icon style="color: #6b7280"><Search /></el-icon
        ></template>
      </el-input>
    </div>

    <div class="kb-body">
      <!-- Category filter chips -->
      <div class="cat-chips">
        <span
          v-for="c in ['All', ...categories]"
          :key="c"
          v-md1-ripple.dark
          :class="[
            'chip',
            filterCategory === (c === 'All' ? '' : c) && 'chip-active',
          ]"
          @click="
            filterCategory = c === 'All' ? '' : c;
            load();
          "
          >{{ c }}</span
        >
      </div>

      <!-- Articles -->
      <div v-loading="loading">
        <div v-if="articles.length === 0 && !loading" class="empty-state">
          <el-empty description="No articles found." :image-size="70" />
        </div>

        <TransitionGroup name="list" tag="div" class="articles-list">
          <div
            v-for="(a, i) in articles"
            :key="a.id"
            class="article-row"
            v-md1-ripple.dark
            :style="{ '--i': i }"
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
                <el-icon style="font-size: 12px"><View /></el-icon>
                <span>{{ a.view_count }}</span>
              </div>
            </div>
            <el-icon class="row-arrow"><ArrowRight /></el-icon>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Article detail dialog — full-screen A4 viewer -->
    <el-dialog
      v-model="articleOpen"
      :title="activeArticle?.title"
      width="96vw"
      top="2vh"
      class="kb-view-dialog"
    >
      <div v-if="activeArticle" class="article-detail">
        <div class="ad-meta">
          <span class="article-cat-badge">{{ activeArticle.category }}</span>
          <span class="dot">·</span>
          <span>{{ activeArticle.author_name }}</span>
          <span class="dot">·</span>
          <span>{{ fmtDate(activeArticle.updated_at) }}</span>
          <template v-if="activeArticle.tags">
            <span class="dot">·</span>
            <span
              v-for="tag in activeArticle.tags.split(',')"
              :key="tag"
              class="tag-chip"
              >{{ tag.trim() }}</span
            >
          </template>
        </div>
        <!-- A4 document viewer -->
        <div class="ad-doc-area">
          <div class="ad-paper">
            <div class="ad-content" v-html="activeArticle.content" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="articleOpen = false">Close</el-button>
        <el-button type="primary" @click="$router.push('/portal/tickets/new')"
          >Still need help? Submit a Request</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../../api";

const articles = ref([]);
const loading = ref(false);
const search = ref("");
const filterCategory = ref("");
const articleOpen = ref(false);
const activeArticle = ref(null);

const categories = [
  "General",
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Security",
  "Policies",
];

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (search.value) params.search = search.value;
    if (filterCategory.value) params.category = filterCategory.value;
    const res = await api.get("/kb", { params });
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
.kb-portal {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.kb-hero {
  background: #2c3e50;
  padding: 48px 24px 56px;
  text-align: center;
}
.kb-hero-title {
  font-size: 26px;
  font-weight: 400;
  color: #fff;
  margin-bottom: 8px;
  animation: hero-in 0.45s cubic-bezier(0, 0, 0.2, 1) both;
}
.kb-hero-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 24px;
  animation: hero-in 0.45s cubic-bezier(0, 0, 0.2, 1) 0.06s both;
}
.kb-search {
  max-width: 520px;
  margin: 0 auto;
  display: block;
  animation: hero-in 0.45s cubic-bezier(0, 0, 0.2, 1) 0.12s both;
}
:deep(.kb-search .el-input__wrapper) {
  padding: 8px 16px;
  border-radius: 2px;
  background: #fff !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2) !important;
  border: none !important;
}

.kb-body {
  flex: 1;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px;
}

.cat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.chip {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.23);
  color: rgba(0, 0, 0, 0.54);
  cursor: pointer;
  padding: 5px 14px;
  border-radius: 2px;
  font-size: 12.5px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.chip:hover {
  border-color: #2196F3;
  color: #2196F3;
}
.chip-active {
  background: #E3F2FD;
  color: #2196F3;
  border-color: #2196F3;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
}

.article-row {
  background: #fff;
  border-radius: 2px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px -2px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2);
}
.article-row:hover {
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.14),
    0 1px 18px rgba(0, 0, 0, 0.12),
    0 3px 5px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.article-icon-wrap {
  background: #E3F2FD;
  border-radius: 2px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.article-icon {
  font-size: 20px;
  color: #2196F3;
}

.article-info {
  flex: 1;
  min-width: 0;
}
.article-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 3px;
}
.article-excerpt {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.article-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.38);
}
.article-cat-badge {
  font-size: 10.5px;
  font-weight: 500;
  text-transform: uppercase;
  background: #E3F2FD;
  color: #2196F3;
  padding: 1px 7px;
  border-radius: 2px;
}
.dot {
  color: rgba(0, 0, 0, 0.2);
}
.row-arrow {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.38);
  flex-shrink: 0;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.article-row:hover .row-arrow {
  color: #2196F3;
  transform: translateX(5px);
}

/* Detail dialog */
:deep(.kb-view-dialog) {
  height: 96vh;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}
:deep(.kb-view-dialog .el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: #fafafa;
}
:deep(.kb-view-dialog .el-dialog__footer) {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.article-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.ad-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
  flex-wrap: wrap;
  background: #fafafa;
}

/* A4 document area */
.ad-doc-area {
  background: #fafafa;
  padding: 24px 0 32px;
  flex: 1;
}
.ad-paper {
  width: 794px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent calc(1123px - 2px),
    #c8c8c8 calc(1123px - 2px),
    #c8c8c8 1123px
  );
}

.ad-content {
  padding: 96px 90px;
  min-height: 1123px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 13px;
  line-height: 1.8;
  word-break: break-word;
}
.ad-content :deep(h1) { font-size: 22px; font-weight: 600; margin: 20px 0 10px; }
.ad-content :deep(h2) { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
.ad-content :deep(h3) { font-size: 15px; font-weight: 600; margin: 12px 0 6px; }
.ad-content :deep(p)  { margin: 0 0 10px; }
.ad-content :deep(ul),
.ad-content :deep(ol) { padding-left: 28px; margin: 4px 0 10px; }
.ad-content :deep(blockquote) {
  border-left: 3px solid #2196F3;
  margin: 12px 0;
  padding: 8px 16px;
  background: #f5f7fa;
  color: rgba(0, 0, 0, 0.54);
}
.ad-content :deep(code) {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 12px;
  font-family: monospace;
}
.ad-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 14px 16px;
  border-radius: 2px;
  overflow-x: auto;
  margin: 12px 0;
}
.ad-content :deep(pre code) { background: none; padding: 0; }
.ad-content :deep(img) {
  max-width: 100%;
  border-radius: 2px;
  margin: 8px 0;
  display: block;
}
.ad-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
  margin: 16px 0;
}

.tag-chip {
  background: #f5f5f5;
  color: rgba(0, 0, 0, 0.54);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 2px;
}

/* TransitionGroup stagger */
.list-enter-active {
  transition:
    opacity 0.32s cubic-bezier(0, 0, 0.2, 1),
    transform 0.32s cubic-bezier(0, 0, 0.2, 1);
  transition-delay: calc(var(--i) * 40ms);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.list-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.4, 0, 1, 1),
    transform 0.2s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Hero entrance */
@keyframes hero-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
