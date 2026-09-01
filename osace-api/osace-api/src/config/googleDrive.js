// src/config/googleDrive.js
const { google } = require('googleapis');

let oauth2ClientInstance = null;
let driveClientInstance = null;

/**
 * Returneaza configuratia Google Drive din mediul curent
 */
function getDriveConfig() {
  return {
    enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    maxUploadMb: parseInt(process.env.GOOGLE_DRIVE_MAX_UPLOAD_MB, 10) || 50,
  };
}

/**
 * Initializeaza si returneaza clientul OAuth2 singleton
 */
function getOAuth2Client() {
  if (oauth2ClientInstance) {
    return oauth2ClientInstance;
  }

  const config = getDriveConfig();

  if (!config.clientId || !config.clientSecret) {
    console.warn('[GoogleDrive] GOOGLE_DRIVE_CLIENT_ID sau GOOGLE_DRIVE_CLIENT_SECRET lipsesc din .env');
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  } else {
    console.warn('[GoogleDrive] GOOGLE_DRIVE_REFRESH_TOKEN lipseste din .env. Ruleaza scripts/google-drive-setup.js');
  }

  oauth2ClientInstance = oauth2Client;
  return oauth2ClientInstance;
}

/**
 * Returneaza clientul Google Drive API v3
 */
function getDriveClient() {
  if (driveClientInstance) {
    return driveClientInstance;
  }

  const auth = getOAuth2Client();
  if (!auth) {
    return null;
  }

  driveClientInstance = google.drive({
    version: 'v3',
    auth,
  });

  return driveClientInstance;
}

/**
 * Testeaza conexiunea la Google Drive si returneaza starea / cota de stocare
 */
async function checkDriveConnection() {
  const config = getDriveConfig();
  if (!config.enabled) {
    return {
      connected: false,
      reason: 'GOOGLE_DRIVE_ENABLED is not true',
    };
  }

  const drive = getDriveClient();
  if (!drive) {
    return {
      connected: false,
      reason: 'Google Drive client could not be initialized (missing credentials)',
    };
  }

  try {
    // 1. Verificam informatiile despre utilizator si cota de stocare
    const aboutRes = await drive.about.get({
      fields: 'user, storageQuota',
    });

    // 2. Daca este configurat un root folder ID, verificam ca exista si este accesibil
    let rootFolder = null;
    if (config.rootFolderId) {
      const folderRes = await drive.files.get({
        fileId: config.rootFolderId,
        fields: 'id, name, mimeType, trashed',
        supportsAllDrives: true,
      });
      rootFolder = folderRes.data;
    }

    return {
      connected: true,
      user: aboutRes.data.user,
      storageQuota: aboutRes.data.storageQuota,
      rootFolder,
    };
  } catch (error) {
    console.error('[GoogleDrive] Eroare la verificarea conexiunii:', error.message);
    return {
      connected: false,
      error: error.message,
      details: error.response ? error.response.data : null,
    };
  }
}

module.exports = {
  getDriveConfig,
  getOAuth2Client,
  getDriveClient,
  checkDriveConnection,
};
