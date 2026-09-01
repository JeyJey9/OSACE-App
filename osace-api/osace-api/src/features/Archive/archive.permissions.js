// src/features/Archive/archive.permissions.js
const { ARCHIVE_PERMISSIONS } = require('./archive.constants');

/**
 * Verifica daca un utilizator are o permisiune globala in user_permissions
 */
async function checkGlobalPermission(pool, userId, role, permissionKey) {
  if (role === 'admin') return true;

  const res = await pool.query(
    'SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission_key = $2',
    [userId, permissionKey]
  );
  return res.rowCount > 0;
}

/**
 * Verifica daca un utilizator are acces la un folder specific din arhiva
 * @param {Object} pool - PG pool
 * @param {number} userId - ID utilizator
 * @param {string} role - Rol utilizator (admin, coordonator, user)
 * @param {number} folderId - ID folder din archive_folders
 * @param {string} requiredAction - 'view' | 'upload' | 'delete' | 'manage'
 * @returns {Promise<boolean>}
 */
async function checkFolderAccess(pool, userId, role, folderId, requiredAction = 'view') {
  // 1. Administratorii au acces total
  if (role === 'admin') return true;

  // 2. Daca este folder radacina / general (null), verificam permisiunea generala
  if (!folderId) {
    if (requiredAction === 'view') {
      return role === 'coordonator' || await checkGlobalPermission(pool, userId, role, ARCHIVE_PERMISSIONS.CAN_VIEW_ARCHIVE);
    }
    if (requiredAction === 'upload') {
      return role === 'coordonator' || await checkGlobalPermission(pool, userId, role, ARCHIVE_PERMISSIONS.CAN_UPLOAD_ARCHIVE);
    }
    return false;
  }

  // 3. Preluam detaliile folderului
  const folderRes = await pool.query(
    'SELECT id, category, department_id, required_permission FROM archive_folders WHERE id = $1',
    [folderId]
  );

  if (folderRes.rows.length === 0) {
    return false;
  }

  const folder = folderRes.rows[0];

  // 4. Folderul financiar este protejat special (doar admin sau permisiune explicita)
  if (folder.category === 'financial') {
    const permCheck = await pool.query(
      'SELECT 1 FROM archive_folder_permissions WHERE user_id = $1 AND folder_id = $2 AND permission IN ($3, $4)',
      [userId, folderId, requiredAction, 'manage']
    );
    return permCheck.rowCount > 0;
  }

  // 5. Daca folderul cere o permisiune globala anume (ex: CAN_MANAGE_ARCHIVE)
  if (folder.required_permission) {
    const hasGlobal = await checkGlobalPermission(pool, userId, role, folder.required_permission);
    if (!hasGlobal) return false;
  }

  // 6. Verificam permisiunea explicita pe folder in archive_folder_permissions
  const explicitCheck = await pool.query(
    `SELECT 1 FROM archive_folder_permissions 
     WHERE user_id = $1 AND folder_id = $2 AND permission IN ($3, 'manage')`,
    [userId, folderId, requiredAction]
  );
  if (explicitCheck.rowCount > 0) return true;

  // 7. Coordonatorii au acces implicit la foldere non-financiare daca au permisiunea generala
  if (role === 'coordonator') {
    if (requiredAction === 'view') return true;
    if (requiredAction === 'upload') return true;
    if (requiredAction === 'delete') {
      return await checkGlobalPermission(pool, userId, role, ARCHIVE_PERMISSIONS.CAN_DELETE_ARCHIVE);
    }
  }

  // 8. Voluntarii au nevoie de permisiunea globala de vizualizare
  if (requiredAction === 'view') {
    return await checkGlobalPermission(pool, userId, role, ARCHIVE_PERMISSIONS.CAN_VIEW_ARCHIVE);
  }

  return false;
}

/**
 * Middleware express pentru a proteja accesul la nivel de arhiva
 */
function requireArchivePermission(pool, permissionKey) {
  return async (req, res, next) => {
    try {
      const { userId, role } = req.user;
      const hasPermission = await checkGlobalPermission(pool, userId, role, permissionKey);
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Nu ai permisiunea necesara pentru a accesa arhiva.',
          required_permission: permissionKey,
        });
      }
      next();
    } catch (err) {
      console.error('[ArchivePerms] Error checking permission:', err);
      res.status(500).json({ error: 'Eroare la verificarea permisiunilor.' });
    }
  };
}

module.exports = {
  checkGlobalPermission,
  checkFolderAccess,
  requireArchivePermission,
};
