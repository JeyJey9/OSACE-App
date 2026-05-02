<template>
  <div class="dashboard-layout">
    <Navbar />
    <main class="main-content">
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
  padding: 2rem 1rem 6rem; /* 6rem bottom on mobile for navbar */
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* Responsivitate pentru sidebar pe viitor, momentan Navbar sus */
@media (min-width: 768px) {
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
