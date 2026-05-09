<template>
  <div class="leaderboard">
    <header class="page-header">
      <h1>Clasament Voluntari</h1>
      <p class="subtitle">Cei mai activi membri ai comunității OSACE.</p>
    </header>

    <!-- Year Selector -->
    <div class="year-selector">
      <select v-model="selectedYear" @change="fetchLeaderboard" class="year-dropdown">
        <option v-for="y in availableYears" :key="y.startYear" :value="y.startYear">
          Anul {{ y.label }}
        </option>
      </select>
    </div>

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
          {{ parseFloat(user.total_hours || 0).toFixed(1) }}h
        </div>
      </div>

      <div v-if="users.length === 0" class="empty-state">
        Nu există voluntari cu ore înregistrate în această perioadă.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const users = ref([]);
const loading = ref(true);
const availableYears = ref([]);
const selectedYear = ref(null);

const fetchLeaderboard = async () => {
  loading.value = true;
  try {
    const yearQuery = selectedYear.value ? `?year=${selectedYear.value}` : '';
    const res = await api.get(`/leaderboard${yearQuery}`);
    users.value = res.data.filter(u => parseFloat(u.total_hours) > 0);
  } catch (error) {
    console.error("Error fetching leaderboard", error);
  } finally {
    loading.value = false;
  }
};

const fetchAvailableYears = async () => {
  try {
    const res = await api.get('/leaderboard/available-years');
    availableYears.value = res.data;
    // Default to the first (most recent) year
    if (res.data.length > 0 && !selectedYear.value) {
      selectedYear.value = res.data[0].startYear;
    }
  } catch (error) {
    console.error("Error fetching available years", error);
  }
};

const selectYear = (startYear) => {
  selectedYear.value = startYear;
  fetchLeaderboard();
};

onMounted(async () => {
  await fetchAvailableYears();
  fetchLeaderboard();
});
</script>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2.2rem;
  color: var(--color-primary);
}

.subtitle {
  color: var(--color-text-secondary);
}

.year-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.year-dropdown {
  padding: 0.6rem 2.5rem 0.6rem 1.2rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
  transition: all 0.2s ease;
  min-width: 200px;
}

.year-dropdown:hover, .year-dropdown:focus {
  border-color: var(--color-primary);
  outline: none;
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

.hours-badge {
  background: var(--color-bg-surface);
  color: var(--color-primary);
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
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
