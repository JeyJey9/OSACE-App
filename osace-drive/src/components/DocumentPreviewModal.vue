<template>
  <div class="modal-overlay preview-overlay" @click.self="$emit('close')">
    <div class="preview-dialog panel animate-fade-in">
      <!-- Header -->
      <div class="preview-header">
        <div class="preview-title-wrap">
          <div class="file-type-pill" :class="'type-' + getFileCategory(doc.file_extension)">
            {{ (doc.file_extension || 'DOC').replace('.', '').toUpperCase() }}
          </div>
          <div class="preview-title-meta">
            <h3 :title="doc.name">{{ doc.name }}</h3>
            <span class="preview-sub">{{ formatBytes(doc.size_bytes) }} • {{ formatDate(doc.created_at) }}</span>
          </div>
        </div>

        <div class="preview-actions">
          <button class="btn btn-secondary btn-sm" @click="handleDownload" title="Descarcă pe calculator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span class="desktop-only">Descarcă</span>
          </button>

          <a 
            v-if="doc.drive_web_view_link" 
            :href="doc.drive_web_view_link" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-ghost btn-sm btn-icon-only"
            title="Deschide în Google Drive"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')" title="Închide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Preview Body -->
      <div class="preview-body">
        <div v-if="isLoading" class="preview-loading">
          <div class="spinner"></div>
          <span>Se generează previzualizarea...</span>
        </div>

        <div v-else-if="errorMessage" class="preview-error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h4>Nu s-a putut genera previzualizarea</h4>
          <p>{{ errorMessage }}</p>
          <button class="btn btn-primary btn-sm" @click="handleDownload">Descarcă Fișierul Direct</button>
        </div>

        <!-- PDF Preview -->
        <div v-else-if="fileType === 'pdf'" class="preview-container pdf-container">
          <iframe :src="blobUrl" class="preview-iframe" title="PDF Preview"></iframe>
        </div>

        <!-- Image Preview -->
        <div v-else-if="fileType === 'image'" class="preview-container image-container">
          <img :src="blobUrl" :alt="doc.name" class="preview-img" />
        </div>

        <!-- Text / Markdown Preview -->
        <div v-else-if="fileType === 'text'" class="preview-container text-container">
          <pre class="preview-text"><code>{{ textContent }}</code></pre>
        </div>

        <!-- Unsupported Filetype (Word, Excel, ZIP) -->
        <div v-else class="preview-fallback">
          <div class="fallback-icon-box" :class="'type-' + getFileCategory(doc.file_extension)">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h4>Previzualizare indisponibilă pentru acest format</h4>
          <p>Fișierele {{ (doc.file_extension || '').toUpperCase() }} pot fi vizualizate descărcându-le pe dispozitiv sau deschizându-le în Google Drive.</p>
          <div class="fallback-actions">
            <button class="btn btn-primary" @click="handleDownload">Descarcă Fișierul</button>
            <a v-if="doc.drive_web_view_link" :href="doc.drive_web_view_link" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              Deschide în Google Drive
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

const isLoading = ref(true);
const errorMessage = ref('');
const blobUrl = ref(null);
const textContent = ref('');
const fileType = ref('unsupported');

function getFileCategory(ext) {
  if (!ext) return 'generic';
  const clean = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(clean)) return 'pdf';
  if (['doc', 'docx'].includes(clean)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(clean)) return 'excel';
  if (['ppt', 'pptx'].includes(clean)) return 'ppt';
  if (['zip', 'rar', '7z', 'gz'].includes(clean)) return 'archive';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(clean)) return 'image';
  return 'generic';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadPreview() {
  isLoading.value = true;
  errorMessage.value = '';

  const ext = (props.doc.file_extension || '').toLowerCase().replace('.', '');
  const mime = (props.doc.mime_type || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) {
    fileType.value = 'pdf';
  } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || mime.startsWith('image/')) {
    fileType.value = 'image';
  } else if (['txt', 'md', 'json', 'csv', 'log', 'js', 'ts', 'html', 'css', 'sql'].includes(ext) || mime.startsWith('text/')) {
    fileType.value = 'text';
  } else {
    fileType.value = 'unsupported';
    isLoading.value = false;
    return;
  }

  try {
    const response = await api.get(`/archive/documents/${props.doc.id}/preview`, {
      responseType: fileType.value === 'text' ? 'text' : 'blob',
    });

    if (fileType.value === 'text') {
      textContent.value = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    } else {
      blobUrl.value = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] || mime }));
    }
  } catch (err) {
    console.error('Eroare preview document:', err);
    errorMessage.value = err.response?.data?.error || 'Nu s-a putut încărca fluxul documentului.';
  } finally {
    isLoading.value = false;
  }
}

async function handleDownload() {
  try {
    const response = await api.get(`/archive/documents/${props.doc.id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', props.doc.name || props.doc.original_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Eroare download:', err);
    alert('Nu s-a putut descărca fișierul.');
  }
}

onMounted(() => {
  loadPreview();
});

onUnmounted(() => {
  if (blobUrl.value) {
    window.URL.revokeObjectURL(blobUrl.value);
  }
});
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.preview-dialog {
  width: 100%;
  max-width: 1100px;
  height: 90vh;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.preview-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-type-pill {
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.type-pdf { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
.type-word { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.type-excel { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.type-image { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
.type-generic { background: rgba(113, 113, 122, 0.15); color: #a1a1aa; border: 1px solid rgba(113, 113, 122, 0.3); }

.preview-title-meta {
  min-width: 0;
}

.preview-title-meta h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.preview-sub {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-body {
  flex: 1;
  background: #09090b;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

.image-container {
  padding: 20px;
  overflow: auto;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
}

.text-container {
  padding: 20px;
  overflow: auto;
  align-items: flex-start;
  justify-content: flex-start;
}

.preview-text {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #e4e4e7;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  width: 100%;
}

.preview-fallback, .preview-error, .preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 12px;
}

.fallback-icon-box {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  margin-bottom: 4px;
}

.preview-fallback h4, .preview-error h4 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.preview-fallback p, .preview-error p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  max-width: 440px;
  margin: 0;
}

.fallback-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .preview-overlay {
    padding: 0;
  }
  .preview-dialog {
    height: 100vh;
    border-radius: 0;
    max-width: 100%;
  }
  .desktop-only {
    display: none;
  }
}
</style>
