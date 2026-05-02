<template>
  <nav class="navbar glass-panel">
    <div class="nav-brand">
      <div class="logo">O</div>
      <span class="brand-name">OSACE</span>
    </div>

    <div class="nav-links">
      <router-link to="/" class="nav-item" active-class="active">
        <HomeIcon size="20" />
        <span>Acasă</span>
      </router-link>
      <router-link to="/leaderboard" class="nav-item" active-class="active">
        <TrophyIcon size="20" />
        <span>Clasament</span>
      </router-link>
      <router-link to="/profile" class="nav-item" active-class="active">
        <UserIcon size="20" />
        <span>Profil</span>
      </router-link>
      <router-link v-if="isAdmin" to="/admin" class="nav-item" active-class="active">
        <ShieldAlertIcon size="20" />
        <span>Admin</span>
      </router-link>
    </div>

    <div class="nav-footer">
      <button @click="logout" class="logout-btn">
        <LogOutIcon size="20" />
        <span>Ieșire</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { HomeIcon, TrophyIcon, UserIcon, ShieldAlertIcon, LogOutIcon } from 'lucide-vue-next';

const router = useRouter();

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch(e) { return null; }
  }
  return null;
});

const isAdmin = computed(() => {
  return user.value && (user.value.role === 'admin' || user.value.role === 'coordonator');
});

const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  /* Layout mobil by default: bottom bar */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  border-bottom: none;
  border-top: 1px solid var(--glass-border);
}

.nav-brand, .nav-footer {
  display: none; /* Ascuns pe mobil */
}

.nav-links {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--color-text-primary);
}

.nav-item.active {
  color: var(--color-primary);
}

/* Sidebar pentru Desktop */
@media (min-width: 768px) {
  .navbar {
    position: sticky;
    top: 0;
    width: 250px;
    height: 100vh;
    border-radius: 0;
    border-top: none;
    border-right: 1px solid var(--glass-border);
    flex-direction: column;
    justify-content: flex-start;
    padding: 2rem 1.5rem;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .logo {
    width: 40px;
    height: 40px;
    background: var(--color-primary);
    color: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    font-family: var(--font-heading);
  }

  .brand-name {
    font-size: 1.5rem;
    font-weight: bold;
    font-family: var(--font-heading);
    color: var(--color-text-primary);
    letter-spacing: 1px;
  }

  .nav-links {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .nav-item {
    flex-direction: row;
    padding: 1rem;
    border-radius: 12px;
    font-size: 1rem;
    gap: 1rem;
  }

  .nav-item.active {
    background: rgba(59, 130, 246, 0.1);
  }

  .nav-footer {
    display: block;
    margin-top: auto;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    color: var(--color-danger);
    font-size: 1rem;
    border-radius: 12px;
    transition: background 0.2s;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
