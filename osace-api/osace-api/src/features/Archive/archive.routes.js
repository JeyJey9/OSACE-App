// src/features/Archive/archive.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkDriveConnection, getDriveConfig } = require('../../config/googleDrive');
const archiveService = require('./archive.service');
const { ARCHIVE_PERMISSIONS } = require('./archive.constants');
const { checkGlobalPermission } = require('./archive.permissions');
const { validateUploadFile, validateFolderInput, sanitizeFileName } = require('./archive.validation');

// Configurare Multer in-memory pentru arhiva (nu incarca discul VPS-ului)
const config = getDriveConfig();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (config.maxUploadMb || 50) * 1024 * 1024, // max 50MB
    files: 1, // 1 fisier per request pentru securitate si tranzactionalitate curata
  },
});

module.exports = (pool, verifyToken, verifyAdmin, verifyManager) => {

  // =========================================================================
  // 1. HEALTH & DIAGNOSTICS (Admin & Manager)
  // =========================================================================
  router.get('/health', [verifyToken, verifyManager], async (req, res) => {
    try {
      const status = await checkDriveConnection();
      return res.json({
        status: status.connected ? 'ok' : 'error',
        diagnostics: status,
      });
    } catch (err) {
      console.error('[ArchiveRoute] Error in /health:', err);
      return res.status(500).json({ error: 'Eroare la verificarea conexiunii Google Drive.' });
    }
  });

  // =========================================================================
  // 2. INITIALIZARE STRUCTURA FOLDERE (Admin Only)
  // =========================================================================
  router.post('/init-structure', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const structure = await archiveService.initDefaultFolderStructure(pool, req.user.userId);
      return res.status(201).json({
        message: 'Structura de foldere a fost initializata cu succes!',
        structure,
      });
    } catch (err) {
      console.error('[ArchiveRoute] Error in /init-structure:', err);
      return res.status(500).json({ error: err.message || 'Eroare la initializarea structurii de foldere.' });
    }
  });

  // =========================================================================
  // 3. STATISTICI GENERALE ARHIVA (Toti membrii autentificati)
  // =========================================================================
  router.get('/stats', verifyToken, async (req, res) => {
    try {
      const stats = await archiveService.getArchiveStats(pool);
      return res.json(stats);
    } catch (err) {
      console.error('[ArchiveRoute] Error in /stats:', err);
      return res.status(500).json({ error: 'Eroare la preluarea statisticilor.' });
    }
  });

  // =========================================================================
  // 4. LISTARE FOLDERE
  // GET /api/archive/folders?parentId=123
  // =========================================================================
  router.get('/folders', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const parentId = req.query.parentId ? parseInt(req.query.parentId, 10) : null;

      if (req.query.parentId && isNaN(parentId)) {
        return res.status(400).json({ error: 'Parametrul parentId este invalid.' });
      }

      const folders = await archiveService.getFolders(pool, userId, role, parentId);
      return res.json(folders);
    } catch (err) {
      console.error('[ArchiveRoute] Error in GET /folders:', err);
      return res.status(500).json({ error: 'Eroare la listarea folderelor.' });
    }
  });

  // =========================================================================
  // 5. DETALII FOLDER & CONTINUT (Subfoldere + Documente)
  // GET /api/archive/folders/:id
  // =========================================================================
  router.get('/folders/:id', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);

      if (isNaN(folderId)) {
        return res.status(400).json({ error: 'ID-ul folderului este invalid.' });
      }

      const contents = await archiveService.getFolderContents(pool, userId, role, folderId);
      return res.json(contents);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error in GET /folders/${req.params.id}:`, err);
      return res.status(500).json({ error: 'Eroare la preluarea continutului folderului.' });
    }
  });

  // =========================================================================
  // 6. CREARE SUBFOLDER NOU (Admin sau Coordonator cu permisiune)
  // POST /api/archive/folders
  // Body: { name, parentId, category, departmentId }
  // =========================================================================
  router.post('/folders', [verifyToken, verifyManager], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const validation = validateFolderInput(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { name, parentId, category, departmentId } = req.body;
      const parsedParentId = parentId ? parseInt(parentId, 10) : null;

      const folder = await archiveService.createSubfolder(pool, userId, role, {
        name: name.trim(),
        parentId: parsedParentId,
        category: category || null,
        departmentId: departmentId || null,
      });

      return res.status(201).json({
        message: 'Folder creat cu succes.',
        folder,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in POST /folders:', err);
      return res.status(500).json({ error: err.message || 'Eroare la crearea folderului.' });
    }
  });

  // =========================================================================
  // 6B. EDITARE FOLDER (Admin sau Coordonator)
  // PUT /api/archive/folders/:id
  // Body: { name, category, departmentId }
  // =========================================================================
  router.put('/folders/:id', [verifyToken, verifyManager], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);
      console.log(`[ArchiveRoute] PUT /folders/${folderId} by user ${userId} (${role}):`, req.body);

      if (isNaN(folderId)) {
        return res.status(400).json({ error: 'ID folder invalid.' });
      }

      const { name, category, departmentId } = req.body;
      const updatedFolder = await archiveService.updateFolder(pool, userId, role, folderId, {
        name,
        category,
        departmentId,
      });

      return res.json({
        message: 'Folderul a fost actualizat cu succes.',
        folder: updatedFolder,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in PUT /folders/:id:', err);
      return res.status(500).json({ error: err.message || 'Eroare la modificarea folderului.' });
    }
  });

  // =========================================================================
  // 6C. STERGERE FOLDER (Admin sau Coordonator)
  // DELETE /api/archive/folders/:id
  // =========================================================================
  router.delete('/folders/:id', [verifyToken, verifyManager], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);
      console.log(`[ArchiveRoute] DELETE /folders/${folderId} by user ${userId} (${role})`);

      if (isNaN(folderId)) {
        return res.status(400).json({ error: 'ID folder invalid.' });
      }

      const result = await archiveService.deleteFolder(pool, userId, role, folderId);
      return res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in DELETE /folders/:id:', err);
      return res.status(500).json({ error: err.message || 'Eroare la stergerea folderului.' });
    }
  });

  // =========================================================================
  // 7. INCARCARE DOCUMENT NOU (Multipart form-data)
  // POST /api/archive/documents/upload
  // Fields: file, folderId, name, category, departmentId, eventId, academicYear, description, tags
  // =========================================================================
  router.post('/documents/upload', [verifyToken, upload.single('file')], async (req, res) => {
    try {
      const { userId, role } = req.user;

      // Verificam permisiunea generala de upload in arhiva
      const canUpload = role === 'admin' || role === 'coordonator' || await checkGlobalPermission(pool, userId, role, ARCHIVE_PERMISSIONS.CAN_UPLOAD_ARCHIVE);
      if (!canUpload) {
        return res.status(403).json({ error: 'Nu ai permisiunea de a incarca documente in arhiva.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Niciun fisier atasat pentru incarcare.' });
      }

      // Validare de securitate MIME & Size
      validateUploadFile(req.file);

      const metadata = {
        folderId: req.body.folderId ? parseInt(req.body.folderId, 10) : null,
        name: req.body.name,
        category: req.body.category,
        departmentId: req.body.departmentId,
        eventId: req.body.eventId,
        academicYear: req.body.academicYear,
        description: req.body.description,
        tags: req.body.tags,
      };

      const doc = await archiveService.uploadDocument(pool, userId, role, req.file, metadata);

      return res.status(201).json({
        message: 'Documentul a fost salvat si arhivat cu succes!',
        document: doc,
      });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in POST /documents/upload:', err);
      return res.status(500).json({ error: err.message || 'Eroare la incarcarea documentului.' });
    }
  });

  // =========================================================================
  // 8. DESCARCARE DOCUMENT (Secure Proxy Stream)
  // GET /api/archive/documents/:id/download
  // =========================================================================
  router.get('/documents/:id/download', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const documentId = parseInt(req.params.id, 10);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'ID document invalid.' });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const { stream, document } = await archiveService.downloadDocument(pool, userId, role, documentId, clientIp);

      // Setam headere de securitate stricte pentru a preveni atacuri XSS/MIME-sniffing
      const safeFilename = sanitizeFileName(document.name || document.original_name);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      if (document.size_bytes) {
        res.setHeader('Content-Length', document.size_bytes);
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      stream.on('error', (streamErr) => {
        console.error('[ArchiveRoute] Error in download stream:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Eroare la transmiterea fluxului de date.' });
        }
      });

      stream.pipe(res);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error in download document ${req.params.id}:`, err);
      return res.status(500).json({ error: 'Eroare la descarcarea documentului.' });
    }
  });

  // =========================================================================
  // 8B. PREVIZUALIZARE DOCUMENT INLINE
  // GET /api/archive/documents/:id/preview
  // =========================================================================
  router.get('/documents/:id/preview', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const documentId = parseInt(req.params.id, 10);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'ID document invalid.' });
      }

      const clientIp = req.ip || req.connection.remoteAddress;
      const { stream, document } = await archiveService.previewDocument(pool, userId, role, documentId, clientIp);

      const safeFilename = sanitizeFileName(document.name || document.original_name);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safeFilename)}"`);
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      if (document.size_bytes) {
        res.setHeader('Content-Length', document.size_bytes);
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=3600');

      stream.on('error', (streamErr) => {
        console.error('[ArchiveRoute] Error in preview stream:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Eroare la transmiterea fluxului de previzualizare.' });
        }
      });

      stream.pipe(res);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error in preview document ${req.params.id}:`, err);
      return res.status(500).json({ error: 'Eroare la previzualizarea documentului.' });
    }
  });

  // =========================================================================
  // 9. STERGERE DOCUMENT (Soft Delete -> Cos de Reciclare)
  // DELETE /api/archive/documents/:id
  // =========================================================================
  router.delete('/documents/:id', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const documentId = parseInt(req.params.id, 10);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'ID document invalid.' });
      }

      const result = await archiveService.deleteDocument(pool, userId, role, documentId);
      return res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error in DELETE /documents/${req.params.id}:`, err);
      return res.status(500).json({ error: 'Eroare la stergerea documentului.' });
    }
  });

  // =========================================================================
  // 9B. COS DE RECICLARE (Trash Management)
  // =========================================================================
  router.get('/trash', [verifyToken, verifyManager], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const docs = await archiveService.getTrashDocuments(pool, userId, role);
      return res.json(docs);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in GET /trash:', err);
      return res.status(500).json({ error: 'Eroare la preluarea documentelor din cos.' });
    }
  });

  router.post('/documents/:id/restore', [verifyToken, verifyManager], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const documentId = parseInt(req.params.id, 10);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'ID document invalid.' });
      }

      const restored = await archiveService.restoreDocument(pool, userId, role, documentId);
      return res.json({ message: 'Documentul a fost restaurat cu succes.', document: restored });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error restoring document ${req.params.id}:`, err);
      return res.status(500).json({ error: err.message || 'Eroare la restaurarea documentului.' });
    }
  });

  router.delete('/documents/:id/permanent', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const documentId = parseInt(req.params.id, 10);

      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'ID document invalid.' });
      }

      const result = await archiveService.permanentDeleteDocument(pool, userId, role, documentId);
      return res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error(`[ArchiveRoute] Error permanent deleting document ${req.params.id}:`, err);
      return res.status(500).json({ error: err.message || 'Eroare la stergerea definitiva.' });
    }
  });

  router.delete('/trash/empty', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const result = await archiveService.emptyTrash(pool, userId, role);
      return res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error emptying trash:', err);
      return res.status(500).json({ error: err.message || 'Eroare la golirea cosului de reciclare.' });
    }
  });

  // =========================================================================
  // 9C. PERMISIUNI GRANULARE FOLDERE (Admin Only)
  // =========================================================================
  router.get('/folders/:id/permissions', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);

      if (isNaN(folderId)) {
        return res.status(400).json({ error: 'ID folder invalid.' });
      }

      const permissions = await archiveService.getFolderPermissions(pool, userId, role, folderId);
      return res.json(permissions);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in GET /folders/:id/permissions:', err);
      return res.status(500).json({ error: 'Eroare la preluarea permisiunilor folderului.' });
    }
  });

  router.post('/folders/:id/permissions', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);
      const { targetUserId, permission } = req.body;

      if (isNaN(folderId) || !targetUserId || !permission) {
        return res.status(400).json({ error: 'Date incomplete pentru acordarea permisiunii.' });
      }

      const perm = await archiveService.grantFolderPermission(pool, userId, role, folderId, parseInt(targetUserId, 10), permission);
      return res.status(201).json({ message: 'Permisiune acordata cu succes.', permission: perm });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in POST /folders/:id/permissions:', err);
      return res.status(500).json({ error: err.message || 'Eroare la acordarea permisiunii.' });
    }
  });

  router.delete('/folders/:id/permissions/:targetUserId', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const { userId, role } = req.user;
      const folderId = parseInt(req.params.id, 10);
      const targetUserId = parseInt(req.params.targetUserId, 10);

      if (isNaN(folderId) || isNaN(targetUserId)) {
        return res.status(400).json({ error: 'Parametri invalizi.' });
      }

      const result = await archiveService.revokeFolderPermission(pool, userId, role, folderId, targetUserId);
      return res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      console.error('[ArchiveRoute] Error in DELETE /folders/:id/permissions:', err);
      return res.status(500).json({ error: err.message || 'Eroare la revocarea permisiunii.' });
    }
  });

  // =========================================================================
  // 10. CAUTARE DOCUMENT (Full-text & Filter)
  // GET /api/archive/search?q=statut&category=governance&year=2025-2026
  // =========================================================================
  router.get('/search', verifyToken, async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { q, category, departmentId, year, limit, offset } = req.query;

      const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
      const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

      const results = await archiveService.searchDocuments(pool, userId, role, {
        query: q,
        category,
        departmentId,
        year,
        limit: parsedLimit,
        offset: parsedOffset,
      });

      return res.json(results);
    } catch (err) {
      console.error('[ArchiveRoute] Error in /search:', err);
      return res.status(500).json({ error: 'Eroare la cautarea documentelor.' });
    }
  });

  // =========================================================================
  // 11. AUDIT ACCESS LOGS (Admin Only)
  // GET /api/archive/access-logs?page=1
  // =========================================================================
  router.get('/access-logs', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = 50;
      const offset = (page - 1) * limit;

      const logsRes = await pool.query(
        `SELECT l.*, u.display_name as user_name, u.email as user_email,
                d.name as document_name, f.name as folder_name
         FROM archive_access_log l
         LEFT JOIN users u ON l.user_id = u.id
         LEFT JOIN archive_documents d ON l.document_id = d.id
         LEFT JOIN archive_folders f ON l.folder_id = f.id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countRes = await pool.query(`SELECT COUNT(*)::int FROM archive_access_log`);
      const total = countRes.rows[0].count;

      return res.json({
        logs: logsRes.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error('[ArchiveRoute] Error in /access-logs:', err);
      return res.status(500).json({ error: 'Eroare la preluarea jurnalelor de acces.' });
    }
  });

  return router;
};
