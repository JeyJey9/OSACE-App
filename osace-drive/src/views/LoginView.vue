<template>
  <div class="login-wrapper">
    <div class="login-box panel animate-fade-in">
      <!-- Brand Header -->
      <div class="brand-header">
        <div class="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            <path d="M12 10v6"></path>
            <path d="m9 13 3-3 3 3"></path>
          </svg>
        </div>
        <h2>O.S.A.C.E. Drive</h2>
        <p class="brand-description">Arhivă Instituțională & Documente Securizate</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-alert">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Form -->
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

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isLoading">
          <span v-if="isLoading">Se verifică...</span>
          <span v-else>Autentificare</span>
        </button>
      </form>

      <div class="login-hint">
        <span>Conectare unificată prin contul tău din platforma O.S.A.C.E.</span>
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
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.brand-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-subtle);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-md);
  color: var(--primary);
}

.brand-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.brand-description {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--danger-subtle);
  border: 1px solid rgba(244, 63, 94, 0.25);
  border-radius: var(--radius-sm);
  color: #fb7185;
  font-size: 0.75rem;
  margin-bottom: 16px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-submit {
  width: 100%;
  padding: 9px;
  margin-top: 4px;
}

.login-hint {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
