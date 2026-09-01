<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <h3>Editare Director</h3>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-field">
          <label>Denumire Director *</label>
          <input 
            type="text" 
            v-model="name" 
            required 
            placeholder="Ex: Proiect_Gala_2026" 
            class="input-control"
            autofocus
          />
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label>Categorie</label>
            <select v-model="category" class="input-control">
              <option value="project">Proiect</option>
              <option value="department">Departament</option>
              <option value="governance">Guvernanță</option>
              <option value="financial">Financiar</option>
              <option value="event">Eveniment</option>
              <option value="general">General</option>
            </select>
          </div>

          <div class="form-field">
            <label>Departament (Opțional)</label>
            <select v-model="departmentId" class="input-control">
              <option value="">Fără departament specific</option>
              <option value="Board">Board / Conducere</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="PR">PR</option>
              <option value="FR">FR</option>
              <option value="Logistica">Logistică</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <div class="left-actions">
            <button 
              type="button" 
              class="btn btn-danger btn-sm delete-btn" 
              @click="handleDelete" 
              :disabled="isSubmitting"
            >
              Șterge
            </button>

            <button 
              v-if="isAdmin"
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="$emit('permissions', folder)"
              title="Gestionează utilizatorii cu acces pe acest folder"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Permisiuni</span>
            </button>
          </div>

          <div class="right-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
              Anulează
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!name.trim() || isSubmitting">
              <span v-if="isSubmitting">Se salvează...</span>
              <span v-else>Salvează</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  folder: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'updated', 'deleted', 'permissions']);

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) return null;
  try { return JSON.parse(userStr); } catch (e) { return null; }
});

const isAdmin = computed(() => user.value?.role === 'admin');

const name = ref(props.folder.name || '');
const category = ref(props.folder.category || 'project');
const departmentId = ref(props.folder.department_id || '');
const isSubmitting = ref(false);

onMounted(() => {
  if (props.folder) {
    name.value = props.folder.name || '';
    category.value = props.folder.category || 'project';
    departmentId.value = props.folder.department_id || '';
  }
});

async function handleSubmit() {
  if (!name.value.trim()) return;

  try {
    isSubmitting.value = true;
    const response = await api.put(`/archive/folders/${props.folder.id}`, {
      name: name.value.trim(),
      category: category.value,
      departmentId: departmentId.value || null,
    });

    emit('updated', response.data.folder);
    emit('close');
  } catch (err) {
    console.error('Eroare la modificare folder:', err);
    const msg = err.response?.data?.error || (err.response?.status ? `Eroare HTTP ${err.response.status}: ${err.response.statusText || 'Rută negăsită'}` : err.message);
    alert(msg || 'Eroare la modificarea folderului.');
  } finally {
    isSubmitting.value = false;
  }
}

async function handleDelete() {
  if (!confirm(`Sigur dorești să ștergi folderul „${props.folder.name}”?`)) return;

  try {
    isSubmitting.value = true;
    await api.delete(`/archive/folders/${props.folder.id}`);
    emit('deleted', props.folder.id);
    emit('close');
  } catch (err) {
    console.error('Eroare la stergere folder:', err);
    const msg = err.response?.data?.error || (err.response?.status ? `Eroare HTTP ${err.response.status}` : err.message);
    alert(msg || 'Nu s-a putut șterge folderul.');
  } finally {
    isSubmitting.value = false;
  }
}
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
  max-width: 460px;
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
  gap: 14px;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.right-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  margin-right: auto;
}
</style>
