<template>
  <div class="profile-view">
    <div v-if="loading" class="loading-state">
      <p>Se încarcă profilul...</p>
    </div>

    <div v-else-if="userProfile" class="profile-container">
      <!-- Info Card -->
      <div class="profile-header glass-panel">
        <div class="avatar-large">{{ userProfile.first_name.charAt(0) }}</div>
        <h2>{{ userProfile.first_name }} {{ userProfile.last_name }}</h2>
        <p class="role-text">{{ displayRole(userProfile.role) }}</p>
        
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-value">{{ userProfile.total_hours || 0 }}</span>
            <span class="stat-label">Ore Totale</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ badges.length }}</span>
            <span class="stat-label">Insigne</span>
          </div>
        </div>
      </div>

      <!-- Insigne -->
      <div class="section-container">
        <h3>Insigne Obținute</h3>
        <div v-if="badges.length === 0" class="empty-state">
          Nicio insignă obținută încă.
        </div>
        <div v-else class="badges-grid">
          <div v-for="badge in badges" :key="badge.badge_id" class="badge-card glass-panel">
            <div class="badge-icon">🎖️</div>
            <h4>{{ badge.name }}</h4>
            <p>{{ badge.description }}</p>
          </div>
        </div>
      </div>

      <!-- Contribuții Speciale -->
      <div class="section-container">
        <h3>Contribuții Speciale</h3>
        <div v-if="contributions.length === 0" class="empty-state">
          Nicio contribuție specială încă.
        </div>
        <div v-else class="contributions-list">
          <div v-for="cont in contributions" :key="cont.id" class="contribution-item glass-panel">
            <div class="cont-header">
              <h4>{{ cont.title }}</h4>
              <span class="hours-tag">+{{ cont.awarded_hours }}h</span>
            </div>
            <p>{{ cont.description }}</p>
            <span class="date">{{ new Date(cont.created_at).toLocaleDateString('ro-RO') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const userProfile = ref(null);
const badges = ref([]);
const contributions = ref([]);
const loading = ref(true);

const fetchProfileData = async () => {
  try {
    const userStr = localStorage.getItem('userData');
    if (!userStr) return;
    const { id } = JSON.parse(userStr);

    const [profileRes, badgesRes, contRes] = await Promise.all([
      api.get(`/profile/${id}`),
      api.get(`/profile/${id}/badges`),
      api.get(`/profile/${id}/contributions`)
    ]);

    userProfile.value = profileRes.data;
    badges.value = badgesRes.data;
    contributions.value = contRes.data;
  } catch (error) {
    console.error("Eroare la preluarea profilului", error);
  } finally {
    loading.value = false;
  }
};

const displayRole = (role) => {
  const mapping = { admin: 'Administrator', coordonator: 'Coordonator', voluntar: 'Voluntar' };
  return mapping[role] || role;
};

onMounted(() => {
  fetchProfileData();
});
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  text-align: center;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-glow);
}

.profile-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.role-text {
  color: var(--color-primary);
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.stats-row {
  display: flex;
  gap: 2rem;
  width: 100%;
  justify-content: center;
  border-top: 1px solid var(--glass-border);
  padding-top: 1.5rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.section-container h3 {
  margin-bottom: 1rem;
  font-size: 1.4rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.badge-card {
  padding: 1.5rem;
  text-align: center;
}

.badge-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.badge-card h4 {
  margin-bottom: 0.5rem;
  color: var(--color-secondary);
}

.badge-card p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.contributions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contribution-item {
  padding: 1.5rem;
  border-left: 4px solid var(--color-secondary);
}

.cont-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cont-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.hours-tag {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9rem;
}

.contribution-item p {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
