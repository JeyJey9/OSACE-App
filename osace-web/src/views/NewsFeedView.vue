<template>
  <div class="newsfeed">
    <header class="page-header">
      <h1>Noutăți OSACE</h1>
      <p class="subtitle">Fii la curent cu ultimele activități și anunțuri.</p>
    </header>

    <div v-if="loading" class="loading-state">
      <p>Se încarcă noutățile...</p>
    </div>

    <div v-else-if="posts.length === 0" class="empty-state">
      <p>Nu există postări momentan.</p>
    </div>

    <div v-else class="feed-container">
      <article v-for="post in posts" :key="post.id" class="post-card glass-panel">
        <div class="post-header">
          <div class="author-avatar">{{ post.author_name ? post.author_name.charAt(0) : 'O' }}</div>
          <div class="author-info">
            <h3>{{ post.author_name || 'Admin OSACE' }}</h3>
            <span class="date">{{ new Date(post.created_at).toLocaleDateString('ro-RO') }}</span>
          </div>
        </div>
        
        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>
        
        <div v-if="post.images && post.images.length" class="post-images">
          <div class="image-grid">
            <img v-for="(img, idx) in post.images.slice(0, 4)" :key="idx" :src="'https://api.osace.ro' + img" alt="Post imagine" loading="lazy" />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const posts = ref([]);
const loading = ref(true);

const fetchPosts = async () => {
  try {
    const res = await api.get('/posts');
    posts.value = res.data;
  } catch (error) {
    console.error("Error fetching posts", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-secondary);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.feed-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.post-card {
  padding: 1.5rem;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.author-info h3 {
  font-size: 1.1rem;
  margin: 0;
}

.date {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.post-content {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  border-radius: 12px;
  overflow: hidden;
}

.image-grid img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s;
}

.image-grid img:hover {
  transform: scale(1.02);
}
</style>
