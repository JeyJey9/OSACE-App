<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          <h3>Director Nou</h3>
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
          <label>Nume Director *</label>
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
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
            Anulează
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!name.trim() || isSubmitting">
            <span v-if="isSubmitting">Se creează...</span>
            <span v-else>Creează Director</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps({
  parentId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close', 'created']);

const name = ref('');
const category = ref('project');
const departmentId = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  if (!name.value.trim()) return;

  try {
    isSubmitting.value = true;
    const response = await api.post('/archive/folders', {
      name: name.value.trim(),
      parentId: props.parentId,
      category: category.value,
      departmentId: departmentId.value || null,
    });

    emit('created', response.data.folder);
    emit('close');
  } catch (err) {
    console.error('Eroare la creare folder:', err);
    alert(err.response?.data?.error || 'Eroare la crearea folderului.');
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
  max-width: 440px;
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
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}
</style>
