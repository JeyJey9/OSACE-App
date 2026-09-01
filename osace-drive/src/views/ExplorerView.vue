<template>
  <div class="explorer-layout">
    <Navbar @search="handleSearch" />

    <div class="explorer-body">
      <Sidebar 
        :top-folders="topLevelFolders" 
        :stats="archiveStats" 
        :is-admin="isAdmin"
        @navigate="navigateToFolder"
        @init-structure="handleInitStructure"
      />

      <main class="explorer-main">
        <!-- Breadcrumbs & Action Toolbar -->
        <div class="main-header-toolbar">
          <Breadcrumbs :path-crumbs="breadcrumbsList" />

          <div class="toolbar-actions">
            <button 
              v-if="canUpload" 
              class="btn btn-secondary btn-sm"
              @click="showNewFolderModal = true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              <span>Folder Nou</span>
            </button>

            <button 
              v-if="canUpload" 
              class="btn btn-primary btn-sm"
              @click="showUploadModal = true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Încarcă Document</span>
            </button>
          </div>
        </div>

        <!-- Search Active Banner -->
        <div v-if="searchQuery" class="search-indicator-bar glass-panel animate-fade-in">
          <span>Rezultate căutare pentru: <strong>"{{ searchQuery }}"</strong> ({{ searchResults.length }} găsite)</span>
          <button class="btn btn-ghost btn-sm" @click="clearSearch">Resetează căutarea</button>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Se încarcă arhiva...</p>
        </div>

        <!-- Main Content (Folders & Documents) -->
        <div v-else class="content-scrollable">
          <!-- Search Results View -->
          <div v-if="searchQuery" class="documents-section">
            <div v-if="searchResults.length === 0" class="empty-state">
              <span class="empty-emoji">🔍</span>
              <h3>Niciun document găsit</h3>
              <p>Încearcă un alt termen de căutare.</p>
            </div>
            <div v-else class="documents-list">
              <DocumentItem 
                v-for="doc in searchResults" 
                :key="doc.id" 
                :doc="doc" 
                :can-delete="canDelete"
                @inspect="inspectDocument(doc)"
                @delete="deleteDocument(doc)"
              />
            </div>
          </div>

          <!-- Normal Explorer View -->
          <div v-else>
            <!-- Subfolders Section -->
            <div v-if="folders.length > 0" class="folders-section">
              <h3 class="section-title">
                {{ isRoot ? 'Categorii Principale' : 'Subfoldere' }}
              </h3>
              <div class="folders-grid">
                <FolderCard 
                  v-for="folder in folders" 
                  :key="folder.id" 
                  :folder="folder" 
                  @open="openFolder(folder)"
                />
              </div>
            </div>

            <!-- Documents Section -->
            <div v-if="documents.length > 0" class="documents-section">
              <h3 class="section-title">Documente ({{ documents.length }})</h3>
              <div class="documents-list">
                <DocumentItem 
                  v-for="doc in documents" 
                  :key="doc.id" 
                  :doc="doc" 
                  :can-delete="canDelete"
                  @inspect="inspectDocument(doc)"
                  @delete="deleteDocument(doc)"
                />
              </div>
            </div>

            <!-- Empty State for Empty Folder or Fresh Archive -->
            <div v-if="folders.length === 0 && documents.length === 0" class="empty-state glass-panel">
              <span class="empty-emoji">📂</span>
              <h3 v-if="isRoot">Arhiva este neinițializată</h3>
              <h3 v-else>Acest folder este gol</h3>
              
              <p v-if="isRoot">Apasă pe butonul de mai jos pentru a genera automat structura de foldere O.S.A.C.E.</p>
              <p v-else>Poți încărca primul document folosind butonul „Încarcă Document”.</p>

              <div class="empty-actions">
                <button 
                  v-if="isRoot && isAdmin" 
                  class="btn btn-primary"
                  @click="handleInitStructure"
                >
                  ⚡ Inițializează Structura Implicită
                </button>
                <button 
                  v-else-if="canUpload" 
                  class="btn btn-primary"
                  @click="showUploadModal = true"
                >
                  📤 Încarcă Primul Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <UploadModal 
      v-if="showUploadModal" 
      :folder-id="currentFolderId"
      @close="showUploadModal = false"
      @uploaded="handleDocumentUploaded"
    />

    <NewFolderModal 
      v-if="showNewFolderModal" 
      :parent-id="currentFolderId"
      @close="showNewFolderModal = false"
      @created="handleFolderCreated"
    />

    <DocumentDetailsModal 
      v-if="inspectedDoc" 
      :doc="inspectedDoc"
      @close="inspectedDoc = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import FolderCard from '../components/FolderCard.vue';
import DocumentItem from '../components/DocumentItem.vue';
import UploadModal from '../components/UploadModal.vue';
import NewFolderModal from '../components/NewFolderModal.vue';
import DocumentDetailsModal from '../components/DocumentDetailsModal.vue';
import api from '../services/api';

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const folders = ref([]);
const documents = ref([]);
const currentFolder = ref(null);
const topLevelFolders = ref([]);
const archiveStats = ref(null);

const searchQuery = ref('');
const searchResults = ref([]);

const showUploadModal = ref(false);
const showNewFolderModal = ref(false);
const inspectedDoc = ref(null);

const user = computed(() => {
  const userStr = localStorage.getItem('userData');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
});

const isAdmin = computed(() => user.value?.role === 'admin');
const isCoordinator = computed(() => user.value?.role === 'coordonator');
const canUpload = computed(() => isAdmin.value || isCoordinator.value);
const canDelete = computed(() => isAdmin.value || isCoordinator.value);

const currentFolderId = computed(() => {
  return route.params.id ? parseInt(route.params.id, 10) : null;
});

const isRoot = computed(() => !currentFolderId.value);

const breadcrumbsList = computed(() => {
  if (!currentFolder.value) return [];
  const parts = (currentFolder.value.logical_path || '').split('/').filter(Boolean);
  return parts.map((name, idx) => ({
    name,
    id: idx === parts.length - 1 ? currentFolder.value.id : null,
  }));
});

async function loadData() {
  isLoading.value = true;
  try {
    // 1. Incarcam folderele de top pentru sidebar
    const topRes = await api.get('/archive/folders');
    topLevelFolders.value = topRes.data;

    // 2. Incarcam statistici
    const statsRes = await api.get('/archive/stats');
    archiveStats.value = statsRes.data;

    // 3. Incarcam folderul curent
    if (currentFolderId.value) {
      const folderRes = await api.get(`/archive/folders/${currentFolderId.value}`);
      currentFolder.value = folderRes.data.folder;
      folders.value = folderRes.data.subfolders;
      documents.value = folderRes.data.documents;
    } else {
      currentFolder.value = null;
      folders.value = topRes.data;
      documents.value = [];
    }
  } catch (err) {
    console.error('Eroare la incarcarea arhivei:', err);
  } finally {
    isLoading.value = false;
  }
}

function openFolder(folder) {
  router.push(`/folder/${folder.id}`);
}

function navigateToFolder(id) {
  router.push(`/folder/${id}`);
}

async function handleInitStructure() {
  if (!confirm('Vrei să inițializezi automat structura oficială de foldere O.S.A.C.E.?')) return;
  try {
    isLoading.value = true;
    await api.post('/archive/init-structure');
    await loadData();
    alert('Structura oficială a fost creată cu succes!');
  } catch (err) {
    console.error('Eroare la initializare structura:', err);
    alert(err.response?.data?.error || 'Eroare la initializarea structurii.');
  } finally {
    isLoading.value = false;
  }
}

function inspectDocument(doc) {
  inspectedDoc.value = doc;
}

async function deleteDocument(doc) {
  if (!confirm(`Sigur dorești să ștergi documentul „${doc.name}”?`)) return;
  try {
    await api.delete(`/archive/documents/${doc.id}`);
    documents.value = documents.value.filter(d => d.id !== doc.id);
    if (archiveStats.value) {
      archiveStats.value.totalDocuments = Math.max(0, archiveStats.value.totalDocuments - 1);
    }
  } catch (err) {
    console.error('Eroare la stergere document:', err);
    alert('Nu s-a putut șterge documentul.');
  }
}

function handleDocumentUploaded(newDoc) {
  documents.value.unshift(newDoc);
  if (archiveStats.value) {
    archiveStats.value.totalDocuments += 1;
    archiveStats.value.totalSizeBytes = Number(archiveStats.value.totalSizeBytes || 0) + Number(newDoc.size_bytes || 0);
  }
}

function handleFolderCreated(newFolder) {
  folders.value.push(newFolder);
}

async function handleSearch(q) {
  searchQuery.value = q;
  if (!q || !q.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    const res = await api.get(`/archive/search?q=${encodeURIComponent(q.trim())}`);
    searchResults.value = res.data;
  } catch (err) {
    console.error('Eroare la cautare:', err);
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
}

watch(() => route.params.id, () => {
  clearSearch();
  loadData();
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.explorer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.explorer-body {
  display: flex;
  flex: 1;
}

.explorer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  background: var(--bg-main);
  overflow-y: auto;
}

.main-header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-indicator-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  margin-bottom: 20px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.folders-section {
  margin-bottom: 32px;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.documents-section {
  margin-bottom: 32px;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  border-radius: var(--radius-lg);
}

.empty-emoji {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 6px;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 420px;
  margin-bottom: 20px;
}
</style>
