<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="content-wrapper">
      <AppHeader />
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f1f5f9;
}
</style>
