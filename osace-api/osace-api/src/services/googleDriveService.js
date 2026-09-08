// src/services/googleDriveService.js
const { getDriveClient, getDriveConfig, getOAuth2Client } = require('../config/googleDrive');
const stream = require('stream');
const axios = require('axios');

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
 * Incarca un fisier mare in Google Drive folosind protocolul Resumable Upload
 * Recomandat si necesar pentru fisiere > 5MB pentru a evita "socket hang up"
 */
async function uploadFileResumable({ name, mimeType, body, size, parentFolderId, description, properties }) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Clientul OAuth2 nu este initializat.');
  }

  const tokenRes = await oauth2Client.getAccessToken();
  const accessToken = (tokenRes && typeof tokenRes === 'object' && tokenRes.token) ? tokenRes.token : tokenRes;

  const config = getDriveConfig();
  const targetParent = parentFolderId || config.rootFolderId;

  const fileMetadata = {
    name,
    parents: targetParent ? [targetParent] : undefined,
    description: description || undefined,
    properties: properties || undefined,
  };

  // 1. Initializare sesiune de upload resumable
  const initUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,size,md5Checksum,webViewLink,webContentLink,createdTime,modifiedTime,parents';
  
  const initRes = await axios.post(initUrl, fileMetadata, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType || 'application/octet-stream',
      'X-Upload-Content-Length': String(size),
    },
    timeout: 60000,
  });

  const uploadUrl = initRes.headers.location;
  if (!uploadUrl) {
    throw new Error('Google Drive API nu a returnat URL-ul de sesiune resumable (Location header lipseste).');
  }

  // 2. Transmitere date (body Buffer sau Stream) catre URL-ul sesiunii Google
  const uploadRes = await axios.put(uploadUrl, body, {
    headers: {
      'Content-Length': String(size),
      'Content-Type': mimeType || 'application/octet-stream',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 0, // Fara timeout la transferul fisierului mare
  });

  return uploadRes.data;
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

  const segments = Array.isArray(pathSegments)
    ? pathSegments
    : (typeof pathSegments === 'string' ? pathSegments.split('/').filter(Boolean) : []);

  for (const segment of segments) {
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
 * Incarca un fisier in Google Drive (stream-based cu suport Resumable pentru fisiere > 5MB)
 * @param {Object} params
 * @param {string} params.name - Numele fisierului
 * @param {string} params.mimeType - Tipul MIME
 * @param {ReadableStream|Buffer} params.body - Fluxul de date sau buffer
 * @param {number} [params.size] - Dimensiunea fisierului in octeti
 * @param {string} params.parentFolderId - ID folder parinte
 * @param {string} [params.description] - Descriere optionala
 * @param {Object} [params.properties] - Metadata custom
 * @returns {Promise<Object>}
 */
async function uploadFile({ name, mimeType, body, size, parentFolderId, description, properties }) {
  const config = getDriveConfig();
  const targetParent = parentFolderId || config.rootFolderId;
  const fileSize = size || (Buffer.isBuffer(body) ? body.length : null);

  // Pentru fisiere mai mari de 5MB, folosim protocolul oficial Google Resumable Upload
  // pentru a preveni 'socket hang up' / ECONNRESET generat de limita multipart a Google.
  if (fileSize && fileSize > 5 * 1024 * 1024) {
    return uploadFileResumable({
      name,
      mimeType,
      body,
      size: fileSize,
      parentFolderId: targetParent,
      description,
      properties,
    });
  }

  const drive = ensureDrive();

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
 * @param {Object} [options] - Optiuni suplimentare (headers pentru Range requests, fullResponse)
 * @returns {Promise<ReadableStream|Object>} Fluxul de descarcare sau obiectul cu stream + headers
 */
async function downloadFileStream(fileId, options = {}) {
  const drive = ensureDrive();

  const requestOptions = {
    fileId,
    alt: 'media',
    supportsAllDrives: true,
  };

  const axiosOptions = { responseType: 'stream' };
  if (options.headers) {
    axiosOptions.headers = options.headers;
  }

  const response = await drive.files.get(
    requestOptions,
    axiosOptions
  );

  if (options.fullResponse) {
    return {
      stream: response.data,
      headers: response.headers,
      status: response.status,
    };
  }

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


