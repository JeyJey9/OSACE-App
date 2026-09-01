<template>
  <div class="login-page">
    <div class="login-card glass-panel animate-fade-in">
      <div class="brand-hero">
        <div class="brand-logo-large">
          <span>⚡</span>
        </div>
        <h1>O.S.A.C.E. Drive</h1>
        <p class="brand-subtitle">Arhivă Instituțională & Documente Securizate</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <span>⚠️</span>
        <p>{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Adresă Email</label>
          <input 
            id="email" 
            type="email" 
            v-model="email" 
            required 
            placeholder="nume@osace.ro" 
            class="input-control"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Parolă</label>
          <input 
            id="password" 
            type="password" 
            v-model="password" 
            required 
            placeholder="••••••••" 
            class="input-control"
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          <span v-if="isLoading">Se verifică datele...</span>
          <span v-else>Autentificare în Arhivă</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Autentificare securizată bazată pe contul tău din aplicația mobilă O.S.A.C.E.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await api.post('/auth/login', {
      email: email.value.trim(),
      password: password.value,
    });

    const { token, user } = response.data;
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(user));

    router.push('/');
  } catch (err) {
    console.error('Eroare login:', err);
    errorMessage.value = err.response?.data?.error || 'Credențiale incorecte sau conexiune eșuată.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top center, rgba(16, 185, 129, 0.12) 0%, transparent 60%), var(--bg-main);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 36px 32px;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}

.brand-hero {
  text-align: center;
  margin-bottom: 28px;
}

.brand-logo-large {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-lg);
  font-size: 1.8rem;
  box-shadow: 0 0 25px var(--primary-glow);
}

.brand-hero h1 {
  font-size: 1.6rem;
  margin-bottom: 6px;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
  color: #fca5a5;
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-block {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
