<template>
  <header class="navbar glass-panel">
    <div class="nav-left">
      <router-link to="/" class="brand-link">
        <div class="brand-logo-badge">
          <span class="logo-emoji">⚡</span>
        </div>
        <div class="brand-text">
          <span class="brand-title">O.S.A.C.E.</span>
          <span class="brand-tag">Drive & Arhivă</span>
        </div>
      </router-link>
    </div>

    <div class="nav-center">
      <div class="search-bar-wrapper">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Caută documente, regulamente, tag-uri..." 
          class="nav-search-input"
          v-model="searchQuery"
          @input="$emit('search', searchQuery)"
        />
      </div>
    </div>

    <div class="nav-right">
      <router-link v-if="isAdmin" to="/logs" class="btn btn-ghost btn-sm" title="Jurnale de Audit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span>Audit Logs</span>
      </router-link>

      <div class="user-pill" v-if="user">
        <div class="user-avatar-circle">
          <span>{{ (user.display_name || user.email || 'U')[0].toUpperCase() }}</span>
        </div>
        <div class="user-meta">
          <span class="user-name">{{ user.display_name || user.email }}</span>
          <span class="badge" :class="getRoleBadgeClass(user.role)">{{ formatRole(user.role) }}</span>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm" @click="handleLogout" title="Deconectare">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

const isAdmin = computed(() => {
  return user.value && user.value.role === 'admin';
});

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
  padding: 12px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  border-radius: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.brand-logo-badge {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-md);
  box-shadow: 0 0 15px var(--primary-glow);
}

.logo-emoji {
  font-size: 1.2rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-center {
  flex: 1;
  max-width: 480px;
  margin: 0 24px;
}

.search-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.nav-search-input {
  width: 100%;
  padding: 8px 14px 8px 38px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-primary);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  outline: none;
  transition: all 0.2s ease;
}

.nav-search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
  background: var(--bg-main);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
}

.user-avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: #fff;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
