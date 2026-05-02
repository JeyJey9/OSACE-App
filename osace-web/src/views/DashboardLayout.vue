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
  padding: 2rem 1rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* Responsivitate pentru sidebar pe viitor, momentan Navbar sus */
@media (min-width: 768px) {
  .dashboard-layout {
    flex-direction: row;
  }
  .main-content {
    padding: 2rem;
  }
}
</style>
