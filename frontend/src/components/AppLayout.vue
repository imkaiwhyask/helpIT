<template>
  <div class="app-layout">
    <AppHeader />
    <div class="app-body">
      <AppSidebar />
      <main class="page-content">
        <RouterView v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
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
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--md1-grey-100);
}

/* MD1 page transition */
.page-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-leave-active { transition: opacity 0.14s ease; }
.page-enter-from   { opacity: 0; transform: translateY(10px); }
.page-leave-to     { opacity: 0; }
</style>
