<template>
  <div class="admin-view">
    <header class="page-header">
      <h1>Panou Administrare</h1>
      <p class="subtitle">Gestionează cererile și voluntarii OSACE.</p>
    </header>

    <div class="tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'requests' }]" 
        @click="activeTab = 'requests'"
      >
        Aprobări Contribuții
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'assign' }]" 
        @click="activeTab = 'assign'"
      >
        Acordare Ore
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'events' }]" 
        @click="activeTab = 'events'"
      >
        Gestiune Evenimente
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'notifications' }]" 
        @click="activeTab = 'notifications'"
      >
        Trimite Notificări
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'logs' }]" 
        @click="activeTab = 'logs'; fetchAuditLogs()"
      >
        🗒 Jurnale
      </button>
    </div>

    <div v-if="activeTab === 'requests'" class="tab-content">
      <div v-if="loadingRequests" class="loading-state">Se încarcă cererile...</div>
      <div v-else-if="requests.length === 0" class="empty-state">
        Nu există cereri de contribuții speciale în așteptare.
      </div>
      <div v-else class="requests-grid">
        <div v-for="req in requests" :key="req.id" class="request-card glass-panel">
          <div class="req-header">
            <h4>{{ req.title }}</h4>
            <span class="hours-tag">+{{ req.awarded_hours }}h</span>
          </div>
          <p class="req-desc">{{ req.description }}</p>
          <div class="req-meta">
            <span>Către: <strong>{{ req.target_first }} {{ req.target_last }}</strong></span>
            <span>Cerut de: {{ req.coord_first }} {{ req.coord_last }}</span>
          </div>
          <div class="action-buttons">
            <button @click="handleAction(req.id, 'reject')" class="btn-reject">Respinge</button>
            <button @click="handleAction(req.id, 'approve')" class="btn-approve">Aprobă</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'events'" class="tab-content">
      <EventManagement />
    </div>

    <div v-if="activeTab === 'notifications'" class="tab-content">
      <div class="assign-form glass-panel">
        <h3>Trimite Notificare Push</h3>
        <p class="desc">Trimite o notificare direct pe telefonul voluntarilor.</p>

        <form @submit.prevent="submitNotification">
          <div class="form-group">
            <label>Titlu Notificare</label>
            <input v-model="notifyForm.title" type="text" class="input-field" required />
          </div>
          <div class="form-group">
            <label>Mesaj</label>
            <textarea v-model="notifyForm.message" class="input-field" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>Trimite către (Roluri):</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="voluntar" /> Voluntari
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="coordonator" /> Coordonatori
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="admin" /> Administratori
              </label>
            </div>
          </div>
          <button type="submit" class="btn-primary" :disabled="submittingNotify">
            {{ submittingNotify ? 'Se trimite...' : 'Trimite Notificare' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="activeTab === 'assign'" class="tab-content">
      <div class="assign-form glass-panel">
        <h3>Nouă Contribuție Specială</h3>
        <p class="desc">Acordă ore manual unui voluntar pentru task-uri externe.</p>
        
        <form @submit.prevent="submitContribution">
          <div class="form-group">
            <label>Alege Voluntar</label>
            <select v-model="form.user_id" class="input-field" required>
              <option value="" disabled>-- Selectează un voluntar --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.first_name }} {{ u.last_name }} ({{ u.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Titlu Contribuție</label>
            <input v-model="form.title" type="text" class="input-field" required />
          </div>
          <div class="form-group">
            <label>Descriere Detaliată</label>
            <textarea v-model="form.description" class="input-field" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>Ore Acordate</label>
            <input v-model="form.awarded_hours" type="number" step="0.5" class="input-field" required />
          </div>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Se trimite...' : 'Trimite Cerere' }}
          </button>
        </form>
      </div>
    </div>

    <!-- JURNALE TAB -->
    <div v-if="activeTab === 'logs'" class="tab-content">
      <div class="logs-header">
        <h3>Jurnal de Audit</h3>
        <p class="desc">Toate acțiunile administrative, în ordine cronologică inversă.</p>
      </div>

      <div v-if="loadingLogs" class="loading-state">Se încarcă jurnalele...</div>
      <div v-else-if="auditLogs.length === 0" class="empty-state">Nu există înregistrări în jurnal.</div>
      <div v-else class="logs-list">
        <div v-for="log in auditLogs" :key="log.id" class="log-entry glass-panel">
          <div class="log-bar" :style="{ backgroundColor: getActionColor(log.action) }"></div>
          <div class="log-body">
            <div class="log-top">
              <span class="log-badge" :style="{ backgroundColor: getActionColor(log.action) + '22', color: getActionColor(log.action) }">
                {{ getActionLabel(log.action) }}
              </span>
              <span class="log-time">{{ formatLogDate(log.created_at) }}</span>
            </div>
            <div class="log-actor">
              <strong>{{ log.actor_name }}</strong>
              <span class="log-role"> ({{ log.actor_role }})</span>
            </div>
            <div v-if="log.target_type" class="log-target">
              Target: <span>{{ log.target_type }} #{{ log.target_id }}</span>
            </div>
            <div v-if="log.details && Object.keys(log.details).length" class="log-details">
              {{ formatDetails(log.details) }}
            </div>
          </div>
        </div>

        <div class="logs-pagination">
          <button @click="fetchAuditLogs(logsPage - 1)" :disabled="logsPage <= 1" class="btn-secondary">← Anterior</button>
          <span>Pagina {{ logsPage }} / {{ logsTotalPages }}</span>
          <button @click="fetchAuditLogs(logsPage + 1)" :disabled="logsPage >= logsTotalPages" class="btn-secondary">Următor →</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import EventManagement from '../components/EventManagement.vue';

const activeTab = ref('requests');
const requests = ref([]);
const users = ref([]);
const loadingRequests = ref(false);
const submitting = ref(false);
const submittingNotify = ref(false);

// --- Audit Logs state ---
const auditLogs = ref([]);
const loadingLogs = ref(false);
const logsPage = ref(1);
const logsTotalPages = ref(1);

const ACTION_META = {
  EVENT_CREATE:                    { label: 'Creare Eveniment',      color: '#27ae60' },
  EVENT_UPDATE:                    { label: 'Editare Eveniment',     color: '#f39c12' },
  EVENT_DELETE:                    { label: 'Ștergere Eveniment',    color: '#e74c3c' },
  POST_CREATE:                     { label: 'Postare Nouă',          color: '#27ae60' },
  POST_DELETE:                     { label: 'Ștergere Postare',      color: '#e74c3c' },
  HOUR_REQUEST_COORDINATOR_APPROVE:{ label: 'Aprobare Ore (Coord)',  color: '#f39c12' },
  HOUR_REQUEST_ADMIN_APPROVE:      { label: 'Aprobare Ore (Admin)',  color: '#27ae60' },
  HOUR_REQUEST_REJECT:             { label: 'Respingere Ore',        color: '#e74c3c' },
  CONTRIBUTION_APPROVE:            { label: 'Aprobare Contribuție',  color: '#27ae60' },
  CONTRIBUTION_REJECT:             { label: 'Respingere Contribuție',color: '#e74c3c' },
  NOTIFICATION_SEND:               { label: 'Notificare Trimisă',    color: '#3498db' },
  USER_ROLE_CHANGE:                { label: 'Schimbare Rol',         color: '#9b59b6' },
  USER_DELETE:                     { label: 'Ștergere Utilizator',   color: '#e74c3c' },
};

const getActionColor = (action) => ACTION_META[action]?.color ?? '#95a5a6';
const getActionLabel = (action) => ACTION_META[action]?.label ?? action;

const formatLogDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDetails = (details) => {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(' · ');
};

const fetchAuditLogs = async (page = 1) => {
  loadingLogs.value = true;
  try {
    const res = await api.get(`/admin/audit-logs?page=${page}`);
    auditLogs.value = res.data.logs;
    logsPage.value = res.data.page;
    logsTotalPages.value = res.data.totalPages;
  } catch (err) {
    console.error('Eroare la preluarea jurnalelor:', err);
  } finally {
    loadingLogs.value = false;
  }
};

const form = ref({
  user_id: '',
  title: '',
  description: '',
  awarded_hours: ''
});


const notifyForm = ref({
  title: '',
  message: '',
  roles: ['voluntar']
});

const fetchRequests = async () => {
  loadingRequests.value = true;
  try {
    const res = await api.get('/admin/contributions/pending');
    requests.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loadingRequests.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const res = await api.get('/admin/users');
    users.value = res.data;
  } catch (error) {
    console.error('Eroare preluare voluntari', error);
  }
};

const handleAction = async (id, action) => {
  if (!confirm(`Sigur dorești să ${action === 'approve' ? 'aprobi' : 'respingi'} cererea?`)) return;
  try {
    await api.post(`/admin/contributions/${id}/${action}`);
    fetchRequests(); // Refresh
  } catch (error) {
    alert('Eroare la procesarea cererii.');
  }
};

const submitContribution = async () => {
  submitting.value = true;
  try {
    await api.post('/admin/contributions', form.value);
    alert('Cerere trimisă cu succes!');
    form.value = { user_id: '', title: '', description: '', awarded_hours: '' };
  } catch (error) {
    alert(error.response?.data?.error || 'Eroare la trimitere.');
  } finally {
    submitting.value = false;
  }
};


const submitNotification = async () => {
  if (notifyForm.value.roles.length === 0) {
    alert('Vă rugăm să selectați cel puțin un rol!');
    return;
  }
  submittingNotify.value = true;
  try {
    const response = await api.post('/admin/notifications/send-all', notifyForm.value);
    alert(response.data.message || 'Notificare trimisă cu succes!');
    notifyForm.value = { title: '', message: '', roles: ['voluntar'] };
  } catch (error) {
    alert(error.response?.data?.error || 'Eroare la trimiterea notificării.');
  } finally {
    submittingNotify.value = false;
  }
};

onMounted(() => {
  fetchRequests();
  fetchUsers();
});
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.tab-btn {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  font-weight: 600;
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.request-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.req-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.req-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.hours-tag {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9rem;
}

.req-desc {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  flex: 1;
}

.req-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-approve, .btn-reject {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-approve {
  background-color: var(--color-success);
}

.btn-reject {
  background-color: var(--color-danger);
}

.btn-approve:hover, .btn-reject:hover {
  opacity: 0.9;
}

.assign-form {
  max-width: 500px;
  padding: 2rem;
}

.assign-form h3 {
  margin-bottom: 0.5rem;
}

.assign-form .desc {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

textarea.input-field {
  resize: vertical;
}

button[type="submit"] {
  width: 100%;
  margin-top: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.checkbox-group {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
  padding: 1rem;
  background-color: var(--color-bg-surface);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

/* Logs tab */
.logs-header {
  margin-bottom: 1.5rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-entry {
  display: flex;
  overflow: hidden;
  padding: 0 !important;
  border-radius: 12px;
}

.log-bar {
  width: 5px;
  flex-shrink: 0;
}

.log-body {
  padding: 0.85rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.log-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.log-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
}

.log-time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.log-actor {
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.log-role {
  color: var(--color-text-secondary);
  font-style: italic;
}

.log-target {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.log-target span {
  color: var(--color-primary);
  font-weight: 600;
}

.log-details {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.logs-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  color: var(--color-text-secondary);
}

.btn-secondary {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-color);
  color: var(--color-text-primary);
  padding: 0.4rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
