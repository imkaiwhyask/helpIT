<template>
  <div class="cp-page">
    <div class="cp-card">
      <img src="@/assets/helpit_logo.png" alt="helpIT" class="cp-logo" />
      <h1 class="cp-heading">Set a new password</h1>
      <p class="cp-sub">Your account requires a password change before continuing.</p>

      <el-form
        @submit.prevent="handleSubmit"
        :model="form"
        label-position="top"
        class="form"
      >
        <el-form-item label="New password">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder=" "
            size="large"
            show-password
            autocomplete="new-password"
            class="md-input"
          />
          <span class="hint">Minimum 12 characters</span>
        </el-form-item>

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
          size="large"
          :loading="loading"
          class="submit-btn"
        >
          Set Password
        </el-button>
      </el-form>
    </div>

    <p class="copyright">© 2026 helpIT. All rights reserved.</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const form = ref({ newPassword: "" });
const loading = ref(false);
const error = ref("");

async function handleSubmit() {
  error.value = "";
  if (form.value.newPassword.length < 12) {
    error.value = "Password must be at least 12 characters.";
    return;
  }
  loading.value = true;
  try {
    await auth.changePassword(form.value.newPassword);
  } catch (e) {
    error.value = e.response?.data?.error || "Failed to update password. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap");

.cp-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  font-family: "Roboto", sans-serif;
  padding: 24px;
  position: relative;
}

.cp-card {
  background: #fff;
  border-radius: 2px;
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2);
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.cp-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
  margin-bottom: 32px;
}

.cp-heading {
  font-size: 24px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 8px;
}

.cp-sub {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 32px;
  line-height: 1.5;
}

/* Form label */
.form :deep(.el-form-item__label) {
  font-family: "Roboto", sans-serif !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  color: #0288d1 !important;
  line-height: 1 !important;
  padding-bottom: 0 !important;
  margin-bottom: 2px !important;
  text-align: left;
  display: block;
}

/* MD1 underline input */
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
  border-bottom: 2px solid #0288d1 !important;
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

.hint {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.38);
  display: block;
  margin-top: 4px;
  text-align: left;
}

/* MD1 Raised button */
.submit-btn {
  width: 100%;
  height: 36px !important;
  margin-top: 8px;
  background: #0288d1 !important;
  border: none !important;
  border-radius: 2px !important;
  color: #fff !important;
  font-family: "Roboto", sans-serif !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2) !important;
  transition:
    box-shadow 0.2s,
    background 0.15s !important;
}
.submit-btn:hover {
  background: #0277bd !important;
  box-shadow:
    0 8px 10px rgba(0, 0, 0, 0.14),
    0 3px 14px rgba(0, 0, 0, 0.12),
    0 5px 5px rgba(0, 0, 0, 0.2) !important;
}
.submit-btn:active {
  background: #01579b !important;
}

.copyright {
  position: absolute;
  bottom: 24px;
  font-size: 11px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.38);
}
</style>
