<template>
  <div class="folder-card" @click="$emit('open', folder)">
    <div class="folder-icon-wrapper">
      <span class="folder-emoji">{{ getFolderEmoji(folder.category) }}</span>
    </div>

    <div class="folder-info">
      <div class="folder-header">
        <h3 class="folder-name" :title="folder.name">{{ folder.name }}</h3>
        <span v-if="folder.department_id" class="badge badge-department">
          {{ folder.department_id }}
        </span>
        <span v-else-if="folder.category" :class="['badge', `badge-${folder.category}`]">
          {{ formatCategory(folder.category) }}
        </span>
      </div>

      <div class="folder-meta">
        <span class="meta-item">
          {{ folder.documents_count || 0 }} {{ (folder.documents_count === 1) ? 'document' : 'documente' }}
        </span>
        <span v-if="folder.subfolders_count > 0" class="meta-separator">•</span>
        <span v-if="folder.subfolders_count > 0" class="meta-item">
          {{ folder.subfolders_count }} subfoldere
        </span>
      </div>
    </div>

    <div class="folder-action-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup>
defineProps({
  folder: {
    type: Object,
    required: true,
  },
});

defineEmits(['open']);

function getFolderEmoji(category) {
  switch (category) {
    case 'governance': return '🏛️';
    case 'department': return '🏢';
    case 'financial': return '💰';
    case 'project': return '🚀';
    case 'event': return '🎉';
    case 'export': return '📦';
    default: return '📁';
  }
}

function formatCategory(cat) {
  const map = {
    governance: 'Guvernanță',
    financial: 'Financiar',
    department: 'Departament',
    project: 'Proiect',
    event: 'Eveniment',
    export: 'Export',
    general: 'General',
  };
  return map[cat] || cat;
}
</script>

<style scoped>
.folder-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.folder-card:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-color-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.folder-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.folder-emoji {
  font-size: 1.5rem;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.folder-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.folder-action-icon {
  color: var(--text-muted);
  opacity: 0.5;
  transition: all 0.2s ease;
}

.folder-card:hover .folder-action-icon {
  color: var(--primary);
  opacity: 1;
  transform: translateX(3px);
}
</style>
