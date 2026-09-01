<template>
  <header class="navbar">
    <div class="nav-left">
      <router-link to="/" class="brand-link">
        <div class="brand-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            <path d="M12 10v6"></path>
            <path d="m9 13 3-3 3 3"></path>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">O.S.A.C.E.</span>
          <span class="brand-sub">Drive & Arhivă</span>
        </div>
      </router-link>
    </div>

    <div class="nav-center">
      <div class="search-box">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Caută în arhivă..." 
          class="nav-search-input"
          v-model="searchQuery"
          @input="$emit('search', searchQuery)"
        />
        <kbd class="search-kbd">⌘K</kbd>
      </div>
    </div>

    <div class="nav-right">
      <router-link v-if="isAdmin" to="/logs" class="btn btn-ghost btn-sm" title="Jurnal de Audit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span>Audit Logs</span>
      </router-link>

      <div class="user-profile" v-if="user">
        <div class="avatar-initials">
          {{ (user.display_name || user.email || 'U')[0].toUpperCase() }}
        </div>
        <div class="user-details">
          <span class="user-display">{{ user.display_name || user.email }}</span>
          <span class="badge" :class="getRoleBadgeClass(user.role)">{{ formatRole(user.role) }}</span>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm btn-icon-only" @click="handleLogout" title="Deconectare">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');

defineEmits(['search']);

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
});

const isAdmin = computed(() => user.value && user.value.role === 'admin');

function getRoleBadgeClass(role) {
  if (role === 'admin') return 'badge-governance';
  if (role === 'coordonator') return 'badge-department';
  return 'badge-general';
}

function formatRole(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'coordonator') return 'Coordonator';
  return 'Voluntar';
}

function handleLogout() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  router.push('/login');
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-default);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 54px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-badge {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-subtle);
  color: var(--primary);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-sm);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-center {
  flex: 1;
  max-width: 440px;
  margin: 0 20px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  pointer-events: none;
}

.nav-search-input {
  width: 100%;
  padding: 6px 36px 6px 30px;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: var(--text-primary);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.15s ease;
}

.nav-search-input:focus {
  border-color: var(--primary);
  background: var(--bg-app);
}

.search-kbd {
  position: absolute;
  right: 8px;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 2px 4px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  pointer-events: none;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px 3px 4px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.avatar-initials {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface-hover);
  border: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--text-primary);
}

.user-details {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-display {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
