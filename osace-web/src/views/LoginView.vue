<template>
  <div class="login-container">
    <div class="login-box glass-panel">
      <div class="logo-container">
        <div class="brand-logo-circle">
          <img src="/favicon.ico" alt="OSACE Logo" class="login-logo-img" />
        </div>
        <h2>O.S.A.C.E.</h2>
        <p class="subtitle">Portal Voluntari</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            class="input-field" 
            placeholder="exemplu@email.com"
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">Parolă</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="input-field" 
            placeholder="••••••••"
            required 
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn-primary login-btn" :disabled="loading">
          <span v-if="loading">Se autentifică...</span>
          <span v-else>Autentificare</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    });

    const { token, user } = response.data;
    
    // Salvează token-ul și datele userului
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));

    // Redirecționează către feed
    router.push({ name: 'feed' });
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Eroare de conectare. Verificați datele introduse.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #090d16;
  padding: 1.5rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 2.25rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-logo-circle {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  padding: 6px;
}

.login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-container h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 0.15rem;
  letter-spacing: 1.5px;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.login-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  color: var(--color-danger);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}
</style>
