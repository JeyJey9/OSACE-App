<template>
  <div class="doc-row" :class="{ 'is-downloading': isDownloading }">
    <!-- File Type Icon -->
    <div class="doc-icon-badge" :class="'type-' + getFileCategory(doc.file_extension)">
      <span class="ext-label">{{ formatExtension(doc.file_extension) }}</span>
    </div>

    <!-- Main Title & Meta -->
    <div class="doc-info" @click="$emit('inspect', doc)">
      <div class="doc-name-line">
        <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
        <span v-if="doc.academic_year" class="badge badge-general">{{ doc.academic_year }}</span>
        <span v-if="doc.department_id" class="badge badge-department">{{ doc.department_id }}</span>
      </div>

      <div class="doc-meta-line">
        <span>{{ formatFileSize(doc.size_bytes) }}</span>
        <span class="sep">•</span>
        <span v-if="doc.uploaded_by_name">De {{ doc.uploaded_by_name }}</span>
        <span class="sep">•</span>
        <span>{{ formatDate(doc.created_at) }}</span>
        <template v-if="doc.tags && doc.tags.length > 0">
          <span class="sep">•</span>
          <span v-for="tag in doc.tags" :key="tag" class="doc-tag">#{{ tag }}</span>
        </template>
      </div>
    </div>

    <!-- Actions -->
    <div class="doc-actions">
      <button 
        class="btn btn-ghost btn-sm btn-icon-only" 
        title="Previzualizează"
        @click.stop="$emit('preview', doc)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      <button 
        class="btn btn-ghost btn-sm btn-icon-only" 
        title="Detalii & Integritate"
        @click.stop="$emit('inspect', doc)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        class="btn btn-ghost btn-sm btn-icon-only" 
        title="Deschide în Google Drive"
        @click.stop
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>

      <button 
        class="btn btn-secondary btn-sm" 
        :disabled="isDownloading"
        @click.stop="handleDownload"
        title="Descarcă pe calculator"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>{{ isDownloading ? 'Se descarcă...' : 'Descarcă' }}</span>
      </button>

      <button 
        v-if="canDelete" 
        class="btn btn-ghost btn-sm btn-icon-only text-danger" 
        title="Șterge document"
        @click.stop="$emit('delete', doc)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

defineEmits(['inspect', 'preview', 'delete']);

const isDownloading = ref(false);

function formatExtension(ext) {
  if (!ext) return 'DOC';
  const clean = ext.replace('.', '').toUpperCase();
  return clean.length > 4 ? clean.substring(0, 4) : clean;
}

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
    alert('Nu s-a putut descărca documentul.');
  } finally {
    isDownloading.value = false;
  }
}
</script>

<style scoped>
.doc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.doc-row:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-strong);
}

.doc-icon-badge {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.type-pdf { background: rgba(244, 63, 94, 0.1); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.2); }
.type-word { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
.type-excel { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
.type-ppt { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.type-archive { background: rgba(168, 85, 247, 0.1); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); }
.type-image { background: rgba(236, 72, 153, 0.1); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.2); }
.type-generic { background: rgba(113, 113, 122, 0.1); color: #a1a1aa; border: 1px solid rgba(113, 113, 122, 0.2); }

.doc-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.doc-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.doc-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-name:hover {
  color: var(--primary);
}

.doc-meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.sep {
  opacity: 0.4;
}

.doc-tag {
  color: #a5b4fc;
  font-size: 0.6875rem;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-danger:hover {
  color: var(--danger);
  background: var(--danger-subtle);
}

@media (max-width: 600px) {
  .doc-row {
    padding: 10px 10px;
    gap: 10px;
  }

  .doc-name {
    font-size: 0.8125rem;
  }

  .doc-actions .btn span {
    display: none;
  }

  .doc-actions .btn {
    padding: 6px;
  }
}
</style>
