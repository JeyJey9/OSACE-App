<template>
  <div class="event-management">
    <!-- Split layout: Event list on left, detail panel on right -->
    <div class="em-layout">

      <!-- LEFT: Event List -->
      <div class="event-list-panel">
        <div class="panel-header">
          <h3>Evenimente</h3>
          <button class="btn-primary btn-sm" @click="openCreateMode">+ Nou</button>
        </div>

        <div v-if="loadingEvents" class="loading-state">Se încarcă...</div>
        <div v-else-if="events.length === 0" class="empty-state">
          Nu există evenimente create de tine.
        </div>
        <div v-else class="event-items">
          <div
            v-for="ev in events"
            :key="ev.id"
            class="event-item"
            :class="{ active: selectedEvent?.id === ev.id }"
            @click="selectEvent(ev)"
          >
            <div class="event-item-top">
              <span class="ev-title">{{ ev.title }}</span>
              <span class="ev-category" :class="ev.category">{{ ev.category }}</span>
            </div>
            <span class="ev-date">{{ formatDate(ev.start_time) }}</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: Detail / Create / Edit Panel -->
      <div class="event-detail-panel glass-panel">

        <!-- Create Mode -->
        <div v-if="mode === 'create'">
          <h3>Creează Eveniment Nou</h3>
          <p class="desc">Completează detaliile noului eveniment.</p>
          <EventForm :form="eventForm" :submitting="submitting" @submit="submitCreate" @cancel="mode = 'idle'" />
        </div>

        <!-- Edit Mode -->
        <div v-else-if="mode === 'edit' && selectedEvent">
          <h3>Editează: {{ selectedEvent.title }}</h3>
          <EventForm :form="eventForm" :submitting="submitting" @submit="submitEdit" @cancel="mode = 'view'" />
        </div>

        <!-- View Mode -->
        <div v-else-if="mode === 'view' && selectedEvent">
          <div class="detail-header">
            <div>
              <span class="ev-category" :class="selectedEvent.category">{{ selectedEvent.category }}</span>
              <h2>{{ selectedEvent.title }}</h2>
              <p class="ev-location">📍 {{ selectedEvent.location }}</p>
            </div>
            <div class="detail-actions">
              <button class="btn-outline" @click="openEditMode">Editează</button>
              <button class="btn-danger-outline" @click="deleteEvent(selectedEvent.id)">Șterge</button>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-box">
              <span class="label">Început</span>
              <span>{{ formatDate(selectedEvent.start_time) }}</span>
            </div>
            <div class="detail-box">
              <span class="label">Final</span>
              <span>{{ formatDate(selectedEvent.end_time) }}</span>
            </div>
            <div class="detail-box">
              <span class="label">Ore Alocate</span>
              <span>{{ selectedEvent.duration_hours }}h</span>
            </div>
          </div>

          <p class="ev-description">{{ selectedEvent.description }}</p>

          <!-- QR Code Section -->
          <div class="qr-section">
            <h4>Cod QR pentru Prezență</h4>
            <p class="desc">Codul se regenerează automat la fiecare 30 de secunde (TOTP).</p>
            <div class="qr-container">
              <canvas ref="qrCanvas" class="qr-canvas"></canvas>
              <div class="qr-countdown">
                <div class="countdown-bar" :style="{ width: countdownPercent + '%' }"></div>
                <span>{{ countdown }}s</span>
              </div>
            </div>
            <button class="btn-outline" @click="fetchAndShowQR">🔄 Regenerează manual</button>
          </div>

          <!-- Participants Section -->
          <div class="participants-section">
            <h4>Participanți ({{ participants.length }})</h4>
            <div v-if="loadingParticipants" class="loading-state">Se încarcă...</div>
            <div v-else-if="participants.length === 0" class="empty-state">
              Niciun participant confirmat.
            </div>
            <div v-else class="participants-grid">
              <div v-for="p in participants" :key="p.user_id" class="participant-chip" :class="p.confirmation_status">
                <span class="p-avatar">{{ p.display_name ? p.display_name.charAt(0) : '?' }}</span>
                <div class="p-info">
                  <span class="p-name">{{ p.display_name }}</span>
                  <span class="p-status">{{ formatStatus(p.confirmation_status) }} · {{ p.awarded_hours ? p.awarded_hours + 'h' : '–' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Idle state -->
        <div v-else class="idle-state">
          <p>← Selectează un eveniment din listă sau creează unul nou.</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import QRCode from 'qrcode';
import api from '../services/api';
import EventForm from './EventForm.vue';

// ─── State ──────────────────────────────────────────────────────────────────
const events = ref([]);
const selectedEvent = ref(null);
const participants = ref([]);
const mode = ref('idle'); // 'idle' | 'view' | 'create' | 'edit'
const loadingEvents = ref(false);
const loadingParticipants = ref(false);
const submitting = ref(false);

const qrCanvas = ref(null);
const countdown = ref(30);
const countdownPercent = ref(100);
let qrInterval = null;
let countdownInterval = null;

const eventForm = ref(emptyForm());

function emptyForm() {
  return { title: '', description: '', start_time: '', end_time: '', location: '', duration_hours: '', category: 'social' };
}

// ─── Fetch Events ────────────────────────────────────────────────────────────
const fetchEvents = async () => {
  loadingEvents.value = true;
  try {
    const res = await api.get('/events/my-created');
    events.value = res.data;
  } catch (e) {
    console.error('Eroare la preluarea evenimentelor:', e);
  } finally {
    loadingEvents.value = false;
  }
};

// ─── Select event ────────────────────────────────────────────────────────────
const selectEvent = async (ev) => {
  selectedEvent.value = ev;
  mode.value = 'view';
  participants.value = [];
  clearQrTimers();
  fetchParticipants(ev.id);
  await nextTick();
  fetchAndShowQR();
  startCountdown();
};

// ─── Participants ────────────────────────────────────────────────────────────
const fetchParticipants = async (id) => {
  loadingParticipants.value = true;
  try {
    const res = await api.get(`/events/${id}/participants`);
    participants.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loadingParticipants.value = false;
  }
};

// ─── QR Code ────────────────────────────────────────────────────────────────
const fetchAndShowQR = async () => {
  if (!selectedEvent.value) return;
  try {
    const res = await api.get(`/events/${selectedEvent.value.id}/current-code`);
    const code = res.data.code;
    if (qrCanvas.value) {
      await QRCode.toCanvas(qrCanvas.value, code, { width: 220, margin: 2, color: { dark: '#0f172a', light: '#f8fafc' } });
    }
  } catch (e) {
    console.error('Eroare la generarea QR:', e);
  }
};

const startCountdown = () => {
  clearQrTimers();
  const now = new Date();
  const secondsLeft = 30 - (now.getSeconds() % 30);
  countdown.value = secondsLeft;
  countdownPercent.value = (secondsLeft / 30) * 100;

  countdownInterval = setInterval(() => {
    countdown.value--;
    countdownPercent.value = (countdown.value / 30) * 100;
    if (countdown.value <= 0) {
      countdown.value = 30;
      countdownPercent.value = 100;
      fetchAndShowQR();
    }
  }, 1000);
};

const clearQrTimers = () => {
  if (qrInterval) { clearInterval(qrInterval); qrInterval = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
};

// ─── Create ──────────────────────────────────────────────────────────────────
const openCreateMode = () => {
  selectedEvent.value = null;
  eventForm.value = emptyForm();
  mode.value = 'create';
  clearQrTimers();
};

const submitCreate = async () => {
  submitting.value = true;
  try {
    const payload = {
      ...eventForm.value,
      start_time: new Date(eventForm.value.start_time).toISOString(),
      end_time: new Date(eventForm.value.end_time).toISOString(),
    };
    const res = await api.post('/events', payload);
    events.value.unshift(res.data);
    await selectEvent(res.data);
  } catch (e) {
    alert(e.response?.data?.error || 'Eroare la creare.');
  } finally {
    submitting.value = false;
  }
};

// ─── Edit ────────────────────────────────────────────────────────────────────
const openEditMode = () => {
  const ev = selectedEvent.value;
  eventForm.value = {
    title: ev.title,
    description: ev.description,
    start_time: toLocalDatetimeString(ev.start_time),
    end_time: toLocalDatetimeString(ev.end_time),
    location: ev.location,
    duration_hours: ev.duration_hours,
    category: ev.category,
  };
  mode.value = 'edit';
  clearQrTimers();
};

const submitEdit = async () => {
  submitting.value = true;
  try {
    const payload = {
      ...eventForm.value,
      start_time: new Date(eventForm.value.start_time).toISOString(),
      end_time: new Date(eventForm.value.end_time).toISOString(),
    };
    const res = await api.put(`/events/${selectedEvent.value.id}`, payload);
    // Update in list
    const idx = events.value.findIndex(e => e.id === res.data.id);
    if (idx !== -1) events.value[idx] = res.data;
    await selectEvent(res.data);
  } catch (e) {
    alert(e.response?.data?.error || 'Eroare la editare.');
  } finally {
    submitting.value = false;
  }
};

// ─── Delete ──────────────────────────────────────────────────────────────────
const deleteEvent = async (id) => {
  if (!confirm('Ești sigur că vrei să ștergi acest eveniment? Acțiunea este ireversibilă.')) return;
  try {
    await api.delete(`/events/${id}`);
    events.value = events.value.filter(e => e.id !== id);
    selectedEvent.value = null;
    mode.value = 'idle';
    clearQrTimers();
  } catch (e) {
    alert(e.response?.data?.error || 'Eroare la ștergere.');
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (dt) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatStatus = (status) => {
  const map = { registered: 'Înscris', checked_in: 'Check-in', attended: 'Prezent', absent: 'Absent' };
  return map[status] || status;
};

const toLocalDatetimeString = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

onMounted(() => { fetchEvents(); });
onUnmounted(() => { clearQrTimers(); });
</script>

<style scoped>
.em-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  height: calc(100vh - 180px);
}

/* ── Event List ─────────────────────────────────────────────────────── */
.event-list-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
}

.btn-sm {
  padding: 0.4rem 0.9rem;
  font-size: 0.9rem;
}

.event-items {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  padding-right: 4px;
}

.event-item {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.event-item:hover { border-color: var(--color-primary); }
.event-item.active { border-color: var(--color-primary); background: rgba(59,130,246,0.1); }

.event-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.ev-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.ev-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* ── Category badge ─────────────────────────────────────────────────── */
.ev-category {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  letter-spacing: 0.5px;
}
.ev-category.social    { background: rgba(16,185,129,0.15); color: #10b981; }
.ev-category.proiect   { background: rgba(59,130,246,0.15); color: #60a5fa; }
.ev-category.sedinta   { background: rgba(245,158,11,0.15); color: #fbbf24; }

/* ── Detail Panel ───────────────────────────────────────────────────── */
.event-detail-panel {
  overflow-y: auto;
  padding: 2rem;
}

.idle-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-style: italic;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.detail-header h2 {
  margin: 0.5rem 0;
}

.ev-location {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-outline, .btn-danger-outline {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-outline:hover { background: rgba(59,130,246,0.1); }

.btn-danger-outline {
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.btn-danger-outline:hover { background: rgba(239,68,68,0.1); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-box {
  background: var(--color-bg-surface);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-box .label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ev-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* ── QR Section ─────────────────────────────────────────────────────── */
.qr-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-surface);
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.qr-section h4 { margin-bottom: 0.25rem; }
.qr-section .desc { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem; }

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.qr-canvas {
  border-radius: 12px;
  display: block;
}

.qr-countdown {
  width: 220px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.countdown-bar {
  height: 4px;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 1s linear;
  flex: 1;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
}

.qr-countdown span {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  min-width: 28px;
}

/* ── Participants ────────────────────────────────────────────────────── */
.participants-section h4 { margin-bottom: 1rem; }

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.participant-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-bg-surface);
  border-radius: 10px;
  padding: 0.75rem;
  border-left: 3px solid var(--color-bg-elevated);
}

.participant-chip.attended    { border-color: var(--color-success); }
.participant-chip.checked_in  { border-color: var(--color-primary); }
.participant-chip.registered  { border-color: var(--color-text-muted); }

.p-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  flex-shrink: 0;
}

.p-info {
  display: flex;
  flex-direction: column;
}

.p-name { font-size: 0.9rem; font-weight: 600; }
.p-status { font-size: 0.75rem; color: var(--color-text-muted); }

/* ── Form ──────────────────────────────────────────────────────────── */
.desc {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions .btn-primary { flex: 1; }

textarea.input-field { resize: vertical; }

.loading-state, .empty-state {
  color: var(--color-text-muted);
  padding: 1rem 0;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
