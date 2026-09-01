<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h3>Permisiuni & Acces: {{ folder.name }}</h3>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Add Permission Form -->
        <form @submit.prevent="handleGrantPermission" class="grant-form panel">
          <div class="form-row">
            <div class="form-field flex-1">
              <label>ID Utilizator sau Email</label>
              <input 
                type="text" 
                v-model="targetUserId" 
                required 
                placeholder="ID utilizator (ex: 12)" 
                class="input-control"
              />
            </div>

            <div class="form-field">
              <label>Nivel Acces</label>
              <select v-model="permission" class="input-control">
                <option value="view">Vizualizare (Read-Only)</option>
                <option value="upload">Încărcare (Upload & View)</option>
                <option value="manage">Gestiune Completă (Manage)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary align-end-btn" :disabled="isSubmitting || !targetUserId">
              <span>Acordă</span>
            </button>
          </div>
        </form>

        <!-- Current Permissions List -->
        <div class="permissions-section">
          <span class="section-label">Utilizatori cu acces explicit</span>

          <div v-if="isLoading" class="loading-perms">
            <div class="spinner-sm"></div>
            <span>Se încarcă permisiunile...</span>
          </div>

          <div v-else-if="permissions.length === 0" class="empty-perms">
            <span>Nu există reguli explicite pe acest folder. Se aplică permisiunile implicite de rol.</span>
          </div>

          <div v-else class="perms-list">
            <div v-for="p in permissions" :key="p.id" class="perm-row">
              <div class="perm-user">
                <div class="perm-avatar">
                  {{ (p.display_name || p.email || 'U')[0].toUpperCase() }}
                </div>
                <div class="perm-meta">
                  <span class="perm-name">{{ p.display_name || 'Utilizator #' + p.user_id }}</span>
                  <span class="perm-email">{{ p.email }}</span>
                </div>
              </div>

              <div class="perm-right">
                <span class="badge" :class="getPermBadgeClass(p.permission)">
                  {{ formatPerm(p.permission) }}
                </span>
                <button 
                  class="btn btn-ghost btn-sm btn-icon-only text-danger" 
                  @click="handleRevokePermission(p.user_id)"
                  title="Revocă accesul"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Închide
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  folder: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

const permissions = ref([]);
const targetUserId = ref('');
const permission = ref('view');
const isLoading = ref(true);
const isSubmitting = ref(false);

async function loadPermissions() {
  isLoading.value = true;
  try {
    const res = await api.get(`/archive/folders/${props.folder.id}/permissions`);
    permissions.value = res.data;
  } catch (err) {
    console.error('Eroare la incarcare permisiuni:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleGrantPermission() {
  if (!targetUserId.value) return;

  try {
    isSubmitting.value = true;
    await api.post(`/archive/folders/${props.folder.id}/permissions`, {
      targetUserId: targetUserId.value.trim(),
      permission: permission.value,
    });
    targetUserId.value = '';
    await loadPermissions();
  } catch (err) {
    console.error('Eroare grant perm:', err);
    alert(err.response?.data?.error || 'Eroare la acordarea permisiunii.');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleRevokePermission(userId) {
  if (!confirm('Sigur dorești să revoci această permisiune?')) return;

  try {
    await api.delete(`/archive/folders/${props.folder.id}/permissions/${userId}`);
    permissions.value = permissions.value.filter(p => p.user_id !== userId);
  } catch (err) {
    console.error('Eroare revoke perm:', err);
    alert('Nu s-a putut revoca permisiunea.');
  }
}

function formatPerm(perm) {
  switch (perm) {
    case 'view': return 'Vizualizare';
    case 'upload': return 'Încărcare';
    case 'manage': return 'Gestiune';
    default: return perm;
  }
}

function getPermBadgeClass(perm) {
  switch (perm) {
    case 'view': return 'badge-general';
    case 'upload': return 'badge-department';
    case 'manage': return 'badge-governance';
    default: return 'badge-general';
  }
}

onMounted(() => {
  loadPermissions();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}

.modal-dialog {
  width: 100%;
  max-width: 520px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title-wrap h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.text-primary {
  color: var(--primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grant-form {
  padding: 14px;
  background: var(--bg-surface-elevated);
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.flex-1 {
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.align-end-btn {
  margin-bottom: 1px;
}

.permissions-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.loading-perms, .empty-perms {
  padding: 20px;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.perms-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

.perm-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.perm-avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  background: var(--primary-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

.perm-meta {
  display: flex;
  flex-direction: column;
}

.perm-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.perm-email {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.perm-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.text-danger:hover {
  color: var(--danger);
  background: var(--danger-subtle);
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
