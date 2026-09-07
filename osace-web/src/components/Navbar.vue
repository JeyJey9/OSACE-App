<template>
  <aside class="navbar glass-panel">
    <!-- Brand -->
    <div class="nav-brand">
      <div class="logo">O</div>
      <div class="brand-text">
        <span class="brand-name">OSACE</span>
        <span class="brand-tag">PORTAL</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <div class="nav-links">
      <router-link to="/" class="nav-item" active-class="active">
        <HomeIcon :size="20" />
        <span>Acasă</span>
      </router-link>

      <router-link to="/leaderboard" class="nav-item" active-class="active">
        <TrophyIcon :size="20" />
        <span>Clasament</span>
      </router-link>

      <!-- Notifications Toggle Button -->
      <div class="nav-item notif-trigger" :class="{ active: showNotifications }" @click="toggleNotifications">
        <div class="icon-wrap">
          <BellIcon :size="20" />
          <span v-if="unreadCount > 0" class="count-bubble notif-bubble">{{ unreadCount }}</span>
        </div>
        <span>Notificări</span>
      </div>

      <router-link to="/profile" class="nav-item" active-class="active">
        <UserIcon :size="20" />
        <span>Profil</span>
      </router-link>

      <router-link v-if="isManager" to="/admin" class="nav-item admin-link" active-class="active">
        <div class="icon-wrap">
          <ShieldAlertIcon :size="20" />
          <span v-if="totalPendingCount > 0" class="count-bubble notif-bubble">{{ totalPendingCount }}</span>
        </div>
        <span>Admin</span>
      </router-link>
    </div>

    <!-- Notifications Popover -->
    <div v-if="showNotifications" class="notif-dropdown glass-panel-elevated" @click.stop>
      <div class="notif-header">
        <div class="notif-header-title">
          <BellIcon :size="18" class="text-primary" />
          <h4>Notificări</h4>
          <span v-if="unreadCount > 0" class="badge-pill badge-red" style="font-size: 0.7rem;">{{ unreadCount }} noi</span>
        </div>
        <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-read-btn">
          <CheckCheckIcon :size="15" />
          <span>Marchează citite</span>
        </button>
      </div>

      <div class="notif-body">
        <div v-if="loadingNotifs" class="notif-empty">
          <p>Se încarcă notificările...</p>
        </div>
        <div v-else-if="notifications.length === 0" class="notif-empty">
          <p>Nu ai nicio notificare primită.</p>
        </div>
        <div v-else class="notif-list">
          <div 
            v-for="item in notifications" 
            :key="item.id" 
            class="notif-item" 
            :class="{ unread: !item.is_read }"
          >
            <div class="notif-dot-wrap">
              <span v-if="!item.is_read" class="unread-dot"></span>
            </div>
            <div class="notif-content">
              <h5 class="notif-title">{{ item.title }}</h5>
              <p class="notif-text">{{ item.body }}</p>
              <span class="notif-time">{{ formatTimeAgo(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Profile & Logout in Footer (Desktop) -->
    <div class="nav-footer">
      <div v-if="user" class="user-brief">
        <img 
          v-if="user.avatar_url" 
          :src="resolveAvatar(user.avatar_url)" 
          class="user-avatar-small" 
          alt="Avatar" 
        />
        <div v-else class="user-avatar-placeholder">
          {{ (user.first_name || 'U').charAt(0) }}
        </div>
        <div class="user-details">
          <span class="user-fullname">{{ user.first_name }} {{ user.last_name }}</span>
          <span class="user-handle">@{{ user.display_name || 'voluntar' }}</span>
        </div>
      </div>

      <button @click="logout" class="logout-btn">
        <LogOutIcon :size="18" />
        <span>Ieșire din cont</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  HomeIcon, 
  TrophyIcon, 
  UserIcon, 
  ShieldAlertIcon, 
  LogOutIcon, 
  BellIcon, 
  CheckCheckIcon 
} from 'lucide-vue-next';
import api from '../services/api';

const router = useRouter();

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch(e) { return null; }
  }
  return null;
});

const isManager = computed(() => {
  return user.value && (user.value.role === 'admin' || user.value.role === 'coordonator');
});

const isAdmin = computed(() => user.value?.role === 'admin');

// ── Notifications state ──────────────────────────────
const showNotifications = ref(false);
const notifications = ref([]);
const loadingNotifs = ref(false);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

// ── Admin Pending counts state ───────────────────────
const pendingCounts = ref({
  hourRequests: 0,
  reportedComments: 0,
  contributionRequests: 0,
  studentVerifications: 0,
});

const totalPendingCount = computed(() => {
  if (!isManager.value) return 0;
  let total = (pendingCounts.value.hourRequests || 0) + (pendingCounts.value.reportedComments || 0);
  if (isAdmin.value) {
    total += (pendingCounts.value.contributionRequests || 0) + (pendingCounts.value.studentVerifications || 0);
  }
  return total;
});

const fetchNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    notifications.value = res.data;
  } catch (err) {
    // Silent fail if not authenticated yet
  }
};

const fetchPendingCounts = async () => {
  if (!isManager.value) return;
  try {
    const res = await api.get('/admin/pending-counts');
    if (res.data) {
      pendingCounts.value = res.data;
    }
  } catch (err) {
    // Silent fail
  }
};

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    loadingNotifs.value = true;
    await fetchNotifications();
    loadingNotifs.value = false;
  }
};

const markAllAsRead = async () => {
  try {
    await api.post('/notifications/mark-all-read');
    notifications.value = notifications.value.map(n => ({ ...n, is_read: true }));
  } catch (err) {
    console.error('Eroare marcare notificari:', err);
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace ? dateStr.replace(' ', 'T') : dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Chiar acum';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Acum ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Acum ${diffHr} ore`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `Acum ${diffDays} zile`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
};

const resolveAvatar = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://api.osace.ro${url}`;
};

const closeOnOutsideClick = (e) => {
  if (!e.target.closest('.notif-trigger') && !e.target.closest('.notif-dropdown')) {
    showNotifications.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  router.push('/login');
};

onMounted(() => {
  fetchNotifications();
  if (isManager.value) fetchPendingCounts();
  window.addEventListener('click', closeOnOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', closeOnOutsideClick);
});
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 1rem;
  border-bottom: none;
  border-top: 1px solid var(--glass-border);
}

.nav-brand, .nav-footer {
  display: none;
}

.nav-links {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  gap: 0.25rem;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  border-radius: 12px;
}

.nav-item:hover {
  color: var(--color-text-primary);
}

.nav-item.active {
  color: var(--color-primary);
}

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-bubble {
  position: absolute;
  top: -6px;
  right: -10px;
}

/* Notifications Dropdown */
.notif-dropdown {
  position: fixed;
  bottom: 75px;
  right: 1rem;
  left: 1rem;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  z-index: 200;
  border-radius: 16px;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  background: rgba(15, 23, 42, 0.4);
}

.notif-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notif-header-title h4 {
  font-size: 1rem;
  margin: 0;
}

.mark-read-btn {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.mark-read-btn:hover {
  background: rgba(59, 130, 246, 0.1);
}

.notif-body {
  overflow-y: auto;
  max-height: 380px;
}

.notif-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.notif-list {
  display: flex;
  flex-direction: column;
}

.notif-item {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s;
}

.notif-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notif-item.unread {
  background: rgba(59, 130, 246, 0.05);
}

.notif-dot-wrap {
  width: 8px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--color-primary);
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.notif-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-bottom: 0.35rem;
}

.notif-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Sidebar Desktop */
@media (min-width: 768px) {
  .navbar {
    position: sticky;
    top: 0;
    width: 270px;
    height: 100vh;
    border-radius: 0;
    border-top: none;
    border-right: 1px solid var(--glass-border);
    flex-direction: column;
    justify-content: flex-start;
    padding: 2rem 1.25rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 2.5rem;
    padding: 0 0.5rem;
  }

  .logo {
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, var(--color-primary), #1d4ed8);
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 800;
    font-family: var(--font-heading);
    box-shadow: var(--shadow-glow);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.4rem;
    font-weight: 800;
    font-family: var(--font-heading);
    color: var(--color-text-primary);
    letter-spacing: 1.5px;
    line-height: 1.1;
  }

  .brand-tag {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 2px;
  }

  .nav-links {
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }

  .nav-item {
    flex-direction: row;
    padding: 0.85rem 1.1rem;
    border-radius: 12px;
    font-size: 0.95rem;
    gap: 0.9rem;
  }

  .nav-item.active {
    background: rgba(59, 130, 246, 0.12);
    color: var(--color-primary);
    font-weight: 600;
  }

  .notif-dropdown {
    position: absolute;
    top: 140px;
    left: 280px;
    bottom: auto;
    right: auto;
    width: 360px;
    box-shadow: var(--shadow-lg);
  }

  .nav-footer {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .user-brief {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0 0.5rem;
  }

  .user-avatar-small {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-primary);
  }

  .user-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), #1d4ed8);
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .user-fullname {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-handle {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: var(--color-danger);
    font-size: 0.9rem;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.4);
  }
}
</style>
