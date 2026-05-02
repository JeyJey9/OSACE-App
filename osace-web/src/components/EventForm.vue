<template>
  <form @submit.prevent="$emit('submit')">
    <div class="form-group">
      <label>Titlu Eveniment</label>
      <input v-model="form.title" type="text" class="input-field" required />
    </div>
    <div class="form-group">
      <label>Categorie</label>
      <select v-model="form.category" class="input-field" required>
        <option value="social">Social</option>
        <option value="proiect">Proiect</option>
        <option value="sedinta">Ședință</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descriere</label>
      <textarea v-model="form.description" class="input-field" rows="3" required></textarea>
    </div>
    <div class="form-group">
      <label>Locație</label>
      <input v-model="form.location" type="text" class="input-field" required />
    </div>
    <div class="form-group">
      <label>Ore Alocate</label>
      <input v-model="form.duration_hours" type="number" step="0.5" min="0.5" class="input-field" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data și Ora de Început</label>
        <input v-model="form.start_time" type="datetime-local" class="input-field" required />
      </div>
      <div class="form-group">
        <label>Data și Ora de Final</label>
        <input v-model="form.end_time" type="datetime-local" class="input-field" required />
      </div>
    </div>
    <div v-if="!isEditMode" class="form-group checkbox-group">
      <label class="checkbox-label">
        <input v-model="form.send_notification" type="checkbox" />
        Anunță voluntarii printr-o notificare push
      </label>
    </div>
    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="$emit('cancel')">Anulează</button>
      <button type="submit" class="btn-primary" :disabled="submitting">
        {{ submitting ? 'Se salvează...' : 'Salvează' }}
      </button>
    </div>
  </form>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  submitting: { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false }
});
defineEmits(['submit', 'cancel']);
</script>

<style scoped>
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions .btn-primary {
  flex: 1;
  padding: 0.75rem;
  font-weight: 600;
}

.btn-cancel {
  flex: 0 0 auto;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255,255,255,0.05);
  color: var(--color-text-primary);
}

textarea.input-field {
  resize: vertical;
}

.checkbox-group {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
  accent-color: var(--color-primary);
}
</style>
