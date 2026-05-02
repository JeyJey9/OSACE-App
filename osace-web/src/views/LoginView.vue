<template>
  <div class="login-container">
    <div class="login-box glass-panel">
      <div class="logo-container">
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
            placeholder="Numele tău de utilizator"
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
  /* Fundal gradient modern */
  background: radial-gradient(circle at top right, #1e293b, #0f172a);
  padding: 1rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container h2 {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
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
