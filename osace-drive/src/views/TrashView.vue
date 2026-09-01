<template>
  <div class="trash-layout">
    <Navbar @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" />

    <div class="trash-body">
      <Sidebar 
        :is-admin="isAdmin" 
        :is-open="isMobileSidebarOpen" 
        @close="isMobileSidebarOpen = false" 
      />

      <main class="trash-main">
        <div class="trash-header">
          <div>
            <h2>Coș de Reciclare</h2>
            <p class="trash-sub">Documentele șterse pot fi restaurate în folderul original sau eliminate definitiv.</p>
          </div>

          <div class="trash-actions" v-if="trashDocs.length > 0 && isAdmin">
            <button class="btn btn-danger btn-sm" @click="handleEmptyTrash" :disabled="isProcessing">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Golește Coșul</span>
            </button>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>Se încarcă coșul de reciclare...</span>
        </div>

        <!-- Empty Trash State -->
        <div v-else-if="trashDocs.length === 0" class="empty-placeholder panel">
          <svg class="empty-svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <h4>Coșul de reciclare este gol</h4>
          <p>Nu există niciun document șters recent în arhivă.</p>
          <router-link to="/" class="btn btn-secondary btn-sm">Înapoi la Arhivă</router-link>
        </div>

        <!-- Trash Table -->
        <div v-else class="trash-table-container panel">
          <table class="trash-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Folder Sursă</th>
                <th>Dimensiune</th>
                <th>Șters la</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in trashDocs" :key="doc.id">
                <td class="cell-doc-name">
                  <div class="trash-doc-cell">
                    <span class="ext-badge">{{ (doc.file_extension || 'DOC').replace('.', '').toUpperCase() }}</span>
                    <span class="doc-text" :title="doc.name">{{ doc.name }}</span>
                  </div>
                </td>
                <td class="cell-folder">
                  <span v-if="doc.folder_name">{{ doc.folder_name }}</span>
                  <span v-else class="text-muted">Rădăcină</span>
                </td>
                <td class="cell-size">{{ formatBytes(doc.size_bytes) }}</td>
                <td class="cell-date">{{ formatDate(doc.updated_at || doc.created_at) }}</td>
                <td class="cell-actions">
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click="handleRestore(doc)"
                    :disabled="isProcessing"
                    title="Restaurează în folder"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                    </svg>
                    <span>Restaurează</span>
                  </button>

                  <button 
                    v-if="isAdmin" 
                    class="btn btn-ghost btn-sm btn-icon-only text-danger" 
                    @click="handlePermanentDelete(doc)"
                    :disabled="isProcessing"
                    title="Șterge definitiv din Google Drive"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import api from '../services/api';

const trashDocs = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const isMobileSidebarOpen = ref(false);

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
});

const isAdmin = computed(() => user.value?.role === 'admin');

async function loadTrash() {
  isLoading.value = true;
  try {
    const res = await api.get('/archive/trash');
    trashDocs.value = res.data;
  } catch (err) {
    console.error('Eroare la preluarea cosului:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleRestore(doc) {
  try {
    isProcessing.value = true;
    await api.post(`/archive/documents/${doc.id}/restore`);
    trashDocs.value = trashDocs.value.filter(d => d.id !== doc.id);
  } catch (err) {
    console.error('Eroare restaurare document:', err);
    alert(err.response?.data?.error || 'Eroare la restaurarea documentului.');
  } finally {
    isProcessing.value = false;
  }
}

async function handlePermanentDelete(doc) {
  if (!confirm(`Sigur dorești să elimini DEFINITIV documentul „${doc.name}” din Google Drive și baza de date? Această acțiune este ireversibilă.`)) return;

  try {
    isProcessing.value = true;
    await api.delete(`/archive/documents/${doc.id}/permanent`);
    trashDocs.value = trashDocs.value.filter(d => d.id !== doc.id);
  } catch (err) {
    console.error('Eroare stergere definitiva:', err);
    alert('Nu s-a putut șterge documentul.');
  } finally {
    isProcessing.value = false;
  }
}

async function handleEmptyTrash() {
  if (!confirm('Sigur dorești să golești întreg coșul de reciclare? Toate fișierele vor fi șterse definitiv din Google Drive.')) return;

  try {
    isProcessing.value = true;
    await api.delete('/archive/trash/empty');
    trashDocs.value = [];
  } catch (err) {
    console.error('Eroare golire cos:', err);
    alert('Eroare la golirea coșului.');
  } finally {
    isProcessing.value = false;
  }
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
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  loadTrash();
});
</script>

<style scoped>
.trash-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.trash-body {
  display: flex;
  flex: 1;
}

.trash-main {
  flex: 1;
  padding: 18px 24px;
  background: var(--bg-app);
  overflow-y: auto;
}

.trash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trash-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.trash-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.trash-table-container {
  overflow-x: auto;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}

.trash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
}

.trash-table th {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-default);
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.trash-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.trash-doc-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ext-badge {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 700;
  font-family: var(--font-mono);
}

.doc-text {
  font-weight: 600;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-date, .cell-size {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.cell-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 8px;
}

.empty-svg {
  color: var(--text-muted);
  margin-bottom: 8px;
  opacity: 0.5;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-danger:hover {
  color: var(--danger);
  background: var(--danger-subtle);
}

@media (max-width: 768px) {
  .trash-main {
    padding: 12px 10px;
  }
  .trash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
