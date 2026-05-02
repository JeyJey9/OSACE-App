<template>
  <div class="leaderboard">
    <header class="page-header">
      <h1>Clasament Voluntari</h1>
      <p class="subtitle">Cei mai activi membri ai comunității OSACE.</p>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Se încarcă clasamentul...</p>
    </div>

    <div v-else class="ranking-container">
      <div 
        v-for="(user, index) in users" 
        :key="user.id" 
        class="rank-card glass-panel"
        :class="{ 'top-1': index === 0, 'top-2': index === 1, 'top-3': index === 2 }"
      >
        <div class="rank-number">#{{ index + 1 }}</div>
        <div class="user-info">
          <h3>{{ user.display_name }}</h3>
        </div>
        <div class="hours-badge">
          {{ user.total_hours }}h
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const users = ref([]);
const loading = ref(true);

const fetchLeaderboard = async () => {
  try {
    const res = await api.get('/leaderboard');
    users.value = res.data;
  } catch (error) {
    console.error("Error fetching leaderboard", error);
  } finally {
    loading.value = false;
  }
};

const displayRole = (role) => {
  const mapping = {
    admin: 'Administrator',
    coordonator: 'Coordonator',
    voluntar: 'Voluntar'
  };
  return mapping[role] || role;
};

onMounted(() => {
  fetchLeaderboard();
});
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2.2rem;
  color: var(--color-primary);
}

.subtitle {
  color: var(--color-text-secondary);
}

.ranking-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 700px;
  margin: 0 auto;
}

.rank-card {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  transition: transform 0.2s ease;
}

.rank-card:hover {
  transform: translateX(5px);
}

.rank-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-text-secondary);
  width: 50px;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.role {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.hours-badge {
  background: var(--color-bg-surface);
  color: var(--color-primary);
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

/* Stilizare specifică pentru Top 3 */
.top-1 {
  border-color: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
}
.top-1 .rank-number { color: #fbbf24; font-size: 2rem; }

.top-2 {
  border-color: #94a3b8;
}
.top-2 .rank-number { color: #94a3b8; font-size: 1.8rem; }

.top-3 {
  border-color: #b45309;
}
.top-3 .rank-number { color: #b45309; font-size: 1.6rem; }
</style>
