<template>
  <div class="projector-page">
    <!-- Header -->
    <header class="projector-header">
      <div class="brand">
        <div class="logo-box">
          <span class="logo-text">O.S.A.C.E.</span>
        </div>
        <div class="event-meta" v-if="event">
          <span class="badge" :class="getCategoryClass(event.category)">{{ formatCategory(event.category) }}</span>
          <h1 class="event-title">{{ event.title }}</h1>
          <p class="event-subtitle">
            <span>📍 {{ event.location || 'Sediul OSACE' }}</span>
            <span class="dot">•</span>
            <span>⏰ {{ formatEventTime(event.start_time, event.end_time) }}</span>
            <span class="dot">•</span>
            <span>⏳ {{ event.duration_hours }} {{ event.duration_hours === 1 ? 'oră' : 'ore' }}</span>
          </p>
        </div>
      </div>

      <div class="header-actions">
        <!-- Live Clock -->
        <div class="live-clock">
          <span class="clock-label">Ora curentă</span>
          <span class="clock-time">{{ currentTime }}</span>
        </div>

        <!-- Fullscreen Toggle -->
        <button class="btn-icon" @click="toggleFullscreen" title="Comută Ecran Complet">
          <component :is="isFullscreen ? Minimize2 : Maximize2" :size="22" />
        </button>

        <!-- Exit / Admin link -->
        <button class="btn-secondary btn-sm" @click="goToAdmin">
          <ArrowLeft :size="16" />
          <span>Panou Admin</span>
        </button>
      </div>
    </header>

    <!-- Main Projection Area -->
    <main class="projector-main">
      <div class="qr-presentation-card glass-panel">
        <div class="qr-wrapper">
          <div v-if="qrLoading && !qrCodeUrl" class="qr-loading">
            <div class="spinner"></div>
            <p>Se generează codul QR...</p>
          </div>
          <div v-else class="qr-container">
            <img :src="qrCodeUrl" alt="Cod QR Prezență" class="qr-image" />
            <div class="scan-target-corners">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
          </div>

          <!-- Countdown Timer Bar -->
          <div class="timer-section">
            <div class="timer-bar-bg">
              <div class="timer-bar-fill" :style="{ width: `${(countdown / 30) * 100}%` }"></div>
            </div>
            <div class="timer-info">
              <RefreshCw :size="14" class="spin-icon" />
              <span>Codul se reîmprospătează în <strong>{{ countdown }}s</strong> (Anti-Fraudă TOTP)</span>
            </div>
          </div>
        </div>

        <!-- Instructions Box -->
        <div class="instructions-box">
          <h2>📱 Cum confirmi prezența?</h2>
          <ol class="steps-list">
            <li>
              <span class="step-num">1</span>
              <span>Deschide aplicația <strong>OSACE Voluntariat</strong> pe telefon.</span>
            </li>
            <li>
              <span class="step-num">2</span>
              <span>Apasă pe butonul de <strong>Scanează Prezența</strong>.</span>
            </li>
            <li>
              <span class="step-num">3</span>
              <span>Îndreaptă camera spre acest cod QR. Ora sosirii tale se înregistrează automat!</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- Live Attendance Sidebar -->
      <aside class="attendance-sidebar glass-panel">
        <div class="sidebar-header">
          <div class="count-badge-wrap">
            <Users :size="24" class="count-icon" />
            <div class="count-texts">
              <span class="count-number">{{ attendees.length }}</span>
              <span class="count-title">Voluntari Prezenți</span>
            </div>
          </div>

          <button class="btn-success btn-validate-all" @click="showValidationModal = true">
            <CheckCircle :size="18" />
            <span>Validează Orele</span>
          </button>
        </div>

        <!-- Live Attendee Feed -->
        <div class="attendees-list custom-scrollbar">
          <div v-if="attendees.length === 0" class="empty-attendees">
            <Clock :size="32" class="empty-icon" />
            <p>Așteptăm primii voluntari să scaneze...</p>
          </div>
          <div 
            v-for="person in attendees" 
            :key="person.user_id" 
            class="attendee-pill animate-fade-in"
          >
            <div class="attendee-avatar">
              <img v-if="person.avatar_url" :src="person.avatar_url" :alt="person.display_name" />
              <div v-else class="avatar-fallback">{{ getInitials(person.first_name, person.last_name, person.display_name) }}</div>
            </div>
            <div class="attendee-info">
              <span class="attendee-name">{{ person.first_name ? `${person.first_name} ${person.last_name}` : person.display_name }}</span>
              <span class="attendee-time">
                <Clock :size="12" />
                {{ formatScanTime(person.check_in_time) }}
              </span>
            </div>
            <div class="attendee-status-indicator">
              <span 
                class="status-pill" 
                :class="getPunctualityClass(person.punctuality_status)"
              >
                {{ formatPunctuality(person.punctuality_status, person.minutes_late) }}
              </span>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <p class="footer-note">💡 Prezențele se actualizează automat la fiecare 5 secunde.</p>
        </div>
      </aside>
    </main>

    <!-- Validation Modal / Drawer -->
    <div v-if="showValidationModal" class="modal-overlay" @click.self="showValidationModal = false">
      <div class="modal-content modal-lg glass-panel animate-scale-up">
        <div class="modal-header">
          <div>
            <h2>Validare Prezențe & Acordare Ore</h2>
            <p class="modal-subtitle">Eveniment: <strong>{{ event?.title }}</strong> ({{ attendees.length }} voluntari scanați)</p>
          </div>
          <button class="btn-close" @click="showValidationModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="validation-toolbar">
            <div class="toolbar-left">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :checked="selectedUserIds.length === attendees.length && attendees.length > 0"
                  @change="toggleSelectAll"
                />
                <span>Selectează toți ({{ selectedUserIds.length }}/{{ attendees.length }})</span>
              </label>
            </div>
            <div class="toolbar-right">
              <span class="tip-text">Orele au fost calculate automat în funcție de ora sosirii fiecăruia.</span>
            </div>
          </div>

          <div class="validation-table-wrapper custom-scrollbar">
            <table class="validation-table">
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Voluntar</th>
                  <th>Ora Scanării</th>
                  <th>Punctualitate</th>
                  <th width="120">Ore Acordate</th>
                  <th>Status Curent</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="person in attendees" :key="person.user_id">
                  <td>
                    <input 
                      type="checkbox" 
                      :value="person.user_id" 
                      v-model="selectedUserIds" 
                    />
                  </td>
                  <td>
                    <div class="table-user">
                      <div class="mini-avatar">
                        <img v-if="person.avatar_url" :src="person.avatar_url" />
                        <span v-else>{{ getInitials(person.first_name, person.last_name, person.display_name) }}</span>
                      </div>
                      <div>
                        <strong>{{ person.first_name ? `${person.first_name} ${person.last_name}` : person.display_name }}</strong>
                        <span class="user-email">{{ person.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="scan-hour">{{ formatScanTime(person.check_in_time) }}</span>
                  </td>
                  <td>
                    <span class="status-pill" :class="getPunctualityClass(person.punctuality_status)">
                      {{ formatPunctuality(person.punctuality_status, person.minutes_late) }}
                    </span>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="24"
                      v-model.number="hoursMap[person.user_id]" 
                      class="hours-input"
                    />
                  </td>
                  <td>
                    <span 
                      class="badge" 
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
            class="btn-success" 
            :disabled="selectedUserIds.length === 0 || validating"
            @click="submitBulkValidation"
          >
            <CheckCircle :size="18" />
            <span v-if="validating">Se validează...</span>
            <span v-else>Validează {{ selectedUserIds.length }} Prezențe & Trimite Notificări</span>
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
  RefreshCw, 
  ArrowLeft, 
  Maximize2, 
  Minimize2 
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

const selectedUserIds = ref([]);
const hoursMap = reactive({});

let totpInterval = null;
let pollInterval = null;
let clockInterval = null;

// Clock updates
const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Fetch current TOTP Code and generate QR
const fetchTotpCode = async () => {
  try {
    qrLoading.value = true;
    const res = await api.get(`/events/${eventId}/current-code`);
    const code = res.data.code;
    if (code) {
      const universalPayload = `https://osace.ro/scan?eventId=${eventId}&code=${code}`;
      qrCodeUrl.value = await QRCode.toDataURL(universalPayload, {
        width: 480,
        margin: 2,
        color: {
          dark: '#0f172a',
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
    alert(res.data.message || 'Prezențele au fost validate cu succes!');
    showValidationModal.value = false;
    await fetchAttendanceReview();
  } catch (err) {
    console.error('Eroare validare bulk:', err);
    alert(err.response?.data?.error || 'Eroare la validarea prezențelor.');
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
  if (!dateStr) return 'Ora nespecificată';
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

const formatPunctuality = (status, minutes) => {
  if (status === 'on_time') return '🟢 La timp';
  if (status === 'late') return `🟡 Întârziat ${minutes}m`;
  if (status === 'late_critical') return `🔴 Venit la final (${minutes}m)`;
  return 'Înregistrat';
};

const getPunctualityClass = (status) => {
  if (status === 'on_time') return 'punctual-green';
  if (status === 'late') return 'punctual-yellow';
  if (status === 'late_critical') return 'punctual-red';
  return 'punctual-neutral';
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
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
  if (totpInterval) clearInterval(totpInterval);
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.projector-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #1e293b, #090d16);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 2rem;
  overflow-x: hidden;
}

/* Header */
.projector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-box {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.logo-text {
  font-size: 1.4rem;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  color: #f8fafc;
}

.event-subtitle {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.95rem;
}

.dot {
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.live-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.clock-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.clock-time {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: monospace;
  color: #60a5fa;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Main Layout */
.projector-main {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  flex: 1;
}

/* Presentation Card */
.qr-presentation-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  text-align: center;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.qr-container {
  position: relative;
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.3);
}

.qr-image {
  width: 380px;
  height: 380px;
  display: block;
  border-radius: 12px;
}

.scan-target-corners .corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: #3b82f6;
  border-style: solid;
  border-width: 0;
}

.corner.top-left {
  top: 8px;
  left: 8px;
  border-top-width: 4px;
  border-left-width: 4px;
  border-top-left-radius: 12px;
}

.corner.top-right {
  top: 8px;
  right: 8px;
  border-top-width: 4px;
  border-right-width: 4px;
  border-top-right-radius: 12px;
}

.corner.bottom-left {
  bottom: 8px;
  left: 8px;
  border-bottom-width: 4px;
  border-left-width: 4px;
  border-bottom-left-radius: 12px;
}

.corner.bottom-right {
  bottom: 8px;
  right: 8px;
  border-bottom-width: 4px;
  border-right-width: 4px;
  border-bottom-right-radius: 12px;
}

.timer-section {
  width: 100%;
  max-width: 400px;
  margin-top: 1.5rem;
}

.timer-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.timer-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 1s linear;
}

.timer-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.spin-icon {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.instructions-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.25rem 2rem;
  max-width: 600px;
  width: 100%;
}

.instructions-box h2 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
  color: #f1f5f9;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.steps-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #cbd5e1;
}

.step-num {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Sidebar */
.attendance-sidebar {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  max-height: calc(100vh - 140px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.count-badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.count-icon {
  color: #3b82f6;
}

.count-texts {
  display: flex;
  flex-direction: column;
}

.count-number {
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 1;
  color: #f8fafc;
}

.count-title {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.btn-validate-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
}

.attendees-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-right: 0.25rem;
}

.empty-attendees {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.attendee-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  transition: transform 0.2s;
}

.attendee-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
}

.attendee-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.attendee-name {
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attendee-time {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.status-pill {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
}

.punctual-green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.punctual-yellow {
  background: rgba(234, 179, 8, 0.15);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.punctual-red {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.sidebar-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-note {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

/* Modal Table */
.validation-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.tip-text {
  font-size: 0.85rem;
  color: #94a3b8;
}

.validation-table-wrapper {
  max-height: 420px;
  overflow-y: auto;
}

.validation-table {
  width: 100%;
  border-collapse: collapse;
}

.validation-table th,
.validation-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
}

.validation-table th {
  color: #94a3b8;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-user {
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
}

.user-email {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.hours-input {
  width: 80px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-weight: 700;
  text-align: center;
}

.hours-input:focus {
  outline: none;
  border-color: #3b82f6;
}

@media (max-width: 1024px) {
  .projector-main {
    grid-template-columns: 1fr;
  }
}
</style>
