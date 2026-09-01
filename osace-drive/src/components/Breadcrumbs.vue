<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <router-link to="/" class="crumb-item crumb-root">
      <span class="crumb-icon">🏛️</span>
      <span class="crumb-text">Arhivă O.S.A.C.E.</span>
    </router-link>

    <template v-for="(crumb, idx) in pathCrumbs" :key="crumb.id || idx">
      <span class="crumb-separator">/</span>
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
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.crumb-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.crumb-item:hover:not(.crumb-current) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.crumb-root {
  color: var(--primary);
  font-weight: 600;
}

.crumb-current {
  color: var(--text-primary);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.04);
}

.crumb-separator {
  color: var(--text-muted);
  font-weight: 400;
  user-select: none;
}
</style>
