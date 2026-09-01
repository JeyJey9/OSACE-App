<template>
  <div class="storage-widget" v-if="stats">
    <div class="widget-top">
      <div class="quota-meta">
        <span class="quota-title">Stocare Cloud</span>
        <span class="quota-figures"><strong>{{ formattedUsage }}</strong> / 5.0 TB</span>
      </div>
      <span class="quota-pct">{{ percentUsage }}%</span>
    </div>

    <div class="progress-track">
      <div class="progress-bar" :style="{ width: percentUsage + '%' }"></div>
    </div>

    <div class="quota-footer">
      <span class="status-indicator">
        <span class="status-dot"></span> Google Drive Conectat
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  stats: {
    type: Object,
    default: null,
  },
});

const totalSizeBytes = computed(() => {
  if (!props.stats || !props.stats.totalSizeBytes) return 0;
  return Number(props.stats.totalSizeBytes);
});

const formattedUsage = computed(() => {
  const bytes = totalSizeBytes.value;
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

const percentUsage = computed(() => {
  const fiveTbBytes = 5 * 1024 * 1024 * 1024 * 1024;
  const pct = (totalSizeBytes.value / fiveTbBytes) * 100;
  return Math.min(Math.max(pct, 0.1), 100).toFixed(1);
});
</script>

<style scoped>
.storage-widget {
  padding: 12px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}

.widget-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.quota-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quota-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.quota-figures {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.quota-figures strong {
  color: var(--text-primary);
  font-weight: 600;
}

.quota-pct {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.quota-footer {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--primary);
}
</style>
