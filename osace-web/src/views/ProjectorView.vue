<template>
  <div class="projector-page" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- Notification Toast (Replaces blocking alerts) -->
    <transition name="slide-fade">
      <div v-if="toastMessage" class="toast-notification" :class="`toast-${toastType}`">
        <CheckCircle2 v-if="toastType === 'success'" :size="18" />
        <AlertTriangle v-else :size="18" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Header -->
    <header class="projector-header glass-panel">
      <div class="header-left">
        <div class="brand-badge">
          <div class="brand-icon">
            <img src="/favicon.ico" alt="OSACE" class="brand-logo-img" />
          </div>
          <div class="brand-info">
            <span class="brand-title">O.S.A.C.E.</span>
            <span class="brand-subtitle">Sistem Prezențe</span>
          </div>
        </div>

        <div class="event-meta" v-if="event">
          <div class="meta-top">
            <span class="badge-pill" :class="getCategoryClass(event.category)">
              {{ formatCategory(event.category) }}
            </span>
            <h1 class="event-title">{{ event.title }}</h1>
          </div>
          <div class="meta-details">
            <span class="meta-item">
              <MapPin :size="14" class="text-primary" />
              <span>{{ event.location || 'Sediul OSACE' }}</span>
            </span>
            <span class="meta-divider">•</span>
            <span class="meta-item">
              <Calendar :size="14" class="text-primary" />
              <span>{{ formatEventTime(event.start_time, event.end_time) }}</span>
            </span>
            <span class="meta-divider">•</span>
            <span class="meta-item">
              <Clock :size="14" class="text-primary" />
              <span>{{ event.duration_hours }} {{ event.duration_hours === 1 ? 'oră' : 'ore' }}</span>
            </span>
          </div>
        </div>

        <!-- Skeleton placeholder if event is still loading -->
        <div class="event-meta-skeleton" v-else>
          <div class="skeleton-pill"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-sub"></div>
        </div>
      </div>

      <div class="header-right">
        <!-- Live Digital Clock -->
        <div class="live-clock-card">
          <div class="clock-badge">
            <span class="pulse-dot green"></span>
            <span class="clock-label">LIVE</span>
          </div>
          <div class="clock-time">{{ currentTime }}</div>
        </div>

        <!-- Fullscreen Toggle -->
        <button 
          class="btn-icon" 
          @click="toggleFullscreen" 
          :title="isFullscreen ? 'Ieși din Ecran Complet' : 'Comută Ecran Complet'"
        >
          <component :is="isFullscreen ? Minimize2 : Maximize2" :size="20" />
        </button>

        <!-- Exit / Admin link -->
        <button class="btn-secondary btn-sm admin-btn" @click="goToAdmin">
          <ArrowLeft :size="16" />
          <span>Panou Admin</span>
        </button>
      </div>
    </header>

    <!-- Main Projection Area -->
    <main class="projector-main">
      <!-- LEFT: QR Code Stage & Instruction Bar -->
      <section class="qr-stage-card glass-panel">
        <div class="qr-hero-container">
          <!-- QR Target Display -->
          <div class="qr-card-wrapper">
            <div v-if="qrLoading && !qrCodeUrl" class="qr-loading-box">
              <div class="spinner"></div>
              <p class="loading-label">Generare cod QR securizat...</p>
            </div>

            <div v-else class="qr-frame-box">
              <div class="qr-bezel">
                <img :src="qrCodeUrl" alt="Cod QR Prezență" class="qr-image" />
              </div>

              <!-- Live TOTP Timer Bar -->
              <div class="totp-timer-container">
                <div class="timer-bar-track">
                  <div 
                    class="timer-bar-progress" 
                    :class="getTimerBarClass"
                    :style="{ width: `${(countdown / 30) * 100}%` }"
                  ></div>
                </div>
                <div class="totp-meta">
                  <div class="totp-status">
                    <ShieldCheck :size="15" class="text-primary" />
                    <span>Cod securizat · Se reînnoiește în <strong>{{ countdown }}s</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clean Single-Line Instruction Banner -->
          <div class="projector-instruction-bar">
            <Smartphone :size="18" class="instruction-icon" />
            <span>Deschide aplicația <strong>OSACE</strong> și apasă pe <strong>Scanează</strong> pentru confirmarea prezenței</span>
          </div>
        </div>
      </section>

      <!-- RIGHT: Live Attendance Sidebar -->
      <aside class="attendance-sidebar glass-panel">
        <div class="sidebar-top">
          <div class="attendance-counter">
            <div class="counter-badge-icon">
              <Users :size="22" />
            </div>
            <div class="counter-text-group">
              <div class="counter-value">
                <span class="number">{{ attendees.length }}</span>
                <span class="live-tag">
                  <span class="pulse-dot green"></span>
                  LIVE
                </span>
              </div>
              <span class="counter-label">Voluntari Prezenți</span>
            </div>
          </div>

          <button class="btn-success btn-validate" @click="showValidationModal = true">
            <CheckCircle :size="16" />
            <span>Validează Orele</span>
          </button>
        </div>

        <!-- Live Attendee Feed with Custom Scrollbar -->
        <div class="attendees-feed custom-scrollbar">
          <transition-group name="list" tag="div" class="attendees-group">
            <div 
              v-for="person in attendees" 
              :key="person.user_id" 
              class="attendee-card"
            >
              <div class="attendee-avatar">
                <img v-if="person.avatar_url" :src="person.avatar_url" :alt="person.display_name" />
                <div v-else class="avatar-fallback">{{ getInitials(person.first_name, person.last_name, person.display_name) }}</div>
              </div>

              <div class="attendee-body">
                <span class="attendee-name">{{ person.first_name ? `${person.first_name} ${person.last_name}` : person.display_name }}</span>
                <span class="attendee-time">
                  <Clock :size="12" />
                  <span>Sosit la {{ formatScanTime(person.check_in_time) }}</span>
                </span>
              </div>

              <div class="attendee-badge-wrap">
                <span 
                  class="status-chip" 
                  :class="getPunctualityClass(person.punctuality_status)"
                >
                  <span class="chip-dot"></span>
                  <span>{{ formatPunctualityLabel(person.punctuality_status, person.minutes_late) }}</span>
                </span>
              </div>
            </div>
          </transition-group>

          <!-- Empty Feed State -->
          <div v-if="attendees.length === 0" class="empty-feed">
            <div class="radar-box">
              <Radio :size="36" class="radar-icon" />
              <div class="radar-wave"></div>
            </div>
            <h4>Se așteaptă primele scanări...</h4>
            <p>Voluntarii care scanează codul vor apărea aici în timp real.</p>
          </div>
        </div>

        <div class="sidebar-bottom">
          <div class="sync-indicator">
            <RefreshCw :size="12" class="sync-spin" />
            <span>Sincronizare automată live (la fiecare 5s)</span>
          </div>
        </div>
      </aside>
    </main>

    <!-- Validation Modal / Drawer -->
    <div v-if="showValidationModal" class="modal-overlay" @click.self="showValidationModal = false">
      <div class="modal-card modal-lg glass-panel-elevated">
        <div class="modal-header">
          <div>
            <div class="modal-badge">ADMINISTRARE PREZENȚE</div>
            <h2>Validare Prezențe & Acordare Ore</h2>
            <p class="modal-subtitle">
              Eveniment: <strong>{{ event?.title }}</strong> · 
              <span>{{ attendees.length }} voluntari în sală</span>
            </p>
          </div>
          <button class="btn-close" @click="showValidationModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="validation-toolbar">
            <div class="toolbar-left">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  :checked="selectedUserIds.length === attendees.length && attendees.length > 0"
                  @change="toggleSelectAll"
                />
                <span class="checkmark"></span>
                <span class="select-label">Selectează toți ({{ selectedUserIds.length }}/{{ attendees.length }})</span>
              </label>
            </div>
            <div class="toolbar-right">
              <span class="tip-banner">💡 Orele sunt calculate automat în funcție de ora sosirii fiecărui voluntar.</span>
            </div>
          </div>

          <div class="table-container custom-scrollbar">
            <table class="styled-table">
              <thead>
                <tr>
                  <th width="45"></th>
                  <th>Voluntar</th>
                  <th>Ora Scanării</th>
                  <th>Punctualitate</th>
                  <th width="130">Ore Acordate</th>
                  <th>Status Curent</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="person in attendees" :key="person.user_id" :class="{ 'row-selected': selectedUserIds.includes(person.user_id) }">
                  <td>
                    <label class="checkbox-container mini">
                      <input 
                        type="checkbox" 
                        :value="person.user_id" 
                        v-model="selectedUserIds" 
                      />
                      <span class="checkmark"></span>
                    </label>
                  </td>
                  <td>
                    <div class="table-user-cell">
                      <div class="mini-avatar">
                        <img v-if="person.avatar_url" :src="person.avatar_url" />
                        <span v-else>{{ getInitials(person.first_name, person.last_name, person.display_name) }}</span>
                      </div>
                      <div class="user-cell-info">
                        <strong>{{ person.first_name ? `${person.first_name} ${person.last_name}` : person.display_name }}</strong>
                        <span class="user-email-text">{{ person.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="scan-time-pill">{{ formatScanTime(person.check_in_time) }}</span>
                  </td>
                  <td>
                    <span class="status-chip" :class="getPunctualityClass(person.punctuality_status)">
                      <span class="chip-dot"></span>
                      <span>{{ formatPunctualityLabel(person.punctuality_status, person.minutes_late) }}</span>
                    </span>
                  </td>
                  <td>
                    <div class="hours-input-wrapper">
                      <input 
                        type="number" 
                        step="0.25" 
                        min="0" 
                        max="24"
                        v-model.number="hoursMap[person.user_id]" 
                        class="styled-number-input"
                      />
                      <span class="unit-label">h</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      class="badge-pill" 
                      :class="person.confirmation_status === 'attended' ? 'badge-green' : 'badge-yellow'"
                    >
                      {{ person.confirmation_status === 'attended' ? 'Validat' : 'În Sală' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showValidationModal = false">Închide</button>
          <button 
            class="btn-success btn-submit-validation" 
            :disabled="selectedUserIds.length === 0 || validating"
            @click="submitBulkValidation"
          >
            <CheckCircle :size="18" />
            <span v-if="validating">Se procesează...</span>
            <span v-else>Validează {{ selectedUserIds.length }} {{ selectedUserIds.length === 1 ? 'Prezență' : 'Prezențe' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import QRCode from 'qrcode';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  RefreshCw, 
  ArrowLeft, 
  Maximize2, 
  Minimize2,
  MapPin,
  Calendar,
  Smartphone,
  QrCode,
  ShieldCheck,
  Radio,
  AlertTriangle
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const eventId = route.params.id;

const event = ref(null);
const attendees = ref([]);
const qrCodeUrl = ref('');
const qrLoading = ref(true);
const countdown = ref(30);
const isFullscreen = ref(false);
const currentTime = ref('');
const showValidationModal = ref(false);
const validating = ref(false);

const toastMessage = ref('');
const toastType = ref('success');

const selectedUserIds = ref([]);
const hoursMap = reactive({});

let totpInterval = null;
let pollInterval = null;
let clockInterval = null;

const showToast = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
};

// Clock updates
const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Timer bar class based on countdown remaining
const getTimerBarClass = computed(() => {
  if (countdown.value <= 5) return 'progress-critical';
  if (countdown.value <= 10) return 'progress-warning';
  return 'progress-normal';
});

// Fetch current TOTP Code and generate QR
const fetchTotpCode = async () => {
  try {
    qrLoading.value = true;
    const res = await api.get(`/events/${eventId}/current-code`);
    const code = res.data.code;
    if (code) {
      const universalPayload = `https://osace.ro/scan?eventId=${eventId}&code=${code}`;
      qrCodeUrl.value = await QRCode.toDataURL(universalPayload, {
        width: 520,
        margin: 2,
        color: {
          dark: '#0a0f1d',
          light: '#ffffff'
        }
      });
    }
  } catch (err) {
    console.error('Eroare generare TOTP:', err);
  } finally {
    qrLoading.value = false;
  }
};

// Fetch Attendance Review list
const fetchAttendanceReview = async () => {
  try {
    const res = await api.get(`/events/${eventId}/attendance-review`);
    event.value = res.data.event;
    attendees.value = res.data.attendees || [];

    // Initialize hours and selections
    attendees.value.forEach(person => {
      if (hoursMap[person.user_id] === undefined) {
        hoursMap[person.user_id] = person.suggested_hours !== undefined 
          ? person.suggested_hours 
          : (parseFloat(event.value?.duration_hours) || 2.0);
      }
      if (!selectedUserIds.value.includes(person.user_id)) {
        selectedUserIds.value.push(person.user_id);
      }
    });
  } catch (err) {
    console.error('Eroare la attendance review:', err);
  }
};

// Bulk validate action
const submitBulkValidation = async () => {
  if (selectedUserIds.value.length === 0) return;
  validating.value = true;

  try {
    const payload = {
      attendees: selectedUserIds.value.map(uid => ({
        userId: uid,
        hours: hoursMap[uid] !== undefined ? hoursMap[uid] : (parseFloat(event.value?.duration_hours) || 2.0)
      }))
    };

    const res = await api.post(`/events/${eventId}/bulk-validate`, payload);
    showToast(res.data.message || 'Prezențele au fost validate cu succes!', 'success');
    showValidationModal.value = false;
    await fetchAttendanceReview();
  } catch (err) {
    console.error('Eroare validare bulk:', err);
    showToast(err.response?.data?.error || 'Eroare la validarea prezențelor.', 'error');
  } finally {
    validating.value = false;
  }
};

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedUserIds.value = attendees.value.map(a => a.user_id);
  } else {
    selectedUserIds.value = [];
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(err => console.error(err));
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(err => console.error(err));
  }
};

const goToAdmin = () => {
  router.push({ name: 'admin' });
};

// Formatting helpers
const formatEventTime = (start, end) => {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const dateStr = s.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  const startStr = s.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  const endStr = e ? e.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '';
  return `${dateStr}, ${startStr} - ${endStr}`;
};

const formatScanTime = (dateStr) => {
  if (!dateStr) return 'Nescanat';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

const formatCategory = (cat) => {
  const map = { sedinta: 'Ședință', social: 'Social', proiect: 'Proiect' };
  return map[cat] || 'Eveniment';
};

const getCategoryClass = (cat) => {
  const map = { sedinta: 'badge-blue', social: 'badge-green', proiect: 'badge-yellow' };
  return map[cat] || 'badge-blue';
};

const formatPunctualityLabel = (status, minutes) => {
  if (status === 'on_time') return 'La timp';
  if (status === 'late') return `Întârziat ${minutes}m`;
  if (status === 'late_critical') return `Final (${minutes}m)`;
  return 'Înregistrat';
};

const getPunctualityClass = (status) => {
  if (status === 'on_time') return 'chip-green';
  if (status === 'late') return 'chip-yellow';
  if (status === 'late_critical') return 'chip-red';
  return 'chip-neutral';
};

const getInitials = (fn, ln, dn) => {
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  if (dn) return dn.slice(0, 2).toUpperCase();
  return 'OS';
};

onMounted(async () => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  await fetchAttendanceReview();
  await fetchTotpCode();

  // 30s countdown timer for TOTP
  totpInterval = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = 30;
      fetchTotpCode();
    }
  }, 1000);

  // Poll attendees every 5 seconds
  pollInterval = setInterval(fetchAttendanceReview, 5000);

  const handleFsChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };
  document.addEventListener('fullscreenchange', handleFsChange);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
  if (totpInterval) clearInterval(totpInterval);
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
/* ==========================================================================
   PROJECTOR VIEW - ULTRA PREMIUM DISPLAY STYLES
   ========================================================================== */

.projector-page {
  position: relative;
  height: 100vh;
  width: 100vw;
  background: #090d16;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.75rem;
  overflow: hidden;
  box-sizing: border-box;
}

/* Slide Toast Notification */
.toast-notification {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
.toast-success {
  background: rgba(16, 185, 129, 0.9);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.toast-error {
  background: rgba(239, 68, 68, 0.9);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}

/* Pulse Dot */
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.pulse-dot.green {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-glow 2s infinite;
}
@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

/* ==========================================================================
   HEADER
   ========================================================================== */
.projector-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.5rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-width: 0;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  padding: 4px;
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 1.5px;
  line-height: 1.1;
  background: linear-gradient(180deg, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.event-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 600px;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-divider {
  color: #475569;
}

/* Skeleton */
.event-meta-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.skeleton-pill { width: 80px; height: 20px; background: rgba(255,255,255,0.05); border-radius: 9999px; }
.skeleton-title { width: 260px; height: 26px; background: rgba(255,255,255,0.08); border-radius: 6px; }
.skeleton-sub { width: 180px; height: 16px; background: rgba(255,255,255,0.05); border-radius: 4px; }

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.live-clock-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.4rem 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.clock-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.clock-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #10b981;
  letter-spacing: 1px;
}

.clock-time {
  font-family: var(--font-heading);
  font-variant-numeric: tabular-nums;
  font-size: 1.35rem;
  font-weight: 700;
  color: #60a5fa;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: 42px;
  border-radius: 12px;
  font-weight: 600;
}

/* ==========================================================================
   MAIN PROJECTION GRID
   ========================================================================== */
.projector-main {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.25rem;
  flex: 1;
  min-height: 0;
}

/* LEFT: QR Code Stage */
.qr-stage-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 2rem;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  min-height: 0;
  overflow: hidden;
}

.qr-hero-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  max-width: 900px;
}

.qr-card-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0;
}

.qr-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 320px;
  height: 320px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}
.loading-label {
  margin-top: 1rem;
  font-size: 0.95rem;
  color: #94a3b8;
}

.qr-frame-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-bezel {
  position: relative;
  background: #ffffff;
  padding: 16px;
  border-radius: 18px;
  box-shadow: 
    0 20px 45px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  /* Dynamically sized to guarantee zero vertical overflow on 1080p and 720p */
  width: clamp(260px, 35vh, 420px);
  height: clamp(260px, 35vh, 420px);
  display: block;
  border-radius: 10px;
}

/* Countdown & TOTP Bar */
.totp-timer-container {
  width: 100%;
  max-width: 420px;
  margin-top: 1rem;
}

.timer-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.timer-bar-progress {
  height: 100%;
  border-radius: 9999px;
  transition: width 1s linear, background 0.3s ease;
}
.progress-normal {
  background: #3b82f6;
}
.progress-warning {
  background: #f59e0b;
}
.progress-critical {
  background: #ef4444;
}

.totp-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.45rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.totp-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.security-chip {
  font-size: 0.7rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Clean Understated Instruction Bar */
.projector-instruction-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #94a3b8;
  margin-top: 0.75rem;
}

.projector-instruction-bar strong {
  color: #f8fafc;
}

.instruction-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

/* ==========================================================================
   RIGHT: ATTENDANCE SIDEBAR
   ========================================================================== */
.attendance-sidebar {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 1.25rem;
  backdrop-filter: blur(16px);
  min-height: 0;
  overflow: hidden;
}

.sidebar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.attendance-counter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.counter-badge-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.counter-text-group {
  display: flex;
  flex-direction: column;
}

.counter-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.counter-value .number {
  font-family: var(--font-heading);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  color: #ffffff;
}

.live-tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  font-weight: 800;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  letter-spacing: 0.5px;
}

.counter-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.btn-validate {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  border-radius: 10px;
}

/* Feed & List */
.attendees-feed {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.attendees-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attendee-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.2s ease;
}
.attendee-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.attendee-avatar img,
.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}
.attendee-avatar img {
  object-fit: cover;
}
.avatar-fallback {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

.attendee-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.attendee-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attendee-time {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Status Chips */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-weight: 600;
  white-space: nowrap;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.chip-green {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.chip-green .chip-dot { background: #10b981; }

.chip-yellow {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.chip-yellow .chip-dot { background: #f59e0b; }

.chip-red {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.chip-red .chip-dot { background: #ef4444; }

.chip-neutral {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.25);
}
.chip-neutral .chip-dot { background: #94a3b8; }

/* Empty state */
.empty-feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem 1rem;
  text-align: center;
  color: #94a3b8;
}

.radar-box {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.radar-icon {
  color: #3b82f6;
  z-index: 2;
}
.radar-wave {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.4);
  animation: radar-expand 2s infinite cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes radar-expand {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}

.empty-feed h4 {
  font-size: 1rem;
  color: #f1f5f9;
  margin-bottom: 0.35rem;
}
.empty-feed p {
  font-size: 0.8rem;
  color: #64748b;
  max-width: 240px;
}

.sidebar-bottom {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 0.5rem;
  flex-shrink: 0;
}

.sync-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #64748b;
}
.sync-spin {
  animation: spin 4s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions for List */
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ==========================================================================
   CUSTOM SCROLLBAR
   ========================================================================== */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ==========================================================================
   MODAL - VALIDATION
   ========================================================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 20, 0.8);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 920px;
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-badge {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: #60a5fa;
  margin-bottom: 0.25rem;
}

.modal-header h2 {
  font-size: 1.35rem;
  margin: 0 0 0.25rem 0;
  color: #ffffff;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.btn-close {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}
.btn-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.modal-body {
  padding: 1.25rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

.validation-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.select-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #f1f5f9;
}

.tip-banner {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Custom Checkbox */
.checkbox-container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  cursor: pointer;
  user-select: none;
}
.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  height: 18px;
  width: 18px;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 5px;
  transition: all 0.2s;
  display: inline-block;
}
.checkbox-container:hover input ~ .checkmark {
  border-color: #3b82f6;
}
.checkbox-container input:checked ~ .checkmark {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}
.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}
.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
}
.styled-table th {
  position: sticky;
  top: 0;
  background: #1e293b;
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 2;
}
.styled-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}
.styled-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}
.row-selected {
  background: rgba(59, 130, 246, 0.05) !important;
}

.table-user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mini-avatar img,
.mini-avatar span {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  font-weight: 700;
  font-size: 0.75rem;
  color: #ffffff;
}
.user-cell-info {
  display: flex;
  flex-direction: column;
}
.user-email-text {
  font-size: 0.75rem;
  color: #64748b;
}

.scan-time-pill {
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
}

.hours-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.styled-number-input {
  width: 65px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  font-weight: 700;
  text-align: center;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}
.styled-number-input:focus {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}
.unit-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.btn-submit-validation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */
@media (max-width: 1200px) {
  .projector-main {
    grid-template-columns: 1fr 340px;
  }
}

@media (max-width: 992px) {
  .projector-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
  .projector-main {
    grid-template-columns: 1fr;
  }
  .attendance-sidebar {
    height: 500px;
  }
}
</style>
