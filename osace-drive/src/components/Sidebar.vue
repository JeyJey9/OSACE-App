<template>
  <aside class="sidebar glass-panel">
    <div class="sidebar-section">
      <span class="section-title">Navigare Rapidă</span>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ 'active': isRootActive }">
          <span class="nav-emoji">🏛️</span>
          <span>Toate Folderele</span>
        </router-link>

        <a 
          v-for="folder in topFolders" 
          :key="folder.id" 
          href="#"
          class="nav-item"
          :class="{ 'active': currentFolderId === folder.id }"
          @click.prevent="$emit('navigate', folder.id)"
        >
          <span class="nav-emoji">{{ getFolderEmoji(folder.category) }}</span>
          <span class="nav-text">{{ folder.name }}</span>
          <span v-if="folder.documents_count" class="nav-count">{{ folder.documents_count }}</span>
        </a>
      </nav>
    </div>

    <div class="sidebar-section" v-if="isAdmin">
      <span class="section-title">Administrare</span>
      <nav class="sidebar-nav">
        <button class="nav-item nav-btn" @click="$emit('init-structure')">
          <span class="nav-emoji">⚡</span>
          <span>Inițializează Structura</span>
        </button>
        <router-link to="/logs" class="nav-item">
          <span class="nav-emoji">📜</span>
          <span>Jurnal de Audit</span>
        </router-link>
      </nav>
    </div>

    <div class="sidebar-footer">
      <StorageMeter :stats="stats" />
    </div>
  </aside>
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
});

defineEmits(['navigate', 'init-structure']);

const currentFolderId = computed(() => {
  return route.params.id ? parseInt(route.params.id, 10) : null;
});

const isRootActive = computed(() => {
  return route.name === 'root-explorer' && !route.params.id;
});

function getFolderEmoji(category) {
  switch (category) {
    case 'governance': return '📜';
    case 'department': return '🏢';
    case 'financial': return '💰';
    case 'project': return '🚀';
    case 'event': return '🎉';
    case 'export': return '📦';
    default: return '📁';
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  min-height: calc(100vh - 65px);
  background: var(--bg-surface);
  border-right: 1px solid var(--border-color);
  border-radius: 0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 10px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--primary);
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.nav-emoji {
  font-size: 1.1rem;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.sidebar-footer {
  margin-top: auto;
}
</style>
