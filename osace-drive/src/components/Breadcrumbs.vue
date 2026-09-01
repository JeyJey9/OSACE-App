<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <router-link to="/" class="crumb-item" :class="{ 'crumb-active': pathCrumbs.length === 0 }">
      <svg class="crumb-home-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      <span>Arhivă</span>
    </router-link>

    <template v-for="(crumb, idx) in pathCrumbs" :key="crumb.id || idx">
      <svg class="crumb-separator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>

      <router-link 
        v-if="crumb.id && idx < pathCrumbs.length - 1" 
        :to="'/folder/' + crumb.id" 
        class="crumb-item"
      >
        {{ crumb.name }}
      </router-link>
      <span v-else class="crumb-item crumb-current">
        {{ crumb.name }}
      </span>
    </template>
  </nav>
</template>

<script setup>
defineProps({
  pathCrumbs: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.8125rem;
}

.crumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  padding: 4px 6px;
  border-radius: var(--radius-xs);
  transition: color 0.15s ease, background 0.15s ease;
}

.crumb-item:hover:not(.crumb-current) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}

.crumb-home-icon {
  opacity: 0.8;
}

.crumb-active, .crumb-current {
  color: var(--text-primary);
  font-weight: 600;
}

.crumb-separator {
  color: var(--text-muted);
  opacity: 0.4;
  flex-shrink: 0;
}
</style>
