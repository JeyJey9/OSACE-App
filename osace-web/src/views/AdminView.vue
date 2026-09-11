<template>
  <div class="admin-view">
    <header class="page-header">
      <div class="header-content">
        <h1>Panou Administrare</h1>
        <p class="subtitle">Gestionează activitățile, orele, utilizatorii și comunitatea OSACE.</p>
      </div>
      <div class="header-status-badge" v-if="totalPendingCount > 0">
        <span class="status-pulse"></span>
        <span>{{ totalPendingCount }} {{ totalPendingCount === 1 ? 'acțiune în așteptare' : 'acțiuni în așteptare' }}</span>
      </div>
    </header>

    <!-- Categorized Admin Navigation Ribbon (Zero Horizontal Scrolling) -->
    <nav class="admin-nav-bar glass-panel" aria-label="Navigare Administrare">
      <!-- 1. Evenimente & Ore -->
      <div class="nav-cluster">
        <span class="cluster-title">Evenimente & Ore</span>
        <div class="cluster-buttons">
          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'events' }]" 
            @click="selectTab('events')"
          >
            <Calendar :size="15" />
            <span>Gestiune Evenimente</span>
          </button>

          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'hour_requests' }]" 
            @click="selectTab('hour_requests')"
          >
            <Clock :size="15" />
            <span>Aprobări Ore</span>
            <span v-if="pendingCounts.hourRequests > 0" class="count-bubble">{{ pendingCounts.hourRequests }}</span>
          </button>

          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'assign' }]" 
            @click="selectTab('assign')"
          >
            <PlusCircle :size="15" />
            <span>Acordare Ore</span>
          </button>

          <button 
            v-if="isAdmin"
            type="button"
            :class="['nav-chip', { active: activeTab === 'requests' }]" 
            @click="selectTab('requests')"
          >
            <FileText :size="15" />
            <span>Aprobări Contribuții</span>
            <span v-if="pendingCounts.contributionRequests > 0" class="count-bubble">{{ pendingCounts.contributionRequests }}</span>
          </button>

          <button 
            v-if="isAdmin"
            type="button"
            :class="['nav-chip', { active: activeTab === 'manage_contributions' }]" 
            @click="selectTab('manage_contributions')"
          >
            <Folder :size="15" />
            <span>Toate Contribuțiile</span>
          </button>
        </div>
      </div>

      <div class="cluster-divider"></div>

      <!-- 2. Membri & Comunitate -->
      <div class="nav-cluster">
        <span class="cluster-title">Membri & Moderare</span>
        <div class="cluster-buttons">
          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'users' }]" 
            @click="selectTab('users')"
          >
            <Users :size="15" />
            <span>Utilizatori</span>
          </button>

          <button 
            v-if="isAdmin"
            type="button"
            :class="['nav-chip', { active: activeTab === 'verifications' }]" 
            @click="selectTab('verifications')"
          >
            <GraduationCap :size="15" />
            <span>Verificări Legitimație</span>
            <span v-if="pendingCounts.studentVerifications > 0" class="count-bubble">{{ pendingCounts.studentVerifications }}</span>
          </button>

          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'reports' }]" 
            @click="selectTab('reports')"
          >
            <Flag :size="15" />
            <span>Comentarii Raportate</span>
            <span v-if="pendingCounts.reportedComments > 0" class="count-bubble">{{ pendingCounts.reportedComments }}</span>
          </button>
        </div>
      </div>

      <div class="cluster-divider" v-if="isAdmin"></div>

      <!-- 3. Sistem & Instrumente -->
      <div class="nav-cluster" v-if="isAdmin">
        <span class="cluster-title">Sistem & Audit</span>
        <div class="cluster-buttons">
          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'badges' }]" 
            @click="selectTab('badges')"
          >
            <Award :size="15" />
            <span>Badge-uri</span>
          </button>

          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'notifications' }]" 
            @click="selectTab('notifications')"
          >
            <Bell :size="15" />
            <span>Notificări Push</span>
          </button>

          <button 
            type="button"
            :class="['nav-chip', { active: activeTab === 'logs' }]" 
            @click="selectTab('logs')"
          >
            <Shield :size="15" />
            <span>Jurnal Audit</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- ========================================================= -->
    <!-- TAB 1: APROBĂRI ORE (HOUR REQUESTS)                      -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'hour_requests'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Aprobări Ore de Voluntariat</h3>
          <p class="desc">Aprobă, ajustează sau respinge orele solicitate de voluntari la activități.</p>
        </div>
        <button @click="fetchHourRequests" class="btn-secondary btn-sm">Reîmprospătează</button>
      </div>

      <div v-if="loadingHourReqs" class="loading-state">Se încarcă cererile de ore...</div>
      <div v-else-if="hourRequests.length === 0" class="empty-state glass-panel">
        <CheckCircle2 :size="32" class="text-success" style="margin-bottom: 0.5rem;" />
        <h4>Toate cererile de ore au fost procesate</h4>
        <p class="empty-sub">Nu există solicitări de ore în așteptare în acest moment.</p>
      </div>
      <div v-else class="requests-grid">
        <div v-for="req in hourRequests" :key="req.id" class="request-card glass-panel">
          <div class="req-header">
            <h4>{{ req.first_name }} {{ req.last_name }}</h4>
            <span class="badge-pill badge-blue">@{{ req.display_name }}</span>
          </div>

          <p class="req-event-title">
            <MapPin :size="13" />
            <span>{{ req.event_title }}</span>
          </p>

          <div class="req-time-details">
            <div v-if="req.check_in_time" class="time-row">
              <span class="label">Check-in:</span>
              <span>{{ formatDateTime(req.check_in_time) }}</span>
            </div>
            <div v-if="req.check_out_time" class="time-row">
              <span class="label">Check-out:</span>
              <span>{{ formatDateTime(req.check_out_time) }}</span>
            </div>
            <div class="time-row">
              <span class="label">Trimis la:</span>
              <span>{{ formatDateTime(req.created_at) }}</span>
            </div>
          </div>

          <div class="hour-adjust-row">
            <label>Ore de aprobat:</label>
            <input 
              type="number" 
              step="0.5" 
              min="0"
              v-model="hourInputs[req.id]" 
              class="input-field hour-input"
            />
          </div>

          <div class="action-buttons">
            <button @click="handleHourReject(req.id)" class="btn-reject" :disabled="actingHourId === req.id">
              Respinge
            </button>
            <button @click="handleHourApprove(req.id)" class="btn-approve" :disabled="actingHourId === req.id">
              Aprobă {{ hourInputs[req.id] }}h
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 2: VERIFICĂRI LEGITIMAȚIE                            -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'verifications'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Verificări Legitimație Student</h3>
          <p class="desc">Aprobă sau respinge solicitările de validare a calității de student.</p>
        </div>
        <button @click="fetchVerifications" class="btn-secondary btn-sm">Reîmprospătează</button>
      </div>

      <div v-if="loadingVerif" class="loading-state">Se încarcă cererile de verificare...</div>
      <div v-else-if="verifications.length === 0" class="empty-state glass-panel">
        <ShieldCheck :size="32" class="text-success" style="margin-bottom: 0.5rem;" />
        <h4>Toate legitimațiile au fost verificate</h4>
        <p class="empty-sub">Nu există solicitări de validare a calității de student în așteptare.</p>
      </div>
      <div v-else class="requests-grid">
        <div v-for="v in verifications" :key="v.id" class="request-card glass-panel">
          <div class="req-header">
            <h4>{{ v.first_name }} {{ v.last_name }}</h4>
            <span class="badge-pill badge-yellow">@{{ v.display_name }}</span>
          </div>
          <p class="req-email">{{ v.email }}</p>

          <!-- Clickable Image Thumbnail for Lightbox -->
          <div class="id-image-wrapper" @click="lightboxImg = resolveUploadUrl(v.image_url)">
            <img :src="resolveUploadUrl(v.image_url)" alt="Student ID" class="id-thumbnail" />
            <span class="zoom-hint">
              <ZoomIn :size="13" />
              <span>Mărește</span>
            </span>
          </div>

          <div class="action-buttons">
            <button @click="openVerifReject(v.id)" class="btn-reject">Respinge</button>
            <button @click="handleVerifApprove(v.id, v.first_name + ' ' + v.last_name)" class="btn-approve">Aprobă</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 3: APROBĂRI CONTRIBUȚII                               -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'requests'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Aprobări Contribuții Speciale</h3>
          <p class="desc">Cereri de ore externe trimise de coordonatori ce necesită acordul unui administrator.</p>
        </div>
        <button @click="fetchRequests" class="btn-secondary btn-sm">Reîmprospătează</button>
      </div>

      <div v-if="loadingRequests" class="loading-state">Se încarcă cererile...</div>
      <div v-else-if="requests.length === 0" class="empty-state glass-panel">
        Nu există cereri de contribuții speciale în așteptare.
      </div>
      <div v-else class="requests-grid">
        <div v-for="req in requests" :key="req.id" class="request-card glass-panel">
          <div class="req-header">
            <h4>{{ req.title }}</h4>
            <span class="hours-tag">+{{ req.awarded_hours }}h</span>
          </div>
          <p class="req-desc">{{ req.description }}</p>
          <div class="req-meta">
            <span>Voluntar: <strong>{{ req.target_first }} {{ req.target_last }}</strong></span>
            <span>Solicitat de: {{ req.coord_first }} {{ req.coord_last }}</span>
          </div>
          <div class="action-buttons">
            <button @click="handleContributionAction(req.id, 'reject')" class="btn-reject">Respinge</button>
            <button @click="handleContributionAction(req.id, 'approve')" class="btn-approve">Aprobă</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 4: GESTIONEAZĂ TOATE CONTRIBUȚIILE                     -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'manage_contributions'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Toate Contribuțiile Înregistrate</h3>
          <p class="desc">Editează sau șterge contribuțiile speciale deja acordate voluntarilor.</p>
        </div>
        <button @click="fetchAllContributions" class="btn-secondary btn-sm">Reîmprospătează</button>
      </div>

      <div v-if="loadingAllContrib" class="loading-state">Se încarcă lista de contribuții...</div>
      <div v-else-if="allContributions.length === 0" class="empty-state glass-panel">
        Nu există nicio contribuție înregistrată.
      </div>
      <div v-else class="table-responsive glass-panel" style="padding: 1rem;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Voluntar</th>
              <th>Titlu</th>
              <th>Descriere</th>
              <th>Ore</th>
              <th>Acordat de</th>
              <th>Data</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in allContributions" :key="c.id">
              <td><strong>{{ c.first_name }} {{ c.last_name }}</strong></td>
              <td>{{ c.title }}</td>
              <td class="desc-cell">{{ c.description }}</td>
              <td><span class="hours-tag">+{{ c.awarded_hours }}h</span></td>
              <td>{{ c.coordinator_name || 'Admin' }}</td>
              <td>{{ formatDate(c.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button @click="openEditContribution(c)" class="btn-secondary btn-sm">Editează</button>
                  <button @click="deleteContribution(c.id)" class="btn-danger-sm">Șterge</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 5: ACORDARE ORE (CREAZĂ CONTRIBUȚIE)                   -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'assign'" class="tab-content">
      <div class="assign-form glass-panel">
        <h3>Nouă Contribuție Specială</h3>
        <p class="desc">Acordă ore manual unui voluntar pentru task-uri, logistică sau activități externe.</p>
        
        <form @submit.prevent="submitContribution">
          <div class="form-group">
            <label>Alege Voluntar</label>
            <select v-model="form.user_id" class="input-field" required>
              <option value="" disabled>-- Selectează un voluntar --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.first_name }} {{ u.last_name }} ({{ u.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Titlu Contribuție</label>
            <input v-model="form.title" type="text" class="input-field" placeholder="Ex: Organizare stand facultate" required />
          </div>
          <div class="form-group">
            <label>Descriere Detaliată</label>
            <textarea v-model="form.description" class="input-field" rows="3" placeholder="Explică ce activitate a desfășurat voluntarul..." required></textarea>
          </div>
          <div class="form-group">
            <label>Ore Acordate</label>
            <input v-model="form.awarded_hours" type="number" step="0.5" class="input-field" required />
          </div>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Se trimite...' : 'Trimite Cerere' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 6: COMENTARII RAPORTATE                                -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'reports'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Comentarii Raportate</h3>
          <p class="desc">Moderează comentariile semnalate de membri ai comunității.</p>
        </div>
        <button @click="fetchReports" class="btn-secondary btn-sm">Reîmprospătează</button>
      </div>

      <div v-if="loadingReports" class="loading-state">Se încarcă rapoartele...</div>
      <div v-else-if="reports.length === 0" class="empty-state glass-panel">
        <CheckCircle2 :size="32" class="text-success" style="margin-bottom: 0.5rem;" />
        <h4>Niciun comentariu raportat</h4>
        <p class="empty-sub">Nu există rapoarte de moderare în așteptare.</p>
      </div>
      <div v-else class="requests-grid">
        <div v-for="r in reports" :key="r.report_id" class="request-card glass-panel">
          <div class="req-header">
            <h4>Comentariu de la {{ r.author_name }}</h4>
            <span :class="['badge-pill', r.status === 'pending' ? 'badge-yellow' : 'badge-green']">
              {{ r.status }}
            </span>
          </div>

          <div class="comment-preview-box">
            <p class="comment-text">"{{ r.comment_content }}"</p>
          </div>

          <div class="report-meta">
            <span>Raportat de: <strong>{{ r.reporter_name }}</strong></span>
            <span>Motiv: <em>{{ r.reason || 'Nespecificat' }}</em></span>
            <span>Data: {{ formatDateTime(r.created_at) }}</span>
          </div>

          <div class="action-buttons">
            <button @click="handleDismissReport(r.report_id)" class="btn-secondary btn-sm">Respinge Raport</button>
            <button @click="handleDeleteReportedComment(r)" class="btn-danger-sm">Șterge Comentariu</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 7: GESTIUNE EVENIMENTE                                 -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'events'" class="tab-content">
      <EventManagement />
    </div>

    <!-- ========================================================= -->
    <!-- TAB 8: GESTIUNE UTILIZATORI                                -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'users'" class="tab-content">
      <UserManagement />
    </div>

    <!-- ========================================================= -->
    <!-- TAB 9: GESTIUNE BADGE-URI                                  -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'badges'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Gestiune Insigne (Badges)</h3>
          <p class="desc">Creează, editează sau șterge insignele disponibile în sistem.</p>
        </div>
        <button @click="openCreateBadge" class="btn-primary btn-sm">+ Adaugă Badge</button>
      </div>

      <div v-if="loadingBadges" class="loading-state">Se încarcă badge-urile...</div>
      <div v-else class="badges-admin-grid">
        <div v-for="b in badges" :key="b.id" class="badge-admin-card glass-panel">
          <div class="badge-admin-top">
            <div class="badge-preview-circle">
              <AwardIcon :size="24" />
            </div>
            <div>
              <h4>{{ b.name }}</h4>
              <span class="badge-key-tag">{{ b.key || b.rule_type }}</span>
            </div>
          </div>
          <p class="badge-admin-desc">{{ b.description }}</p>
          <div class="badge-admin-meta">
            <span>Regulă: <strong>{{ b.rule_type }}</strong></span>
            <span>Prag: <strong>{{ b.threshold || 0 }}</strong></span>
          </div>
          <div class="badge-admin-actions">
            <button @click="openEditBadge(b)" class="btn-secondary btn-sm">Editează</button>
            <button @click="deleteBadge(b.id)" class="btn-danger-sm">Șterge</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 10: TRIMITE NOTIFICĂRI PUSH                            -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'notifications'" class="tab-content">
      <div class="assign-form glass-panel">
        <h3>Trimite Notificare Push</h3>
        <p class="desc">Trimite o notificare instant către telefoanele voluntarilor și în interfața web.</p>

        <form @submit.prevent="submitNotification">
          <div class="form-group">
            <label>Titlu Notificare</label>
            <input v-model="notifyForm.title" type="text" class="input-field" placeholder="Ex: Activitate nouă sâmbătă!" required />
          </div>
          <div class="form-group">
            <label>Mesaj Detaliat</label>
            <textarea v-model="notifyForm.message" class="input-field" rows="3" placeholder="Scrie conținutul notificării..." required></textarea>
          </div>
          <div class="form-group">
            <label>Grupuri Țintă (Roluri):</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="voluntar" /> Voluntari
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="coordonator" /> Coordonatori
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifyForm.roles" value="admin" /> Administratori
              </label>
            </div>
          </div>
          <button type="submit" class="btn-primary" :disabled="submittingNotify">
            {{ submittingNotify ? 'Se trimite...' : 'Trimite Notificare' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- TAB 11: JURNAL DE AUDIT                                    -->
    <!-- ========================================================= -->
    <div v-if="activeTab === 'logs'" class="tab-content">
      <div class="content-header">
        <div>
          <h3>Jurnal de Audit</h3>
          <p class="desc">Toate acțiunile administrative, în ordine cronologică inversă.</p>
        </div>
      </div>

      <div v-if="loadingLogs" class="loading-state">Se încarcă jurnalele...</div>
      <div v-else-if="auditLogs.length === 0" class="empty-state glass-panel">Nu există înregistrări în jurnal.</div>
      <div v-else class="logs-list">
        <div v-for="log in auditLogs" :key="log.id" class="log-entry glass-panel">
          <div class="log-bar" :style="{ backgroundColor: getActionColor(log.action) }"></div>
          <div class="log-body">
            <div class="log-top">
              <span class="log-badge" :style="{ backgroundColor: getActionColor(log.action) + '22', color: getActionColor(log.action) }">
                {{ getActionLabel(log.action) }}
              </span>
              <span class="log-time">{{ formatDateTime(log.created_at) }}</span>
            </div>
            <div class="log-actor">
              <strong>{{ log.actor_name }}</strong>
              <span class="log-role"> ({{ log.actor_role }})</span>
            </div>
            <div v-if="log.target_type" class="log-target">
              Target: <span>{{ log.target_type }} #{{ log.target_id }}</span>
            </div>
            <div v-if="log.details && Object.keys(log.details).length" class="log-details">
              {{ formatDetails(log.details) }}
            </div>
          </div>
        </div>

        <div class="logs-pagination">
          <button @click="fetchAuditLogs(logsPage - 1)" :disabled="logsPage <= 1" class="btn-secondary btn-sm">← Anterior</button>
          <span>Pagina {{ logsPage }} / {{ logsTotalPages }}</span>
          <button @click="fetchAuditLogs(logsPage + 1)" :disabled="logsPage >= logsTotalPages" class="btn-secondary btn-sm">Următor →</button>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODALS                                                    -->
    <!-- ========================================================= -->

    <!-- Verif Reject Modal -->
    <div v-if="verifRejectModal.visible" class="modal-overlay" @click.self="verifRejectModal.visible = false">
      <div class="modal-card glass-panel-elevated">
        <h3>Motiv respingere legitimație</h3>
        <p class="modal-sub">Explică utilizatorului ce trebuie corectat (acest mesaj va fi vizibil în profilul său):</p>
        <textarea v-model="verifRejectReason" class="input-field" rows="3" placeholder="Ex: Fotografia este neclară sau lipsește viza pe anul universitar curent..."></textarea>
        <div class="modal-actions" style="display:flex;gap:1rem;margin-top:1rem;">
          <button @click="verifRejectModal.visible = false" class="btn-secondary" style="flex:1;">Anulează</button>
          <button @click="handleVerifReject" class="btn-danger" style="flex:1;">Respinge</button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div v-if="lightboxImg" class="modal-overlay" @click="lightboxImg = null">
      <div class="lightbox-modal-wrap" @click.stop>
        <img :src="lightboxImg" alt="Enlarged legitimație" class="lightbox-img" />
        <button class="lightbox-close" @click="lightboxImg = null">✕</button>
      </div>
    </div>

    <!-- Badge Create / Edit Modal -->
    <div v-if="badgeModal.visible" class="modal-overlay" @click.self="badgeModal.visible = false">
      <div class="modal-card glass-panel-elevated">
        <h3>{{ badgeModal.isEdit ? 'Editează Badge' : 'Creează Badge Nou' }}</h3>
        <form @submit.prevent="saveBadge" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
          <div class="form-group">
            <label>Nume Badge</label>
            <input v-model="badgeModal.form.name" type="text" class="input-field" required />
          </div>
          <div class="form-group">
            <label>Descriere</label>
            <textarea v-model="badgeModal.form.description" class="input-field" rows="2" required></textarea>
          </div>
          <div class="form-group">
            <label>Cheie Unică (Key)</label>
            <input v-model="badgeModal.form.key" type="text" class="input-field" placeholder="Ex: HOURS_50" required />
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Tip Regulă</label>
              <select v-model="badgeModal.form.rule_type" class="input-field">
                <option value="hours">Ore acumulate</option>
                <option value="events_attended">Activități participat</option>
                <option value="social_hours">Ore Social</option>
                <option value="first_event">Prima activitate</option>
                <option value="manual">Manual / Special</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Prag (Threshold)</label>
              <input v-model="badgeModal.form.threshold" type="number" step="1" class="input-field" />
            </div>
          </div>
          <div class="form-group">
            <label>Icon</label>
            <input v-model="badgeModal.form.icon" type="text" class="input-field" placeholder="Ex: trophy, flame, star, award" />
          </div>
          <div class="modal-actions" style="display:flex;gap:1rem;margin-top:1rem;">
            <button type="button" @click="badgeModal.visible = false" class="btn-secondary" style="flex:1;">Anulează</button>
            <button type="submit" class="btn-primary" style="flex:1;">Salvează</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Contribution Modal -->
    <div v-if="editContribModal.visible" class="modal-overlay" @click.self="editContribModal.visible = false">
      <div class="modal-card glass-panel-elevated">
        <h3>Editează Contribuția</h3>
        <form @submit.prevent="saveEditContribution" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
          <div class="form-group">
            <label>Titlu</label>
            <input v-model="editContribModal.form.title" type="text" class="input-field" required />
          </div>
          <div class="form-group">
            <label>Descriere</label>
            <textarea v-model="editContribModal.form.description" class="input-field" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>Ore Acordate</label>
            <input v-model="editContribModal.form.awarded_hours" type="number" step="0.5" class="input-field" required />
          </div>
          <div class="modal-actions" style="display:flex;gap:1rem;margin-top:1rem;">
            <button type="button" @click="editContribModal.visible = false" class="btn-secondary" style="flex:1;">Anulează</button>
            <button type="submit" class="btn-primary" style="flex:1;">Actualizează</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Calendar, 
  Clock, 
  PlusCircle, 
  FileText, 
  Folder, 
  Users, 
  GraduationCap, 
  Flag, 
  Award, 
  Bell, 
  Shield,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ZoomIn
} from 'lucide-vue-next';
import api from '../services/api';
import EventManagement from '../components/EventManagement.vue';
import UserManagement from '../components/UserManagement.vue';

const route = useRoute();
const activeTab = ref(sessionStorage.getItem('adminActiveTab') || 'events');

const selectTab = (tab) => {
  activeTab.value = tab;
  sessionStorage.setItem('adminActiveTab', tab);
  if (tab === 'hour_requests') fetchHourRequests();
  else if (tab === 'verifications') fetchVerifications();
  else if (tab === 'requests') fetchRequests();
  else if (tab === 'manage_contributions') fetchAllContributions();
  else if (tab === 'reports') fetchReports();
  else if (tab === 'badges') fetchBadges();
  else if (tab === 'logs') fetchAuditLogs();
};

const currentUser = computed(() => {
  const str = localStorage.getItem('userData');
  return str ? JSON.parse(str) : null;
});

const isAdmin = computed(() => currentUser.value?.role === 'admin');

// ── Pending Counts State ─────────────────────────────
const pendingCounts = ref({
  hourRequests: 0,
  reportedComments: 0,
  contributionRequests: 0,
  studentVerifications: 0,
});

const fetchPendingCounts = async () => {
  try {
    const res = await api.get('/admin/pending-counts');
    if (res.data) pendingCounts.value = res.data;
  } catch (err) {}
};

const totalPendingCount = computed(() => {
  return (pendingCounts.value.hourRequests || 0) + 
         (pendingCounts.value.studentVerifications || 0) + 
         (pendingCounts.value.contributionRequests || 0) + 
         (pendingCounts.value.reportedComments || 0);
});

// ── 1. Hour Requests ─────────────────────────────────
const hourRequests = ref([]);
const loadingHourReqs = ref(false);
const hourInputs = ref({});
const actingHourId = ref(null);

const fetchHourRequests = async () => {
  loadingHourReqs.value = true;
  try {
    const res = await api.get('/admin/hour-requests');
    hourRequests.value = res.data;
    const inputs = {};
    res.data.forEach(r => {
      inputs[r.id] = r.requested_hours;
    });
    hourInputs.value = inputs;
    fetchPendingCounts();
  } catch (err) {
    console.error('Eroare preluare hour requests:', err);
  } finally {
    loadingHourReqs.value = false;
  }
};

const handleHourApprove = async (id) => {
  const val = parseFloat(hourInputs.value[id]);
  if (isNaN(val) || val < 0) {
    alert('Te rugăm să introduci un număr valid de ore.');
    return;
  }
  actingHourId.value = id;
  try {
    await api.post(`/admin/hour-requests/${id}/approve`, { approved_hours: val });
    alert('Cerere aprobată cu succes!');
    fetchHourRequests();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la aprobare.');
  } finally {
    actingHourId.value = null;
  }
};

const handleHourReject = async (id) => {
  if (!confirm('Sigur dorești să respingi această cerere de ore?')) return;
  actingHourId.value = id;
  try {
    await api.post(`/admin/hour-requests/${id}/reject`);
    alert('Cerere respinsă.');
    fetchHourRequests();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la respingere.');
  } finally {
    actingHourId.value = null;
  }
};

// ── 2. Verifications ─────────────────────────────────
const verifications = ref([]);
const loadingVerif = ref(false);
const verifRejectModal = ref({ visible: false, id: null });
const verifRejectReason = ref('');
const lightboxImg = ref(null);

const fetchVerifications = async () => {
  loadingVerif.value = true;
  try {
    const res = await api.get('/verification/pending');
    verifications.value = res.data;
    fetchPendingCounts();
  } catch (err) {
    console.error('Eroare preluare verificări:', err);
  } finally {
    loadingVerif.value = false;
  }
};

const handleVerifApprove = async (id, name) => {
  if (!confirm(`Aprobă contul de student pentru ${name}?`)) return;
  try {
    await api.post(`/verification/${id}/approve`);
    alert('Cont verificat cu succes!');
    fetchVerifications();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la aprobare.');
  }
};

const openVerifReject = (id) => {
  verifRejectReason.value = '';
  verifRejectModal.value = { visible: true, id };
};

const handleVerifReject = async () => {
  if (!verifRejectReason.value.trim()) {
    alert('Te rugăm să specifici un motiv.');
    return;
  }
  try {
    await api.post(`/verification/${verifRejectModal.value.id}/reject`, {
      reason: verifRejectReason.value.trim()
    });
    verifRejectModal.value.visible = false;
    alert('Cerere respinsă. Utilizatorul a fost notificat.');
    fetchVerifications();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la respingere.');
  }
};

// ── 3. Contribution Requests ─────────────────────────
const requests = ref([]);
const loadingRequests = ref(false);

const fetchRequests = async () => {
  loadingRequests.value = true;
  try {
    const res = await api.get('/admin/contributions/pending');
    requests.value = res.data;
    fetchPendingCounts();
  } catch (err) {
    console.error(err);
  } finally {
    loadingRequests.value = false;
  }
};

const handleContributionAction = async (id, action) => {
  if (!confirm(`Sigur dorești să ${action === 'approve' ? 'aprobi' : 'respingi'} cererea?`)) return;
  try {
    await api.post(`/admin/contributions/${id}/${action}`);
    fetchRequests();
  } catch (err) {
    alert('Eroare la procesarea cererii.');
  }
};

// ── 4. All Contributions Management ──────────────────
const allContributions = ref([]);
const loadingAllContrib = ref(false);
const editContribModal = ref({ visible: false, form: { id: null, title: '', description: '', awarded_hours: 0 } });

const fetchAllContributions = async () => {
  loadingAllContrib.value = true;
  try {
    const res = await api.get('/admin/contributions/all');
    allContributions.value = res.data;
  } catch (err) {
    console.error('Eroare preluare all contributions:', err);
  } finally {
    loadingAllContrib.value = false;
  }
};

const openEditContribution = (c) => {
  editContribModal.value = {
    visible: true,
    form: { id: c.id, title: c.title, description: c.description, awarded_hours: c.awarded_hours }
  };
};

const saveEditContribution = async () => {
  try {
    await api.put(`/admin/contributions/${editContribModal.value.form.id}`, editContribModal.value.form);
    editContribModal.value.visible = false;
    alert('Contribuție actualizată!');
    fetchAllContributions();
  } catch (err) {
    alert('Eroare la actualizarea contribuției.');
  }
};

const deleteContribution = async (id) => {
  if (!confirm('Ești sigur că vrei să ștergi această contribuție? Orele vor fi deduse.')) return;
  try {
    await api.delete(`/admin/contributions/${id}`);
    fetchAllContributions();
  } catch (err) {
    alert('Eroare la ștergerea contribuției.');
  }
};

// ── 5. Assign Hours (Form) ───────────────────────────
const users = ref([]);
const submitting = ref(false);
const form = ref({ user_id: '', title: '', description: '', awarded_hours: '' });

const fetchUsers = async () => {
  try {
    const res = await api.get('/admin/users');
    users.value = res.data;
  } catch (err) {}
};

const submitContribution = async () => {
  submitting.value = true;
  try {
    await api.post('/admin/contributions', form.value);
    alert('Cerere trimisă cu succes!');
    form.value = { user_id: '', title: '', description: '', awarded_hours: '' };
    fetchPendingCounts();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la trimitere.');
  } finally {
    submitting.value = false;
  }
};

// ── 6. Reported Comments ─────────────────────────────
const reports = ref([]);
const loadingReports = ref(false);

const fetchReports = async () => {
  loadingReports.value = true;
  try {
    const res = await api.get('/posts/reports');
    reports.value = res.data;
    fetchPendingCounts();
  } catch (err) {
    console.error(err);
  } finally {
    loadingReports.value = false;
  }
};

const handleDeleteReportedComment = async (report) => {
  if (!confirm(`Sigur dorești să ștergi comentariul lui ${report.author_name}?`)) return;
  try {
    await api.delete(`/posts/comments/${report.comment_id}`);
    alert('Comentariu șters cu succes.');
    fetchReports();
  } catch (err) {
    alert('Eroare la ștergerea comentariului.');
  }
};

const handleDismissReport = async (reportId) => {
  try {
    await api.patch(`/posts/reports/${reportId}`, { status: 'dismissed' });
    fetchReports();
  } catch (err) {
    alert('Eroare la actualizarea raportului.');
  }
};

// ── 9. Badge Management ──────────────────────────────
const badges = ref([]);
const loadingBadges = ref(false);
const badgeModal = ref({
  visible: false,
  isEdit: false,
  form: { id: null, name: '', description: '', key: '', rule_type: 'hours', threshold: 10, icon: 'award' }
});

const fetchBadges = async () => {
  loadingBadges.value = true;
  try {
    const res = await api.get('/admin/badges');
    badges.value = res.data;
  } catch (err) {
    console.error('Eroare preluare badges:', err);
  } finally {
    loadingBadges.value = false;
  }
};

const openCreateBadge = () => {
  badgeModal.value = {
    visible: true,
    isEdit: false,
    form: { id: null, name: '', description: '', key: '', rule_type: 'hours', threshold: 10, icon: 'award' }
  };
};

const openEditBadge = (b) => {
  badgeModal.value = {
    visible: true,
    isEdit: true,
    form: { ...b }
  };
};

const saveBadge = async () => {
  try {
    if (badgeModal.value.isEdit) {
      await api.put(`/admin/badges/${badgeModal.value.form.id}`, badgeModal.value.form);
      alert('Badge actualizat!');
    } else {
      await api.post('/admin/badges', badgeModal.value.form);
      alert('Badge creat cu succes!');
    }
    badgeModal.value.visible = false;
    fetchBadges();
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la salvarea badge-ului.');
  }
};

const deleteBadge = async (id) => {
  if (!confirm('Ești sigur că vrei să ștergi acest badge?')) return;
  try {
    await api.delete(`/admin/badges/${id}`);
    fetchBadges();
  } catch (err) {
    alert('Eroare la ștergerea badge-ului.');
  }
};

// ── 10. Push Notifications ───────────────────────────
const submittingNotify = ref(false);
const notifyForm = ref({ title: '', message: '', roles: ['voluntar'] });

const submitNotification = async () => {
  if (notifyForm.value.roles.length === 0) {
    alert('Selectează cel puțin un rol destinatar.');
    return;
  }
  submittingNotify.value = true;
  try {
    const res = await api.post('/admin/notifications/send-all', notifyForm.value);
    alert(res.data.message || 'Notificare trimisă cu succes!');
    notifyForm.value = { title: '', message: '', roles: ['voluntar'] };
  } catch (err) {
    alert(err.response?.data?.error || 'Eroare la trimiterea notificării.');
  } finally {
    submittingNotify.value = false;
  }
};

// ── 11. Audit Logs ───────────────────────────────────
const auditLogs = ref([]);
const loadingLogs = ref(false);
const logsPage = ref(1);
const logsTotalPages = ref(1);

const ACTION_META = {
  EVENT_CREATE:                     { label: 'Creare Eveniment',       color: '#27ae60' },
  EVENT_UPDATE:                     { label: 'Editare Eveniment',      color: '#f39c12' },
  EVENT_DELETE:                     { label: 'Ștergere Eveniment',     color: '#e74c3c' },
  POST_CREATE:                      { label: 'Postare Nouă',           color: '#27ae60' },
  POST_DELETE:                      { label: 'Ștergere Postare',       color: '#e74c3c' },
  HOUR_REQUEST_COORDINATOR_APPROVE: { label: 'Aprobare Ore (Coord)',   color: '#f39c12' },
  HOUR_REQUEST_ADMIN_APPROVE:       { label: 'Aprobare Ore (Admin)',   color: '#27ae60' },
  HOUR_REQUEST_REJECT:              { label: 'Respingere Ore',         color: '#e74c3c' },
  CONTRIBUTION_APPROVE:             { label: 'Aprobare Contribuție',   color: '#27ae60' },
  CONTRIBUTION_REJECT:              { label: 'Respingere Contribuție', color: '#e74c3c' },
  NOTIFICATION_SEND:                { label: 'Notificare Trimisă',     color: '#3498db' },
  USER_ROLE_CHANGE:                 { label: 'Schimbare Rol',          color: '#9b59b6' },
  USER_DELETE:                      { label: 'Ștergere Utilizator',    color: '#e74c3c' },
  STUDENT_ID_APPROVE:               { label: 'Verificare Aprobată',    color: '#27ae60' },
  STUDENT_ID_REJECT:                { label: 'Verificare Respinsă',    color: '#e74c3c' },
};

const getActionColor = (a) => ACTION_META[a]?.color || '#94a3b8';
const getActionLabel = (a) => ACTION_META[a]?.label || a;

const fetchAuditLogs = async (page = 1) => {
  loadingLogs.value = true;
  try {
    const res = await api.get(`/admin/audit-logs?page=${page}`);
    auditLogs.value = res.data.logs;
    logsPage.value = res.data.page;
    logsTotalPages.value = res.data.totalPages;
  } catch (err) {
    console.error('Eroare preluare audit logs:', err);
  } finally {
    loadingLogs.value = false;
  }
};

// ── General Helpers ──────────────────────────────────
const resolveUploadUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.PROD ? 'https://api.osace.ro' : 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatDetails = (details) => {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(' · ');
};

onMounted(() => {
  fetchPendingCounts();
  fetchUsers();
  const initialTab = route.query.tab || sessionStorage.getItem('adminActiveTab') || 'events';
  selectTab(initialTab);
});
</script>

<style scoped>
.admin-view {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.header-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
}

.status-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

/* Categorized Admin Navigation Ribbon (Zero Horizontal Scroll) */
.admin-nav-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: stretch;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.85rem 1.15rem;
  backdrop-filter: blur(12px);
}

.nav-cluster {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1 1 auto;
}

.cluster-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-left: 0.2rem;
}

.cluster-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.nav-chip {
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.86rem;
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-chip:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.12);
}

.nav-chip.active {
  background: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.cluster-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 0.15rem;
  align-self: stretch;
}

@media (max-width: 1100px) {
  .cluster-divider {
    display: none;
  }
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.content-header h3 {
  font-size: 1.3rem;
  margin-bottom: 0.15rem;
}

.content-header .desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* Requests Grid */
.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.request-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.req-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.req-header h4 {
  margin: 0;
  font-size: 1.05rem;
}

.req-event-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #60a5fa;
  font-size: 0.9rem;
}

.req-time-details {
  background: var(--color-bg-base);
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-row {
  display: flex;
  justify-content: space-between;
}

.time-row .label {
  color: var(--color-text-muted);
}

.hour-adjust-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.25rem;
}

.hour-adjust-row label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.hour-input {
  width: 90px;
  padding: 0.4rem 0.6rem;
  text-align: center;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.btn-approve, .btn-reject {
  flex: 1;
  padding: 0.55rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-approve { background: #059669; color: white; }
.btn-reject { background: #dc2626; color: white; }
.btn-approve:hover, .btn-reject:hover { opacity: 0.9; }

/* Verifications Tab */
.id-image-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
  margin: 0.5rem 0;
  border: 1px solid var(--border-color);
}

.id-thumbnail {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.zoom-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

/* Comments Tab */
.comment-preview-box {
  background: rgba(15, 23, 42, 0.6);
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border-left: 3px solid #f59e0b;
}

.comment-text {
  font-style: italic;
  font-size: 0.9rem;
  line-height: 1.4;
}

.report-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* Badges Tab */
.badges-admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.badge-admin-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.badge-admin-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-preview-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-key-tag {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.badge-admin-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.badge-admin-meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: flex;
  justify-content: space-between;
}

.badge-admin-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

/* Tables */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.admin-table th, .admin-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.admin-table th {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.desc-cell {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-danger-sm {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-sm:hover {
  background: #ef4444;
  color: white;
}

/* Lightbox Modal */
.lightbox-modal-wrap {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.lightbox-modal-wrap .lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
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

/* Common form styles */
.assign-form {
  max-width: 540px;
  padding: 2rem;
  border-radius: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.checkbox-group {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem;
  background: var(--color-bg-surface);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

/* Logs */
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-entry {
  display: flex;
  overflow: hidden;
  border-radius: 12px;
}

.log-bar {
  width: 5px;
  flex-shrink: 0;
}

.log-body {
  padding: 0.85rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.log-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.log-actor {
  font-size: 0.9rem;
}

.log-role {
  color: var(--color-text-muted);
}

.log-target span {
  color: var(--color-primary);
  font-weight: 600;
}

.log-details {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.logs-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  color: var(--color-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3.5rem 1.5rem;
  color: var(--color-text-secondary);
  border-radius: 12px;
}

.empty-state h4 {
  font-size: 1.05rem;
  color: #f8fafc;
  margin-bottom: 0.25rem;
}

.empty-sub {
  font-size: 0.85rem;
  color: #64748b;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}
</style>
