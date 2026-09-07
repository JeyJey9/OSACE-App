<template>
  <div class="leaderboard-page">
    <!-- Header -->
    <header class="page-header">
      <h1>Clasament Voluntari</h1>
      <p class="subtitle">Cei mai activi și dedicați membri ai comunității OSACE.</p>
    </header>

    <!-- Controls Row: Category Filter + Year Selector -->
    <div class="controls-bar glass-panel">
      <!-- Categories Filter -->
      <div class="category-tabs">
        <button 
          v-for="cat in categories" 
          :key="cat.id" 
          class="cat-tab"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.label }}</span>
        </button>
      </div>

      <!-- Year Selector -->
      <div class="year-selector-wrap">
        <select v-model="selectedYear" @change="fetchLeaderboard" class="year-select">
          <option v-for="y in availableYears" :key="y.startYear" :value="y.startYear">
            Anul {{ y.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- My Position Banner (If Logged In & Ranked) -->
    <div v-if="myRankInfo" class="my-rank-banner glass-panel">
      <div class="my-rank-left">
        <div class="my-rank-badge">#{{ myRankInfo.rank }}</div>
        <div class="my-rank-text">
          <h4>Poziția Ta în Clasament</h4>
          <p>{{ myRankInfo.entry.first_name }} {{ myRankInfo.entry.last_name }} (@{{ myRankInfo.entry.display_name }})</p>
        </div>
      </div>
      <div class="my-rank-hours">
        <span>{{ getDisplayHours(myRankInfo.entry).toFixed(1) }} ore</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Se calculează clasamentul...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="sortedData.length === 0" class="empty-state glass-panel">
      <TrophyIcon :size="48" class="text-secondary" />
      <h3>Niciun voluntar în această categorie</h3>
      <p>Nu există ore înregistrate pentru categoria sau anul selectat.</p>
    </div>

    <!-- Ranking Content -->
    <div v-else class="ranking-content">
      
      <!-- TOP 3 PODIUM -->
      <div v-if="top3.length > 0" class="podium-container">
        
        <!-- 2nd Place (Left) -->
        <div v-if="top3[1]" class="podium-card silver glass-panel-elevated">
          <div class="podium-rank-badge rank-2">2</div>
          <div class="podium-avatar-wrap">
            <img 
              v-if="top3[1].avatar_url" 
              :src="resolveAvatar(top3[1].avatar_url)" 
              class="podium-avatar" 
              alt="Avatar" 
            />
            <div v-else class="podium-avatar placeholder silver-grad">
              {{ (top3[1].first_name || 'V').charAt(0) }}
            </div>
          </div>
          <h4 class="podium-name">{{ top3[1].first_name }} {{ top3[1].last_name }}</h4>
          <span class="podium-handle">@{{ top3[1].display_name }}</span>
          <div class="podium-hours badge-silver">
            {{ getDisplayHours(top3[1]).toFixed(1) }}h
          </div>
        </div>

        <!-- 1st Place (Center - Elevated) -->
        <div v-if="top3[0]" class="podium-card gold glass-panel-elevated">
          <div class="crown-icon">👑</div>
          <div class="podium-rank-badge rank-1">1</div>
          <div class="podium-avatar-wrap gold-glow">
            <img 
              v-if="top3[0].avatar_url" 
              :src="resolveAvatar(top3[0].avatar_url)" 
              class="podium-avatar" 
              alt="Avatar" 
            />
            <div v-else class="podium-avatar placeholder gold-grad">
              {{ (top3[0].first_name || 'V').charAt(0) }}
            </div>
          </div>
          <h3 class="podium-name gold-text">{{ top3[0].first_name }} {{ top3[0].last_name }}</h3>
          <span class="podium-handle">@{{ top3[0].display_name }}</span>
          <div class="podium-hours badge-gold">
            {{ getDisplayHours(top3[0]).toFixed(1) }}h
          </div>
        </div>

        <!-- 3rd Place (Right) -->
        <div v-if="top3[2]" class="podium-card bronze glass-panel-elevated">
          <div class="podium-rank-badge rank-3">3</div>
          <div class="podium-avatar-wrap">
            <img 
              v-if="top3[2].avatar_url" 
              :src="resolveAvatar(top3[2].avatar_url)" 
              class="podium-avatar" 
              alt="Avatar" 
            />
            <div v-else class="podium-avatar placeholder bronze-grad">
              {{ (top3[2].first_name || 'V').charAt(0) }}
            </div>
          </div>
          <h4 class="podium-name">{{ top3[2].first_name }} {{ top3[2].last_name }}</h4>
          <span class="podium-handle">@{{ top3[2].display_name }}</span>
          <div class="podium-hours badge-bronze">
            {{ getDisplayHours(top3[2]).toFixed(1) }}h
          </div>
        </div>

      </div>

      <!-- REST OF THE LEADERBOARD (#4+) -->
      <div v-if="others.length > 0" class="others-list">
        <h4 class="others-title">Ceilalți Voluntari</h4>
        <div 
          v-for="(user, idx) in others" 
          :key="user.id" 
          class="rank-row glass-panel"
          :class="{ 'is-me': currentUser?.id === user.id }"
        >
          <div class="row-rank">#{{ idx + 4 }}</div>
          
          <div class="row-user">
            <img 
              v-if="user.avatar_url" 
              :src="resolveAvatar(user.avatar_url)" 
              class="row-avatar" 
              alt="Avatar" 
            />
            <div v-else class="row-avatar-placeholder">
              {{ (user.first_name || 'V').charAt(0) }}
            </div>
            
            <div class="row-details">
              <span class="row-name">{{ user.first_name }} {{ user.last_name }}</span>
              <span class="row-handle">@{{ user.display_name }}</span>
            </div>
          </div>

          <div class="row-hours">
            <span class="hours-num">{{ getDisplayHours(user).toFixed(1) }}</span>
            <span class="hours-unit">ore</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { TrophyIcon } from 'lucide-vue-next';
import api from '../services/api';

const loading = ref(true);
const leaderboardData = ref([]);
const availableYears = ref([]);
const selectedCategory = ref('general');
const selectedYear = ref(null);

const categories = [
  { id: 'general', label: 'General' },
  { id: 'social',  label: 'Social' },
  { id: 'proiect', label: 'Proiecte' },
  { id: 'sedinta', label: 'Ședințe' },
];

const currentUser = computed(() => {
  const str = localStorage.getItem('userData');
  return str ? JSON.parse(str) : null;
});

const fetchAvailableYears = async () => {
  try {
    const res = await api.get('/leaderboard/available-years');
    availableYears.value = res.data;
    if (res.data.length > 0 && !selectedYear.value) {
      selectedYear.value = res.data[0].startYear;
    }
  } catch (error) {
    console.error("Eroare preluare ani:", error);
  }
};

const fetchLeaderboard = async () => {
  loading.value = true;
  try {
    const yearQuery = selectedYear.value ? `?year=${selectedYear.value}` : '';
    const res = await api.get(`/leaderboard${yearQuery}`);
    leaderboardData.value = res.data;
  } catch (error) {
    console.error("Eroare preluare clasament:", error);
  } finally {
    loading.value = false;
  }
};

const getDisplayHours = (u) => {
  if (selectedCategory.value === 'social') return parseFloat(u.social_hours || 0);
  if (selectedCategory.value === 'proiect') return parseFloat(u.proiect_hours || 0);
  if (selectedCategory.value === 'sedinta') return parseFloat(u.sedinta_hours || 0);
  return parseFloat(u.total_hours || 0);
};

const sortedData = computed(() => {
  return [...leaderboardData.value]
    .filter(u => getDisplayHours(u) > 0)
    .sort((a, b) => getDisplayHours(b) - getDisplayHours(a));
});

const top3 = computed(() => sortedData.value.slice(0, 3));
const others = computed(() => sortedData.value.slice(3));

const myRankInfo = computed(() => {
  if (!currentUser.value) return null;
  const idx = sortedData.value.findIndex(u => u.id === currentUser.value.id);
  if (idx === -1) return null;
  return { rank: idx + 1, entry: sortedData.value[idx] };
});

const resolveAvatar = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.PROD ? 'https://api.osace.ro' : 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

onMounted(async () => {
  await fetchAvailableYears();
  fetchLeaderboard();
});
</script>

<style scoped>
.leaderboard-page {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header {
  text-align: center;
}

.page-header h1 {
  font-size: 2.2rem;
  margin-bottom: 0.35rem;
  background: linear-gradient(135deg, #f8fafc, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 14px;
  flex-wrap: wrap;
  gap: 1rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.cat-tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.cat-tab:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.cat-tab.active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-primary);
  border-color: rgba(59, 130, 246, 0.3);
}

.year-select {
  padding: 0.5rem 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.year-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* My Rank Banner */
.my-rank-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 14px;
}

.my-rank-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.my-rank-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 800;
  font-family: var(--font-heading);
  box-shadow: var(--shadow-glow);
}

.my-rank-text h4 {
  font-size: 0.95rem;
  color: var(--color-text-primary);
  margin-bottom: 0.2rem;
}

.my-rank-text p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.my-rank-hours {
  font-size: 1.1rem;
  font-weight: 800;
  color: #60a5fa;
  font-family: var(--font-heading);
}

/* Loading & Empty */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* PODIUM */
.podium-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
  padding-top: 2rem;
}

.podium-card {
  flex: 1;
  max-width: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.75rem 1rem 1.5rem;
  border-radius: 20px;
  position: relative;
  text-align: center;
  transition: transform 0.2s ease;
}

.podium-card:hover {
  transform: translateY(-4px);
}

.podium-card.gold {
  padding-top: 2.5rem;
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.15);
}

.podium-card.silver {
  border-color: rgba(148, 163, 184, 0.3);
}

.podium-card.bronze {
  border-color: rgba(205, 127, 50, 0.3);
}

.crown-icon {
  position: absolute;
  top: -24px;
  font-size: 2rem;
  animation: float 2.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.podium-rank-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
}

.rank-1 { background: #fbbf24; }
.rank-2 { background: #cbd5e1; }
.rank-3 { background: #d97706; }

.podium-avatar-wrap {
  margin-bottom: 0.85rem;
}

.podium-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.gold .podium-avatar {
  width: 76px;
  height: 76px;
  border-color: #fbbf24;
}

.gold-glow {
  filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
}

.podium-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.gold-grad { background: linear-gradient(135deg, #f59e0b, #d97706); }
.silver-grad { background: linear-gradient(135deg, #94a3b8, #64748b); }
.bronze-grad { background: linear-gradient(135deg, #b45309, #78350f); }

.podium-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.gold-text {
  font-size: 1.1rem;
  color: #fbbf24;
}

.podium-handle {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.85rem;
}

.podium-hours {
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  font-family: var(--font-heading);
}

.badge-gold {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.badge-silver {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.badge-bronze {
  background: rgba(205, 127, 50, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(205, 127, 50, 0.3);
}

/* OTHERS LIST (#4+) */
.others-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.others-title {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  gap: 1.25rem;
  transition: transform 0.2s ease, background 0.2s;
}

.rank-row:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.05);
}

.rank-row.is-me {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.06);
}

.row-rank {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-muted);
  width: 40px;
  font-family: var(--font-heading);
}

.row-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.row-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.row-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.row-details {
  display: flex;
  flex-direction: column;
}

.row-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.row-handle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.row-hours {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.hours-num {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-primary);
  font-family: var(--font-heading);
}

.hours-unit {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .podium-container {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .podium-card {
    max-width: 100%;
  }
}
</style>
