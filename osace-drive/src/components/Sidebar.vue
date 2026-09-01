<template>
  <div>
    <!-- Mobile Backdrop -->
    <div 
      class="sidebar-backdrop" 
      :class="{ 'is-open': isOpen }" 
      @click="$emit('close')"
    ></div>

    <aside class="sidebar" :class="{ 'is-mobile-open': isOpen }">
      <!-- Mobile Header in Drawer -->
      <div class="sidebar-mobile-head">
        <span class="drawer-title">Meniu Navigare</span>
        <button class="btn btn-ghost btn-icon-only btn-sm" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Quick Nav -->
      <div class="sidebar-section">
        <span class="section-label">Arhivă</span>
        <nav class="nav-list">
          <router-link to="/" class="nav-row" :class="{ 'active': isRootActive }" @click="$emit('close')">
            <svg class="nav-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>
            <span class="nav-label">Toate Directoarele</span>
          </router-link>

          <a 
            v-for="folder in topFolders" 
            :key="folder.id" 
            href="#"
            class="nav-row"
            :class="{ 'active': currentFolderId === folder.id }"
            @click.prevent="handleFolderClick(folder.id)"
          >
            <svg class="nav-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
            </svg>
            <span class="nav-label">{{ folder.name }}</span>
            <span v-if="folder.documents_count" class="nav-badge">{{ folder.documents_count }}</span>
          </a>
        </nav>
      </div>

      <!-- Admin Tools -->
      <div class="sidebar-section" v-if="isAdmin">
        <span class="section-label">Administrare</span>
        <nav class="nav-list">
          <router-link to="/logs" class="nav-row" @click="$emit('close')">
            <svg class="nav-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span class="nav-label">Jurnal Activitate</span>
          </router-link>
        </nav>
      </div>

      <!-- Storage Widget -->
      <div class="sidebar-bottom">
        <StorageMeter :stats="stats" />
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import StorageMeter from './StorageMeter.vue';

const route = useRoute();

const props = defineProps({
  topFolders: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['navigate', 'close']);

const currentFolderId = computed(() => {
  return route.params.id ? parseInt(route.params.id, 10) : null;
});

const isRootActive = computed(() => {
  return route.name === 'root-explorer' && !route.params.id;
});

function handleFolderClick(id) {
  emit('navigate', id);
  emit('close');
}
</script>

<style scoped>
.sidebar {
  width: 230px;
  min-height: calc(100vh - 54px);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-default);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-mobile-head {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-backdrop {
  display: none;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 8px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.nav-row:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.nav-row.active {
  background: var(--primary-subtle);
  color: var(--primary);
  font-weight: 600;
}

.nav-svg {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.nav-row:hover .nav-svg, .nav-row.active .nav-svg {
  color: inherit;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
}

.nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.sidebar-bottom {
  margin-top: auto;
}

/* Mobile Drawer Styles */
@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 150;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .sidebar-backdrop.is-open {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    height: 100vh;
    z-index: 160;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--shadow-lg);
    padding-top: calc(16px + env(safe-area-inset-top));
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
  }

  .sidebar-mobile-head {
    display: flex;
  }

  .nav-row {
    padding: 10px 12px;
    font-size: 0.875rem;
  }
}
</style>
