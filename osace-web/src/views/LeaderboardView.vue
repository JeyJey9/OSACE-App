<template>
  <div class="leaderboard-page">
    <!-- Header -->
    <header class="page-header">
      <h1>Clasament Voluntari</h1>
      <p class="subtitle">Cei mai activi și dedicați membri ai comunității OSACE.</p>
    </header>

    <!-- Controls Bar: Categories, Period Filters & Quick Search -->
    <div class="controls-bar glass-panel">
      <div class="controls-top-row">
        <div class="category-tabs">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="cat-tab"
            :class="{ active: selectedCategory === cat.id }"
            :style="selectedCategory === cat.id ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.bg } : {}"
            @click="selectedCategory = cat.id"
          >
            <span>{{ cat.label }}</span>
          </button>
        </div>

        <div class="period-selectors">
          <select v-model="selectedYear" @change="onYearChange" class="year-select">
            <option v-for="y in yearOptions" :key="y.startYear" :value="y.startYear">
              Anul {{ y.label }}
            </option>
            <option value="all">Din Toate Timpurile</option>
          </select>

          <select
            v-if="selectedYear !== 'all'"
            v-model="selectedMonth"
            @change="fetchLeaderboard"
            class="year-select"
          >
            <option v-for="m in ACADEMIC_MONTH_OPTIONS" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="search-row">
        <SearchIcon :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Caută voluntar după nume..."
        />
        <button v-if="searchQuery" type="button" class="clear-search-btn" @click="searchQuery = ''">
          <XIcon :size="15" />
        </button>
      </div>
    </div>

    <!-- Spotlight Pills: Volunteer of the Month & Volunteer of the Year -->
    <div v-if="showSpotlightBanner" class="spotlights-stack">
      <button
        v-if="prevMonthWinner"
        type="button"
        class="spotlight-pill spotlight-month"
        @click="openPublicProfile(prevMonthWinner.id)"
      >
        <div class="spotlight-left">
          <TrophyIcon :size="18" class="spotlight-icon-month" />
          <img
            v-if="prevMonthWinner.avatar_url"
            :src="resolveMediaUrl(prevMonthWinner.avatar_url)"
            class="spotlight-avatar"
            alt="Avatar"
          />
          <span class="spotlight-copy">
            <span class="spotlight-label-month">Voluntarul lunii {{ spotlights.previousMonth.label }}:</span>
            <strong class="spotlight-winner">{{ prevMonthWinner.display_name }}</strong>
            <span class="spotlight-hours-month">· {{ parseFloat(prevMonthWinner.total_hours || 0).toFixed(1) }}h</span>
          </span>
        </div>
        <ChevronRightIcon :size="16" class="spotlight-chevron" />
      </button>

      <button
        v-if="yearWinner"
        type="button"
        class="spotlight-pill spotlight-year"
        @click="openPublicProfile(yearWinner.id)"
      >
        <div class="spotlight-left">
          <CrownIcon :size="18" class="spotlight-icon-year" />
          <img
            v-if="yearWinner.avatar_url"
            :src="resolveMediaUrl(yearWinner.avatar_url)"
            class="spotlight-avatar"
            alt="Avatar"
          />
          <span class="spotlight-copy">
            <span class="spotlight-label-year">Voluntarul anului {{ spotlights.academicYear.label }}:</span>
            <strong class="spotlight-winner">{{ yearWinner.display_name }}</strong>
            <span class="spotlight-hours-year">· {{ parseFloat(yearWinner.total_hours || 0).toFixed(1) }}h</span>
          </span>
        </div>
        <ChevronRightIcon :size="16" class="spotlight-chevron" />
      </button>
    </div>

    <!-- My Position Banner -->
    <div
      v-if="myRankInfo && !isSearching"
      class="my-rank-banner glass-panel clickable-card"
      @click="openPublicProfile(myRankInfo.entry.id)"
    >
      <div class="my-rank-left">
        <div class="my-rank-badge">#{{ myRankInfo.rank }}</div>
        <div class="my-rank-text">
          <h4>Poziția Ta în Clasament</h4>
          <p>{{ myRankInfo.entry.display_name }} · {{ getDisplayActivities(myRankInfo.entry) }} act.</p>
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
    <div v-else-if="rankedData.length === 0 || (isSearching && displayedList.length === 0)" class="empty-state glass-panel">
      <TrophyIcon :size="48" class="text-secondary" />
      <h3>{{ isSearching ? 'Niciun voluntar găsit' : 'Niciun voluntar în această categorie' }}</h3>
      <p>
        {{ isSearching
          ? 'Încearcă un alt nume în bara de căutare.'
          : 'Nu există ore înregistrate pentru categoria sau perioada selectată.' }}
      </p>
    </div>

    <!-- Ranking Content -->
    <div v-else class="ranking-content">
      <!-- TOP 3 PODIUM (hidden during search) -->
      <div v-if="!isSearching && top3.length > 0" class="podium-container">
        <!-- 2nd Place -->
        <div
          v-if="top3[1]"
          class="podium-card silver glass-panel-elevated clickable-card"
          @click="openPublicProfile(top3[1].id)"
        >
          <div class="podium-rank-badge rank-2">2</div>
          <div class="podium-avatar-wrap">
            <img
              v-if="top3[1].avatar_url"
              :src="resolveMediaUrl(top3[1].avatar_url)"
              class="podium-avatar"
              alt="Avatar"
            />
            <div v-else class="podium-avatar placeholder silver-grad">
              {{ getInitial(top3[1]) }}
            </div>
          </div>
          <h4 class="podium-name">{{ top3[1].display_name }}</h4>
          <div v-if="top3[1].year_champion_label || top3[1].month_champion_label" class="podium-champs">
            <span v-if="top3[1].year_champion_label" class="champ-chip year">👑 An</span>
            <span v-if="top3[1].month_champion_label" class="champ-chip month">🏆 Lună</span>
          </div>
          <span class="podium-meta">{{ getDisplayActivities(top3[1]) }} act.</span>
          <div class="podium-hours badge-silver">
            {{ getDisplayHours(top3[1]).toFixed(1) }}h
          </div>
        </div>

        <!-- 1st Place -->
        <div
          v-if="top3[0]"
          class="podium-card gold glass-panel-elevated clickable-card"
          @click="openPublicProfile(top3[0].id)"
        >
          <div class="crown-icon">
            <CrownIcon :size="18" />
          </div>
          <div class="podium-rank-badge rank-1">1</div>
          <div class="podium-avatar-wrap gold-glow">
            <img
              v-if="top3[0].avatar_url"
              :src="resolveMediaUrl(top3[0].avatar_url)"
              class="podium-avatar"
              alt="Avatar"
            />
            <div v-else class="podium-avatar placeholder gold-grad">
              {{ getInitial(top3[0]) }}
            </div>
          </div>
          <h3 class="podium-name gold-text">{{ top3[0].display_name }}</h3>
          <div v-if="top3[0].year_champion_label || top3[0].month_champion_label" class="podium-champs">
            <span v-if="top3[0].year_champion_label" class="champ-chip year">👑 An</span>
            <span v-if="top3[0].month_champion_label" class="champ-chip month">🏆 Lună</span>
          </div>
          <span class="podium-meta">{{ getDisplayActivities(top3[0]) }} act.</span>
          <div class="podium-hours badge-gold">
            {{ getDisplayHours(top3[0]).toFixed(1) }}h
          </div>
        </div>

        <!-- 3rd Place -->
        <div
          v-if="top3[2]"
          class="podium-card bronze glass-panel-elevated clickable-card"
          @click="openPublicProfile(top3[2].id)"
        >
          <div class="podium-rank-badge rank-3">3</div>
          <div class="podium-avatar-wrap">
            <img
              v-if="top3[2].avatar_url"
              :src="resolveMediaUrl(top3[2].avatar_url)"
              class="podium-avatar"
              alt="Avatar"
            />
            <div v-else class="podium-avatar placeholder bronze-grad">
              {{ getInitial(top3[2]) }}
            </div>
          </div>
          <h4 class="podium-name">{{ top3[2].display_name }}</h4>
          <div v-if="top3[2].year_champion_label || top3[2].month_champion_label" class="podium-champs">
            <span v-if="top3[2].year_champion_label" class="champ-chip year">👑 An</span>
            <span v-if="top3[2].month_champion_label" class="champ-chip month">🏆 Lună</span>
          </div>
          <span class="podium-meta">{{ getDisplayActivities(top3[2]) }} act.</span>
          <div class="podium-hours badge-bronze">
            {{ getDisplayHours(top3[2]).toFixed(1) }}h
          </div>
        </div>
      </div>

      <!-- LIST (#4+ or Search Results) -->
      <div v-if="displayedList.length > 0" class="others-list">
        <h4 class="others-title">
          {{ isSearching ? `Rezultate căutare (${displayedList.length})` : 'Clasament' }}
        </h4>
        <div
          v-for="user in displayedList"
          :key="user.id"
          class="rank-row glass-panel clickable-card"
          :class="{ 'is-me': currentUser?.id === user.id }"
          @click="openPublicProfile(user.id)"
        >
          <div class="row-rank">#{{ user._rank }}</div>

          <div class="row-user">
            <img
              v-if="user.avatar_url"
              :src="resolveMediaUrl(user.avatar_url)"
              class="row-avatar"
              alt="Avatar"
            />
            <div v-else class="row-avatar-placeholder">
              {{ getInitial(user) }}
            </div>

            <div class="row-details">
              <div class="row-name-line">
                <span class="row-name">{{ user.display_name }}</span>
                <span v-if="user.year_champion_label" class="champ-chip year">👑 Vol. Anului</span>
                <span v-if="user.month_champion_label" class="champ-chip month">🏆 Vol. Lunii</span>
              </div>
              <span class="row-handle">
                {{ getDisplayActivities(user) }} {{ getDisplayActivities(user) === 1 ? 'activitate' : 'activități' }}
                <template v-if="currentUser?.id === user.id"> · Tu</template>
              </span>
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
import { useRouter } from 'vue-router';
import { TrophyIcon, CrownIcon, SearchIcon, XIcon, ChevronRightIcon } from 'lucide-vue-next';
import api from '../services/api';
import {
  ACADEMIC_MONTH_OPTIONS,
  getDefaultAcademicYear,
  buildPeriodQuery,
  resolveMediaUrl,
} from '../utils/periodFilters';

const router = useRouter();
const loading = ref(true);
const leaderboardData = ref([]);
const spotlights = ref(null);
const availableYears = ref([]);
const selectedCategory = ref('general');
const selectedYear = ref(getDefaultAcademicYear());
const selectedMonth = ref('all');
const searchQuery = ref('');

const categories = [
  { id: 'general',     label: 'General',     hoursKey: 'total_hours',       countKey: 'total_activities',  color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'social',      label: 'Social',      hoursKey: 'social_hours',      countKey: 'social_count',      color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'proiect',     label: 'Proiecte',    hoursKey: 'proiect_hours',     countKey: 'proiect_count',     color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'sedinta',     label: 'Ședințe',     hoursKey: 'sedinta_hours',     countKey: 'sedinta_count',     color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'contributie', label: 'Contribuții', hoursKey: 'contributie_hours', countKey: 'contributie_count', color: '#c084fc', bg: 'rgba(142, 68, 173, 0.2)' },
];

const activeCatConfig = computed(
  () => categories.find((c) => c.id === selectedCategory.value) || categories[0]
);

const yearOptions = computed(() => {
  const cur = getDefaultAcademicYear();
  const list = [...availableYears.value];
  if (!list.find((y) => y.startYear === cur)) {
    list.unshift({ startYear: cur, label: `${cur}-${cur + 1}` });
  }
  return list;
});

const currentUser = computed(() => {
  const str = localStorage.getItem('userData');
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
});

const openPublicProfile = (userId) => {
  if (!userId) return;
  router.push({ name: 'public-profile', params: { id: userId } });
};

const getInitial = (u) => ((u?.display_name || u?.first_name || 'V').charAt(0).toUpperCase());

const fetchAvailableYears = async () => {
  try {
    const res = await api.get('/leaderboard/available-years');
    availableYears.value = res.data || [];
  } catch (error) {
    console.error('Eroare preluare ani:', error);
  }
};

const fetchSpotlights = async () => {
  try {
    const yearQuery = selectedYear.value ? `?year=${encodeURIComponent(selectedYear.value)}` : '';
    const res = await api.get(`/leaderboard/spotlights${yearQuery}`);
    spotlights.value = res.data;
  } catch (error) {
    console.error('Eroare preluare spotlights:', error);
  }
};

const fetchLeaderboard = async () => {
  loading.value = true;
  try {
    const query = buildPeriodQuery(selectedYear.value, selectedMonth.value);
    const res = await api.get(`/leaderboard${query}`);
    leaderboardData.value = res.data || [];
  } catch (error) {
    console.error('Eroare preluare clasament:', error);
  } finally {
    loading.value = false;
  }
};

const onYearChange = () => {
  if (selectedYear.value === 'all') {
    selectedMonth.value = 'all';
  }
  fetchSpotlights();
  fetchLeaderboard();
};

const getDisplayHours = (u) => parseFloat(u?.[activeCatConfig.value.hoursKey] || 0);
const getDisplayActivities = (u) => parseInt(u?.[activeCatConfig.value.countKey] || 0, 10) || 0;

const rankedData = computed(() => {
  return [...leaderboardData.value]
    .filter((u) => getDisplayHours(u) > 0)
    .sort((a, b) => {
      const diff = getDisplayHours(b) - getDisplayHours(a);
      if (diff !== 0) return diff;
      return getDisplayActivities(b) - getDisplayActivities(a);
    })
    .map((u, idx) => ({ ...u, _rank: idx + 1 }));
});

const trimmedSearch = computed(() => searchQuery.value.trim().toLowerCase());
const isSearching = computed(() => trimmedSearch.value.length > 0);

const top3 = computed(() => (isSearching.value ? [] : rankedData.value.slice(0, 3)));
const displayedList = computed(() => {
  if (isSearching.value) {
    return rankedData.value.filter((u) =>
      (u.display_name || '').toLowerCase().includes(trimmedSearch.value)
    );
  }
  return rankedData.value.slice(3);
});

const myRankInfo = computed(() => {
  if (!currentUser.value) return null;
  const entry = rankedData.value.find((u) => u.id === currentUser.value.id);
  return entry ? { rank: entry._rank, entry } : null;
});

const isOverallYearView = computed(
  () =>
    !isSearching.value &&
    selectedYear.value !== 'all' &&
    selectedMonth.value === 'all' &&
    selectedCategory.value === 'general'
);

const prevMonthWinner = computed(() =>
  isOverallYearView.value && Number(selectedYear.value) === getDefaultAcademicYear()
    ? spotlights.value?.previousMonth?.winner
    : null
);

const yearWinner = computed(() =>
  isOverallYearView.value ? spotlights.value?.academicYear?.winner : null
);

const showSpotlightBanner = computed(() => Boolean(prevMonthWinner.value || yearWinner.value));

onMounted(async () => {
  await Promise.all([fetchAvailableYears(), fetchSpotlights(), fetchLeaderboard()]);
});
</script>

<style scoped>
.leaderboard-page {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.page-header {
  text-align: center;
}

.page-header h1 {
  font-size: 2.15rem;
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
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.9rem 1.15rem;
  border-radius: 14px;
}

.controls-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.category-tabs {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.cat-tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.42rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.cat-tab:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.period-selectors {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.year-select {
  padding: 0.45rem 0.95rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--color-bg-base);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
}

.search-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 0.88rem;
  outline: none;
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  padding: 0.15rem;
}

/* Spotlights */
.spotlights-stack {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.spotlight-pill {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.1rem;
  border-radius: 14px;
  text-align: left;
  transition: transform 0.15s ease;
}

.spotlight-pill:hover {
  transform: translateY(-1px);
}

.spotlight-month {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.32);
}

.spotlight-year {
  background: rgba(142, 68, 173, 0.14);
  border: 1px solid rgba(142, 68, 173, 0.35);
}

.spotlight-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.spotlight-icon-month { color: #fbbf24; flex-shrink: 0; }
.spotlight-icon-year { color: #c084fc; flex-shrink: 0; }

.spotlight-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.spotlight-copy {
  font-size: 0.88rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.spotlight-label-month { color: #fbbf24; font-weight: 600; }
.spotlight-label-year { color: #c084fc; font-weight: 600; }
.spotlight-winner { color: var(--color-text-primary); font-weight: 800; }
.spotlight-hours-month { color: #f59e0b; font-weight: 700; }
.spotlight-hours-year { color: #a855f7; font-weight: 700; }
.spotlight-chevron { color: var(--color-text-muted); flex-shrink: 0; }

/* My Rank Banner */
.my-rank-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1.35rem;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 14px;
}

.clickable-card {
  cursor: pointer;
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
  font-size: 1.15rem;
  font-weight: 800;
  font-family: var(--font-heading);
}

.my-rank-text h4 {
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.my-rank-text p {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}

.my-rank-hours {
  font-size: 1.1rem;
  font-weight: 800;
  color: #60a5fa;
  font-family: var(--font-heading);
}

/* Loading & Empty */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3.5rem 2rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
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
  gap: 1.15rem;
  margin-bottom: 1.75rem;
  padding-top: 1.5rem;
}

.podium-card {
  flex: 1;
  max-width: 235px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem 1.35rem;
  border-radius: 20px;
  position: relative;
  text-align: center;
  transition: transform 0.2s ease;
}

.podium-card:hover {
  transform: translateY(-4px);
}

.podium-card.gold {
  padding-top: 2.25rem;
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.14);
}

.podium-card.silver { border-color: rgba(148, 163, 184, 0.3); }
.podium-card.bronze { border-color: rgba(205, 127, 50, 0.3); }

.crown-icon {
  position: absolute;
  top: -16px;
  width: 34px;
  height: 34px;
  background: var(--color-bg-elevated);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
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

.podium-avatar-wrap { margin-bottom: 0.75rem; }

.podium-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.gold .podium-avatar {
  width: 76px;
  height: 76px;
  border-color: #fbbf24;
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
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.gold-text {
  font-size: 1.1rem;
  color: #fbbf24;
}

.podium-champs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.champ-chip {
  padding: 0.14rem 0.45rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.champ-chip.month {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.champ-chip.year {
  background: rgba(142, 68, 173, 0.22);
  color: #c084fc;
}

.podium-meta {
  font-size: 0.76rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.65rem;
}

.podium-hours {
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.32rem 0.85rem;
  border-radius: 20px;
  font-family: var(--font-heading);
}

.badge-gold { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4); }
.badge-silver { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
.badge-bronze { background: rgba(205, 127, 50, 0.15); color: #f59e0b; border: 1px solid rgba(205, 127, 50, 0.3); }

/* LIST */
.others-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.others-title {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.2rem;
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 0.95rem 1.2rem;
  border-radius: 12px;
  gap: 1.1rem;
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
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text-muted);
  width: 42px;
  font-family: var(--font-heading);
}

.row-user {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.row-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.row-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-name-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.row-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.row-handle {
  font-size: 0.76rem;
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
  flex-shrink: 0;
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
