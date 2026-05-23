<template>
  <div>
    <div class="toolbar">
      <el-input v-model="search" placeholder="Search users…" clearable style="width:240px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="toolbar-spacer" />
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> Add User
      </el-button>
    </div>

    <div class="card">
      <el-table :data="filteredUsers" v-loading="loading" style="width:100%">

        <el-table-column label="Name" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="uavatar">{{ initials(row.name) }}</div>
              <div>
                <div class="uname">{{ row.name }}</div>
                <div class="uemail">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Role" width="130">
          <template #default="{ row }">
            <span :class="['badge', 'role-' + row.role]">{{ row.role === 'user' ? 'End User' : row.role }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="department" label="Department" width="160" />
        <el-table-column prop="phone"      label="Phone"      width="140" />

        <el-table-column label="Status" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Created" width="110">
          <template #default="{ row }">{{ fmtDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="" width="110" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" plain size="small" circle title="Edit user" @click="openEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm
                :title="`Delete ${row.name}?`"
                confirm-button-type="danger"
                @confirm="deleteUser(row)"
                :disabled="row.id === myId"
              >
                <template #reference>
                  <el-button
                    type="danger" plain size="small" circle
                    :disabled="row.id === myId"
                    :title="row.id === myId ? 'Cannot delete yourself' : 'Delete user'"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Create / Edit dialog -->
    <el-dialog
      v-model="dialogOpen"
      :title="editingId ? 'Edit User' : 'Add New User'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-position="top">
        <div class="dialog-row">
          <el-form-item label="Full Name *">
            <el-input v-model="form.name" placeholder="John Doe" />
          </el-form-item>
          <el-form-item label="Email *">
            <el-input v-model="form.email" type="email" placeholder="john@company.com" />
          </el-form-item>
        </div>
        <div class="dialog-row">
          <el-form-item :label="editingId ? 'New Password (leave blank to keep)' : 'Password *'">
            <el-input v-model="form.password" type="password" show-password :placeholder="editingId ? 'Leave blank to keep current' : 'Min. 8 characters'" />
          </el-form-item>
          <el-form-item label="Role *">
            <el-select v-model="form.role" style="width:100%">
              <el-option value="user"       label="End User (Self-Service)" />
              <el-option value="technician" label="Technician (IT Staff)" />
              <el-option value="admin"      label="Admin (IT Staff)" />
            </el-select>
          </el-form-item>
        </div>
        <div class="dialog-row">
          <el-form-item label="Department">
            <el-input v-model="form.department" placeholder="IT Support" />
          </el-form-item>
          <el-form-item label="Phone">
            <el-input v-model="form.phone" placeholder="+1-555-0100" />
          </el-form-item>
        </div>
        <el-form-item v-if="editingId" label="Account Status">
          <el-switch v-model="form.is_active" active-text="Active" inactive-text="Inactive" />
        </el-form-item>

        <el-alert v-if="formError" :title="formError" type="error" show-icon :closable="false" style="margin-top:8px" />
      </el-form>

      <template #footer>
        <el-button @click="dialogOpen = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="editingId ? updateUser() : createUser()">
          {{ editingId ? 'Save Changes' : 'Create User' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const auth = useAuthStore();
const myId = computed(() => auth.user?.id);

const users   = ref([]);
const loading = ref(false);
const search  = ref('');

const dialogOpen = ref(false);
const editingId  = ref(null);
const saving     = ref(false);
const formError  = ref('');

const emptyForm = () => ({ name:'', email:'', password:'', role:'technician', department:'', phone:'', is_active: true });
const form = ref(emptyForm());

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase();
  return q ? users.value.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department||'').toLowerCase().includes(q)
  ) : users.value;
});

function initials(name) {
  return (name||'').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = '';
  dialogOpen.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  form.value = { name: row.name, email: row.email, password: '', role: row.role, department: row.department||'', phone: row.phone||'', is_active: !!row.is_active };
  formError.value = '';
  dialogOpen.value = true;
}

async function load() {
  loading.value = true;
  try {
    const res = await api.get('/users');
    users.value = res.data;
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  formError.value = '';
  if (!form.value.name.trim())         { formError.value = 'Name is required'; return; }
  if (!form.value.email.trim())        { formError.value = 'Email is required'; return; }
  if (form.value.password.length < 6)  { formError.value = 'Password must be at least 8 characters'; return; }

  saving.value = true;
  try {
    await api.post('/users', form.value);
    ElMessage.success(`User ${form.value.name} created`);
    dialogOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to create user';
  } finally {
    saving.value = false;
  }
}

async function updateUser() {
  formError.value = '';
  if (!form.value.name.trim())  { formError.value = 'Name is required'; return; }
  if (!form.value.email.trim()) { formError.value = 'Email is required'; return; }
  if (form.value.password && form.value.password.length < 6) { formError.value = 'Password must be at least 8 characters'; return; }

  saving.value = true;
  const payload = { ...form.value };
  if (!payload.password) delete payload.password;

  try {
    await api.put(`/users/${editingId.value}`, payload);
    ElMessage.success('User updated');
    dialogOpen.value = false;
    await load();
  } catch (e) {
    formError.value = e.response?.data?.error || 'Failed to update user';
  } finally {
    saving.value = false;
  }
}

async function deleteUser(row) {
  try {
    await api.delete(`/users/${row.id}`);
    ElMessage.success(`${row.name} deleted`);
    users.value = users.value.filter(u => u.id !== row.id);
  } catch (e) {
    ElMessage.error(e.response?.data?.error || 'Delete failed');
  }
}

onMounted(load);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; margin-bottom: 16px; gap: 10px; }
.toolbar-spacer { flex: 1; }

.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius:10px; overflow:hidden; backdrop-filter: blur(12px); }

.user-cell { display:flex; align-items:center; gap:10px; }
.uavatar {
  width:32px; height:32px;
  background: linear-gradient(135deg, #0080c6, #00c7d4);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:600; color:#fff; flex-shrink:0;
}
.uname  { font-size:13px; font-weight:600; color:#f1f5f9; }
.uemail { font-size:12px; color:rgba(255,255,255,0.45); }

.action-btns { display:flex; gap:6px; }
.dialog-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
</style>
