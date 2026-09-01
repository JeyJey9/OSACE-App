<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box glass-panel animate-fade-in">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-emoji">📤</span>
          <h3>Încarcă Document în Arhivă</h3>
        </div>
        <button class="btn btn-ghost btn-sm" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Drag & Drop Zone -->
        <div 
          class="dropzone" 
          :class="{ 'dropzone-active': isDragging, 'has-file': selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden-input" 
            @change="handleFileSelect"
          />

          <div v-if="!selectedFile" class="dropzone-content">
            <span class="drop-icon">📁</span>
            <p class="drop-title">Trage fișierul aici sau <span>alege din calculator</span></p>
            <p class="drop-subtitle">PDF, Word, Excel, PowerPoint, Imagini, Arhive ZIP (Max 50MB)</p>
          </div>

          <div v-else class="selected-file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click.stop="selectedFile = null">Schimbă</button>
          </div>
        </div>

        <!-- Form fields -->
        <div class="form-group">
          <label>Nume Document (Opțional)</label>
          <input 
            type="text" 
            v-model="customName" 
            placeholder="Ex: Regulament de Ordine Interioara 2025" 
            class="input-control"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Departament</label>
            <select v-model="department" class="input-control">
              <option value="">(Implicit din folder)</option>
              <option value="Board">Board / Conducere</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="PR">PR</option>
              <option value="FR">FR</option>
              <option value="Logistica">Logistică</option>
            </select>
          </div>

          <div class="form-group">
            <label>An Academic</label>
            <input 
              type="text" 
              v-model="academicYear" 
              placeholder="Ex: 2025-2026" 
              class="input-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Tag-uri (separate prin virgulă)</label>
          <input 
            type="text" 
            v-model="tags" 
            placeholder="statut, regulament, sedinta" 
            class="input-control"
          />
        </div>

        <div class="form-group">
          <label>Descriere sau Note</label>
          <textarea 
            v-model="description" 
            rows="2" 
            placeholder="Detalii suplimentare despre document..." 
            class="input-control"
          ></textarea>
        </div>

        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress-wrapper">
          <div class="progress-bar-fill" :style="{ width: uploadProgress + '%' }"></div>
          <span class="progress-text">Se încarcă în Google Drive... {{ uploadProgress }}%</span>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isUploading">
            Anulează
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!selectedFile || isUploading">
            <span v-if="isUploading">Se încarcă...</span>
            <span v-else>Încarcă Documentul</span>
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
  folderId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close', 'uploaded']);

const selectedFile = ref(null);
const customName = ref('');
const department = ref('');
const academicYear = ref('2025-2026');
const tags = ref('');
const description = ref('');
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);

function handleFileSelect(e) {
  if (e.target.files && e.target.files[0]) {
    selectedFile.value = e.target.files[0];
  }
}

function handleDrop(e) {
  isDragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    selectedFile.value = e.dataTransfer.files[0];
  }
}

async function handleSubmit() {
  if (!selectedFile.value) return;

  try {
    isUploading.value = true;
    uploadProgress.value = 10;

    const formData = new FormData();
    formData.append('file', selectedFile.value);
    if (props.folderId) formData.append('folderId', props.folderId);
    if (customName.value.trim()) formData.append('name', customName.value.trim());
    if (department.value) formData.append('departmentId', department.value);
    if (academicYear.value.trim()) formData.append('academicYear', academicYear.value.trim());
    if (tags.value.trim()) formData.append('tags', tags.value.trim());
    if (description.value.trim()) formData.append('description', description.value.trim());

    uploadProgress.value = 40;

    const response = await api.post('/archive/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      },
    });

    uploadProgress.value = 100;
    emit('uploaded', response.data.document);
    emit('close');
  } catch (err) {
    console.error('Eroare la upload:', err);
    alert(err.response?.data?.error || 'Eroare la încărcarea fișierului în Google Drive.');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
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
  max-width: 540px;
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

.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
}

.dropzone:hover, .dropzone-active {
  border-color: var(--primary);
  background: var(--primary-glow);
}

.dropzone.has-file {
  border-style: solid;
  border-color: var(--primary);
  background: rgba(16, 185, 129, 0.05);
}

.hidden-input {
  display: none;
}

.drop-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.drop-title {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.drop-title span {
  color: var(--primary);
  text-decoration: underline;
}

.drop-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.file-icon {
  font-size: 1.8rem;
}

.file-details {
  flex: 1;
}

.file-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.file-size {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
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

.upload-progress-wrapper {
  position: relative;
  height: 28px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  transition: width 0.2s ease;
}

.progress-text {
  position: relative;
  z-index: 2;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
