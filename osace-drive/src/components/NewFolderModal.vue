<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box glass-panel animate-fade-in">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-emoji">📁</span>
          <h3>Creare Folder Nou</h3>
        </div>
        <button class="btn btn-ghost btn-sm" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>Nume Folder *</label>
          <input 
            type="text" 
            v-model="name" 
            required 
            placeholder="Ex: Proiect_Gala_2026" 
            class="input-control"
            autofocus
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Categorie</label>
            <select v-model="category" class="input-control">
              <option value="department">Departament</option>
              <option value="project">Proiect</option>
              <option value="governance">Guvernanță</option>
              <option value="event">Eveniment</option>
              <option value="general">General</option>
            </select>
          </div>

          <div class="form-group">
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

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
            Anulează
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!name.trim() || isSubmitting">
            <span v-if="isSubmitting">Se creează...</span>
            <span v-else>Creează Folder</span>
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
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.modal-box {
  width: 100%;
  max-width: 460px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color-hover);
  border-radius: var(--radius-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title-group h3 {
  font-size: 1.15rem;
}

.modal-emoji {
  font-size: 1.3rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
