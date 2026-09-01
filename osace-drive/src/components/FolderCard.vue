<template>
  <div class="folder-card" :class="'category-' + (folder.category || 'general')" @click="$emit('open', folder)">
    <div class="folder-icon-box">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="folder-svg">
        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
      </svg>
    </div>

    <div class="folder-content">
      <div class="folder-title-row">
        <span class="folder-name" :title="folder.name">{{ folder.name }}</span>
      </div>

      <div class="folder-sub-row">
        <span class="folder-count">
          {{ folder.documents_count || 0 }} {{ (folder.documents_count === 1) ? 'fișier' : 'fișiere' }}
        </span>
        <span v-if="folder.department_id" class="badge badge-department">{{ folder.department_id }}</span>
        <span v-else-if="folder.category && folder.category !== 'general'" :class="['badge', `badge-${folder.category}`]">
          {{ formatCategory(folder.category) }}
        </span>
      </div>
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

function formatCategory(cat) {
  const map = {
    governance: 'Guvernanță',
    financial: 'Financiar',
    department: 'Departament',
    project: 'Proiect',
    event: 'Eveniment',
    export: 'Export',
  };
  return map[cat] || cat;
}
</script>

<style scoped>
.folder-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.folder-card:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.folder-icon-box {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.folder-svg {
  color: #71717a;
  transition: color 0.15s ease;
}

.category-governance .folder-svg { color: #818cf8; }
.category-financial .folder-svg { color: #fbbf24; }
.category-department .folder-svg { color: #34d399; }
.category-project .folder-svg { color: #38bdf8; }
.category-export .folder-svg { color: #a1a1aa; }

.folder-content {
  flex: 1;
  min-width: 0;
}

.folder-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.folder-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}
</style>
