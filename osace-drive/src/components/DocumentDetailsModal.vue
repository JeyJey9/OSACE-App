<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box glass-panel animate-fade-in">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-emoji">📋</span>
          <h3>Detalii & Integritate Document</h3>
        </div>
        <button class="btn btn-ghost btn-sm" @click="$emit('close')">✕</button>
      </div>

      <div class="details-content" v-if="doc">
        <!-- Main Highlight -->
        <div class="doc-header-card">
          <h4 class="doc-big-title">{{ doc.name }}</h4>
          <p class="doc-sub" v-if="doc.original_name !== doc.name">
            Fișier original: <code>{{ doc.original_name }}</code>
          </p>
        </div>

        <!-- Metadata Grid -->
        <div class="meta-grid">
          <div class="meta-card">
            <span class="meta-label">Format / MIME</span>
            <span class="meta-val">{{ doc.mime_type }}</span>
          </div>

          <div class="meta-card">
            <span class="meta-label">Dimensiune</span>
            <span class="meta-val">{{ formatBytes(doc.size_bytes) }}</span>
          </div>

          <div class="meta-card">
            <span class="meta-label">Departament</span>
            <span class="meta-val">{{ doc.department_id || 'N/A' }}</span>
          </div>

          <div class="meta-card">
            <span class="meta-label">An Academic</span>
            <span class="meta-val">{{ doc.academic_year || 'N/A' }}</span>
          </div>
        </div>

        <!-- Description if present -->
        <div v-if="doc.description" class="desc-box">
          <span class="desc-title">Descriere / Note:</span>
          <p>{{ doc.description }}</p>
        </div>

        <!-- Integrity & Google Drive Sync -->
        <div class="security-card">
          <div class="security-row">
            <span class="sec-label">Google Drive File ID:</span>
            <code class="sec-val">{{ doc.drive_file_id }}</code>
          </div>
          <div class="security-row" v-if="doc.checksum_sha256">
            <span class="sec-label">Integritate SHA-256:</span>
            <code class="sec-val checksum-val">{{ doc.checksum_sha256 }}</code>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-footer">
          <a 
            v-if="doc.drive_web_view_link" 
            :href="doc.drive_web_view_link" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-secondary"
          >
            Vizualizează în Google Drive ↗
          </a>
          <button class="btn btn-primary" @click="handleDownload">
            Descarcă Fișierul
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '../services/api';

const props = defineProps({
  doc: {
    type: Object,
    required: true,
  },
});

defineEmits(['close']);

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  max-width: 580px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color-hover);
  border-radius: var(--radius-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title-group h3 {
  font-size: 1.15rem;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.doc-header-card {
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.doc-big-title {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.doc-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.doc-sub code {
  color: var(--text-secondary);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.meta-card {
  padding: 10px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.meta-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-all;
}

.desc-box {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.desc-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.security-card {
  padding: 12px 14px;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.security-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sec-label {
  font-size: 0.7rem;
  color: var(--primary);
  font-weight: 700;
}

.sec-val {
  font-size: 0.75rem;
  color: var(--text-secondary);
  word-break: break-all;
  font-family: monospace;
}

.checksum-val {
  color: #a7f3d0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
