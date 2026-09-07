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
            <div class="ev-date-interval">
              <div class="date-row">
                <span class="date-dot start-dot"></span>
                <span class="ev-date">{{ formatDate(ev.start_time) }}</span>
              </div>
              <div class="date-divider"></div>
              <div class="date-row">
                <span class="date-dot end-dot"></span>
                <span class="ev-date">{{ formatDate(ev.end_time) }}</span>
              </div>
            </div>
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
          <EventForm :form="eventForm" :submitting="submitting" :isEditMode="true" @submit="submitEdit" @cancel="mode = 'view'" />
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
              <button class="btn-primary btn-sm" @click="openProjectorMode">📽️ Proiecție Videoproiector</button>
              <button class="btn-success btn-sm" @click="openBulkValidationModal">⚡ Validează Prezențe</button>
              <button class="btn-outline btn-sm" @click="openEditMode">Editează</button>
              <button class="btn-danger-outline btn-sm" @click="deleteEvent(selectedEvent.id)">Șterge</button>
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
            <div style="display:flex;gap:0.75rem;margin-top:0.75rem;">
              <button class="btn-outline btn-sm" @click="fetchAndShowQR">🔄 Regenerează manual</button>
              <button class="btn-primary btn-sm" @click="openProjectorMode">↗ Deschide Ecran Complet</button>
            </div>
          </div>

          <!-- Participants Section -->
          <div class="participants-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="margin:0;">Participanți ({{ participants.length }})</h4>
              <button class="btn-secondary btn-sm" @click="openBulkValidationModal">⚡ Validare în Masă</button>
            </div>
            <div v-if="loadingParticipants" class="loading-state">Se încarcă...</div>
            <div v-else-if="participants.length === 0" class="empty-state">
              Niciun participant confirmat.
            </div>
            <div v-else class="participants-grid">
              <div 
                v-for="p in participants" 
                :key="p.user_id" 
                class="participant-chip clickable" 
                :class="p.confirmation_status"
                @click="openEditParticipantModal(p)"
                title="Click pentru a edita orele și statusul acestui participant"
              >
                <span class="p-avatar">{{ p.display_name ? p.display_name.charAt(0) : '?' }}</span>
                <div class="p-info">
                  <span class="p-name">{{ p.display_name }}</span>
                  <span class="p-status">
                    {{ formatStatus(p.confirmation_status) }} · {{ p.awarded_hours ? p.awarded_hours + 'h' : '–' }}
                    <span v-if="p.check_in_time" class="p-time">({{ formatScanHour(p.check_in_time) }})</span>
                  </span>
                </div>
                <span class="edit-badge">✏️</span>
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

    <!-- Modal Editare Individuală Participant -->
    <div v-if="editParticipantModal.visible" class="modal-overlay" @click.self="editParticipantModal.visible = false">
      <div class="modal-card glass-panel-elevated">
        <h3>Editare Participant</h3>
        <p class="modal-sub">Participant: <strong>{{ editParticipantModal.target?.display_name }}</strong></p>

        <form @submit.prevent="saveSingleParticipant" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
          <div class="form-group">
            <label>Status Prezență</label>
            <select v-model="editParticipantModal.status" class="input-field" required>
              <option value="registered">Înscris</option>
              <option value="checked_in">Check-in (În Sală)</option>
              <option value="attended">Prezent (Ore Aprobate)</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <div class="form-group">
            <label>Ore Acordate</label>
            <input 
              v-model.number="editParticipantModal.hours" 
              type="number" 
              step="0.25" 
              min="0" 
              max="24" 
              class="input-field" 
              required 
            />
          </div>

          <div v-if="editParticipantModal.target?.check_in_time" class="form-group" style="font-size:0.85rem;color:var(--color-text-secondary);">
            <span>Ora Check-in: <strong>{{ formatDateTime(editParticipantModal.target.check_in_time) }}</strong></span>
          </div>

          <div class="modal-actions" style="display:flex;gap:1rem;margin-top:0.5rem;">
            <button type="button" @click="editParticipantModal.visible = false" class="btn-secondary" style="flex:1;">Anulează</button>
            <button type="submit" class="btn-primary" :disabled="editParticipantModal.saving" style="flex:1;">
              {{ editParticipantModal.saving ? 'Se salvează...' : 'Salvează Modificarea' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Validare În Masă (Ședință) -->
    <div v-if="bulkValidationModal.visible" class="modal-overlay" @click.self="bulkValidationModal.visible = false">
      <div class="modal-card modal-lg glass-panel-elevated" style="max-width:850px;width:95%;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div>
            <h3 style="margin:0;">Validare Prezențe în Masă</h3>
            <p style="margin:0;font-size:0.9rem;color:var(--color-text-secondary);">
              Eveniment: <strong>{{ selectedEvent?.title }}</strong> · Orele sunt calculate automat pe baza sosirii.
            </p>
          </div>
          <button class="btn-close" @click="bulkValidationModal.visible = false">✕</button>
        </div>

        <div v-if="bulkValidationModal.loading" class="loading-state">Se încarcă lista sosirilor...</div>
        <div v-else-if="bulkValidationModal.attendees.length === 0" class="empty-state">
          Niciun voluntar nu a scanat codul pentru acest eveniment.
        </div>
        <div v-else>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.03);border-radius:8px;">
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;font-size:0.9rem;">
              <input 
                type="checkbox" 
                :checked="bulkValidationModal.selectedIds.length === bulkValidationModal.attendees.length"
                @change="toggleBulkSelectAll"
              />
              <span>Selectează toți ({{ bulkValidationModal.selectedIds.length }}/{{ bulkValidationModal.attendees.length }})</span>
            </label>
            <span style="font-size:0.8rem;color:var(--color-text-muted);">Poți ajusta individual orele din căsuță înainte de validare.</span>
          </div>

          <div style="max-height:380px;overflow-y:auto;" class="custom-scrollbar">
            <table class="table" style="width:100%;">
              <thead>
                <tr>
                  <th width="40"></th>
                  <th>Voluntar</th>
                  <th>Ora Scanării</th>
                  <th>Punctualitate</th>
                  <th width="110">Ore Acordate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in bulkValidationModal.attendees" :key="a.user_id">
                  <td>
                    <input 
                      type="checkbox" 
                      :value="a.user_id" 
                      v-model="bulkValidationModal.selectedIds" 
                    />
                  </td>
                  <td>
                    <strong>{{ a.first_name ? `${a.first_name} ${a.last_name}` : a.display_name }}</strong>
                    <div style="font-size:0.75rem;color:var(--color-text-muted);">@{{ a.display_name }}</div>
                  </td>
                  <td>{{ formatScanHour(a.check_in_time) }}</td>
                  <td>
                    <span class="badge" :class="getPunctualBadgeClass(a.punctuality_status)">
                      {{ formatPunctualityLabel(a.punctuality_status, a.minutes_late) }}
                    </span>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0" 
                      max="24"
                      v-model.number="bulkValidationModal.hoursMap[a.user_id]" 
                      class="input-field"
                      style="width:75px;padding:0.3rem 0.5rem;text-align:center;font-weight:700;"
                    />
                  </td>
                  <td>
                    <span class="badge" :class="a.confirmation_status === 'attended' ? 'badge-green' : 'badge-yellow'">
                      {{ a.confirmation_status === 'attended' ? 'Validat' : 'În Sală' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1.25rem;">
            <button class="btn-secondary" @click="bulkValidationModal.visible = false">Închide</button>
            <button 
              class="btn-success" 
              :disabled="bulkValidationModal.selectedIds.length === 0 || bulkValidationModal.submitting"
              @click="submitBulkValidationFromAdmin"
            >
              {{ bulkValidationModal.submitting ? 'Se validează...' : `Validează ${bulkValidationModal.selectedIds.length} Prezențe & Trimite Notificări` }}
            </button>
          </div>
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
  return { title: '', description: '', start_time: '', end_time: '', location: '', duration_hours: '', category: 'social', send_notification: false };
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
    if (qrCanvas.value && code) {
      const universalPayload = `https://osace.ro/scan?eventId=${selectedEvent.value.id}&code=${code}`;
      await QRCode.toCanvas(qrCanvas.value, universalPayload, { width: 220, margin: 2, color: { dark: '#0f172a', light: '#f8fafc' } });
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

// ─── Projector & Modals State ─────────────────────────────────────────────
const openProjectorMode = () => {
  if (!selectedEvent.value) return;
  window.open(`/projector/${selectedEvent.value.id}`, '_blank');
};

// ─── Single Participant Edit Modal State ────────────────────────────────────
const editParticipantModal = ref({
  visible: false,
  target: null,
  status: 'registered',
  hours: 0,
  saving: false,
});

const openEditParticipantModal = (participant) => {
  editParticipantModal.value = {
    visible: true,
    target: participant,
    status: participant.confirmation_status || 'registered',
    hours: parseFloat(participant.awarded_hours) || 0,
    saving: false,
  };
};

const saveSingleParticipant = async () => {
  if (!editParticipantModal.value.target || !selectedEvent.value) return;
  editParticipantModal.value.saving = true;
  try {
    const payload = {
      status: editParticipantModal.value.status,
      awarded_hours: parseFloat(editParticipantModal.value.hours) || 0,
    };
    await api.put(`/events/${selectedEvent.value.id}/participants/${editParticipantModal.value.target.user_id}`, payload);
    editParticipantModal.value.visible = false;
    await fetchParticipants(selectedEvent.value.id);
  } catch (err) {
    console.error('Eroare la salvare participant:', err);
    alert(err.response?.data?.error || 'Nu s-a putut salva modificarea participantului.');
  } finally {
    editParticipantModal.value.saving = false;
  }
};

// ─── Bulk Meeting Attendance Validation Modal State ─────────────────────────
const bulkValidationModal = ref({
  visible: false,
  loading: false,
  attendees: [],
  selectedIds: [],
  hoursMap: {},
  submitting: false,
});

const openBulkValidationModal = async () => {
  if (!selectedEvent.value) return;
  bulkValidationModal.value.visible = true;
  bulkValidationModal.value.loading = true;
  bulkValidationModal.value.attendees = [];
  bulkValidationModal.value.selectedIds = [];
  bulkValidationModal.value.hoursMap = {};

  try {
    const res = await api.get(`/events/${selectedEvent.value.id}/attendance-review`);
    const atts = res.data.attendees || [];
    bulkValidationModal.value.attendees = atts;

    const initialHours = {};
    const initialSelected = [];

    atts.forEach(a => {
      initialHours[a.user_id] = a.suggested_hours !== undefined 
        ? a.suggested_hours 
        : (parseFloat(selectedEvent.value.duration_hours) || 2.0);
      initialSelected.push(a.user_id);
    });

    bulkValidationModal.value.hoursMap = initialHours;
    bulkValidationModal.value.selectedIds = initialSelected;
  } catch (err) {
    console.error('Eroare la attendance review:', err);
    alert('Nu s-au putut prelua datele de prezență.');
  } finally {
    bulkValidationModal.value.loading = false;
  }
};

const toggleBulkSelectAll = (e) => {
  if (e.target.checked) {
    bulkValidationModal.value.selectedIds = bulkValidationModal.value.attendees.map(a => a.user_id);
  } else {
    bulkValidationModal.value.selectedIds = [];
  }
};

const submitBulkValidationFromAdmin = async () => {
  if (bulkValidationModal.value.selectedIds.length === 0 || !selectedEvent.value) return;
  bulkValidationModal.value.submitting = true;

  try {
    const payload = {
      attendees: bulkValidationModal.value.selectedIds.map(uid => ({
        userId: uid,
        hours: bulkValidationModal.value.hoursMap[uid] !== undefined 
          ? bulkValidationModal.value.hoursMap[uid] 
          : (parseFloat(selectedEvent.value.duration_hours) || 2.0)
      }))
    };

    const res = await api.post(`/events/${selectedEvent.value.id}/bulk-validate`, payload);
    alert(res.data.message || 'Prezențele au fost validate cu succes!');
    bulkValidationModal.value.visible = false;
    await fetchParticipants(selectedEvent.value.id);
  } catch (err) {
    console.error('Eroare validare bulk:', err);
    alert(err.response?.data?.error || 'Eroare la validarea prezențelor.');
  } finally {
    bulkValidationModal.value.submitting = false;
  }
};

// Additional Formatting Helpers
const formatScanHour = (dt) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dt) => {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatPunctualityLabel = (status, minutes) => {
  if (status === 'on_time') return '🟢 La timp';
  if (status === 'late') return `🟡 Întârziat ${minutes}m`;
  if (status === 'late_critical') return `🔴 Venit la final (${minutes}m)`;
  return 'Înregistrat';
};

const getPunctualBadgeClass = (status) => {
  if (status === 'on_time') return 'badge-green';
  if (status === 'late') return 'badge-yellow';
  if (status === 'late_critical') return 'badge-red';
  return 'badge-blue';
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

/* ── Date Interval ─────────────────────────────────────────────────── */
.ev-date-interval {
  display: flex;
  flex-direction: column;
  margin-top: 0.2rem;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.start-dot { background: #10b981; }
.end-dot { background: #ef4444; }

.date-divider {
  border-left: 2px dotted var(--color-text-muted);
  height: 12px;
  margin-left: 2px;
  margin-top: 2px;
  margin-bottom: 2px;
  opacity: 0.5;
}

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
