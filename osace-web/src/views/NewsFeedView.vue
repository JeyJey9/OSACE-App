<template>
  <div class="newsfeed-page">
    <!-- Page Header & Actions -->
    <header class="page-header">
      <div class="header-left">
        <h1>Noutăți OSACE</h1>
        <p class="subtitle">Fii la curent cu ultimele activități, proiecte și anunțuri.</p>
      </div>

      <div class="header-actions" v-if="isManager">
        <button 
          @click="syncInstagram" 
          class="btn-secondary sync-btn" 
          :disabled="syncing"
          title="Sincronizează postările de pe contul oficial de Instagram"
        >
          <RefreshCwIcon :size="16" :class="{ 'spin-icon': syncing }" />
          <span>{{ syncing ? 'Se sincronizează...' : 'Sincronizează Instagram' }}</span>
        </button>
      </div>
    </header>

    <!-- Student Verification Warning Banner -->
    <div v-if="showVerificationBanner" class="verification-banner glass-panel">
      <div class="banner-icon-box">
        <AlertTriangleIcon :size="24" class="text-warning" />
      </div>
      <div class="banner-content">
        <h4>Verificare legitimație student necesară!</h4>
        <p v-if="verificationStatus === 'rejected'">
          Cererea ta anterioară a fost respinsă. Mergi în profil pentru a vedea motivul și a re-trimite legitimația.
        </p>
        <p v-else>
          Încarcă legitimația de student în secțiunea de profil pentru a putea acumula ore și debloca insigne.
        </p>
      </div>
      <router-link to="/profile" class="btn-primary btn-sm banner-action">
        Verifică acum
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Se încarcă noutățile...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="posts.length === 0" class="empty-state glass-panel">
      <SparklesIcon :size="40" class="text-primary" />
      <h3>Nicio postare momentan</h3>
      <p>Postările vor apărea aici automat din Instagram sau din comunicatele oficiale.</p>
    </div>

    <!-- Posts Feed -->
    <div v-else class="feed-container">
      <article v-for="post in posts" :key="post.id" class="post-card glass-panel">
        
        <!-- Post Header -->
        <div class="post-header">
          <div class="author-avatar-box">
            <div class="avatar-circle">
              {{ (post.creator_name || 'O').charAt(0) }}
            </div>
          </div>

          <div class="author-info">
            <div class="author-row">
              <span class="author-name">{{ post.creator_name || 'OSACE' }}</span>
              <span v-if="isNewPost(post.created_at)" class="badge-pill badge-blue new-tag">NOU</span>
            </div>
            <span class="post-date">{{ formatRelativeDate(post.created_at) }}</span>
          </div>

          <!-- Manager actions (delete post) -->
          <div v-if="isManager" class="post-menu">
            <button @click="deletePost(post.id)" class="post-del-btn" title="Șterge postarea">
              <Trash2Icon :size="16" />
            </button>
          </div>
        </div>

        <!-- Post Content (Text / Description) -->
        <div class="post-content">
          <p class="post-text" :class="{ 'collapsed': !isExpanded(post.id) }">
            {{ post.description }}
          </p>
          <button 
            v-if="post.description && post.description.length > 180" 
            @click="toggleExpand(post.id)" 
            class="expand-btn"
          >
            {{ isExpanded(post.id) ? 'Afișează mai puțin' : 'Citește mai mult...' }}
          </button>
        </div>

        <!-- Media Gallery / Carousel -->
        <div v-if="post.image_urls && post.image_urls.length > 0" class="post-media-container">
          <!-- Multi-image Carousel Slider -->
          <div class="media-carousel">
            <div class="media-item-wrapper">
              <template v-if="isVideo(getCurrentMedia(post))">
                <video 
                  :src="resolveMediaUrl(getCurrentMedia(post))" 
                  controls 
                  class="media-element video-element"
                ></video>
              </template>
              <template v-else>
                <img 
                  :src="resolveMediaUrl(getCurrentMedia(post))" 
                  alt="Post media" 
                  class="media-element"
                  loading="lazy"
                  @click="openLightbox(resolveMediaUrl(getCurrentMedia(post)))"
                />
              </template>
            </div>

            <!-- Carousel arrows if > 1 -->
            <button 
              v-if="post.image_urls.length > 1 && getMediaIndex(post.id) > 0" 
              class="carousel-arrow prev" 
              @click="prevMedia(post.id)"
            >
              <ChevronLeftIcon :size="20" />
            </button>
            <button 
              v-if="post.image_urls.length > 1 && getMediaIndex(post.id) < post.image_urls.length - 1" 
              class="carousel-arrow next" 
              @click="nextMedia(post.id, post.image_urls.length)"
            >
              <ChevronRightIcon :size="20" />
            </button>

            <!-- Carousel indicators -->
            <div v-if="post.image_urls.length > 1" class="carousel-dots">
              <span 
                v-for="(_, idx) in post.image_urls" 
                :key="idx" 
                class="dot" 
                :class="{ active: getMediaIndex(post.id) === idx }"
              ></span>
            </div>
          </div>
        </div>

        <!-- Post Action Bar (Like, Comment, Share) -->
        <div class="post-actions-bar">
          <button 
            class="action-btn like-btn" 
            :class="{ 'liked': post.is_liked_by_me }" 
            @click="toggleLike(post)"
          >
            <HeartIcon :size="20" :fill="post.is_liked_by_me ? '#ef4444' : 'none'" />
            <span class="action-count">{{ post.likes_count || 0 }}</span>
          </button>

          <button 
            class="action-btn comment-btn" 
            :class="{ 'active-comments': activeCommentPostId === post.id }"
            @click="toggleComments(post.id)"
          >
            <MessageCircleIcon :size="20" />
            <span class="action-count">{{ post.comment_count || 0 }}</span>
          </button>

          <button class="action-btn share-btn" @click="sharePost(post)">
            <Share2Icon :size="18" />
          </button>
        </div>

        <!-- Comments Section (Accordion) -->
        <div v-if="activeCommentPostId === post.id" class="comments-section">
          <div class="comments-header">
            <h5>Comentarii ({{ post.comment_count || 0 }})</h5>
          </div>

          <!-- Add Comment Box -->
          <form @submit.prevent="submitComment(post)" class="add-comment-form">
            <input 
              v-model="commentInputs[post.id]" 
              type="text" 
              placeholder="Scrie un comentariu pozitiv..." 
              class="input-field comment-input"
              required
            />
            <button type="submit" class="btn-primary comment-send-btn" :disabled="sendingComment">
              <SendIcon :size="16" />
            </button>
          </form>

          <!-- Loading comments -->
          <div v-if="loadingComments[post.id]" class="comments-loading">
            Se încarcă comentariile...
          </div>

          <!-- Comments List -->
          <div v-else-if="postComments[post.id] && postComments[post.id].length === 0" class="no-comments">
            Fii primul care lasă un comentariu! ✨
          </div>

          <div v-else class="comments-list">
            <div 
              v-for="c in (postComments[post.id] || [])" 
              :key="c.id" 
              class="comment-bubble"
            >
              <div class="comment-author-avatar">
                <img 
                  v-if="c.author_avatar" 
                  :src="resolveMediaUrl(c.author_avatar)" 
                  class="c-avatar-img" 
                  alt="Avatar"
                />
                <div v-else class="c-avatar-placeholder">
                  {{ (c.author_name || 'U').charAt(0) }}
                </div>
              </div>

              <div class="comment-body-wrap">
                <div class="comment-meta">
                  <span class="c-author-name">{{ c.author_name }}</span>
                  <span class="c-handle" v-if="c.author_display_name">@{{ c.author_display_name }}</span>
                  <span class="c-time">{{ formatRelativeDate(c.created_at) }}</span>
                </div>
                <p class="c-text">{{ c.content }}</p>
              </div>

              <div class="comment-options">
                <button 
                  v-if="isManager || c.is_my_comment" 
                  @click="deleteComment(post, c.id)" 
                  class="comment-opt-btn del"
                  title="Șterge comentariul"
                >
                  <Trash2Icon :size="13" />
                </button>
                <button 
                  v-else 
                  @click="openReportModal(c.id)" 
                  class="comment-opt-btn report"
                  title="Raportează"
                >
                  <FlagIcon :size="13" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </article>
    </div>

    <!-- Report Modal -->
    <div v-if="reportModal.visible" class="modal-overlay" @click.self="reportModal.visible = false">
      <div class="modal-card glass-panel-elevated">
        <h3>Raportează comentariul</h3>
        <p class="modal-sub">Descrie pe scurt motivul pentru care raportezi acest comentariu:</p>
        <textarea 
          v-model="reportModal.reason" 
          class="input-field" 
          rows="3" 
          placeholder="Ex: Limbaj neadecvat, spam sau conținut ofensator..."
        ></textarea>
        <div class="modal-actions" style="display: flex; gap: 1rem; margin-top: 1.25rem;">
          <button @click="reportModal.visible = false" class="btn-secondary" style="flex:1;">Anulează</button>
          <button @click="sendReport" class="btn-danger" style="flex:1;">Trimite Raport</button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div v-if="lightboxUrl" class="modal-overlay" @click="lightboxUrl = null">
      <div class="lightbox-content" @click.stop>
        <img :src="lightboxUrl" alt="Zoomed image" class="lightbox-img" />
        <button class="lightbox-close" @click="lightboxUrl = null">✕</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  HeartIcon, 
  MessageCircleIcon, 
  Share2Icon, 
  Trash2Icon, 
  RefreshCwIcon, 
  AlertTriangleIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SendIcon, 
  FlagIcon, 
  SparklesIcon 
} from 'lucide-vue-next';
import api from '../services/api';

const posts = ref([]);
const loading = ref(true);
const syncing = ref(false);

const currentUser = computed(() => {
  const str = localStorage.getItem('userData');
  return str ? JSON.parse(str) : null;
});

const isManager = computed(() => {
  const role = currentUser.value?.role;
  return role === 'admin' || role === 'coordonator';
});

// ── Student verification check ───────────────────────
const verificationStatus = ref('verified');
const checkVerification = async () => {
  try {
    const res = await api.get('/verification/my-status');
    if (res.data) {
      verificationStatus.value = res.data.status;
    }
  } catch (err) {}
};

const showVerificationBanner = computed(() => {
  return currentUser.value?.role === 'user' && 
         (verificationStatus.value === 'unverified' || verificationStatus.value === 'rejected');
});

// ── Expanded captions state ──────────────────────────
const expandedPosts = ref(new Set());
const isExpanded = (id) => expandedPosts.value.has(id);
const toggleExpand = (id) => {
  if (expandedPosts.value.has(id)) {
    expandedPosts.value.delete(id);
  } else {
    expandedPosts.value.add(id);
  }
};

// ── Carousel index map ───────────────────────────────
const mediaIndices = ref({});
const getMediaIndex = (postId) => mediaIndices.value[postId] || 0;
const getCurrentMedia = (post) => {
  const idx = getMediaIndex(post.id);
  return post.image_urls ? post.image_urls[idx] : '';
};
const prevMedia = (postId) => {
  const cur = getMediaIndex(postId);
  if (cur > 0) mediaIndices.value[postId] = cur - 1;
};
const nextMedia = (postId, max) => {
  const cur = getMediaIndex(postId);
  if (cur < max - 1) mediaIndices.value[postId] = cur + 1;
};

// ── Lightbox ─────────────────────────────────────────
const lightboxUrl = ref(null);
const openLightbox = (url) => {
  lightboxUrl.value = url;
};

// ── Fetch Posts ──────────────────────────────────────
const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/posts');
    posts.value = res.data;
  } catch (error) {
    console.error("Eroare preluare postari:", error);
  } finally {
    loading.value = false;
  }
};

// ── Like / Unlike ────────────────────────────────────
const toggleLike = async (post) => {
  const wasLiked = post.is_liked_by_me;
  post.is_liked_by_me = !wasLiked;
  post.likes_count = parseInt(post.likes_count || 0) + (wasLiked ? -1 : 1);

  try {
    if (wasLiked) {
      await api.delete(`/posts/${post.id}/like`);
    } else {
      await api.post(`/posts/${post.id}/like`);
    }
  } catch (err) {
    // Revert on error
    post.is_liked_by_me = wasLiked;
    post.likes_count = parseInt(post.likes_count || 0) + (wasLiked ? 1 : -1);
  }
};

// ── Comments ─────────────────────────────────────────
const activeCommentPostId = ref(null);
const postComments = ref({});
const loadingComments = ref({});
const commentInputs = ref({});
const sendingComment = ref(false);

const toggleComments = async (postId) => {
  if (activeCommentPostId.value === postId) {
    activeCommentPostId.value = null;
    return;
  }
  activeCommentPostId.value = postId;
  if (!postComments.value[postId]) {
    await fetchCommentsForPost(postId);
  }
};

const fetchCommentsForPost = async (postId) => {
  loadingComments.value[postId] = true;
  try {
    const res = await api.get(`/posts/${postId}/comments`);
    postComments.value[postId] = res.data;
  } catch (err) {
    console.error("Eroare preluare comentarii:", err);
  } finally {
    loadingComments.value[postId] = false;
  }
};

const submitComment = async (post) => {
  const content = (commentInputs.value[post.id] || '').trim();
  if (!content) return;
  sendingComment.value = true;

  try {
    const res = await api.post(`/posts/${post.id}/comments`, { content });
    if (!postComments.value[post.id]) postComments.value[post.id] = [];
    postComments.value[post.id].push(res.data);
    commentInputs.value[post.id] = '';
    post.comment_count = parseInt(post.comment_count || 0) + 1;
  } catch (err) {
    alert('Nu s-a putut trimite comentariul.');
  } finally {
    sendingComment.value = false;
  }
};

const deleteComment = async (post, commentId) => {
  if (!confirm('Ești sigur că vrei să ștergi acest comentariu?')) return;
  try {
    await api.delete(`/posts/comments/${commentId}`);
    postComments.value[post.id] = postComments.value[post.id].filter(c => c.id !== commentId);
    post.comment_count = Math.max(0, parseInt(post.comment_count || 1) - 1);
  } catch (err) {
    alert('Eroare la ștergerea comentariului.');
  }
};

// ── Report Comment ───────────────────────────────────
const reportModal = ref({ visible: false, commentId: null, reason: '' });

const openReportModal = (commentId) => {
  reportModal.value = { visible: true, commentId, reason: '' };
};

const sendReport = async () => {
  if (!reportModal.value.reason.trim()) {
    alert('Te rugăm să specifici un motiv.');
    return;
  }
  try {
    await api.post(`/posts/comments/${reportModal.value.commentId}/report`, {
      reason: reportModal.value.reason.trim()
    });
    alert('Comentariul a fost raportat. Mulțumim!');
    reportModal.value.visible = false;
  } catch (err) {
    alert('Eroare la trimiterea raportului.');
  }
};

// ── Instagram Sync ───────────────────────────────────
const syncInstagram = async () => {
  syncing.value = true;
  try {
    const res = await api.post('/posts/sync-instagram');
    alert(res.data.message || 'Sincronizare reușită!');
    fetchPosts();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la conectarea la Instagram API.');
  } finally {
    syncing.value = false;
  }
};

// ── Delete Post ──────────────────────────────────────
const deletePost = async (postId) => {
  if (!confirm('Sigur dorești să ștergi această postare?')) return;
  try {
    await api.delete(`/posts/${postId}`);
    posts.value = posts.value.filter(p => p.id !== postId);
  } catch (err) {
    alert('Eroare la ștergerea postării.');
  }
};

// ── Share Post ───────────────────────────────────────
const sharePost = (post) => {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: 'Noutăți OSACE',
      text: post.description?.substring(0, 100),
      url: url,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    alert('Link-ul a fost copiat în clipboard!');
  }
};

// ── Helpers ──────────────────────────────────────────
const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.PROD ? 'https://api.osace.ro' : 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isVideo = (url) => {
  if (!url) return false;
  return /\.(mp4|mov|webm)(\?.*)?$/i.test(url) || url.includes('.mp4');
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString.replace ? dateString.replace(' ', 'T') : dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Acum câteva secunde';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Acum ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Acum ${diffHr} ore`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `Acum ${diffDays} zile`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isNewPost = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString.replace ? dateString.replace(' ', 'T') : dateString);
  const diffHours = (new Date() - d) / (1000 * 60 * 60);
  return diffHours < 24;
};

onMounted(() => {
  fetchPosts();
  checkVerification();
});
</script>

<style scoped>
.newsfeed-page {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.sync-btn {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Verification Banner */
.verification-banner {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 14px;
}

.banner-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-warning {
  color: #f59e0b;
}

.banner-content {
  flex: 1;
}

.banner-content h4 {
  font-size: 0.95rem;
  color: #fbbf24;
  margin-bottom: 0.2rem;
}

.banner-content p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.banner-action {
  white-space: nowrap;
}

/* Loading & Empty states */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Feed container & cards */
.feed-container {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.post-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.author-avatar-box .avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  font-family: var(--font-heading);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.author-info {
  flex: 1;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.new-tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
}

.post-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.post-menu .post-del-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.post-del-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.post-content {
  margin-bottom: 1.25rem;
}

.post-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-line;
}

.post-text.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
  cursor: pointer;
  padding: 0;
}

.expand-btn:hover {
  text-decoration: underline;
}

/* Media Carousel */
.post-media-container {
  margin-bottom: 1.25rem;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.media-carousel {
  position: relative;
  width: 100%;
}

.media-item-wrapper {
  width: 100%;
  max-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.media-element {
  width: 100%;
  max-height: 480px;
  object-fit: contain;
  cursor: pointer;
}

.video-element {
  max-height: 480px;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(15, 23, 42, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}

.carousel-arrow:hover {
  background: rgba(59, 130, 246, 0.8);
}

.carousel-arrow.prev { left: 10px; }
.carousel-arrow.next { right: 10px; }

.carousel-dots {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.2s;
}

.dot.active {
  background: white;
  width: 18px;
  border-radius: 4px;
}

/* Actions Bar */
.post-actions-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.like-btn.liked {
  color: #ef4444;
}

.comment-btn.active-comments {
  color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
}

.share-btn {
  margin-left: auto;
}

/* Comments Section */
.comments-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comments-header h5 {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.add-comment-form {
  display: flex;
  gap: 0.5rem;
}

.comment-input {
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
}

.comment-send-btn {
  padding: 0.6rem 1rem;
  border-radius: 10px;
}

.comments-loading, .no-comments {
  text-align: center;
  padding: 1.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-bubble {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.comment-author-avatar .c-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-author-avatar .c-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.comment-body-wrap {
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.c-author-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.c-handle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.c-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.c-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.comment-options .comment-opt-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  color: var(--color-text-muted);
  border-radius: 6px;
  transition: all 0.2s;
}

.comment-opt-btn:hover.del {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
}

.comment-opt-btn:hover.report {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
}

/* Lightbox Modal */
.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
}

.lightbox-close {
  position: absolute;
  top: -15px;
  right: -15px;
  background: #1e293b;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
}
</style>
