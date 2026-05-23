<template>
  <div class="login-page">

    <!-- ── Left panel ── -->
    <div class="left-panel">
      <div class="deco deco-circle-1"></div>
      <div class="deco deco-circle-2"></div>
      <div class="deco deco-ring"></div>

      <div class="left-content">
        <!-- Logo mark -->
        <div class="brand">
          <!-- Original H-mark: two pillars + teal gradient crossbar with circuit nodes -->
          <svg width="56" height="46" viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Left pillar -->
            <rect x="0" y="0" width="11" height="46" rx="4" fill="white"/>
            <!-- Right pillar -->
            <rect x="45" y="0" width="11" height="46" rx="4" fill="white"/>
            <!-- Teal gradient crossbar -->
            <rect x="0" y="17" width="56" height="12" rx="4" fill="url(#hbar)"/>
            <!-- Circuit node dots -->
            <circle cx="14" cy="23" r="3.5" fill="white" opacity="0.85"/>
            <circle cx="28" cy="23" r="3.5" fill="white" opacity="0.85"/>
            <circle cx="42" cy="23" r="3.5" fill="white" opacity="0.85"/>
            <!-- Connector lines between nodes -->
            <line x1="17.5" y1="23" x2="24.5" y2="23" stroke="white" stroke-width="1.5" opacity="0.4"/>
            <line x1="31.5" y1="23" x2="38.5" y2="23" stroke="white" stroke-width="1.5" opacity="0.4"/>
            <defs>
              <linearGradient id="hbar" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00d4e0"/>
                <stop offset="1" stop-color="#0080c6"/>
              </linearGradient>
            </defs>
          </svg>

          <div class="brand-name">
            <span class="brand-help">help</span><span class="brand-it">IT</span>
          </div>
        </div>

        <h2 class="tagline-head">Your IT Support,<br/>simplified.</h2>
        <p class="tagline-body">
          From ticket submission to resolution tracking — one unified platform for your entire IT team and every employee.
        </p>

        <div class="features">
          <span class="pill" v-for="f in features" :key="f">{{ f }}</span>
        </div>
      </div>
    </div>

    <!-- ── Right panel ── -->
    <div class="right-panel">
      <div class="form-card">
        <!-- Inline logo on card header -->
        <div class="card-logo">
          <svg width="28" height="23" viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="11" height="46" rx="4" fill="#0d2137"/>
            <rect x="45" y="0" width="11" height="46" rx="4" fill="#0d2137"/>
            <rect x="0" y="17" width="56" height="12" rx="4" fill="url(#hbar2)"/>
            <circle cx="14" cy="23" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="28" cy="23" r="3.5" fill="white" opacity="0.9"/>
            <circle cx="42" cy="23" r="3.5" fill="white" opacity="0.9"/>
            <defs>
              <linearGradient id="hbar2" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00c7d4"/>
                <stop offset="1" stop-color="#0072bc"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="card-logo-text">help<em>IT</em></span>
        </div>

        <h2 class="form-heading">Welcome back</h2>
        <p class="form-sub">Sign in to continue to helpIT.</p>

        <el-form @submit.prevent="handleLogin" :model="form" label-position="top">
          <el-form-item label="Email address">
            <el-input v-model="form.email" type="email" placeholder="you@company.com" size="large" autocomplete="email" />
          </el-form-item>
          <el-form-item label="Password">
            <el-input v-model="form.password" type="password" placeholder="Enter your password" size="large" show-password autocomplete="current-password" />
          </el-form-item>

          <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-bottom:16px" />

          <el-button native-type="submit" size="large" :loading="loading" class="signin-btn">
            Sign In
          </el-button>
        </el-form>

        <div class="demo-box">
          <div class="demo-label">Demo Accounts</div>
          <div class="demo-row">
            <div class="demo-tag tag-admin">IT Admin</div>
            <code>admin@helpit.local / admin123</code>
          </div>
          <div class="demo-row">
            <div class="demo-tag tag-user">End User</div>
            <code>user@helpit.local / user123</code>
          </div>
        </div>
      </div>

      <p class="access-note">For access issues, contact your IT Department.</p>
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

const features = ['Ticket Management', 'SLA Tracking', 'Self-Service Portal', 'User Management', 'Activity Logs'];

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
.login-page { display: flex; min-height: 100vh; }

/* ── Left panel ── */
.left-panel {
  width: 50%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg, #0d1e30 0%, #0a2840 45%, #063040 100%);
  display: flex;
  align-items: center;
  padding: 64px 72px;
}

/* Decorative blobs — Wazuh-style teal glow */
.deco { position: absolute; border-radius: 50%; pointer-events: none; }
.deco-circle-1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(0,180,210,0.1) 0%, transparent 70%);
  top: -180px; right: -180px;
}
.deco-circle-2 {
  width: 340px; height: 340px;
  background: radial-gradient(circle, rgba(0,128,198,0.12) 0%, transparent 70%);
  bottom: -120px; left: -80px;
}
.deco-ring {
  width: 280px; height: 280px;
  border: 1.5px solid rgba(0,199,212,0.1);
  top: -90px; right: -90px;
}

.left-content { position: relative; z-index: 1; }

/* Logo */
.brand { display: flex; align-items: center; gap: 16px; margin-bottom: 44px; }
.brand-name { font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
.brand-help { color: #fff; }
.brand-it   { color: #00c7d4; font-style: italic; }

/* Tagline */
.tagline-head {
  font-size: 28px; font-weight: 700; color: #fff;
  line-height: 1.3; margin-bottom: 16px; letter-spacing: -0.3px;
}
.tagline-body {
  font-size: 15px; color: rgba(255,255,255,0.55);
  line-height: 1.7; max-width: 380px; margin-bottom: 40px;
}

/* Feature pills — Wazuh teal */
.features { display: flex; flex-wrap: wrap; gap: 10px; }
.pill {
  border: 1px solid rgba(0,199,212,0.28);
  color: rgba(255,255,255,0.7);
  font-size: 12px; font-weight: 500;
  padding: 6px 14px; border-radius: 20px;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.pill:hover {
  border-color: #00c7d4;
  color: #00c7d4;
  background: rgba(0,199,212,0.07);
}

/* ── Right panel ── */
.right-panel {
  flex: 1;
  background: #f4f7fb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
}

.form-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  width: 100%; max-width: 420px;
  box-shadow: 0 2px 24px rgba(13,30,50,0.08);
  border: 1px solid #e3e9f0;
}

/* Card mini-logo */
.card-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
.card-logo-text {
  font-size: 18px; font-weight: 800; color: #0d1e30; letter-spacing: -0.5px;
}
.card-logo-text em { font-style: italic; color: #00a0b4; }

.form-heading { font-size: 22px; font-weight: 700; color: #0d1e30; margin-bottom: 4px; }
.form-sub     { font-size: 14px; color: #7a8fa6; margin-bottom: 26px; }

/* Override Element Plus for Wazuh teal */
.signin-btn {
  width: 100%;
  background: linear-gradient(90deg, #00a9c8 0%, #0080c6 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  height: 44px !important;
  border-radius: 8px !important;
}
.signin-btn:hover {
  background: linear-gradient(90deg, #00bcd4 0%, #0090d6 100%) !important;
}

/* Demo box */
.demo-box {
  margin-top: 22px;
  background: #f8fafc;
  border: 1px solid #e3e9f0;
  border-radius: 10px;
  padding: 14px 16px;
}
.demo-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #9db0c4; margin-bottom: 10px;
}
.demo-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 11.5px; margin-bottom: 7px;
}
.demo-row:last-child { margin-bottom: 0; }
.demo-tag {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 4px; white-space: nowrap; flex-shrink: 0;
}
.tag-admin { background: #e0f7fa; color: #00838f; }
.tag-user  { background: #ede7f6; color: #6a1b9a; }
.demo-row code {
  font-family: monospace; font-size: 11px;
  background: #edf2f7; padding: 2px 6px; border-radius: 4px; color: #2d3e50;
}

.access-note {
  margin-top: 18px; font-size: 12px;
  color: #a0b3c6; text-align: center;
}
</style>
