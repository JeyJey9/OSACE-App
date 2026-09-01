<template>
  <div class="logs-layout">
    <Navbar />

    <div class="logs-body">
      <Sidebar :is-admin="true" />

      <main class="logs-main">
        <div class="logs-header">
          <div>
            <h2>Jurnal de Audit & Securitate Arhivă</h2>
            <p class="logs-sub">Istoricul complet al accesărilor, descărcărilor și modificărilor din Google Drive</p>
          </div>
          <button class="btn btn-secondary btn-sm" @click="loadLogs" :disabled="isLoading">
            🔄 Reîmprospătează
          </button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Se încarcă jurnalele...</p>
        </div>

        <div v-else class="logs-table-container glass-panel">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Data & Ora</th>
                <th>Acțiune</th>
                <th>Utilizator</th>
                <th>Element Afectat</th>
                <th>Adresă IP</th>
                <th>Rezultat</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logs.length === 0">
                <td colspan="6" class="empty-cell">Nicio activitate înregistrată încă.</td>
              </tr>
              <tr v-for="log in logs" :key="log.id">
                <td class="cell-date">{{ formatDate(log.created_at) }}</td>
                <td>
                  <span class="badge" :class="getActionBadgeClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td class="cell-user">
                  <strong>{{ log.user_name || 'Sistem' }}</strong>
                  <span class="user-email">{{ log.user_email }}</span>
                </td>
                <td class="cell-target">
                  <span v-if="log.document_name">📄 {{ log.document_name }}</span>
                  <span v-else-if="log.folder_name">📁 {{ log.folder_name }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="cell-ip">
                  <code>{{ log.ip_address || 'Intern' }}</code>
                </td>
                <td>
                  <span class="status-indicator" :class="log.result === 'success' ? 'status-ok' : 'status-err'">
                    {{ log.result === 'success' ? 'Succes' : 'Refuzat/Eroare' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination-footer" v-if="totalPages > 1">
            <button 
              class="btn btn-ghost btn-sm" 
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              ← Pagina anterioară
            </button>
            <span class="page-indicator">Pagina {{ currentPage }} din {{ totalPages }} ({{ totalLogs }} acțiuni)</span>
            <button 
              class="btn btn-ghost btn-sm" 
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Pagina următoare →
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import api from '../services/api';

const logs = ref([]);
const totalLogs = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(true);

async function loadLogs() {
  isLoading.value = true;
  try {
    const res = await api.get(`/archive/access-logs?page=${currentPage.value}`);
    logs.value = res.data.logs;
    totalLogs.value = res.data.total;
    totalPages.value = res.data.totalPages;
  } catch (err) {
    console.error('Eroare la preluarea logurilor:', err);
  } finally {
    isLoading.value = false;
  }
}

function goToPage(p) {
  currentPage.value = p;
  loadLogs();
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
    second: '2-digit',
  });
}

function getActionBadgeClass(action) {
  switch (action) {
    case 'DOCUMENT_UPLOAD': return 'badge-department';
    case 'DOCUMENT_DOWNLOAD': return 'badge-project';
    case 'DOCUMENT_DELETE': return 'badge-financial';
    case 'FOLDER_CREATE': return 'badge-governance';
    case 'STRUCTURE_INIT': return 'badge-governance';
    default: return 'badge-general';
  }
}

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.logs-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logs-body {
  display: flex;
  flex: 1;
}

.logs-main {
  flex: 1;
  padding: 24px 32px;
  background: var(--bg-main);
  overflow-y: auto;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.logs-header h2 {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.logs-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.logs-table-container {
  overflow-x: auto;
  border-radius: var(--radius-lg);
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.logs-table th {
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.logs-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.cell-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.cell-user {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cell-ip code {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
}

.status-indicator {
  font-weight: 600;
  font-size: 0.75rem;
}

.status-ok {
  color: var(--primary);
}

.status-err {
  color: var(--danger);
}

.empty-cell {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
}

.page-indicator {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
