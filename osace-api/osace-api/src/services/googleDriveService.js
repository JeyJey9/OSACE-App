// src/services/googleDriveService.js
const { getDriveClient, getDriveConfig } = require('../config/googleDrive');
const stream = require('stream');

/**
 * Returneaza instanta Drive sau arunca eroare daca nu este initializat
 */
function ensureDrive() {
  const drive = getDriveClient();
  if (!drive) {
    throw new Error('Google Drive API nu este configurat corespunzator sau lipsesc credidentialele.');
  }
  return drive;
}

/**
 * Creaza un folder in Google Drive sub un folder parinte
 * @param {string} name - Numele folderului
 * @param {string} parentFolderId - ID-ul folderului parinte (sau root folder ID)
 * @returns {Promise<Object>} Metadata folder creat
 */
async function createFolder(name, parentFolderId = null) {
  const drive = ensureDrive();
  const config = getDriveConfig();
  const targetParent = parentFolderId || config.rootFolderId;

  const fileMetadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: targetParent ? [targetParent] : undefined,
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name, mimeType, parents, webViewLink, createdTime, modifiedTime',
    supportsAllDrives: true,
  });

  return response.data;
}

/**
 * Cauta un folder dupa nume sub un parinte anume
 * @param {string} name - Numele folderului
 * @param {string} parentFolderId - ID-ul folderului parinte
 * @returns {Promise<Object|null>}
 */
async function findFolder(name, parentFolderId = null) {
  const drive = ensureDrive();
  const config = getDriveConfig();
  const targetParent = parentFolderId || config.rootFolderId;

  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`;
  if (targetParent) {
    query += ` and '${targetParent}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, parents, webViewLink, createdTime, modifiedTime)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0];
  }
  return null;
}

/**
 * Asigura crearea recursiva a unei cai de foldere (ex: ['00_Governance', '01_Statut'])
 * @param {string[]} pathSegments - Lista de nume de foldere
 * @param {string} rootFolderId - ID-ul folderului de start
 * @returns {Promise<Object>} Folderul final din ierarhie
 */
async function ensureFolderPath(pathSegments, rootFolderId = null) {
  const config = getDriveConfig();
  let currentParentId = rootFolderId || config.rootFolderId;
  let lastFolder = null;

  for (const segment of pathSegments) {
    if (!segment || !segment.trim()) continue;
    const cleanSegment = segment.trim();

    let folder = await findFolder(cleanSegment, currentParentId);
    if (!folder) {
      folder = await createFolder(cleanSegment, currentParentId);
    }
    currentParentId = folder.id;
    lastFolder = folder;
  }

  return lastFolder;
}

/**
 * Incarca un fisier in Google Drive (stream-based)
 * @param {Object} params
 * @param {string} params.name - Numele fisierului
 * @param {string} params.mimeType - Tipul MIME
 * @param {ReadableStream|Buffer} params.body - Fluxul de date sau buffer
 * @param {string} params.parentFolderId - ID folder parinte
 * @param {string} [params.description] - Descriere optionala
 * @param {Object} [params.properties] - Metadata custom
 * @returns {Promise<Object>}
 */
async function uploadFile({ name, mimeType, body, parentFolderId, description, properties }) {
  const drive = ensureDrive();
  const config = getDriveConfig();
  const targetParent = parentFolderId || config.rootFolderId;

  // Convertim Buffer in Readable Stream daca este necesar
  let mediaStream = body;
  if (Buffer.isBuffer(body)) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(body);
    mediaStream = bufferStream;
  }

  const fileMetadata = {
    name,
    parents: targetParent ? [targetParent] : undefined,
    description: description || undefined,
    properties: properties || undefined,
  };

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: mediaStream,
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, md5Checksum, webViewLink, webContentLink, createdTime, modifiedTime, parents',
    supportsAllDrives: true,
  });

  return response.data;
}

/**
 * Obtine metadata pentru un fisier/folder din Drive
 * @param {string} fileId - ID-ul fisierului din Drive
 * @returns {Promise<Object>}
 */
async function getFileMetadata(fileId) {
  const drive = ensureDrive();

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, md5Checksum, webViewLink, webContentLink, createdTime, modifiedTime, parents, trashed, description, properties',
    supportsAllDrives: true,
  });

  return response.data;
}

/**
 * Descarca un fisier ca stream din Google Drive
 * @param {string} fileId - ID-ul fisierului din Drive
 * @returns {Promise<ReadableStream>} Fluxul de descarcare
 */
async function downloadFileStream(fileId) {
  const drive = ensureDrive();

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'stream' }
  );

  return response.data;
}

/**
 * Sterge un fisier (mutare in Trash sau stergere definitiva)
 * @param {string} fileId - ID-ul fisierului din Drive
 * @param {boolean} [permanent=false] - True pentru stergere permanenta
 * @returns {Promise<void>}
 */
async function deleteFile(fileId, permanent = false) {
  const drive = ensureDrive();

  if (permanent) {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } else {
    await drive.files.update({
      fileId,
      resource: { trashed: true },
      supportsAllDrives: true,
    });
  }
}

/**
 * Muta un fisier dintr-un folder in altul
 * @param {string} fileId - ID-ul fisierului
 * @param {string} newParentId - ID-ul noului folder parinte
 * @param {string} oldParentId - ID-ul vechiului folder parinte
 * @returns {Promise<Object>}
 */
async function moveFile(fileId, newParentId, oldParentId) {
  const drive = ensureDrive();

  const response = await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id, name, parents',
    supportsAllDrives: true,
  });

  return response.data;
}

/**
 * Listeaza continutul unui folder din Google Drive
 * @param {string} folderId - ID-ul folderului
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function listFolder(folderId, options = {}) {
  const drive = ensureDrive();
  const config = getDriveConfig();
  const targetFolder = folderId || config.rootFolderId;

  const pageSize = options.pageSize || 50;
  const pageToken = options.pageToken || undefined;
  const orderBy = options.orderBy || 'folder,name';

  const query = `'${targetFolder}' in parents and trashed = false`;

  const response = await drive.files.list({
    q: query,
    pageSize,
    pageToken,
    orderBy,
    fields: 'nextPageToken, files(id, name, mimeType, size, md5Checksum, webViewLink, createdTime, modifiedTime, parents)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data;
}

/**
 * Redenumeste un folder din Google Drive
 * @param {string} folderId - ID-ul folderului din Drive
 * @param {string} newName - Noul nume al folderului
 * @returns {Promise<Object>}
 */
async function renameFolder(folderId, newName) {
  const drive = ensureDrive();
  const response = await drive.files.update({
    fileId: folderId,
    resource: { name: newName },
    fields: 'id, name, modifiedTime',
    supportsAllDrives: true,
  });
  return response.data;
}

/**
 * Restaureaza un fisier din Trash in Google Drive
 * @param {string} fileId - ID-ul fisierului din Drive
 * @returns {Promise<Object>}
 */
async function untrashFile(fileId) {
  const drive = ensureDrive();
  const response = await drive.files.update({
    fileId,
    resource: { trashed: false },
    fields: 'id, name, trashed',
    supportsAllDrives: true,
  });
  return response.data;
}

module.exports = {
  createFolder,
  findFolder,
  ensureFolderPath,
  uploadFile,
  getFileMetadata,
  downloadFileStream,
  deleteFile,
  moveFile,
  listFolder,
  renameFolder,
  untrashFile,
};


