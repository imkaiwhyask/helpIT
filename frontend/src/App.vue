<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();

// Re-validate session against the server on every page load.
// This keeps the localStorage profile fresh and detects revoked sessions.
onMounted(() => {
  if (auth.isAuthenticated) auth.fetchMe();
});
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Roboto', sans-serif; background: #fafafa; margin: 0; color: rgba(0,0,0,0.87); }
</style>
