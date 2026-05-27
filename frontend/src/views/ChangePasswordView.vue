<template>
  <div class="login-page">
    <div class="brand-panel">
      <div class="brand-inner">
        <img src="@/assets/helpit_logo.png" alt="helpIT" class="brand-logo" />
        <div class="brand-message">
          <h2 class="brand-title">Secure your account</h2>
          <p class="brand-body">Choose a strong password to protect your helpIT account. You'll use it every time you sign in.</p>
        </div>
      </div>
    </div>

    <div class="form-panel">
      <div class="form-inner">
        <h1 class="form-heading">Set your password</h1>
        <p class="form-sub">Your account requires a new password before you can continue.</p>

        <el-form @submit.prevent="handleSubmit" :model="form" label-position="top" class="form">
          <el-form-item label="New Password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder=" "
              size="large"
              show-password
              autocomplete="new-password"
              class="md-input"
            />
          </el-form-item>

          <el-form-item label="Confirm Password">
            <el-input
              v-model="form.confirm"
              type="password"
              placeholder=" "
              size="large"
              show-password
              autocomplete="new-password"
              class="md-input"
            />
          </el-form-item>

          <el-alert
            v-if="error"
            :title="error"
            type="error"
            show-icon
            :closable="false"
            style="margin-bottom: 24px; border-radius: 2px"
          />

          <el-button native-type="submit" size="large" :loading="loading" class="signin-btn">
            Set Password
          </el-button>
        </el-form>

        <p class="footer-note">Minimum 8 characters.</p>
      </div>

      <p class="copyright">© 2026 helpIT. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const form = ref({ password: '', confirm: '' });
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  error.value = '';
  if (form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters.';
    return;
  }
  if (form.value.password !== form.value.confirm) {
    error.value = 'Passwords do not match.';
    return;
  }
  loading.value = true;
  try {
    await auth.changePassword(form.value.password);
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to update password. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  font-family: 'Roboto', sans-serif;
  background: #fff;
}

.brand-panel {
  width: 45%;
  background: #2196F3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 48px;
}

.brand-inner {
  text-align: center;
  width: 100%;
  max-width: 340px;
}

.brand-logo {
  height: 100px;
  width: auto;
  object-fit: contain;
  margin-bottom: 48px;
  filter: brightness(0) invert(1);
}

.brand-message {
  text-align: center;
}

.brand-title {
  font-family: 'Roboto', sans-serif;
  font-size: 24px;
  font-weight: 400;
  color: #fff;
  line-height: 1.4;
  margin-bottom: 12px;
}

.brand-body {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 48px;
  background: #fff;
  position: relative;
}

.form-inner {
  width: 100%;
  max-width: 360px;
}

.copyright {
  position: absolute;
  bottom: 24px;
  font-family: 'Roboto', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
}

.form-heading {
  font-family: 'Roboto', sans-serif;
  font-size: 34px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 8px;
  letter-spacing: 0;
}

.form-sub {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 40px;
}

.form :deep(.el-form-item__label) {
  font-family: 'Roboto', sans-serif !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  color: #2196F3 !important;
  line-height: 1 !important;
  padding-bottom: 0 !important;
  margin-bottom: 2px !important;
}

.md-input :deep(.el-input__wrapper) {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.42) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 4px 0 8px !important;
  transition: border-color 0.2s !important;
}
.md-input :deep(.el-input__wrapper:hover) {
  border-bottom-color: rgba(0, 0, 0, 0.87) !important;
}
.md-input :deep(.el-input__wrapper.is-focus) {
  border-bottom: 2px solid #2196F3 !important;
  box-shadow: none !important;
}
.md-input :deep(.el-input__inner) {
  font-family: 'Roboto', sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  color: rgba(0, 0, 0, 0.87) !important;
  padding: 0 !important;
}
.md-input :deep(.el-input__inner::placeholder) {
  color: transparent !important;
}
.md-input :deep(.el-input__suffix-inner .el-icon) {
  color: rgba(0, 0, 0, 0.54) !important;
}

.signin-btn {
  width: 100%;
  height: 36px !important;
  margin-top: 8px;
  background: #2196F3 !important;
  border: none !important;
  border-radius: 2px !important;
  color: #fff !important;
  font-family: 'Roboto', sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2) !important;
  transition: box-shadow 0.2s, background 0.15s !important;
}
.signin-btn:hover {
  background: #e55a00 !important;
  box-shadow:
    0 8px 10px rgba(0, 0, 0, 0.14),
    0 3px 14px rgba(0, 0, 0, 0.12),
    0 5px 5px rgba(0, 0, 0, 0.2) !important;
}
.signin-btn:active {
  background: #cc5000 !important;
  box-shadow:
    0 4px 5px rgba(0, 0, 0, 0.14),
    0 1px 10px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

.footer-note {
  margin-top: 32px;
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
}

@media (max-width: 768px) {
  .login-page { flex-direction: column; }
  .brand-panel { width: 100%; padding: 48px 32px; }
  .brand-inner { max-width: 100%; }
  .form-panel { padding: 48px 24px; }
}
</style>
