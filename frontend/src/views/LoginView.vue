<template>
  <div class="login-page">

    <!-- Left: brand panel -->
    <div class="brand-panel">
      <div class="brand-inner">
        <img src="@/assets/helpit_logo.png" alt="helpIT" class="brand-logo" />
        <h2 class="brand-tagline">Your IT Service Desk,<br>simplified.</h2>
        <p class="brand-sub">Resolve faster. Collaborate smarter.<br>Built for modern enterprise teams.</p>
        <div class="brand-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- Right: form panel -->
    <div class="form-panel">
      <div class="form-inner">
        <h1 class="form-heading">Welcome back</h1>
        <p class="form-sub">Sign in to continue to helpIT</p>

        <el-form @submit.prevent="handleLogin" :model="form" label-position="top" class="form">
          <el-form-item label="Email address">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="you@company.com"
              size="large"
              autocomplete="email"
              class="md-input"
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
              class="md-input"
            />
          </el-form-item>

          <el-alert
            v-if="error"
            :title="error"
            type="error"
            show-icon
            :closable="false"
            style="margin-bottom: 20px; border-radius: 8px;"
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
/* ── Page layout ── */
.login-page {
  min-height: 100vh;
  display: flex;
  background: #fff;
}

/* ── Left brand panel ── */
.brand-panel {
  width: 45%;
  background: linear-gradient(145deg, #0097b8 0%, #005f9e 55%, #003d7a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 48px;
  position: relative;
  overflow: hidden;
}

/* Subtle geometric decoration */
.brand-panel::before {
  content: '';
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  top: -120px; right: -120px;
}
.brand-panel::after {
  content: '';
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  bottom: -80px; left: -80px;
}

.brand-inner {
  position: relative;
  z-index: 1;
  text-align: center;
}

.brand-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
  margin-bottom: 40px;
  filter: brightness(0) invert(1);
}

.brand-tagline {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.35;
  margin-bottom: 16px;
  letter-spacing: -0.3px;
}

.brand-sub {
  font-size: 15px;
  color: rgba(255,255,255,0.7);
  line-height: 1.6;
  margin-bottom: 48px;
}

.brand-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.brand-dots span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
}
.brand-dots span:first-child {
  background: rgba(255,255,255,0.9);
  width: 24px;
  border-radius: 4px;
}

/* ── Right form panel ── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 48px;
  background: #fafafa;
}

.form-inner {
  width: 100%;
  max-width: 380px;
}

.form-heading {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.form-sub {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 36px;
}

/* ── Form labels ── */
.form :deep(.el-form-item__label) {
  color: #374151 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  margin-bottom: 4px;
}

/* ── Material-style inputs ── */
.md-input :deep(.el-input__wrapper) {
  background: #fff !important;
  border: 1.5px solid #d1d5db !important;
  box-shadow: none !important;
  border-radius: 8px !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.md-input :deep(.el-input__wrapper:hover) {
  border-color: #0097b8 !important;
}
.md-input :deep(.el-input__wrapper.is-focus) {
  border-color: #0097b8 !important;
  box-shadow: 0 0 0 3px rgba(0, 151, 184, 0.12) !important;
}
.md-input :deep(.el-input__inner) {
  color: #111827 !important;
  font-size: 14px !important;
}
.md-input :deep(.el-input__inner::placeholder) {
  color: #9ca3af !important;
}
.md-input :deep(.el-input__suffix-inner .el-icon) {
  color: #6b7280 !important;
}

/* ── Sign in button ── */
.signin-btn {
  width: 100%;
  height: 48px !important;
  background: linear-gradient(90deg, #0097b8 0%, #005f9e 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  color: #fff !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(0, 100, 160, 0.3) !important;
  transition: box-shadow 0.2s, transform 0.1s !important;
}
.signin-btn:hover {
  box-shadow: 0 4px 16px rgba(0, 100, 160, 0.45) !important;
  transform: translateY(-1px);
}
.signin-btn:active {
  transform: translateY(0);
}

/* ── Footer ── */
.footer-note {
  margin-top: 28px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

/* ── Responsive: stack on small screens ── */
@media (max-width: 768px) {
  .login-page { flex-direction: column; }
  .brand-panel { width: 100%; padding: 40px 32px; }
  .brand-tagline { font-size: 22px; }
  .brand-sub { display: none; }
  .form-panel { padding: 40px 24px; }
}
</style>
