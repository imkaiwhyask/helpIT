<template>
  <div class="login-bg">
    <!-- Ambient blobs -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <div class="glass-card">
      <!-- Logo -->
      <div class="logo">
        <img src="@/assets/helpit_logo.png" alt="helpIT" class="logo-img" />
      </div>

      <h1 class="heading">Welcome back</h1>
      <p class="subheading">Sign in to your IT Service Desk</p>

      <el-form @submit.prevent="handleLogin" :model="form" label-position="top" class="form">
        <el-form-item label="Email address">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="you@company.com"
            size="large"
            autocomplete="email"
            class="glass-input"
          />
        </el-form-item>
        <el-form-item label="Password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Enter your password"
            size="large"
            show-password
            autocomplete="current-password"
            class="glass-input"
          />
        </el-form-item>

        <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 16px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;"
        />

        <el-button
          native-type="submit"
          size="large"
          :loading="loading"
          class="signin-btn"
        >
          Sign In
        </el-button>
      </el-form>

      <p class="footer-note">For access issues, contact your IT Department.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(form.value.email, form.value.password);
  } catch (e) {
    error.value = e.response?.data?.error || 'Invalid credentials. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ── Background ── */
.login-bg {
  min-height: 100vh;
  background: #070d1a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Ambient glow blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.55;
}
.blob-1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, #0057a8 0%, transparent 70%);
  top: -160px; left: -160px;
}
.blob-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #007a8c 0%, transparent 70%);
  bottom: -120px; right: -120px;
}
.blob-3 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, #003566 0%, transparent 70%);
  top: 50%; left: 60%;
  transform: translate(-50%, -50%);
}

/* ── Glass card ── */
.glass-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  margin: 24px;
  padding: 44px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 0 0 1px rgba(0, 180, 220, 0.08),
    0 32px 64px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* ── Logo ── */
.logo {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}
.logo-img {
  height: 64px;
  width: auto;
  object-fit: contain;
}

/* ── Headings ── */
.heading {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.subheading {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 30px;
}

/* ── Form labels ── */
.form :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 13px !important;
  font-weight: 500;
}

/* ── Inputs ── */
.glass-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.07) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  transition: border-color 0.2s, background 0.2s;
}
.glass-input :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.10) !important;
  border-color: rgba(0, 199, 212, 0.4) !important;
}
.glass-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.10) !important;
  border-color: #00c7d4 !important;
  box-shadow: 0 0 0 3px rgba(0, 199, 212, 0.15) !important;
}
.glass-input :deep(.el-input__inner) {
  color: #fff !important;
  font-size: 14px !important;
}
.glass-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.3) !important;
}
.glass-input :deep(.el-input__suffix-inner .el-icon) {
  color: rgba(255, 255, 255, 0.4) !important;
}

/* ── Button ── */
.signin-btn {
  width: 100%;
  height: 46px !important;
  background: linear-gradient(90deg, #0097b8 0%, #0060a8 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  color: #fff !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 20px rgba(0, 150, 200, 0.35) !important;
  transition: opacity 0.2s, box-shadow 0.2s !important;
}
.signin-btn:hover {
  opacity: 0.9 !important;
  box-shadow: 0 6px 24px rgba(0, 150, 200, 0.5) !important;
}

/* ── Footer ── */
.footer-note {
  margin-top: 24px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
}
</style>
