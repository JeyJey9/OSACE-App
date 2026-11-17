<template>
  <div class="dashboard-layout">
    <Navbar />
    <main class="main-content">
      <div class="mobile-top-header glass-panel">
        <div class="mobile-brand-left">
          <img src="/favicon.ico" alt="OSACE Logo" class="mobile-logo-img" />
          <span class="mobile-brand-title">OSACE PORTAL</span>
        </div>
        <span class="mobile-version-pill">Compatibil {{ APP_WEB_VERSION }}</span>
      </div>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import { APP_WEB_VERSION } from '../utils/periodFilters';
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  min-height: 0;
  padding: 1rem 1rem 6rem; /* 6rem bottom on mobile for navbar */
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.mobile-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.9rem;
  margin-bottom: 1rem;
  border-radius: 12px;
}

.mobile-brand-left {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.mobile-logo-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mobile-brand-title {
  font-size: 0.9rem;
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
  letter-spacing: 0.04em;
}

.mobile-version-pill {
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Responsivitate pentru sidebar pe viitor, momentan Navbar sus */
@media (min-width: 768px) {
  .mobile-top-header {
    display: none;
  }
  .dashboard-layout {
    flex-direction: row;
    height: 100vh;
    overflow: hidden;
  }
  .main-content {
    padding: 2rem;
    overflow-y: auto;
  }
}
</style>
