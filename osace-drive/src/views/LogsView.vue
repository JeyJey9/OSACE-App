<template>
  <div class="logs-layout">
    <Navbar @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" />

    <div class="logs-body">
      <Sidebar 
        :is-admin="true" 
        :is-open="isMobileSidebarOpen" 
        @close="isMobileSidebarOpen = false" 
      />

      <main class="logs-main">
        <div class="logs-header">
          <div>
            <h2>Jurnal de Audit & Activitate</h2>
            <p class="logs-sub">Istoricul operațiunilor de descărcare, încărcare și gestionare din arhivă</p>
          </div>
          <button class="btn btn-secondary btn-sm" @click="loadLogs" :disabled="isLoading">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            <span>Reîmprospătează</span>
          </button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>Se accesează jurnalele...</span>
        </div>

        <div v-else class="logs-table-container panel">
          <table class="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operațiune</th>
                <th>Utilizator</th>
                <th>Țintă</th>
                <th>Adresă IP</th>
                <th>Stare</th>
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
                  <span class="user-name">{{ log.user_name || 'Sistem' }}</span>
                  <span class="user-email">{{ log.user_email }}</span>
                </td>
                <td class="cell-target">
                  <span v-if="log.document_name" class="target-doc">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                    {{ log.document_name }}
                  </span>
                  <span v-else-if="log.folder_name" class="target-folder">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {{ log.folder_name }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="cell-ip">
                  <code>{{ log.ip_address || 'Intern' }}</code>
                </td>
                <td>
                  <span class="status-indicator" :class="log.result === 'success' ? 'status-ok' : 'status-err'">
                    {{ log.result === 'success' ? 'Succes' : 'Refuzat' }}
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
              ← Anterior
            </button>
            <span class="page-indicator">Pagina {{ currentPage }} din {{ totalPages }} ({{ totalLogs }} înregistrări)</span>
            <button 
              class="btn btn-ghost btn-sm" 
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Următor →
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
const isMobileSidebarOpen = ref(false);

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
  padding: 18px 24px;
  background: var(--bg-app);
  overflow-y: auto;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.logs-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.logs-table-container {
  overflow-x: auto;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
}

.logs-table th {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-default);
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
}

.logs-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.cell-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.cell-user {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-name {
  font-weight: 600;
  font-size: 0.8125rem;
}

.user-email {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.cell-target span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.target-doc {
  color: var(--text-primary);
}

.target-folder {
  color: #38bdf8;
}

.cell-ip code {
  font-size: 0.6875rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 5px;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.status-indicator {
  font-weight: 600;
  font-size: 0.6875rem;
}

.status-ok {
  color: var(--primary);
}

.status-err {
  color: var(--danger);
}

.empty-cell {
  text-align: center;
  padding: 30px !important;
  color: var(--text-muted);
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--border-default);
}

.page-indicator {
  font-size: 0.75rem;
  color: var(--text-muted);
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

@media (max-width: 768px) {
  .logs-main {
    padding: 12px 10px;
  }

  .logs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }

  .logs-header .btn {
    width: 100%;
  }

  .logs-table-container {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
