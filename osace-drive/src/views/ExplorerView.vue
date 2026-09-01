<template>
  <div class="explorer-layout">
    <Navbar @search="handleSearch" @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" />

    <div class="explorer-body">
      <Sidebar 
        :top-folders="topLevelFolders" 
        :stats="archiveStats" 
        :is-admin="isAdmin"
        :is-open="isMobileSidebarOpen"
        @close="isMobileSidebarOpen = false"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Încarcă Document</span>
            </button>
          </div>
        </div>

        <!-- Search Active Banner -->
        <div v-if="searchQuery" class="search-banner panel animate-fade-in">
          <span>Rezultate căutare pentru: <strong>"{{ searchQuery }}"</strong> ({{ searchResults.length }} găsite)</span>
          <button class="btn btn-ghost btn-sm" @click="clearSearch">Resetează căutarea</button>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>Se accesează arhiva...</span>
        </div>

        <!-- Main Content -->
        <div v-else class="content-scrollable">
          <!-- Search Results View -->
          <div v-if="searchQuery" class="section-block">
            <div v-if="searchResults.length === 0" class="empty-placeholder">
              <svg class="empty-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h4>Niciun document găsit</h4>
              <p>Încearcă un alt cuvânt cheie sau verifică ortografia.</p>
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
            <div v-if="folders.length > 0" class="section-block">
              <div class="section-head">
                <span class="section-title">{{ isRoot ? 'Categorii Principale' : 'Directoare' }}</span>
                <span class="section-count">{{ folders.length }}</span>
              </div>
              <div class="folders-grid">
                <FolderCard 
                  v-for="folder in folders" 
                  :key="folder.id" 
                  :folder="folder" 
                  :can-edit="isAdmin || isCoordinator"
                  @open="openFolder(folder)"
                  @edit="editingFolder = folder"
                />
              </div>
            </div>

            <!-- Documents Section -->
            <div v-if="documents.length > 0" class="section-block">
              <div class="section-head">
                <span class="section-title">Fișiere & Documente</span>
                <span class="section-count">{{ documents.length }}</span>
              </div>
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
            <div v-if="folders.length === 0 && documents.length === 0" class="empty-placeholder panel">
              <svg class="empty-svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
              <h4 v-if="isRoot">Arhiva este neinițializată</h4>
              <h4 v-else>Acest director este gol</h4>
              
              <p v-if="isRoot">Apasă pe butonul de mai jos pentru a genera structura oficială de foldere O.S.A.C.E.</p>
              <p v-else>Poți încărca un document în acest director folosind butonul de mai sus.</p>

              <div class="empty-actions" v-if="isRoot && isAdmin">
                <button 
                  class="btn btn-primary"
                  @click="handleInitStructure"
                >
                  Inițializează Structura Implicită
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

    <EditFolderModal
      v-if="editingFolder"
      :folder="editingFolder"
      @close="editingFolder = null"
      @updated="handleFolderUpdated"
      @deleted="handleFolderDeleted"
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
import EditFolderModal from '../components/EditFolderModal.vue';
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
const editingFolder = ref(null);
const inspectedDoc = ref(null);
const isMobileSidebarOpen = ref(false);

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
    const topRes = await api.get('/archive/folders');
    topLevelFolders.value = topRes.data;

    const statsRes = await api.get('/archive/stats');
    archiveStats.value = statsRes.data;

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

function handleFolderUpdated(updatedFolder) {
  const idx = folders.value.findIndex(f => f.id === updatedFolder.id);
  if (idx !== -1) {
    folders.value[idx] = updatedFolder;
  }
  const topIdx = topLevelFolders.value.findIndex(f => f.id === updatedFolder.id);
  if (topIdx !== -1) {
    topLevelFolders.value[topIdx] = updatedFolder;
  }
}

function handleFolderDeleted(deletedId) {
  folders.value = folders.value.filter(f => f.id !== deletedId);
  topLevelFolders.value = topLevelFolders.value.filter(f => f.id !== deletedId);
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
  padding: 18px 24px;
  background: var(--bg-app);
  overflow-y: auto;
}

.main-header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 16px;
  font-size: 0.8125rem;
  background: var(--bg-surface-elevated);
}

.section-block {
  margin-bottom: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.section-count {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-svg {
  color: var(--text-muted);
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-placeholder h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-placeholder p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  max-width: 380px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .explorer-main {
    padding: 12px 10px;
  }

  .main-header-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 14px;
  }

  .toolbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }

  .toolbar-actions .btn {
    width: 100%;
    padding: 8px 6px;
    font-size: 0.75rem;
  }

  .folders-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
