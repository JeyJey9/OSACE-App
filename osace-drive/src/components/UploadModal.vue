<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in upload-dialog">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h3>Încărcare Documente în Arhivă</h3>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')" :disabled="isUploading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleBatchUpload" class="modal-body">
        <!-- Dropzone -->
        <div 
          class="dropzone-area" 
          :class="{ 'is-dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            multiple
            class="hidden-file-input" 
            @change="handleFileSelect"
          />

          <svg class="dropzone-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m16 16-4-4-4 4"></path>
          </svg>
          <p class="dropzone-prompt">Trage fișierele aici sau <span class="highlight">alege din calculator</span></p>
          <span class="dropzone-hint">PDF, Word, Excel, PowerPoint, ZIP, Imagini (Selectează unul sau mai multe fișiere)</span>
        </div>

        <!-- Selected Files Queue -->
        <div v-if="fileQueue.length > 0" class="file-queue-box">
          <div class="queue-head">
            <span class="queue-label">Fișiere selectate ({{ fileQueue.length }})</span>
            <button type="button" class="btn btn-ghost btn-sm text-danger" @click="clearQueue" :disabled="isUploading">
              Golește lista
            </button>
          </div>

          <div class="queue-list">
            <div v-for="(item, idx) in fileQueue" :key="idx" class="queue-item">
              <div class="queue-item-info">
                <span class="queue-filename" :title="item.file.name">{{ item.file.name }}</span>
                <span class="queue-filesize">{{ formatBytes(item.file.size) }}</span>
              </div>

              <div class="queue-item-status">
                <span v-if="item.status === 'pending'" class="status-pill status-pending">Așteptare</span>
                <span v-else-if="item.status === 'uploading'" class="status-pill status-uploading">Se încarcă...</span>
                <span v-else-if="item.status === 'done'" class="status-pill status-done">✓ Finalizat</span>
                <span v-else-if="item.status === 'error'" class="status-pill status-error" :title="item.error">✕ Eroare</span>

                <button 
                  v-if="item.status === 'pending'" 
                  type="button" 
                  class="btn btn-ghost btn-sm btn-icon-only remove-btn" 
                  @click="removeFile(idx)"
                  :disabled="isUploading"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Metadata Configuration (Applied to all) -->
        <div class="form-grid">
          <div class="form-field">
            <label>Departament</label>
            <select v-model="department" class="input-control" :disabled="isUploading">
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
              :disabled="isUploading"
            />
          </div>
        </div>

        <div class="form-field">
          <label>Tag-uri comune de căutare</label>
          <input 
            type="text" 
            v-model="tags" 
            placeholder="statut, regulament, raport" 
            class="input-control"
            :disabled="isUploading"
          />
        </div>

        <!-- Overall Progress Bar -->
        <div v-if="isUploading" class="upload-meter">
          <div class="upload-meter-bar" :style="{ width: overallProgress + '%' }"></div>
          <span class="upload-meter-text">Se transmite către Google Drive... {{ currentFileIndex }} / {{ fileQueue.length }}</span>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isUploading">
            Anulează
          </button>
          <button type="submit" class="btn btn-primary" :disabled="fileQueue.length === 0 || isUploading">
            <span v-if="isUploading">Se încarcă ({{ currentFileIndex }}/{{ fileQueue.length }})...</span>
            <span v-else>Încarcă {{ fileQueue.length }} {{ fileQueue.length === 1 ? 'fișier' : 'fișiere' }}</span>
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

const fileQueue = ref([]);
const department = ref('');
const academicYear = ref('2025-2026');
const tags = ref('');
const isDragging = ref(false);
const isUploading = ref(false);
const currentFileIndex = ref(0);
const overallProgress = ref(0);

function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    addFiles(Array.from(e.target.files));
  }
}

function handleDrop(e) {
  isDragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    addFiles(Array.from(e.dataTransfer.files));
  }
}

function addFiles(files) {
  files.forEach(file => {
    // Evitam duplicatele in coada
    if (!fileQueue.value.some(item => item.file.name === file.name && item.file.size === file.size)) {
      fileQueue.value.push({
        file,
        status: 'pending',
        error: null,
      });
    }
  });
}

function removeFile(idx) {
  fileQueue.value.splice(idx, 1);
}

function clearQueue() {
  fileQueue.value = [];
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function handleBatchUpload() {
  if (fileQueue.value.length === 0) return;

  isUploading.value = true;
  currentFileIndex.value = 0;
  overallProgress.value = 0;

  const uploadedDocs = [];

  for (let i = 0; i < fileQueue.value.length; i++) {
    const item = fileQueue.value[i];
    if (item.status === 'done') continue;

    currentFileIndex.value = i + 1;
    item.status = 'uploading';

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      if (props.folderId) formData.append('folderId', props.folderId);
      if (department.value) formData.append('departmentId', department.value);
      if (academicYear.value.trim()) formData.append('academicYear', academicYear.value.trim());
      if (tags.value.trim()) formData.append('tags', tags.value.trim());

      const res = await api.post('/archive/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      item.status = 'done';
      uploadedDocs.push(res.data.document);
      emit('uploaded', res.data.document);
    } catch (err) {
      console.error('Upload error for', item.file.name, err);
      item.status = 'error';
      item.error = err.response?.data?.error || 'Eroare la upload';
    }

    overallProgress.value = Math.round(((i + 1) / fileQueue.value.length) * 100);
  }

  isUploading.value = false;

  // Daca toate s-au incarcat cu succes, inchidem modalul
  if (fileQueue.value.every(item => item.status === 'done')) {
    emit('close');
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

.upload-dialog {
  width: 100%;
  max-width: 540px;
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

.file-queue-box {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.queue-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

.queue-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.queue-filename {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-filesize {
  font-size: 0.6875rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.queue-item-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-pill {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
}

.status-pending { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }
.status-uploading { background: var(--primary-subtle); color: var(--primary); }
.status-done { background: rgba(16, 185, 129, 0.1); color: #34d399; }
.status-error { background: rgba(244, 63, 94, 0.1); color: #fb7185; }

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
  color: #ffffff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}
</style>
