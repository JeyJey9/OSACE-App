// src/features/Archive/archive.service.js
const googleDriveService = require('../../services/googleDriveService');
const { getDriveConfig } = require('../../config/googleDrive');
const { DEFAULT_FOLDER_STRUCTURE, ARCHIVE_ACTIONS } = require('./archive.constants');
const { checkFolderAccess } = require('./archive.permissions');
const { sanitizeFileName } = require('./archive.validation');
const { FolderNotFoundError, DocumentNotFoundError, ArchivePermissionDeniedError } = require('./archive.errors');
const path = require('path');
const crypto = require('crypto');

/**
 * Logheaza o actiune in archive_access_log
 */
async function logArchiveAccess(pool, { documentId = null, folderId = null, userId = null, action, result = 'success', ip = null, details = {} }) {
  try {
    await pool.query(
      `INSERT INTO archive_access_log (document_id, folder_id, user_id, action, result, ip_address, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [documentId, folderId, userId, action, result, ip, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('[ArchiveService] Eroare la logArchiveAccess:', err.message);
  }
}

/**
 * Initializeaza structura de foldere standard O.S.A.C.E. in Google Drive si in DB
 */
async function initDefaultFolderStructure(pool, adminUserId) {
  const config = getDriveConfig();
  if (!config.rootFolderId) {
    throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID nu este setat in configuratie.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Asiguram inregistrarea in archive_config
    await client.query(
      `INSERT INTO archive_config (root_folder_id, is_active, last_sync_at)
       VALUES ($1, true, NOW())
       ON CONFLICT (id) DO UPDATE SET root_folder_id = $1, last_sync_at = NOW()`,
      [config.rootFolderId]
    );

    const createdStructure = [];

    // 2. Parcurgem structura default si cream folderele daca nu exista
    for (const topFolder of DEFAULT_FOLDER_STRUCTURE) {
      // Cautam sau cream in Google Drive
      let topDriveFolder = await googleDriveService.findFolder(topFolder.name, config.rootFolderId);
      if (!topDriveFolder) {
        topDriveFolder = await googleDriveService.createFolder(topFolder.name, config.rootFolderId);
      }

      // Inseram sau actualizam in DB
      const topDbRes = await client.query(
        `INSERT INTO archive_folders (drive_folder_id, parent_id, name, logical_path, category, department_id, is_system_folder, created_by)
         VALUES ($1, NULL, $2, $3, $4, $5, true, $6)
         ON CONFLICT (drive_folder_id) 
         DO UPDATE SET name = EXCLUDED.name, logical_path = EXCLUDED.logical_path, updated_at = NOW()
         RETURNING id`,
        [
          topDriveFolder.id,
          topFolder.name,
          `/${topFolder.name}`,
          topFolder.category,
          topFolder.department || null,
          adminUserId,
        ]
      );
      const topFolderId = topDbRes.rows[0].id;
      const subResults = [];

      // Cream subfolderele aferente
      if (topFolder.subfolders && topFolder.subfolders.length > 0) {
        for (const sub of topFolder.subfolders) {
          let subDriveFolder = await googleDriveService.findFolder(sub.name, topDriveFolder.id);
          if (!subDriveFolder) {
            subDriveFolder = await googleDriveService.createFolder(sub.name, topDriveFolder.id);
          }

          const subDbRes = await client.query(
            `INSERT INTO archive_folders (drive_folder_id, parent_id, name, logical_path, category, department_id, is_system_folder, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, true, $7)
             ON CONFLICT (drive_folder_id) 
             DO UPDATE SET name = EXCLUDED.name, logical_path = EXCLUDED.logical_path, updated_at = NOW()
             RETURNING id`,
            [
              subDriveFolder.id,
              topFolderId,
              sub.name,
              `/${topFolder.name}/${sub.name}`,
              sub.category || topFolder.category,
              sub.department || topFolder.department || null,
              adminUserId,
            ]
          );
          subResults.push({ id: subDbRes.rows[0].id, name: sub.name, driveId: subDriveFolder.id });
        }
      }

      createdStructure.push({
        id: topFolderId,
        name: topFolder.name,
        driveId: topDriveFolder.id,
        subfolders: subResults,
      });
    }

    await client.query('COMMIT');

    await logArchiveAccess(pool, {
      userId: adminUserId,
      action: ARCHIVE_ACTIONS.STRUCTURE_INIT,
      details: { foldersCount: createdStructure.length },
    });

    return createdStructure;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ArchiveService] Eroare la initDefaultFolderStructure:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Returneaza lista de foldere accesibile utilizatorului
 */
async function getFolders(pool, userId, role, parentId = null) {
  let query = `
    SELECT f.id, f.drive_folder_id, f.parent_id, f.name, f.logical_path, f.category, 
           f.department_id, f.is_system_folder, f.created_at, f.updated_at,
           (SELECT COUNT(*)::int FROM archive_documents d WHERE d.folder_id = f.id AND d.status = 'active') as documents_count,
           (SELECT COUNT(*)::int FROM archive_folders sub WHERE sub.parent_id = f.id) as subfolders_count
    FROM archive_folders f
    WHERE `;

  const params = [];
  if (parentId === null || parentId === undefined) {
    query += `f.parent_id IS NULL`;
  } else {
    params.push(parentId);
    query += `f.parent_id = $${params.length}`;
  }

  query += ` ORDER BY f.is_system_folder DESC, f.name ASC`;

  const res = await pool.query(query, params);
  const accessibleFolders = [];

  // Filtrare pe permisiuni
  for (const folder of res.rows) {
    const hasAccess = await checkFolderAccess(pool, userId, role, folder.id, 'view');
    if (hasAccess) {
      accessibleFolders.push(folder);
    }
  }

  return accessibleFolders;
}

/**
 * Returneaza detaliile unui folder, inclusiv subfolderele si documentele continute
 */
async function getFolderContents(pool, userId, role, folderId) {
  const folderRes = await pool.query(
    `SELECT f.*, p.name as parent_name
     FROM archive_folders f
     LEFT JOIN archive_folders p ON f.parent_id = p.id
     WHERE f.id = $1`,
    [folderId]
  );

  if (folderRes.rows.length === 0) {
    throw new FolderNotFoundError(folderId);
  }

  const folder = folderRes.rows[0];
  const hasAccess = await checkFolderAccess(pool, userId, role, folder.id, 'view');
  if (!hasAccess) {
    throw new ArchivePermissionDeniedError('vizualizarea acestui folder');
  }

  // 1. Subfoldere accesibile
  const subfolders = await getFolders(pool, userId, role, folderId);

  // 2. Documente active din folder
  const docsRes = await pool.query(
    `SELECT d.id, d.drive_file_id, d.folder_id, d.name, d.original_name, d.mime_type, 
            d.file_extension, d.size_bytes, d.category, d.department_id, d.event_id, 
            d.academic_year, d.status, d.drive_web_view_link, d.description, d.tags, 
            d.created_at, d.updated_at,
            u.display_name as uploaded_by_name, u.avatar_url as uploaded_by_avatar
     FROM archive_documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.folder_id = $1 AND d.status = 'active'
     ORDER BY d.created_at DESC`,
    [folderId]
  );

  return {
    folder,
    subfolders,
    documents: docsRes.rows,
  };
}

/**
 * Creaza un subfolder nou
 */
async function createSubfolder(pool, userId, role, { name, parentId = null, category = null, departmentId = null }) {
  if (parentId) {
    const canCreate = await checkFolderAccess(pool, userId, role, parentId, 'upload');
    if (!canCreate && role !== 'admin') {
      throw new ArchivePermissionDeniedError('crearea de foldere');
    }
  } else if (role !== 'admin') {
    throw new ArchivePermissionDeniedError('crearea de foldere in radacina');
  }

  const config = getDriveConfig();
  let parentDriveId = config.rootFolderId;
  let logicalPath = `/${name}`;

  if (parentId) {
    const parentRes = await pool.query('SELECT drive_folder_id, logical_path, category, department_id FROM archive_folders WHERE id = $1', [parentId]);
    if (parentRes.rows.length === 0) {
      throw new FolderNotFoundError(parentId);
    }
    parentDriveId = parentRes.rows[0].drive_folder_id;
    logicalPath = `${parentRes.rows[0].logical_path}/${name}`;
    if (!category) category = parentRes.rows[0].category;
    if (!departmentId) departmentId = parentRes.rows[0].department_id;
  }

  // 1. Creare in Google Drive
  const driveFolder = await googleDriveService.createFolder(name, parentDriveId);

  // 2. Salvare in DB
  const insertRes = await pool.query(
    `INSERT INTO archive_folders (drive_folder_id, parent_id, name, logical_path, category, department_id, is_system_folder, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, false, $7)
     RETURNING *`,
    [driveFolder.id, parentId || null, name, logicalPath, category, departmentId, userId]
  );

  await logArchiveAccess(pool, {
    folderId: insertRes.rows[0].id,
    userId,
    action: ARCHIVE_ACTIONS.FOLDER_CREATE,
    details: { name, parentId, driveFolderId: driveFolder.id },
  });

  return insertRes.rows[0];
}

/**
 * Modifica un folder existent (redenumire, schimbare categorie/departament)
 */
async function updateFolder(pool, userId, role, folderId, { name, category, departmentId }) {
  const folderRes = await pool.query('SELECT * FROM archive_folders WHERE id = $1', [folderId]);
  if (folderRes.rows.length === 0) {
    throw new FolderNotFoundError(folderId);
  }

  const folder = folderRes.rows[0];

  // Verificam permisiunea
  if (role !== 'admin') {
    const canManage = await checkFolderAccess(pool, userId, role, folderId, 'manage');
    if (!canManage && folder.created_by !== userId) {
      throw new ArchivePermissionDeniedError('modificarea acestui folder');
    }
  }

  const newName = name && name.trim() ? name.trim() : folder.name;
  const newCategory = category || folder.category;
  const newDepartment = departmentId !== undefined ? departmentId : folder.department_id;

  // Daca s-a schimbat numele, actualizam in Google Drive
  if (newName !== folder.name) {
    try {
      await googleDriveService.renameFolder(folder.drive_folder_id, newName);
    } catch (driveErr) {
      console.warn('[ArchiveService] Eroare la redenumire folder pe Drive:', driveErr.message);
    }
  }

  // Recalculam logical_path
  let parentPath = '';
  if (folder.parent_id) {
    const parentRes = await pool.query('SELECT logical_path FROM archive_folders WHERE id = $1', [folder.parent_id]);
    if (parentRes.rows.length > 0) {
      parentPath = parentRes.rows[0].logical_path;
    }
  }
  const oldPath = folder.logical_path;
  const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`;

  // Actualizam folderul
  const updateRes = await pool.query(
    `UPDATE archive_folders
     SET name = $1, logical_path = $2, category = $3, department_id = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [newName, newPath, newCategory, newDepartment, folderId]
  );

  // Daca s-a schimbat calea logica, actualizam si toti descendentii
  if (oldPath && oldPath !== newPath) {
    await pool.query(
      `UPDATE archive_folders
       SET logical_path = $1 || COALESCE(SUBSTR(logical_path, LENGTH($2) + 1), '')
       WHERE logical_path LIKE $2 || '/%'`,
      [newPath, oldPath]
    );
  }

  await logArchiveAccess(pool, {
    folderId,
    userId,
    action: ARCHIVE_ACTIONS.FOLDER_UPDATE,
    details: { oldName: folder.name, newName, oldPath, newPath },
  });

  return updateRes.rows[0];
}

/**
 * Sterge un folder din arhiva
 */
async function deleteFolder(pool, userId, role, folderId) {
  const folderRes = await pool.query('SELECT * FROM archive_folders WHERE id = $1', [folderId]);
  if (folderRes.rows.length === 0) {
    throw new FolderNotFoundError(folderId);
  }

  const folder = folderRes.rows[0];

  if (folder.is_system_folder && role !== 'admin') {
    throw new ArchivePermissionDeniedError('stergerea folderelor de sistem');
  }

  if (role !== 'admin') {
    const canManage = await checkFolderAccess(pool, userId, role, folderId, 'manage');
    if (!canManage && folder.created_by !== userId) {
      throw new ArchivePermissionDeniedError('stergerea acestui folder');
    }
  }

  // Stergem/mutam in Trash pe Google Drive
  try {
    await googleDriveService.deleteFile(folder.drive_folder_id, false);
  } catch (driveErr) {
    console.warn('[ArchiveService] Nu s-a putut sterge folderul din Drive:', driveErr.message);
  }

  // Stergem din DB
  await pool.query('DELETE FROM archive_folders WHERE id = $1', [folderId]);

  await logArchiveAccess(pool, {
    folderId,
    userId,
    action: ARCHIVE_ACTIONS.FOLDER_DELETE,
    details: { name: folder.name, driveFolderId: folder.drive_folder_id },
  });

  return { message: 'Folderul a fost sters cu succes.' };
}

/**
 * Incarca un document in arhiva (Google Drive + DB metadata)
 */
async function uploadDocument(pool, userId, role, file, metadata = {}) {
  const { folderId, name, category, departmentId, eventId, academicYear, description, tags } = metadata;

  // 1. Verificam permisiunea pe folder
  if (folderId) {
    const canUpload = await checkFolderAccess(pool, userId, role, folderId, 'upload');
    if (!canUpload) {
      throw new ArchivePermissionDeniedError('incarcarea de documente in acest folder');
    }
  }

  // 2. Identificam folderul tinta in Drive
  const config = getDriveConfig();
  let targetDriveFolderId = config.rootFolderId;
  let folderRecord = null;

  if (folderId) {
    const folderRes = await pool.query('SELECT * FROM archive_folders WHERE id = $1', [folderId]);
    if (folderRes.rows.length === 0) {
      throw new FolderNotFoundError(folderId);
    }
    folderRecord = folderRes.rows[0];
    targetDriveFolderId = folderRecord.drive_folder_id;
  }

  const originalName = file.originalname;
  const docName = name && name.trim() ? name.trim() : sanitizeFileName(originalName);
  const ext = path.extname(originalName).toLowerCase();
  const checksumSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // 3. Upload stream/buffer in Google Drive
  const driveFile = await googleDriveService.uploadFile({
    name: docName,
    mimeType: file.mimetype,
    body: file.buffer,
    parentFolderId: targetDriveFolderId,
    description: description || undefined,
    properties: {
      uploadedByUserId: String(userId),
      originalName,
      sha256: checksumSha256,
    },
  });

  // 4. Inserare in DB (archive_documents + archive_document_versions)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docCategory = category || (folderRecord ? folderRecord.category : 'general');
    const docDept = departmentId || (folderRecord ? folderRecord.department_id : null);
    const parsedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()) : []);

    const docRes = await client.query(
      `INSERT INTO archive_documents (
        drive_file_id, folder_id, name, original_name, mime_type, file_extension,
        size_bytes, checksum_sha256, category, department_id, event_id, academic_year,
        status, uploaded_by, drive_web_view_link, description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $14, $15, $16)
      RETURNING *`,
      [
        driveFile.id,
        folderId || null,
        docName,
        originalName,
        file.mimetype,
        ext,
        file.size,
        checksumSha256,
        docCategory,
        docDept,
        eventId ? parseInt(eventId, 10) : null,
        academicYear || null,
        userId,
        driveFile.webViewLink || null,
        description || null,
        parsedTags,
      ]
    );

    const newDoc = docRes.rows[0];

    // Inseram versiunea initiala v1
    await client.query(
      `INSERT INTO archive_document_versions (document_id, version_number, uploaded_by, size_bytes, change_summary)
       VALUES ($1, 1, $2, $3, 'Initial upload')`,
      [newDoc.id, userId, file.size]
    );

    await client.query('COMMIT');

    await logArchiveAccess(pool, {
      documentId: newDoc.id,
      folderId: folderId || null,
      userId,
      action: ARCHIVE_ACTIONS.DOCUMENT_UPLOAD,
      details: { driveFileId: driveFile.id, size: file.size, mimeType: file.mimetype },
    });

    return newDoc;
  } catch (err) {
    await client.query('ROLLBACK');
    // Daca inserarea in DB a esuat, curatam fisierul urcat din Drive pentru consistenta
    try {
      await googleDriveService.deleteFile(driveFile.id, true);
    } catch (cleanupErr) {
      console.error('[ArchiveService] Cleanup drive file failed:', cleanupErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Descarca un document din Google Drive via backend proxy stream
 */
async function downloadDocument(pool, userId, role, documentId, ip = null) {
  const docRes = await pool.query(
    `SELECT d.*, f.id as folder_id
     FROM archive_documents d
     LEFT JOIN archive_folders f ON d.folder_id = f.id
     WHERE d.id = $1 AND d.status = 'active'`,
    [documentId]
  );

  if (docRes.rows.length === 0) {
    throw new DocumentNotFoundError(documentId);
  }

  const doc = docRes.rows[0];
  if (doc.folder_id) {
    const canView = await checkFolderAccess(pool, userId, role, doc.folder_id, 'view');
    if (!canView) {
      throw new ArchivePermissionDeniedError('descarcarea acestui document');
    }
  }

  const stream = await googleDriveService.downloadFileStream(doc.drive_file_id);

  await logArchiveAccess(pool, {
    documentId: doc.id,
    folderId: doc.folder_id,
    userId,
    action: ARCHIVE_ACTIONS.DOCUMENT_DOWNLOAD,
    ip,
    details: { driveFileId: doc.drive_file_id, name: doc.name },
  });

  return {
    stream,
    document: doc,
  };
}

/**
 * Sterge un document (soft delete in DB + mutare in Trash in Google Drive)
 */
async function deleteDocument(pool, userId, role, documentId) {
  const docRes = await pool.query('SELECT * FROM archive_documents WHERE id = $1', [documentId]);
  if (docRes.rows.length === 0) {
    throw new DocumentNotFoundError(documentId);
  }

  const doc = docRes.rows[0];
  const isOwner = doc.uploaded_by === userId;

  if (role !== 'admin' && !isOwner) {
    const canDelete = doc.folder_id ? await checkFolderAccess(pool, userId, role, doc.folder_id, 'delete') : false;
    if (!canDelete) {
      throw new ArchivePermissionDeniedError('stergerea acestui document');
    }
  }

  // 1. Soft delete in DB
  await pool.query(
    `UPDATE archive_documents SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
    [documentId]
  );

  // 2. Mutare in trash pe Google Drive
  try {
    await googleDriveService.deleteFile(doc.drive_file_id, false);
  } catch (driveErr) {
    console.warn('[ArchiveService] Nu s-a putut muta fisierul in Trash pe Drive:', driveErr.message);
  }

  await logArchiveAccess(pool, {
    documentId: doc.id,
    folderId: doc.folder_id,
    userId,
    action: ARCHIVE_ACTIONS.DOCUMENT_DELETE,
    details: { driveFileId: doc.drive_file_id },
  });

  return { message: 'Documentul a fost sters cu succes.' };
}

/**
 * Cautare documente in arhiva
 */
async function searchDocuments(pool, userId, role, { query, category, departmentId, year, limit = 50, offset = 0 }) {
  let sql = `
    SELECT d.id, d.drive_file_id, d.folder_id, d.name, d.original_name, d.mime_type, 
           d.file_extension, d.size_bytes, d.category, d.department_id, d.academic_year, 
           d.drive_web_view_link, d.description, d.tags, d.created_at,
           f.name as folder_name, f.logical_path as folder_path,
           u.display_name as uploaded_by_name
    FROM archive_documents d
    LEFT JOIN archive_folders f ON d.folder_id = f.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.status = 'active'
  `;

  const params = [];

  if (query && query.trim()) {
    params.push(`%${query.trim()}%`);
    sql += ` AND (d.name ILIKE $${params.length} OR d.description ILIKE $${params.length} OR $${params.length} = ANY(d.tags))`;
  }

  if (category) {
    params.push(category);
    sql += ` AND d.category = $${params.length}`;
  }

  if (departmentId) {
    params.push(departmentId);
    sql += ` AND d.department_id = $${params.length}`;
  }

  if (year) {
    params.push(year);
    sql += ` AND d.academic_year = $${params.length}`;
  }

  sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const res = await pool.query(sql, params);
  const accessibleResults = [];

  for (const doc of res.rows) {
    if (!doc.folder_id) {
      accessibleResults.push(doc);
      continue;
    }
    const hasAccess = await checkFolderAccess(pool, userId, role, doc.folder_id, 'view');
    if (hasAccess) {
      accessibleResults.push(doc);
    }
  }

  return accessibleResults;
}

/**
 * Statistici generale despre stocarea arhivei
 */
async function getArchiveStats(pool) {
  const [docStats, folderStats, catStats] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int as total_documents,
             COALESCE(SUM(size_bytes), 0)::bigint as total_size_bytes
      FROM archive_documents
      WHERE status = 'active'
    `),
    pool.query(`SELECT COUNT(*)::int as total_folders FROM archive_folders`),
    pool.query(`
      SELECT category, COUNT(*)::int as count, COALESCE(SUM(size_bytes), 0)::bigint as size_bytes
      FROM archive_documents
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `),
  ]);

  return {
    totalDocuments: docStats.rows[0].total_documents,
    totalSizeBytes: docStats.rows[0].total_size_bytes,
    totalFolders: folderStats.rows[0].total_folders,
    categories: catStats.rows,
  };
}

module.exports = {
  logArchiveAccess,
  initDefaultFolderStructure,
  getFolders,
  getFolderContents,
  createSubfolder,
  updateFolder,
  deleteFolder,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  searchDocuments,
  getArchiveStats,
};

