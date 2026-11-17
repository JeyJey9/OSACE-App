<template>
  <div class="user-management">
    <!-- STATS HEADER -->
    <div class="stats-grid">
      <div class="stat-card glass-panel">
        <div class="stat-title">Total Utilizatori</div>
        <div class="stat-value">{{ totalUsers }}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Administratori</div>
        <div class="stat-value">{{ adminCount }}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Coordonatori</div>
        <div class="stat-value">{{ coordCount }}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Noi (Luna aceasta)</div>
        <div class="stat-value">{{ newThisMonth }}</div>
      </div>
    </div>

    <div class="glass-panel main-panel">
      <div class="panel-header">
        <h3>Lista Utilizatorilor</h3>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Caută după nume sau email..." 
          class="input-field search-box"
        />
      </div>

      <div v-if="loading" class="loading-state">Se încarcă utilizatorii...</div>
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        Nu a fost găsit niciun utilizator.
      </div>
      <div v-else class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>Utilizator</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Înregistrat la</th>
              <th v-if="isAdmin">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td>
                <div class="user-info clickable-user" @click="openPublicProfile(u.id)" title="Vezi profilul public">
                  <img 
                    v-if="u.avatar_url"
                    :src="resolveMediaUrl(u.avatar_url)"
                    alt="avatar" 
                    class="avatar" 
                  />
                  <div v-else class="avatar-placeholder">{{ (u.display_name || u.first_name || '?')[0].toUpperCase() }}</div>
                  <div>
                    <div class="user-name">{{ u.first_name }} {{ u.last_name }}</div>
                    <div class="user-display">@{{ u.display_name }}</div>
                  </div>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <span v-if="!isAdmin" :class="['role-badge', u.role]">
                  {{ formatRole(u.role) }}
                </span>
                <select 
                  v-else 
                  v-model="u.role" 
                  @change="updateRole(u.id, u.role)"
                  class="role-select"
                >
                  <option value="user">Voluntar</option>
                  <option value="coordonator">Coordonator</option>
                  <option value="admin">Administrator</option>
                </select>
              </td>
              <td>{{ formatDate(u.created_at) }}</td>
              <td v-if="isAdmin">
                <div class="row-actions">
                  <button
                    type="button"
                    @click="openBadgesModal(u)"
                    class="btn-secondary btn-sm"
                  >
                    <AwardIcon :size="14" />
                    <span>Badge-uri</span>
                  </button>
                  <button 
                    @click="deleteUser(u.id, u.first_name, u.last_name)" 
                    class="btn-danger-small"
                    :disabled="u.id === currentUser?.id"
                  >
                    Șterge
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Badges Management Modal -->
    <div v-if="badgesModal.visible" class="modal-overlay" @click.self="closeBadgesModal">
      <div class="modal-card glass-panel-elevated">
        <div class="badges-modal-header">
          <div>
            <h3>Badge-uri · {{ badgesModal.user?.display_name || `${badgesModal.user?.first_name} ${badgesModal.user?.last_name}` }}</h3>
            <p class="modal-sub">Acordă, editează perioada sau revocă realizările utilizatorului.</p>
          </div>
          <button type="button" class="close-modal-btn" @click="closeBadgesModal">✕</button>
        </div>

        <div v-if="badgesModal.loading" class="loading-state">Se încarcă badge-urile...</div>
        <div v-else class="badges-modal-body">
          <!-- Period Input Subform -->
          <div v-if="periodFormState" class="period-form-box">
            <h4>{{ periodFormState.badge.name }}</h4>
            <p class="period-hint">Alege rapid sau scrie luna / anul pentru care este acordat acest badge:</p>
            <div v-if="getQuickPeriodOptions(periodFormState.badge.key).length > 0" class="quick-chips">
              <button
                v-for="opt in getQuickPeriodOptions(periodFormState.badge.key)"
                :key="opt"
                type="button"
                :class="['quick-chip', { active: periodInput.trim() === opt }]"
                @click="periodInput = opt"
              >
                {{ opt }}
              </button>
            </div>
            <input
              v-model="periodInput"
              type="text"
              class="input-field"
              placeholder="Ex: Octombrie 2026 sau 2025-2026"
            />
            <div class="period-form-actions">
              <button type="button" class="btn-secondary btn-sm" @click="periodFormState = null">Anulează</button>
              <button
                type="button"
                class="btn-primary btn-sm"
                :disabled="!periodInput.trim() || savingBadge"
                @click="awardBadge(periodFormState.badge.id, periodInput.trim(), periodFormState.isEdit)"
              >
                {{ periodFormState.isEdit ? 'Salvează perioada' : 'Acordă badge' }}
              </button>
            </div>
          </div>

          <!-- Owned Badges -->
          <div class="modal-section">
            <h4>Badge-uri deținute ({{ userBadges.length }})</h4>
            <div v-if="userBadges.length === 0" class="empty-inline">
              Utilizatorul nu are încă niciun badge acordat.
            </div>
            <div v-else class="modal-badge-list">
              <div v-for="ub in userBadges" :key="ub.id" class="modal-badge-item">
                <div class="modal-badge-info">
                  <strong>{{ ub.name }}</strong>
                  <span v-if="ub.period_label" class="period-chip">Perioada: {{ ub.period_label }}</span>
                  <span class="earned-date">Acordat la: {{ formatDate(ub.earned_at) }}</span>
                </div>
                <div class="modal-badge-btns">
                  <button
                    v-if="isChampionBadgeKey(ub.key)"
                    type="button"
                    class="btn-secondary btn-sm"
                    @click="openPeriodForm(ub, true)"
                  >
                    <Edit3Icon :size="13" />
                    <span>{{ ub.period_label ? 'Schimbă perioada' : 'Setează perioada' }}</span>
                  </button>
                  <button
                    type="button"
                    class="btn-danger-small"
                    :disabled="savingBadge"
                    @click="revokeBadge(ub.id, ub.name)"
                  >
                    <Trash2Icon :size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Available Badges to Award -->
          <div class="modal-section">
            <div class="section-row-header">
              <h4>Acordă un badge nou</h4>
              <button type="button" class="btn-secondary btn-sm" @click="showAvailablePicker = !showAvailablePicker">
                {{ showAvailablePicker ? 'Ascunde lista' : '+ Alege badge' }}
              </button>
            </div>
            <div v-if="showAvailablePicker" class="modal-badge-list">
              <div v-for="b in availableBadges" :key="b.id" class="modal-badge-item">
                <div class="modal-badge-info">
                  <strong>{{ b.name }}</strong>
                  <span class="earned-date">{{ b.description }}</span>
                </div>
                <button
                  type="button"
                  class="btn-primary btn-sm"
                  :disabled="savingBadge"
                  @click="handleSelectAvailableBadge(b)"
                >
                  {{ isChampionBadgeKey(b.key) ? 'Alege perioada' : 'Acordă' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AwardIcon, Edit3Icon, Trash2Icon } from 'lucide-vue-next';
import api from '../services/api';
import { getDefaultAcademicYear, resolveMediaUrl } from '../utils/periodFilters';

const router = useRouter();

const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');

const currentUser = computed(() => {
  const userStr = localStorage.getItem('userData');
  return userStr ? JSON.parse(userStr) : null;
});

const isAdmin = computed(() => currentUser.value?.role === 'admin');

// --- Stats Computations ---
const totalUsers = computed(() => users.value.length);
const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length);
const coordCount = computed(() => users.value.filter(u => u.role === 'coordonator').length);
const newThisMonth = computed(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return users.value.filter(u => {
    const d = new Date(u.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u => 
    (u.first_name && u.first_name.toLowerCase().includes(q)) ||
    (u.last_name && u.last_name.toLowerCase().includes(q)) ||
    (u.display_name && u.display_name.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q))
  );
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    // Admins use /users; coordinators use /users/managed (both return same data now)
    const endpoint = isAdmin.value ? '/admin/users' : '/admin/users/managed';
    const res = await api.get(endpoint);
    users.value = res.data;
  } catch (error) {
    console.error('Eroare preluare utilizatori', error);
  } finally {
    loading.value = false;
  }
};

const updateRole = async (userId, newRole) => {
  if (!confirm(`Ești sigur că vrei să schimbi rolul acestui utilizator în ${newRole}?`)) {
    fetchUsers(); // reset if cancelled
    return;
  }
  try {
    await api.put(`/admin/users/${userId}/role`, { newRole });
  } catch (error) {
    console.error('Eroare actualizare rol:', error);
    alert('A apărut o eroare la actualizarea rolului.');
    fetchUsers(); // reset to original
  }
};

const deleteUser = async (userId, firstName, lastName) => {
  if (!confirm(`Ești absolut sigur că vrei să ștergi utilizatorul ${firstName} ${lastName}? Această acțiune este IREVERSIBILĂ.`)) {
    return;
  }
  try {
    await api.delete(`/admin/users/${userId}`);
    fetchUsers();
  } catch (error) {
    console.error('Eroare la ștergerea utilizatorului:', error);
    alert(error.response?.data?.error || 'A apărut o eroare la ștergerea utilizatorului.');
  }
};

const formatRole = (role) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'coordonator') return 'Coordonator';
  return 'Voluntar'; // 'user' in DB = Voluntar in UI
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace ? dateStr.replace(' ', 'T') : dateStr);
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const openPublicProfile = (userId) => {
  router.push({ name: 'public-profile', params: { id: userId } });
};

// --- User Badges Modal ---
const badgesModal = ref({ visible: false, loading: false, user: null });
const userBadges = ref([]);
const allBadges = ref([]);
const showAvailablePicker = ref(false);
const periodFormState = ref(null);
const periodInput = ref('');
const savingBadge = ref(false);

const RO_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const isChampionBadgeKey = (key) =>
  key === 'VOLUNTEER_OF_THE_MONTH' || key === 'VOLUNTEER_OF_THE_YEAR';

const getDefaultPeriodForKey = (key) => {
  const now = new Date();
  if (key === 'VOLUNTEER_OF_THE_MONTH') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    return `${RO_MONTHS[prev.getMonth()]} ${prev.getFullYear()}`;
  }
  if (key === 'VOLUNTEER_OF_THE_YEAR') {
    const curY = getDefaultAcademicYear();
    return `${curY - 1}-${curY}`;
  }
  return '';
};

const getQuickPeriodOptions = (key) => {
  const now = new Date();
  if (key === 'VOLUNTEER_OF_THE_MONTH') {
    return [-2, -1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 15);
      return `${RO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    });
  }
  if (key === 'VOLUNTEER_OF_THE_YEAR') {
    const curY = getDefaultAcademicYear();
    return [`${curY - 2}-${curY - 1}`, `${curY - 1}-${curY}`, `${curY}-${curY + 1}`];
  }
  return [];
};

const availableBadges = computed(() =>
  allBadges.value.filter(
    (b) => isChampionBadgeKey(b.key) || !userBadges.value.some((ub) => ub.id === b.id)
  )
);

const loadUserBadgesData = async (targetUserId) => {
  badgesModal.value.loading = true;
  try {
    const [uRes, allRes] = await Promise.all([
      api.get(`/profile/${targetUserId}/badges`),
      api.get('/admin/badges'),
    ]);
    userBadges.value = uRes.data || [];
    allBadges.value = allRes.data || [];
  } catch (err) {
    console.error('Eroare preluare badge-uri utilizator:', err);
    alert('Nu s-au putut încărca badge-urile utilizatorului.');
  } finally {
    badgesModal.value.loading = false;
  }
};

const openBadgesModal = (userObj) => {
  badgesModal.value = { visible: true, loading: true, user: userObj };
  showAvailablePicker.value = false;
  periodFormState.value = null;
  periodInput.value = '';
  loadUserBadgesData(userObj.id);
};

const closeBadgesModal = () => {
  badgesModal.value.visible = false;
  periodFormState.value = null;
  periodInput.value = '';
};

const openPeriodForm = (badge, isEdit = false) => {
  periodFormState.value = { badge, isEdit };
  periodInput.value = badge.period_label || getDefaultPeriodForKey(badge.key) || '';
};

const awardBadge = async (badgeId, periodLabel = null, replacePeriod = false) => {
  if (!badgesModal.value.user) return;
  savingBadge.value = true;
  try {
    const payload = periodLabel
      ? { badge_id: badgeId, period_label: periodLabel, replace_period: replacePeriod }
      : { badge_id: badgeId };
    await api.post(`/admin/users/${badgesModal.value.user.id}/badges`, payload);
    periodFormState.value = null;
    periodInput.value = '';
    await loadUserBadgesData(badgesModal.value.user.id);
  } catch (err) {
    alert(err.response?.data?.error || 'Acordarea badge-ului a eșuat.');
  } finally {
    savingBadge.value = false;
  }
};

const handleSelectAvailableBadge = (badge) => {
  if (isChampionBadgeKey(badge.key)) {
    openPeriodForm(badge, false);
    return;
  }
  awardBadge(badge.id);
};

const revokeBadge = async (badgeId, badgeName) => {
  if (!badgesModal.value.user) return;
  if (!confirm(`Ești sigur că vrei să retragi badge-ul "${badgeName}"?`)) return;
  savingBadge.value = true;
  try {
    await api.delete(`/admin/users/${badgesModal.value.user.id}/badges/${badgeId}`);
    await loadUserBadgesData(badgesModal.value.user.id);
  } catch (err) {
    alert(err.response?.data?.error || 'Revocarea badge-ului a eșuat.');
  } finally {
    savingBadge.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
  text-align: center;
  border-left: 4px solid var(--color-primary);
}

.stat-title {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: var(--color-text-primary);
  font-size: 2rem;
  font-family: var(--font-heading);
  font-weight: bold;
}

.main-panel {
  padding: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.search-box {
  width: 100%;
  max-width: 300px;
  margin: 0;
}

.table-responsive {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.users-table th,
.users-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--glass-border);
}

.users-table th {
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  flex-shrink: 0;
  text-transform: uppercase;
}

.user-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-display {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.role-badge.coordonator {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.role-badge.user {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.role-select {
  padding: 0.4rem;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--bg-primary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.btn-danger-small {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-small:hover:not(:disabled) {
  background: #e74c3c;
  color: white;
}

.btn-danger-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clickable-user {
  cursor: pointer;
}

.clickable-user:hover .user-name {
  color: var(--color-primary);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badges-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.modal-sub {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

.close-modal-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--color-text-secondary);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
}

.badges-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-section h4 {
  font-size: 0.95rem;
  margin-bottom: 0.65rem;
}

.section-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
}

.modal-badge-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.modal-badge-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: var(--color-bg-base);
  border: 1px solid var(--border-color);
}

.modal-badge-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.modal-badge-btns {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.period-chip {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fbbf24;
}

.earned-date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.empty-inline {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.period-form-box {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.period-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.quick-chip {
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--color-bg-base);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.quick-chip.active {
  border-color: var(--color-primary);
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
}

.period-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
