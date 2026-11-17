<template>
  <div class="profile-page">
    <div class="top-nav-row">
      <button type="button" class="btn-secondary btn-sm" @click="goBack">
        <ArrowLeftIcon :size="15" />
        <span>Înapoi</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Se încarcă profilul voluntarului...</p>
    </div>

    <div v-else-if="errorMsg" class="empty-state glass-panel">
      <h3>{{ errorMsg }}</h3>
      <button type="button" class="btn-primary btn-sm" @click="goBack" style="margin-top: 1rem;">
        Înapoi
      </button>
    </div>

    <div v-else-if="profile" class="profile-container">
      <!-- 1. PROFILE HEADER -->
      <div class="profile-header glass-panel-elevated">
        <div class="avatar-wrapper">
          <img
            v-if="profile.avatar_url"
            :src="resolveMediaUrl(profile.avatar_url)"
            class="avatar-large"
            alt="Avatar"
          />
          <div v-else class="avatar-large placeholder">
            {{ (profile.display_name || profile.first_name || 'V').charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="user-meta-header">
          <h2>{{ profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() }}</h2>
          <span class="handle" v-if="profile.first_name || profile.last_name">
            {{ profile.first_name }} {{ profile.last_name }} · @{{ profile.display_name }}
          </span>
          <div class="badges-row">
            <span :class="['badge-pill', getRoleBadgeClass(profile.role)]">
              {{ displayRole(profile.role) }}
            </span>
            <span v-if="profile.created_at" class="badge-pill badge-blue">
              Membru din {{ formatDateRo(profile.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. STATS & PERIOD FILTERS -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <TrophyIcon :size="20" class="text-secondary" />
            <h3>Statistici Voluntariat</h3>
          </div>

          <div class="period-filters">
            <select v-model="selectedYear" @change="onYearChange" class="year-select">
              <option v-for="y in yearOptions" :key="y.startYear" :value="y.startYear">
                Anul {{ y.label }}
              </option>
              <option value="all">Din Toate Timpurile</option>
            </select>

            <select
              v-if="selectedYear !== 'all'"
              v-model="selectedMonth"
              @change="loadPeriodData"
              class="year-select"
            >
              <option v-for="m in ACADEMIC_MONTH_OPTIONS" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ totalHours.toFixed(1) }}</span>
            <span class="stat-label">Ore Acumulate</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ profile.rank ? `#${profile.rank}` : '—' }}</span>
            <span class="stat-label">Loc Clasament</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ profile.events_count ?? pastEvents.length }}</span>
            <span class="stat-label">Activități</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ badges.length }}</span>
            <span class="stat-label">Realizări Deblocate</span>
          </div>
        </div>

        <!-- Category Distribution Bar -->
        <div v-if="categorySegments.length > 0" class="breakdown-box">
          <div class="bar-track">
            <div
              v-for="seg in categorySegments"
              :key="seg.key"
              class="bar-segment"
              :style="{ flex: seg.hours, backgroundColor: seg.color }"
              :title="`${seg.label}: ${seg.hours.toFixed(1)}h`"
            />
          </div>
          <div class="legend-row">
            <div v-for="seg in categorySegments" :key="seg.key" class="legend-item">
              <span class="legend-dot" :style="{ backgroundColor: seg.color }"></span>
              <span class="legend-text">
                {{ seg.label }}: <strong>{{ seg.hours.toFixed(1) }}h</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. BADGES -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <AwardIcon :size="20" class="text-primary" />
            <h3>Realizări ({{ badges.length }})</h3>
          </div>
        </div>

        <div v-if="badges.length === 0" class="empty-state">
          Acest voluntar nu a deblocat încă realizări.
        </div>
        <div v-else class="badges-grid">
          <div
            v-for="b in badges"
            :key="b.id"
            class="badge-card glass-panel earned"
            @click="selectedBadgeModal = b"
          >
            <div class="badge-icon-box">
              <component :is="getBadgeIcon(b.icon_name || b.icon)" :size="28" />
            </div>
            <h4 class="badge-name">{{ b.name }}</h4>
            <p class="badge-desc">{{ b.description }}</p>
            <span v-if="b.period_label" class="badge-period-pill">{{ b.period_label }}</span>
            <span v-else class="badge-earned-tag">Deblocat</span>
          </div>
        </div>
      </div>

      <!-- 4. SPECIAL CONTRIBUTIONS -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <StarIcon :size="20" class="text-secondary" />
            <h3>Contribuții Speciale ({{ contributions.length }})</h3>
          </div>
        </div>

        <div v-if="contributions.length === 0" class="empty-state">
          Nicio contribuție specială în perioada selectată.
        </div>
        <div v-else class="contributions-list">
          <div v-for="cont in contributions" :key="cont.id" class="contribution-item glass-panel">
            <div class="cont-top">
              <h4>{{ cont.title }}</h4>
              <span class="hours-tag">+{{ cont.awarded_hours }}h</span>
            </div>
            <p class="cont-desc">{{ cont.description }}</p>
            <span class="cont-date">{{ formatDateRo(cont.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 5. PAST EVENTS HISTORY -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <CalendarIcon :size="20" class="text-primary" />
            <h3>Istoric Activități ({{ pastEvents.length }})</h3>
          </div>
        </div>

        <div v-if="pastEvents.length === 0" class="empty-state">
          Nicio activitate finalizată în perioada selectată.
        </div>
        <div v-else class="events-history-list">
          <div v-for="ev in pastEvents" :key="ev.id" class="history-item glass-panel">
            <div class="hist-info">
              <h4>{{ ev.title }}</h4>
              <span class="hist-meta">{{ formatDateRo(ev.start_time) }} · {{ ev.location || 'Sediul OSACE' }}</span>
            </div>
            <div class="hist-hours">
              <span class="hours-val">+{{ ev.awarded_hours ?? ev.duration_hours }}h</span>
              <span class="hist-status" :class="ev.confirmation_status">
                {{ ev.confirmation_status === 'attended' ? 'Prezent' : 'Check-in' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Badge Detail Modal -->
    <div v-if="selectedBadgeModal" class="modal-overlay" @click="selectedBadgeModal = null">
      <div class="modal-card glass-panel-elevated" @click.stop>
        <div class="modal-badge-header">
          <div class="modal-badge-icon earned">
            <component :is="getBadgeIcon(selectedBadgeModal.icon_name || selectedBadgeModal.icon)" :size="48" />
          </div>
          <h3>{{ selectedBadgeModal.name }}</h3>
          <span class="badge-pill badge-green">Insignă Obținută</span>
        </div>

        <div class="modal-badge-body">
          <p class="desc">{{ selectedBadgeModal.description }}</p>
          <div v-if="selectedBadgeModal.period_label" class="period-modal-pill">
            Perioada câștigată: <strong>{{ selectedBadgeModal.period_label }}</strong>
          </div>
          <div v-if="selectedBadgeModal.earned_at" class="criteria-box">
            <span class="criteria-title">Obținut la</span>
            <span class="criteria-val">{{ formatDateRo(selectedBadgeModal.earned_at) }}</span>
          </div>
        </div>

        <button type="button" @click="selectedBadgeModal = null" class="btn-secondary" style="width: 100%; margin-top: 1.5rem;">
          Închide
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  TrophyIcon,
  AwardIcon,
  StarIcon,
  CalendarIcon,
  FlameIcon,
  HeartIcon,
  SparklesIcon,
  MedalIcon,
} from 'lucide-vue-next';
import api from '../services/api';
import {
  ACADEMIC_MONTH_OPTIONS,
  CATEGORY_SEGMENTS,
  getDefaultAcademicYear,
  buildPeriodQuery,
  resolveMediaUrl,
  displayRole,
  formatDateRo,
} from '../utils/periodFilters';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const errorMsg = ref('');
const profile = ref(null);
const badges = ref([]);
const contributions = ref([]);
const pastEvents = ref([]);
const availableYears = ref([]);
const selectedYear = ref(getDefaultAcademicYear());
const selectedMonth = ref('all');
const selectedBadgeModal = ref(null);

const userId = computed(() => route.params.id);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'leaderboard' });
  }
};

const yearOptions = computed(() => {
  const cur = getDefaultAcademicYear();
  const list = [...availableYears.value];
  if (!list.find((y) => y.startYear === cur)) {
    list.unshift({ startYear: cur, label: `${cur}-${cur + 1}` });
  }
  return list;
});

const totalHours = computed(() => parseFloat(profile.value?.total_hours || 0));

const categorySegments = computed(() => {
  const map = profile.value?.hours_by_category;
  if (!map) return [];
  return CATEGORY_SEGMENTS
    .map((seg) => ({ ...seg, hours: parseFloat(map[seg.key]) || 0 }))
    .filter((seg) => seg.hours > 0);
});

const fetchYearsAndBadges = async () => {
  const [yearsRes, badgesRes] = await Promise.all([
    api.get(`/profile/${userId.value}/available-years`),
    api.get(`/profile/${userId.value}/badges`),
  ]);
  availableYears.value = yearsRes.data || [];
  badges.value = badgesRes.data || [];
};

const loadPeriodData = async () => {
  const query = buildPeriodQuery(selectedYear.value, selectedMonth.value);
  const [profRes, contribRes, eventsRes] = await Promise.all([
    api.get(`/profile/${userId.value}${query}`),
    api.get(`/profile/${userId.value}/contributions${query}`),
    api.get(`/profile/${userId.value}/past-events${query}`),
  ]);
  profile.value = profRes.data;
  contributions.value = contribRes.data || [];
  pastEvents.value = eventsRes.data || [];
};

const loadAll = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    await Promise.all([fetchYearsAndBadges(), loadPeriodData()]);
  } catch (err) {
    console.error('Eroare la încărcarea profilului public:', err);
    errorMsg.value = err.response?.data?.error || 'Nu s-a putut încărca profilul acestui voluntar.';
  } finally {
    loading.value = false;
  }
};

const onYearChange = () => {
  if (selectedYear.value === 'all') {
    selectedMonth.value = 'all';
  }
  loadPeriodData();
};

const getRoleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-red';
  if (role === 'coordonator') return 'badge-yellow';
  return 'badge-blue';
};

const getBadgeIcon = (iconName) => {
  const lower = (iconName || '').toLowerCase();
  if (lower.includes('flame') || lower.includes('foc')) return FlameIcon;
  if (lower.includes('heart') || lower.includes('inima')) return HeartIcon;
  if (lower.includes('star') || lower.includes('stea')) return StarIcon;
  if (lower.includes('sparkle')) return SparklesIcon;
  if (lower.includes('medal')) return MedalIcon;
  if (lower.includes('trophy')) return TrophyIcon;
  return AwardIcon;
};

onMounted(loadAll);
watch(userId, () => {
  selectedYear.value = getDefaultAcademicYear();
  selectedMonth.value = 'all';
  loadAll();
});
</script>

<style scoped>
.profile-page {
  max-width: 820px;
  margin: 0 auto;
}

.top-nav-row {
  margin-bottom: 1rem;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem;
  border-radius: 20px;
  flex-wrap: wrap;
}

.avatar-wrapper {
  width: 86px;
  height: 86px;
  flex-shrink: 0;
}

.avatar-large {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.avatar-large.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #1d4ed8);
}

.user-meta-header {
  flex: 1;
}

.user-meta-header h2 {
  font-size: 1.55rem;
  margin-bottom: 0.2rem;
}

.handle {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 0.65rem;
}

.badges-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.section-card {
  padding: 1.5rem;
  border-radius: 18px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.title-with-icon h3 {
  font-size: 1.15rem;
  margin: 0;
}

.period-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.year-select {
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.85rem;
}

.stat-card {
  padding: 1.15rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.breakdown-box {
  margin-top: 1.15rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.bar-track {
  display: flex;
  height: 10px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  gap: 2px;
}

.bar-segment {
  height: 100%;
  min-width: 6px;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.25rem;
  margin-top: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.legend-text strong {
  color: var(--color-text-primary);
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 1rem;
}

.badge-card {
  padding: 1.15rem 0.9rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-color: rgba(59, 130, 246, 0.38);
  transition: transform 0.2s ease;
}

.badge-card:hover {
  transform: translateY(-3px);
}

.badge-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
  color: #60a5fa;
}

.badge-name {
  font-size: 0.92rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.badge-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.3;
  margin-bottom: 0.55rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge-earned-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-success);
}

.badge-period-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.contributions-list,
.events-history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contribution-item {
  padding: 1.15rem;
  border-left: 4px solid #8e44ad;
}

.cont-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.cont-top h4 {
  font-size: 0.98rem;
  margin: 0;
}

.hours-tag {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
}

.cont-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.3rem;
}

.cont-date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.95rem 1.15rem;
}

.hist-info h4 {
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.hist-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.hist-hours {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.hours-val {
  font-weight: 800;
  color: var(--color-primary);
}

.hist-status {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.hist-status.attended {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.hist-status.checked_in {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.modal-badge-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.modal-badge-icon {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.modal-badge-icon.earned {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.4));
  color: #60a5fa;
}

.modal-badge-body {
  text-align: center;
}

.modal-badge-body .desc {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.period-modal-pill {
  display: inline-block;
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.criteria-box {
  background: rgba(15, 23, 42, 0.5);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.criteria-title {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.criteria-val {
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.88rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
