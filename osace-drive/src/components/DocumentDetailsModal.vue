<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog panel animate-fade-in">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <h3>Inspecție & Integritate Document</h3>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon-only" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body" v-if="doc">
        <!-- Title & Original File -->
        <div class="doc-header">
          <h4>{{ doc.name }}</h4>
          <span class="original-filename" v-if="doc.original_name && doc.original_name !== doc.name">
            Fișier sursă: <code>{{ doc.original_name }}</code>
          </span>
        </div>

        <!-- Metadata Grid -->
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-key">Tip MIME</span>
            <span class="meta-val">{{ doc.mime_type }}</span>
          </div>

          <div class="meta-item">
            <span class="meta-key">Dimensiune</span>
            <span class="meta-val">{{ formatBytes(doc.size_bytes) }}</span>
          </div>

          <div class="meta-item">
            <span class="meta-key">Departament</span>
            <span class="meta-val">{{ doc.department_id || 'N/A' }}</span>
          </div>

          <div class="meta-item">
            <span class="meta-key">An Academic</span>
            <span class="meta-val">{{ doc.academic_year || 'N/A' }}</span>
          </div>
        </div>

        <!-- Description if present -->
        <div v-if="doc.description" class="note-box">
          <span class="note-label">Descriere / Note</span>
          <p>{{ doc.description }}</p>
        </div>

        <!-- Cloud & SHA256 Integrity -->
        <div class="integrity-panel">
          <div class="integrity-row">
            <span class="int-label">Drive File ID</span>
            <code class="int-code">{{ doc.drive_file_id }}</code>
          </div>
          <div class="integrity-row" v-if="doc.checksum_sha256">
            <div class="checksum-head">
              <span class="int-label">Integritate SHA-256</span>
              <button class="btn btn-ghost btn-sm" @click="copyChecksum">
                <span>{{ copied ? 'Copiat!' : 'Copiază Hash' }}</span>
              </button>
            </div>
            <code class="int-code sha-code">{{ doc.checksum_sha256 }}</code>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <a 
            v-if="doc.drive_web_view_link" 
            :href="doc.drive_web_view_link" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Deschide în Google Drive</span>
          </a>

          <button class="btn btn-primary" @click="handleDownload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Descarcă Fișier</span>
          </button>
        </div>
      </div>
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
});

defineEmits(['close']);

const copied = ref(false);

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyChecksum() {
  if (!props.doc?.checksum_sha256) return;
  navigator.clipboard.writeText(props.doc.checksum_sha256);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

async function handleDownload() {
  try {
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
    console.error('Eroare la descărcare:', err);
    alert('Nu s-a putut descărca documentul.');
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
  gap: 14px;
}

.doc-header {
  padding: 10px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.doc-header h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  word-break: break-all;
}

.original-filename {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.original-filename code {
  color: var(--text-secondary);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.meta-item {
  padding: 8px 10px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-key {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.meta-val {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
}

.note-box {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.note-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.integrity-panel {
  padding: 10px 12px;
  background: rgba(16, 185, 129, 0.03);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-xs);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.integrity-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.int-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 0.03em;
}

.checksum-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.int-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  word-break: break-all;
}

.sha-code {
  color: #a7f3d0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}
</style>
