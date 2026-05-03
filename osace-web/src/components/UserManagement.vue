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
                <div class="user-info">
                  <img 
                  :src="u.avatar_url || ''"
                  @error="(e) => e.target.style.display='none'"
                  alt="avatar" 
                  class="avatar" 
                />
                <div v-if="!u.avatar_url" class="avatar-placeholder">{{ (u.first_name || '?')[0] }}</div>
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
                <button 
                  @click="deleteUser(u.id, u.first_name, u.last_name)" 
                  class="btn-danger-small"
                  :disabled="u.id === currentUser?.id"
                >
                  Șterge
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

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
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' });
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
</style>
