<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Se încarcă profilul tău...</p>
    </div>

    <div v-else-if="userProfile" class="profile-container">
      
      <!-- 1. PROFILE HEADER -->
      <div class="profile-header glass-panel-elevated">
        <div class="avatar-wrapper">
          <img 
            v-if="userProfile.avatar_url" 
            :src="resolveMediaUrl(userProfile.avatar_url)" 
            class="avatar-large" 
            alt="Avatar"
          />
          <div v-else class="avatar-large placeholder">
            {{ (userProfile.first_name || 'U').charAt(0) }}
          </div>
          
          <!-- Avatar Upload Overlay / Button -->
          <label class="avatar-upload-btn" title="Schimbă fotografia de profil">
            <CameraIcon :size="16" />
            <input type="file" accept="image/*" class="file-input-hidden" @change="handleAvatarUpload" />
          </label>
        </div>

        <div class="user-meta-header">
          <h2>{{ userProfile.first_name }} {{ userProfile.last_name }}</h2>
          <span class="handle">@{{ userProfile.display_name }}</span>
          
          <div class="badges-row">
            <span :class="['badge-pill', getRoleBadgeClass(userProfile.role)]">
              {{ displayRole(userProfile.role) }}
            </span>
            
            <span :class="['badge-pill', getStudentStatusBadgeClass(verificationInfo.status)]">
              <ShieldCheckIcon v-if="verificationInfo.status === 'verified'" :size="14" />
              <ClockIcon v-else-if="verificationInfo.status === 'pending'" :size="14" />
              <AlertCircleIcon v-else :size="14" />
              {{ displayStudentStatus(verificationInfo.status) }}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <button @click="exportMyData" class="btn-secondary btn-sm" title="Descarcă arhiva cu toate datele tale conform GDPR">
            <DownloadIcon :size="15" />
            <span>Exportă Date (GDPR)</span>
          </button>
        </div>
      </div>

      <!-- 2. STUDENT VERIFICATION CARD -->
      <div class="section-card glass-panel" v-if="userProfile.role === 'user'">
        <div class="section-title-row">
          <div class="title-with-icon">
            <ShieldCheckIcon :size="20" class="text-primary" />
            <h3>Legitimație Student</h3>
          </div>
        </div>

        <!-- Verified state -->
        <div v-if="verificationInfo.status === 'verified'" class="status-box verified">
          <CheckCircle2Icon :size="24" class="text-success" />
          <div>
            <h4>Cont Student Verificat</h4>
            <p>Legitimația ta a fost validată cu succes. Poți acumula ore și debloca toate insignele.</p>
          </div>
        </div>

        <!-- Pending state -->
        <div v-else-if="verificationInfo.status === 'pending'" class="status-box pending">
          <ClockIcon :size="24" class="text-warning" />
          <div>
            <h4>Cerere în Curs de Verificare</h4>
            <p>Ai trimis o fotografie cu legitimația ta. Un administrator o va analiza în cel mai scurt timp.</p>
          </div>
        </div>

        <!-- Rejected state (WITH REVIEWER DETAILS) -->
        <div v-else-if="verificationInfo.status === 'unverified' && verificationInfo.rejection_reason" class="reject-card">
          <div class="reject-header">
            <div class="reject-badge">
              <AlertCircleIcon :size="16" />
              <span>Cerere Respinsă</span>
            </div>
            <span class="reject-date" v-if="verificationInfo.reviewed_at">
              {{ formatDate(verificationInfo.reviewed_at) }}
            </span>
          </div>

          <div class="reject-reason-box">
            <p class="reason-text">"{{ verificationInfo.rejection_reason }}"</p>
          </div>

          <!-- Reviewer Info Bar -->
          <div class="reviewer-bar" v-if="verificationInfo.rejected_by">
            <div class="reviewer-avatar">
              <img 
                v-if="verificationInfo.reviewer_avatar_url" 
                :src="resolveMediaUrl(verificationInfo.reviewer_avatar_url)" 
                alt="Reviewer" 
              />
              <div v-else class="rev-placeholder">{{ verificationInfo.rejected_by.charAt(0) }}</div>
            </div>
            <span class="reviewer-text">
              Verificat de <strong>@{{ verificationInfo.rejected_by }}</strong>
            </span>
          </div>

          <!-- Re-submit section -->
          <div class="resubmit-box">
            <h4>Re-trimite legitimația corectată</h4>
            <p class="desc">Asigură-te că numărul matricol și viza pe anul universitar curent sunt vizibile clar.</p>
            <div class="upload-dropzone">
              <input type="file" accept="image/*" @change="onStudentIdFileSelected" id="resubmit-file" class="file-input-hidden" />
              <label for="resubmit-file" class="btn-secondary btn-sm dropzone-label">
                <UploadIcon :size="16" />
                <span>{{ studentIdFile ? studentIdFile.name : 'Selectează o nouă fotografie' }}</span>
              </label>
              <button 
                v-if="studentIdFile" 
                @click="submitVerification" 
                class="btn-primary btn-sm"
                :disabled="submittingVerif"
              >
                {{ submittingVerif ? 'Se trimite...' : 'Trimite spre verificare' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Unverified state (first submission) -->
        <div v-else class="unverified-box">
          <p class="desc">
            Încarcă o fotografie clară cu legitimația ta de student pentru a participa la activitățile OSACE.
          </p>
          <div class="upload-dropzone">
            <input type="file" accept="image/*" @change="onStudentIdFileSelected" id="first-verif-file" class="file-input-hidden" />
            <label for="first-verif-file" class="btn-secondary dropzone-label">
              <UploadIcon :size="16" />
              <span>{{ studentIdFile ? studentIdFile.name : 'Alege fotografia legitimației' }}</span>
            </label>
            <button 
              v-if="studentIdFile" 
              @click="submitVerification" 
              class="btn-primary"
              :disabled="submittingVerif"
            >
              {{ submittingVerif ? 'Se trimite...' : 'Trimite Legitimația' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 3. STATS & PERIOD FILTER -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <TrophyIcon :size="20" class="text-secondary" />
            <h3>Statistici Voluntariat</h3>
          </div>
          
          <!-- Year + Month Selectors -->
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
              @change="onPeriodChange"
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
            <span class="stat-value">{{ displayTotalHours.toFixed(1) }}</span>
            <span class="stat-label">Ore de Voluntariat</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ profileSummary?.rank ? `#${profileSummary.rank}` : '—' }}</span>
            <span class="stat-label">Loc Clasament</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ profileSummary?.events_count ?? pastEvents.length }}</span>
            <span class="stat-label">Activități Participat</span>
          </div>
          <div class="stat-card glass-panel">
            <span class="stat-value">{{ myBadges.length }} / {{ totalVisibleBadges }}</span>
            <span class="stat-label">Insigne Deblocate</span>
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

      <!-- 4. BADGES CATALOG SECTION -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <AwardIcon :size="20" class="text-primary" />
            <h3>Catalog Realizări & Insigne</h3>
          </div>
          
          <div class="badge-filter-toggle">
            <button 
              :class="['filter-btn', { active: badgeFilter === 'all' }]"
              @click="badgeFilter = 'all'"
            >
              Toate ({{ totalVisibleBadges }})
            </button>
            <button 
              :class="['filter-btn', { active: badgeFilter === 'earned' }]"
              @click="badgeFilter = 'earned'"
            >
              Deblocate ({{ earnedVisibleCount }})
            </button>
            <button 
              :class="['filter-btn', { active: badgeFilter === 'in_progress' }]"
              @click="badgeFilter = 'in_progress'"
            >
              În progres ({{ inProgressCount }})
            </button>
          </div>
        </div>

        <div v-if="filteredBadges.length === 0" class="empty-state">
          Nicio insignă în această categorie.
        </div>

        <div v-else class="badges-grid">
          <div 
            v-for="b in filteredBadges" 
            :key="b.id" 
            class="badge-card glass-panel"
            :class="{ 'earned': b.isEarned, 'locked': !b.isEarned }"
            @click="openBadgeDetail(b)"
          >
            <div class="badge-icon-box">
              <component :is="getBadgeIcon(b.icon_name || b.icon)" :size="28" />
              <LockIcon v-if="!b.isEarned" :size="14" class="badge-lock-tag" />
            </div>
            <h4 class="badge-name">{{ b.name }}</h4>
            <p class="badge-desc">{{ b.description }}</p>

            <template v-if="b.isEarned">
              <span class="badge-earned-tag">Deblocat ✅</span>
              <span v-if="b.period_label" class="badge-period-pill">{{ b.period_label }}</span>
            </template>

            <div v-else-if="(b.progress_target || 0) > 0" class="badge-progress-wrap">
              <div class="badge-progress-track">
                <div class="badge-progress-fill" :style="{ width: `${b.progress_pct || 0}%` }"></div>
              </div>
              <span class="badge-progress-label">
                {{ b.progress_current }}/{{ b.progress_target }} ({{ b.progress_pct || 0 }}%)
              </span>
            </div>

            <span v-else class="badge-locked-tag">Blocat 🔒</span>
          </div>
        </div>
      </div>

      <!-- 5. SPECIAL CONTRIBUTIONS -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <StarIcon :size="20" class="text-secondary" />
            <h3>Contribuții Speciale</h3>
          </div>
        </div>

        <div v-if="contributions.length === 0" class="empty-state">
          Nu ai nicio contribuție specială înregistrată pentru perioada selectată.
        </div>
        <div v-else class="contributions-list">
          <div v-for="cont in contributions" :key="cont.id" class="contribution-item glass-panel">
            <div class="cont-top">
              <h4>{{ cont.title }}</h4>
              <span class="hours-tag">+{{ cont.awarded_hours }}h</span>
            </div>
            <p class="cont-desc">{{ cont.description }}</p>
            <span class="cont-date">{{ formatDate(cont.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 6. PAST EVENTS HISTORY -->
      <div class="section-card glass-panel">
        <div class="section-title-row">
          <div class="title-with-icon">
            <CalendarIcon :size="20" class="text-primary" />
            <h3>Istoric Activități</h3>
          </div>
        </div>

        <div v-if="pastEvents.length === 0" class="empty-state">
          Nu ai participat la activități în această perioadă.
        </div>
        <div v-else class="events-history-list">
          <div v-for="ev in pastEvents" :key="ev.id" class="history-item glass-panel">
            <div class="hist-info">
              <h4>{{ ev.title }}</h4>
              <span class="hist-meta">{{ formatDate(ev.start_time) }} · 📍 {{ ev.location }}</span>
            </div>
            <div class="hist-hours">
              <span class="hours-val">+{{ ev.awarded_hours || ev.duration_hours }}h</span>
              <span class="hist-status" :class="ev.confirmation_status">{{ formatAttendanceStatus(ev.confirmation_status) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Badge Detail Modal -->
    <div v-if="selectedBadgeModal" class="modal-overlay" @click="selectedBadgeModal = null">
      <div class="modal-card glass-panel-elevated" @click.stop>
        <div class="modal-badge-header">
          <div class="modal-badge-icon" :class="{ 'earned': selectedBadgeModal.isEarned }">
            <component :is="getBadgeIcon(selectedBadgeModal.icon_name || selectedBadgeModal.icon)" :size="48" />
          </div>
          <h3>{{ selectedBadgeModal.name }}</h3>
          <span :class="['badge-pill', selectedBadgeModal.isEarned ? 'badge-green' : 'badge-yellow']">
            {{ selectedBadgeModal.isEarned ? 'Insignă Obținută' : 'Încă nedeblocat' }}
          </span>
        </div>

        <div class="modal-badge-body">
          <p class="desc">{{ selectedBadgeModal.description }}</p>

          <div v-if="selectedBadgeModal.isEarned && selectedBadgeModal.period_label" class="period-modal-pill">
            Perioada câștigată: <strong>{{ selectedBadgeModal.period_label }}</strong>
          </div>

          <div v-if="!selectedBadgeModal.isEarned && (selectedBadgeModal.progress_target || 0) > 0" class="modal-progress-box">
            <div class="modal-progress-header">
              <span>Progres realizare</span>
              <strong>
                {{ selectedBadgeModal.progress_current }} / {{ selectedBadgeModal.progress_target }} ({{ selectedBadgeModal.progress_pct || 0 }}%)
              </strong>
            </div>
            <div class="modal-progress-track">
              <div class="badge-progress-fill" :style="{ width: `${selectedBadgeModal.progress_pct || 0}%` }"></div>
            </div>
          </div>

          <div class="criteria-box" v-if="selectedBadgeModal.rule_type">
            <span class="criteria-title">Condiție de deblocare:</span>
            <span class="criteria-val">{{ formatRuleType(selectedBadgeModal.rule_type, selectedBadgeModal.rule_value || selectedBadgeModal.threshold) }}</span>
          </div>
        </div>

        <button @click="selectedBadgeModal = null" class="btn-secondary" style="width: 100%; margin-top: 1.5rem;">
          Închide
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  CameraIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  DownloadIcon, 
  CheckCircle2Icon, 
  UploadIcon, 
  TrophyIcon, 
  AwardIcon, 
  LockIcon, 
  StarIcon, 
  CalendarIcon,
  FlameIcon,
  HeartIcon,
  SparklesIcon,
  MedalIcon
} from 'lucide-vue-next';
import api from '../services/api';
import {
  ACADEMIC_MONTH_OPTIONS,
  CATEGORY_SEGMENTS,
  getDefaultAcademicYear,
  buildPeriodQuery,
  resolveMediaUrl as resolveMediaUrlShared,
  resolveRankFallback,
} from '../utils/periodFilters';

const loading = ref(true);
const userProfile = ref(null);
const profileSummary = ref(null);
const verificationInfo = ref({ status: 'verified' });
const allBadges = ref([]);
const myBadges = ref([]);
const pastEvents = ref([]);
const contributions = ref([]);
const availableYears = ref([]);
const selectedYear = ref(getDefaultAcademicYear());
const selectedMonth = ref('all');
const badgeFilter = ref('all');

const studentIdFile = ref(null);
const submittingVerif = ref(false);
const selectedBadgeModal = ref(null);

const isSecretBadge = (badge) =>
  badge.rule_type === 'easter_egg' ||
  badge.key === 'FOUND_EASTER_EGG' ||
  badge.key?.startsWith('SECRET_') ||
  badge.key?.startsWith('EASTER_EGG_');

const yearOptions = computed(() => {
  const cur = getDefaultAcademicYear();
  const list = [...availableYears.value];
  if (!list.find((y) => y.startYear === cur)) {
    list.unshift({ startYear: cur, label: `${cur}-${cur + 1}` });
  }
  return list;
});

// ── Fetch Profile & Core Data ────────────────────────
const fetchProfileData = async () => {
  loading.value = true;
  try {
    const userStr = localStorage.getItem('userData');
    if (!userStr) return;
    const { id } = JSON.parse(userStr);

    const [meRes, verifRes, yearsRes] = await Promise.all([
      api.get(`/profile/${id}`),
      api.get('/verification/my-status'),
      api.get('/profile/my-available-years'),
    ]);

    userProfile.value = meRes.data;
    verificationInfo.value = verifRes.data;
    availableYears.value = yearsRes.data || [];

    // Apel secvențial: /badges auto-deblochează badge-urile ajunse la 100%, apoi /my-badges le citește
    const allBadgesRes = await api.get('/badges');
    const myBadgesRes = await api.get('/profile/my-badges');
    allBadges.value = allBadgesRes.data || [];
    myBadges.value = myBadgesRes.data || [];

    await fetchPeriodData();
  } catch (error) {
    console.error("Eroare la preluarea profilului:", error);
  } finally {
    loading.value = false;
  }
};

const fetchPeriodData = async () => {
  if (!userProfile.value) return;
  const query = buildPeriodQuery(selectedYear.value, selectedMonth.value);
  try {
    const [summaryRes, eventsRes, contribRes] = await Promise.all([
      api.get(`/profile/me${query}`),
      api.get(`/profile/my-past-events${query}`),
      api.get(`/profile/${userProfile.value.id}/contributions${query}`)
    ]);
    const summary = { ...(summaryRes.data || {}) };
    if (summary.rank === undefined) {
      summary.rank = await resolveRankFallback(api, userProfile.value.id, selectedYear.value, selectedMonth.value);
    }
    profileSummary.value = summary;
    pastEvents.value = eventsRes.data || [];
    contributions.value = contribRes.data || [];
  } catch (err) {
    console.error("Eroare incarcare istoric/contributii:", err);
  }
};

const onPeriodChange = () => {
  fetchPeriodData();
};

const onYearChange = () => {
  if (selectedYear.value === 'all') {
    selectedMonth.value = 'all';
  }
  fetchPeriodData();
};

// ── Calculated Hours & Category Breakdown ────────────
const calculatedHours = computed(() => {
  const evH = pastEvents.value.reduce((sum, e) => {
    if (e.confirmation_status === 'attended' || !e.confirmation_status) {
      return sum + (parseFloat(e.awarded_hours ?? e.duration_hours) || 0);
    }
    return sum;
  }, 0);

  const ctH = contributions.value.reduce((sum, c) => {
    return sum + (parseFloat(c.awarded_hours) || 0);
  }, 0);

  return evH + ctH;
});

const displayTotalHours = computed(() =>
  profileSummary.value?.total_hours != null
    ? parseFloat(profileSummary.value.total_hours) || 0
    : calculatedHours.value
);

const categorySegments = computed(() => {
  const map = profileSummary.value?.hours_by_category;
  if (!map) return [];
  return CATEGORY_SEGMENTS
    .map((seg) => ({ ...seg, hours: parseFloat(map[seg.key]) || 0 }))
    .filter((seg) => seg.hours > 0);
});

// ── Badges List with Earned State, Progress & Sorting ──
const processedBadges = computed(() => {
  const earnedMap = new Map(myBadges.value.map((b) => [b.id || b.badge_id, b]));
  return allBadges.value
    .map((b) => {
      const earned = earnedMap.get(b.id);
      return {
        ...b,
        isEarned: Boolean(earned),
        period_label: earned?.period_label || null,
      };
    })
    .filter((b) => !(isSecretBadge(b) && !b.isEarned))
    .sort((a, b) => {
      if (a.isEarned !== b.isEarned) return a.isEarned ? -1 : 1;
      if (!a.isEarned && !b.isEarned) {
        const pctDiff = (b.progress_pct || 0) - (a.progress_pct || 0);
        if (pctDiff !== 0) return pctDiff;
      }
      return (a.name || '').localeCompare(b.name || '', 'ro');
    });
});

const totalVisibleBadges = computed(() => processedBadges.value.length);
const earnedVisibleCount = computed(() => processedBadges.value.filter((b) => b.isEarned).length);
const inProgressCount = computed(
  () => processedBadges.value.filter((b) => !b.isEarned && (b.progress_target || 0) > 0).length
);

const filteredBadges = computed(() => {
  if (badgeFilter.value === 'earned') {
    return processedBadges.value.filter((b) => b.isEarned);
  }
  if (badgeFilter.value === 'in_progress') {
    return processedBadges.value.filter((b) => !b.isEarned && (b.progress_target || 0) > 0);
  }
  return processedBadges.value;
});

const openBadgeDetail = (badge) => {
  selectedBadgeModal.value = badge;
};

// ── Avatar Upload ────────────────────────────────────
const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data?.avatar_url) {
      userProfile.value.avatar_url = res.data.avatar_url;
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('userData') || '{}');
      stored.avatar_url = res.data.avatar_url;
      localStorage.setItem('userData', JSON.stringify(stored));
      alert('Avatar actualizat cu succes!');
    }
  } catch (err) {
    alert('Eroare la încărcarea fotografiei de profil.');
  }
};

// ── Student Verification Submission ─────────────────
const onStudentIdFileSelected = (e) => {
  studentIdFile.value = e.target.files?.[0] || null;
};

const submitVerification = async () => {
  if (!studentIdFile.value) return;
  submittingVerif.value = true;

  const formData = new FormData();
  formData.append('student_id_image', studentIdFile.value);

  try {
    await api.post('/verification/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    alert('Legitimație trimisă cu succes! Va fi analizată în curând.');
    studentIdFile.value = null;
    // Refresh verification status
    const verifRes = await api.get('/verification/my-status');
    verificationInfo.value = verifRes.data;
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la trimiterea legitimației.');
  } finally {
    submittingVerif.value = false;
  }
};

// ── GDPR Export ──────────────────────────────────────
const exportMyData = async () => {
  try {
    const res = await api.get('/profile/my-data');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `osace_gdpr_export_${userProfile.value.display_name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    alert('Nu s-a putut genera exportul de date.');
  }
};

// ── Helpers ──────────────────────────────────────────
const resolveMediaUrl = (url) => resolveMediaUrlShared(url);

const displayRole = (role) => {
  const map = { admin: 'Administrator', coordonator: 'Coordonator', user: 'Voluntar', voluntar: 'Voluntar' };
  return map[role] || 'Voluntar';
};

const getRoleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-red';
  if (role === 'coordonator') return 'badge-yellow';
  return 'badge-blue';
};

const displayStudentStatus = (status) => {
  if (status === 'verified') return 'Student Verificat';
  if (status === 'pending') return 'Verificare în Așteptare';
  return 'Neverificat';
};

const getStudentStatusBadgeClass = (status) => {
  if (status === 'verified') return 'badge-green';
  if (status === 'pending') return 'badge-yellow';
  return 'badge-red';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace ? dateStr.replace(' ', 'T') : dateStr);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAttendanceStatus = (status) => {
  if (status === 'attended') return 'Prezent';
  if (status === 'absent') return 'Absent';
  return 'Înregistrat';
};

const formatRuleType = (rule, ruleVal) => {
  if ((rule === 'total_hours' || rule === 'hours') && ruleVal) return `Acumulează cel puțin ${ruleVal} ore de voluntariat.`;
  if ((rule === 'total_events' || rule === 'events_attended') && ruleVal) return `Participă la cel puțin ${ruleVal} activități.`;
  if (rule === 'monthly_events' && ruleVal) return `Participă la ${ruleVal} activități într-o singură lună.`;
  if (rule === 'weekly_hours' && ruleVal) return `Acumulează ${ruleVal} ore într-o săptămână.`;
  if (rule === 'perfect_streak' && ruleVal) return `Participă la ${ruleVal} activități consecutive.`;
  if (rule === 'evening_events' && ruleVal) return `Participă la ${ruleVal} activități de seară.`;
  if (rule === 'diversified') return 'Participă la toate cele 3 categorii de activități.';
  if (rule === 'social_hours' && ruleVal) return `Acumulează ${ruleVal} ore în categoria Social.`;
  if (rule === 'first_event') return 'Participă la prima ta activitate OSACE.';
  return 'Condiție specială de participare.';
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

onMounted(() => {
  fetchProfileData();
});
</script>

<style scoped>
.profile-page {
  max-width: 820px;
  margin: 0 auto;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  padding: 2rem;
  border-radius: 20px;
  flex-wrap: wrap;
}

.avatar-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
}

.avatar-large {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.avatar-large.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #1d4ed8);
}

.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--color-primary);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
}

.file-input-hidden {
  display: none;
}

.user-meta-header {
  flex: 1;
}

.user-meta-header h2 {
  font-size: 1.6rem;
  margin-bottom: 0.15rem;
}

.handle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 0.65rem;
}

.badges-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Section Card */
.section-card {
  padding: 1.75rem;
  border-radius: 18px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.title-with-icon h3 {
  font-size: 1.2rem;
  margin: 0;
}

/* Verification Card */
.status-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
}

.status-box.verified {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.status-box.pending {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.status-box h4 {
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.status-box p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* Rejection Card */
.reject-card {
  padding: 1.25rem;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reject-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #f87171;
  font-weight: 700;
  font-size: 0.85rem;
}

.reject-date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.reject-reason-box {
  background: rgba(15, 23, 42, 0.6);
  padding: 1rem;
  border-radius: 10px;
  border-left: 3px solid #ef4444;
}

.reason-text {
  font-style: italic;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.reviewer-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.reviewer-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
}

.reviewer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rev-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.resubmit-box h4 {
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.resubmit-box .desc, .unverified-box .desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.upload-dropzone {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.dropzone-label {
  cursor: pointer;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.period-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.year-select {
  padding: 0.45rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
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

/* Badges Grid */
.badge-filter-toggle {
  display: flex;
  gap: 0.4rem;
}

.filter-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-primary);
  border-color: rgba(59, 130, 246, 0.3);
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1rem;
}

.badge-card {
  padding: 1.25rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s;
}

.badge-card:hover {
  transform: translateY(-3px);
}

.badge-card.earned {
  border-color: rgba(59, 130, 246, 0.4);
}

.badge-card.locked {
  opacity: 0.6;
}

.badge-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  position: relative;
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.earned .badge-icon-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
  color: #60a5fa;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.badge-lock-tag {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #334155;
  color: #94a3b8;
  padding: 2px;
  border-radius: 50%;
}

.badge-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--color-text-primary);
}

.badge-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.3;
  margin-bottom: 0.6rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge-earned-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-success);
}

.badge-period-pill {
  margin-top: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.badge-progress-wrap {
  width: 100%;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
}

.badge-progress-track,
.modal-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.modal-progress-track {
  height: 8px;
}

.badge-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
}

.badge-progress-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.badge-locked-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-muted);
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

.modal-progress-box {
  background: rgba(15, 23, 42, 0.5);
  padding: 0.85rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.modal-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.45rem;
}

.modal-progress-header strong {
  color: #60a5fa;
}

/* Contributions List */
.contributions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contribution-item {
  padding: 1.25rem;
  border-left: 4px solid var(--color-secondary);
}

.cont-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.cont-top h4 {
  font-size: 1rem;
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
  line-height: 1.4;
  margin-bottom: 0.35rem;
}

.cont-date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* History */
.events-history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 12px;
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
  font-family: var(--font-heading);
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

.hist-status.registered {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

/* Modal */
.modal-badge-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.modal-badge-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.modal-badge-icon.earned {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.4));
  color: #60a5fa;
  box-shadow: var(--shadow-glow);
}

.modal-badge-header h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.modal-badge-body {
  text-align: center;
}

.modal-badge-body .desc {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.criteria-box {
  background: rgba(15, 23, 42, 0.5);
  padding: 0.85rem 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.criteria-title {
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.criteria-val {
  color: var(--color-text-primary);
  font-weight: 600;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
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
