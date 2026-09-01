// src/features/Archive/archive.constants.js

// Permisiuni globale in user_permissions pentru modulul Arhiva
const ARCHIVE_PERMISSIONS = {
  CAN_VIEW_ARCHIVE: 'CAN_VIEW_ARCHIVE',
  CAN_UPLOAD_ARCHIVE: 'CAN_UPLOAD_ARCHIVE',
  CAN_DELETE_ARCHIVE: 'CAN_DELETE_ARCHIVE',
  CAN_MANAGE_ARCHIVE: 'CAN_MANAGE_ARCHIVE',
};

// Actiuni de log in archive_access_log
const ARCHIVE_ACTIONS = {
  FOLDER_CREATE: 'FOLDER_CREATE',
  FOLDER_VIEW: 'FOLDER_VIEW',
  FOLDER_UPDATE: 'FOLDER_UPDATE',
  FOLDER_DELETE: 'FOLDER_DELETE',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_DOWNLOAD: 'DOCUMENT_DOWNLOAD',
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_PREVIEW: 'DOCUMENT_PREVIEW',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  DOCUMENT_RESTORE: 'DOCUMENT_RESTORE',
  DOCUMENT_PERMANENT_DELETE: 'DOCUMENT_PERMANENT_DELETE',
  TRASH_EMPTY: 'TRASH_EMPTY',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  STRUCTURE_INIT: 'STRUCTURE_INIT',
};

// Categorii de documente
const DOCUMENT_CATEGORIES = [
  'governance',      // Statut, PV-uri CD, Hotarari, Rapoarte
  'department',      // IT, HR, PR, FR, Logistica
  'project',         // Documente per proiect
  'financial',       // Bugete, deconturi, facturi
  'event',           // Documente evenimente
  'export',          // Exporturi aplicatie
  'general',         // General
];

// Departamente recunoscute in organizatie
const DEPARTMENTS = [
  'IT',
  'HR',
  'PR',
  'FR',
  'Logistica',
  'Board',
];

// Structura ierarhica implicita de foldere O.S.A.C.E.
const DEFAULT_FOLDER_STRUCTURE = [
  {
    name: '00_Governance',
    category: 'governance',
    department: 'Board',
    subfolders: [
      { name: '01_Statut_si_Regulamente', category: 'governance' },
      { name: '02_Procese_Verbale_CD', category: 'governance' },
      { name: '03_Hotarari', category: 'governance' },
      { name: '04_Rapoarte_Anuale', category: 'governance' },
      { name: '05_Adunarea_Generala', category: 'governance' },
    ],
  },
  {
    name: '01_Departamente',
    category: 'department',
    subfolders: [
      { name: 'IT', category: 'department', department: 'IT' },
      { name: 'HR', category: 'department', department: 'HR' },
      { name: 'PR', category: 'department', department: 'PR' },
      { name: 'FR', category: 'department', department: 'FR' },
      { name: 'Logistica', category: 'department', department: 'Logistica' },
    ],
  },
  {
    name: '02_Proiecte',
    category: 'project',
    subfolders: [],
  },
  {
    name: '03_Financial',
    category: 'financial',
    department: 'Board',
    subfolders: [
      { name: 'Bugete', category: 'financial' },
      { name: 'Deconturi', category: 'financial' },
    ],
  },
  {
    name: '04_Evenimente',
    category: 'event',
    subfolders: [],
  },
  {
    name: '10_Exports',
    category: 'export',
    subfolders: [],
  },
  {
    name: '99_System',
    category: 'general',
    subfolders: [],
  },
];

// Extensii si MIME types acceptate pentru upload in arhiva
const ALLOWED_ARCHIVE_MIMES = [
  // Documente & Office
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  // Arhive
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  // Imagini
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

module.exports = {
  ARCHIVE_PERMISSIONS,
  ARCHIVE_ACTIONS,
  DOCUMENT_CATEGORIES,
  DEPARTMENTS,
  DEFAULT_FOLDER_STRUCTURE,
  ALLOWED_ARCHIVE_MIMES,
};
