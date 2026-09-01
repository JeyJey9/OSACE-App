<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h3>Încărcare Document în Arhivă</h3>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Dropzone -->
        <div 
          class="dropzone-area" 
          :class="{ 'is-dragging': isDragging, 'has-selection': selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden-file-input" 
            @change="handleFileSelect"
          />

          <div v-if="!selectedFile" class="dropzone-idle">
            <svg class="dropzone-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
            <p class="dropzone-prompt">Trage fișierul aici sau <span class="highlight">alege din calculator</span></p>
            <span class="dropzone-hint">PDF, Word, Excel, PowerPoint, ZIP, Imagini (Până la 50MB)</span>
          </div>

          <div v-else class="file-preview-pill">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <div class="file-pill-meta">
              <span class="pill-name">{{ selectedFile.name }}</span>
              <span class="pill-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click.stop="selectedFile = null">Schimbă</button>
          </div>
        </div>

        <!-- Form fields -->
        <div class="form-field">
          <label>Denumire Document</label>
          <input 
            type="text" 
            v-model="customName" 
            placeholder="Lasă gol pentru numele original sau introdu un titlu clar" 
            class="input-control"
          />
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label>Departament</label>
            <select v-model="department" class="input-control">
              <option value="">(Moștenit din folder)</option>
              <option value="Board">Board / Conducere</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="PR">PR</option>
              <option value="FR">FR</option>
              <option value="Logistica">Logistică</option>
            </select>
          </div>

          <div class="form-field">
            <label>An Academic</label>
            <input 
              type="text" 
              v-model="academicYear" 
              placeholder="Ex: 2025-2026" 
              class="input-control"
            />
          </div>
        </div>

        <div class="form-field">
          <label>Tag-uri de căutare</label>
          <input 
            type="text" 
            v-model="tags" 
            placeholder="statut, regulament, pv_sedinta" 
            class="input-control"
          />
        </div>

        <div class="form-field">
          <label>Descriere sau Note</label>
          <textarea 
            v-model="description" 
            rows="2" 
            placeholder="Context sau descriere opțională..." 
            class="input-control"
          ></textarea>
        </div>

        <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-meter">
          <div class="upload-meter-bar" :style="{ width: uploadProgress + '%' }"></div>
          <span class="upload-meter-text">Se transmite către Google Drive... {{ uploadProgress }}%</span>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isUploading">
            Anulează
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!selectedFile || isUploading">
            <span v-if="isUploading">Se încarcă...</span>
            <span v-else>Salvează în Arhivă</span>
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

    uploadProgress.value = 35;

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
  max-width: 500px;
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

.dropzone-area {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.01);
  transition: all 0.15s ease;
}

.dropzone-area:hover, .dropzone-area.is-dragging {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.dropzone-area.has-selection {
  border-style: solid;
  border-color: var(--primary-border);
  background: var(--primary-subtle);
}

.hidden-file-input {
  display: none;
}

.dropzone-svg {
  color: var(--text-muted);
  margin-bottom: 6px;
}

.dropzone-prompt {
  font-size: 0.8125rem;
  color: var(--text-primary);
  font-weight: 500;
}

.highlight {
  color: var(--primary);
  text-decoration: underline;
}

.dropzone-hint {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 3px;
}

.file-preview-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.file-pill-meta {
  flex: 1;
  min-width: 0;
}

.pill-name {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill-size {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
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

.upload-meter {
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xs);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-meter-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--primary);
  transition: width 0.2s ease;
}

.upload-meter-text {
  position: relative;
  z-index: 2;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #042f20;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}
</style>
