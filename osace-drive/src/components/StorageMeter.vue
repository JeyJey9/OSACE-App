<template>
  <div class="storage-meter" v-if="stats">
    <div class="meter-header">
      <span class="meter-label">Stocare Google Drive</span>
      <span class="meter-value">{{ formattedUsage }} / 5.0 TB</span>
    </div>
    <div class="progress-track">
      <div class="progress-bar" :style="{ width: percentUsage + '%' }"></div>
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
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

const percentUsage = computed(() => {
  const fiveTbBytes = 5 * 1024 * 1024 * 1024 * 1024;
  const pct = (totalSizeBytes.value / fiveTbBytes) * 100;
  return Math.min(Math.max(pct, 0.5), 100).toFixed(2);
});
</script>

<style scoped>
.storage-meter {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.meter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  margin-bottom: 8px;
}

.meter-label {
  color: var(--text-muted);
  font-weight: 500;
}

.meter-value {
  color: var(--primary);
  font-weight: 700;
  font-family: var(--font-display);
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}
</style>
