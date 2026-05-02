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
      <div class="empty-state glass-panel" style="padding: 3rem;">
        <h3>Gestiune Evenimente</h3>
        <p>Interfața pentru crearea și editarea evenimentelor va fi adăugată aici.</p>
      </div>
    </div>

    <div v-if="activeTab === 'notifications'" class="tab-content">
      <div class="empty-state glass-panel" style="padding: 3rem;">
        <h3>Trimite Notificări Push</h3>
        <p>Interfața pentru selectarea voluntarilor și trimiterea notificărilor va fi adăugată aici.</p>
      </div>
    </div>

    <div v-if="activeTab === 'assign'" class="tab-content">
      <div class="assign-form glass-panel">
        <h3>Nouă Contribuție Specială</h3>
        <p class="desc">Acordă ore manual unui voluntar pentru task-uri externe.</p>
        
        <form @submit.prevent="submitContribution">
          <div class="form-group">
            <label>ID Voluntar (Momentan manual)</label>
            <input v-model="form.user_id" type="number" class="input-field" required />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const activeTab = ref('requests');
const requests = ref([]);
const loadingRequests = ref(false);
const submitting = ref(false);

const form = ref({
  user_id: '',
  title: '',
  description: '',
  awarded_hours: ''
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

onMounted(() => {
  fetchRequests();
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
</style>
