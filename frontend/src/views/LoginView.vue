<template>
  <div class="login-page">
    <!-- Left: brand panel -->
    <div class="brand-panel">
      <div class="brand-inner">
        <img :src="helpitLogo" class="brand-logo" />
        <p class="brand-tagline">Service desk. Simplified.</p>
      </div>
      <p class="brand-copyright">© 2026 helpIT. All rights reserved.</p>
    </div>

    <!-- Right: form panel -->
    <div class="form-panel">
      <div class="form-card">
        <h1 class="form-heading">Sign in</h1>
        <p class="form-sub">Use your helpIT account</p>

        <el-form
          @submit.prevent="handleLogin"
          :model="form"
          label-position="top"
          class="form"
        >
          <el-form-item label="Email or Username">
            <el-input
              v-model="form.email"
              type="text"
              placeholder=" "
              size="large"
              autocomplete="username"
              class="md-input"
            />
          </el-form-item>

          <el-form-item label="Password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder=" "
              size="large"
              show-password
              autocomplete="current-password"
              class="md-input"
            />
          </el-form-item>

          <div class="remember-row">
            <el-checkbox v-model="form.rememberMe">Remember me</el-checkbox>
          </div>

          <el-alert
            v-if="error"
            :title="error"
            type="error"
            show-icon
            :closable="false"
            style="margin-bottom: 24px; border-radius: 2px"
          />

          <el-button
            native-type="submit"
            type="primary"
            size="large"
            :loading="loading"
            class="signin-btn"
          >
            Sign In
          </el-button>
        </el-form>

        <p class="privacy-notice">
          By signing in, you agree to our
          <router-link to="/privacy" class="privacy-link" target="_blank">Privacy Notice</router-link>.
          This system is for authorized use only and all access is monitored.
        </p>

        <p class="footer-note">
          For access issues, contact your IT Department.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import helpitLogo from "@/assets/helpit_logo.png";

const auth = useAuthStore();
const form = ref({ email: "", password: "", rememberMe: false });
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(
      form.value.email,
      form.value.password,
      form.value.rememberMe,
    );
  } catch (e) {
    error.value =
      e.response?.data?.error || "Invalid credentials. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap");

/* ── Page ── */
.login-page {
  min-height: 100vh;
  display: flex;
  font-family: "Roboto", sans-serif;
  background: #fff;
  overflow: hidden;
}

/* ── Left brand panel ── */
.brand-panel {
  flex: 0 0 44%;
  background: #2196F3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.18);
  position: relative;
  z-index: 1;
}

.brand-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.brand-logo {
  max-width: 260px;
  max-height: 100px;
  width: auto;
  object-fit: contain;
  display: block;
  filter: brightness(0) invert(1);
}

.brand-tagline {
  font-size: 15px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.03em;
  margin: 0;
}

/* ── Right form panel ── */
.form-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: #f0f4f8;
  position: relative;
}

/* ── Floating card ── */
.form-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 2px;
  padding: 40px 40px 32px;
  box-shadow:
    0 8px 10px 1px rgba(0, 0, 0, 0.14),
    0 3px 14px 2px rgba(0, 0, 0, 0.12),
    0 5px 5px -3px rgba(0, 0, 0, 0.20);
}

.brand-copyright {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* MD1 typography */
.form-heading {
  font-family: "Roboto", sans-serif;
  font-size: 34px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 8px;
  letter-spacing: 0;
}

.form-sub {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 40px;
}

/* ── Form label ── */
.form :deep(.el-form-item__label) {
  font-family: "Roboto", sans-serif !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  color: #2196F3 !important;
  line-height: 1 !important;
  padding-bottom: 0 !important;
  margin-bottom: 2px !important;
}

/* ── MD1 underline inputs ── */
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
  font-family: "Roboto", sans-serif !important;
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

/* ── Sign-in button — full-width primary, inherits MD1 from theme.css ── */
.signin-btn {
  width: 100%;
  margin-top: 8px;
}

/* ── Remember me ── */
.remember-row {
  margin-bottom: 20px;
}
.remember-row :deep(.el-checkbox__label) {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.54);
}
.remember-row :deep(.el-checkbox__inner) {
  border-color: rgba(0, 0, 0, 0.42);
}
.remember-row :deep(.el-checkbox.is-checked .el-checkbox__inner) {
  background-color: #2196F3;
  border-color: #2196F3;
}

/* ── Footer ── */
.footer-note {
  margin-top: 32px;
  font-family: "Roboto", sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
}

/* ── In-card privacy notice ── */
.privacy-notice {
  margin-top: 20px;
  margin-bottom: 0;
  font-size: 11px;
  line-height: 1.65;
  color: rgba(0, 0, 0, 0.42);
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.privacy-link {
  color: rgba(0, 45, 114, 0.7);
  text-decoration: underline;
  font-weight: 500;
}
.privacy-link:hover { color: #2196F3; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .login-page { flex-direction: column; }
  .brand-panel {
    flex: none;
    width: 100%;
    padding: 40px 32px;
  }
  .form-panel { padding: 32px 20px; }
  .form-card {
    max-width: 100%;
    padding: 32px 24px 24px;
    box-shadow:
      0 2px 2px rgba(0, 0, 0, 0.14),
      0 3px 1px -2px rgba(0, 0, 0, 0.12),
      0 1px 5px rgba(0, 0, 0, 0.20);
  }
}
</style>
