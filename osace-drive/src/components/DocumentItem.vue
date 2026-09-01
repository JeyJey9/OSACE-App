<template>
  <div class="document-item glass-panel">
    <div class="doc-icon-container" :class="'icon-' + getFileCategory(doc.file_extension)">
      <span class="doc-badge-ext">{{ (doc.file_extension || '').replace('.', '').toUpperCase() || 'FILE' }}</span>
    </div>

    <div class="doc-main">
      <div class="doc-title-row">
        <h4 class="doc-name" :title="doc.name" @click="$emit('inspect', doc)">{{ doc.name }}</h4>
        <span v-if="doc.academic_year" class="badge badge-general">{{ doc.academic_year }}</span>
        <span v-if="doc.department_id" class="badge badge-department">{{ doc.department_id }}</span>
      </div>

      <div class="doc-meta-row">
        <span class="doc-size">{{ formatFileSize(doc.size_bytes) }}</span>
        <span class="meta-dot">•</span>
        <span class="doc-uploader" v-if="doc.uploaded_by_name">
          Încărcat de <strong>{{ doc.uploaded_by_name }}</strong>
        </span>
        <span class="meta-dot">•</span>
        <span class="doc-date">{{ formatDate(doc.created_at) }}</span>
      </div>

      <div v-if="doc.tags && doc.tags.length > 0" class="doc-tags-row">
        <span v-for="tag in doc.tags" :key="tag" class="doc-tag">#{{ tag }}</span>
      </div>
    </div>

    <div class="doc-actions">
      <button 
        class="btn btn-ghost btn-sm" 
        title="Detalii & Istoric"
        @click="$emit('inspect', doc)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>

      <a 
        v-if="doc.drive_web_view_link" 
        :href="doc.drive_web_view_link" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="btn btn-ghost btn-sm" 
        title="Deschide în Google Drive"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>

      <button 
        class="btn btn-primary btn-sm" 
        :disabled="isDownloading"
        @click="handleDownload"
        title="Descarcă pe calculator"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Descarcă</span>
      </button>

      <button 
        v-if="canDelete" 
        class="btn btn-danger btn-sm" 
        title="Șterge document"
        @click="$emit('delete', doc)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../services/api';

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['inspect', 'delete']);

const isDownloading = ref(false);

function getFileCategory(ext) {
  if (!ext) return 'generic';
  const clean = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(clean)) return 'pdf';
  if (['doc', 'docx'].includes(clean)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(clean)) return 'excel';
  if (['ppt', 'pptx'].includes(clean)) return 'powerpoint';
  if (['zip', 'rar', '7z', 'gz'].includes(clean)) return 'archive';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(clean)) return 'image';
  return 'generic';
}

function formatFileSize(bytes) {
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

async function handleDownload() {
  try {
    isDownloading.value = true;
    const response = await api.get(`/archive/documents/${props.doc.id}/download`, {
      responseType: 'blob',
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', props.doc.name || props.doc.original_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Eroare la descărcarea documentului:', err);
    alert('Nu s-a putut descărca documentul. Verifică permisiunile.');
  } finally {
    isDownloading.value = false;
  }
}
</script>

<style scoped>
.document-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.document-item:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-color-hover);
}

.doc-icon-container {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.icon-pdf { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.icon-word { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.icon-excel { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.icon-powerpoint { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); }
.icon-archive { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.icon-image { background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
.icon-generic { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

.doc-main {
  flex: 1;
  min-width: 0;
}

.doc-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.doc-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-name:hover {
  color: var(--primary);
  text-decoration: underline;
}

.doc-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.doc-uploader strong {
  color: var(--text-secondary);
}

.meta-dot {
  color: var(--text-muted);
}

.doc-tags-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.doc-tag {
  font-size: 0.7rem;
  color: var(--accent);
  background: rgba(99, 102, 241, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
