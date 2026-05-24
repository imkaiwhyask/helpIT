<template>
  <div class="login-page">
    <!-- Left: brand panel -->
    <div class="brand-panel">
      <div class="brand-inner">
        <img src="@/assets/helpit_logo.png" alt="helpIT" class="brand-logo" />

        <div class="carousel">
          <Transition name="fade" mode="out-in">
            <div class="slide" :key="current">
              <el-icon class="slide-icon"
                ><component :is="slides[current].icon"
              /></el-icon>
              <h2 class="slide-title">{{ slides[current].title }}</h2>
              <p class="slide-body">{{ slides[current].body }}</p>
            </div>
          </Transition>
        </div>

        <div class="dots">
          <span
            v-for="(_, i) in slides"
            :key="i"
            :class="['dot', { active: i === current }]"
            @click="current = i"
          ></span>
        </div>
      </div>
    </div>

    <!-- Right: form panel -->
    <div class="form-panel">
      <div class="form-inner">
        <h1 class="form-heading">Sign in</h1>
        <p class="form-sub">Use your helpIT account</p>

        <el-form
          @submit.prevent="handleLogin"
          :model="form"
          label-position="top"
          class="form"
        >
          <el-form-item label="Email address">
            <el-input
              v-model="form.email"
              type="email"
              placeholder=" "
              size="large"
              autocomplete="email"
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
            <el-checkbox v-model="form.rememberMe" class="remember-cb">
              Remember me
            </el-checkbox>
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
            size="large"
            :loading="loading"
            class="signin-btn"
          >
            Sign In
          </el-button>
        </el-form>

        <p class="footer-note">
          For access issues, contact your IT Department.
        </p>
      </div>

      <p class="copyright">© 2026 helpIT. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const form = ref({ email: "", password: "", rememberMe: false });
const loading = ref(false);
const error = ref("");

const slides = [
  {
    icon: "Tickets",
    title: "Your IT Service Desk,\nsimplified.",
    body: "Resolve faster. Collaborate smarter.\nBuilt for modern enterprise teams.",
  },
  {
    icon: "Odometer",
    title: "Resolve tickets in\nrecord time.",
    body: "Auto-assign, SLA tracking, and priority queues keep your team on top of every request.",
  },
  {
    icon: "DataAnalysis",
    title: "Full visibility,\nzero guesswork.",
    body: "Real-time dashboards and SLA reports so you always know where things stand.",
  },
  {
    icon: "Document",
    title: "Knowledge at your\nfingertips.",
    body: "A built-in help center lets users find answers before they even need to submit a ticket.",
  },
];

const current = ref(0);
let timer = null;

onMounted(() => {
  timer = setInterval(() => {
    current.value = (current.value + 1) % slides.length;
  }, 4000);
});
onUnmounted(() => clearInterval(timer));

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(form.value.email, form.value.password, form.value.rememberMe);
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
}

/* ── Left brand panel — flat solid color, no gradients ── */
.brand-panel {
  width: 45%;
  background: #0288d1;
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

/* ── Carousel ── */
.carousel {
  min-height: 168px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide {
  text-align: center;
}

.slide-icon {
  font-size: 40px !important;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
}
.slide-icon :deep(svg) {
  width: 40px;
  height: 40px;
  display: block;
  margin: 0 auto;
}

.slide-title {
  font-family: "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 400;
  color: #fff;
  line-height: 1.4;
  margin-bottom: 12px;
  white-space: pre-line;
}

.slide-body {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: pre-line;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── Dots ── */
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.3s ease;
}
.dot.active {
  background: #fff;
  width: 24px;
  border-radius: 4px;
}

/* ── Right form panel ── */
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
  font-family: "Roboto", sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.38);
  text-align: center;
}

/* MD1 typography — Display / Title styles */
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

/* ── Form label (MD1: 12sp floated) ── */
.form :deep(.el-form-item__label) {
  font-family: "Roboto", sans-serif !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  color: #0288d1 !important;
  line-height: 1 !important;
  padding-bottom: 0 !important;
  margin-bottom: 2px !important;
}

/* ── MD1 underline inputs — no box, only bottom border ── */
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

/* ── Remember me row ── */
.remember-row {
  margin: 16px 0 20px;
}

.remember-cb :deep(.el-checkbox__inner) {
  border-color: rgba(0, 0, 0, 0.42);
  border-radius: 2px;
}
.remember-cb :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #0288d1;
  border-color: #0288d1;
}
.remember-cb :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #0288d1;
}
.remember-cb :deep(.el-checkbox__label) {
  font-family: "Roboto", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.54);
}

/* ── MD1 Raised button ── */
.signin-btn {
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
  /* Raised: 2dp elevation */
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 3px 1px rgba(0, 0, 0, 0.12),
    0 1px 5px rgba(0, 0, 0, 0.2) !important;
  transition:
    box-shadow 0.2s,
    background 0.15s !important;
}
.signin-btn:hover {
  background: #0277bd !important;
  /* Hover: 8dp elevation */
  box-shadow:
    0 8px 10px rgba(0, 0, 0, 0.14),
    0 3px 14px rgba(0, 0, 0, 0.12),
    0 5px 5px rgba(0, 0, 0, 0.2) !important;
}
.signin-btn:active {
  background: #01579b !important;
  box-shadow:
    0 4px 5px rgba(0, 0, 0, 0.14),
    0 1px 10px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.2) !important;
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

/* ── Responsive ── */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  .brand-panel {
    width: 100%;
    padding: 48px 32px;
  }
  .brand-inner {
    max-width: 100%;
  }
  .slide-body {
    display: none;
  }
  .form-panel {
    padding: 48px 24px;
  }
}
</style>
