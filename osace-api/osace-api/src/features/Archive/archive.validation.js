// src/features/Archive/archive.validation.js
const path = require('path');
const { ALLOWED_ARCHIVE_MIMES, DOCUMENT_CATEGORIES } = require('./archive.constants');
const { InvalidFileTypeError, FileSizeExceededError } = require('./archive.errors');
const { getDriveConfig } = require('../../config/googleDrive');

/**
 * Curata si sanitizeaza numele unui fisier
 */
function sanitizeFileName(fileName) {
  if (!fileName) return 'document-fara-nume';
  // Eliminam caracterele periculoase sau path traversal
  const base = path.basename(fileName);
  return base.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Valideaza un fisier pentru upload
 */
function validateUploadFile(file) {
  if (!file) {
    throw new Error('Niciun fisier nu a fost transmis pentru incarcare.');
  }

  const mime = file.mimetype;
  const config = getDriveConfig();
  const maxBytes = config.maxUploadMb * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new FileSizeExceededError(file.size, config.maxUploadMb);
  }

  // Verificare lista alba de MIME types
  if (!ALLOWED_ARCHIVE_MIMES.includes(mime) && !mime.startsWith('image/') && !mime.startsWith('text/')) {
    throw new InvalidFileTypeError(mime);
  }

  return true;
}

/**
 * Valideaza crearea unui folder
 */
function validateFolderInput(data) {
  const { name, category, department_id } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Numele folderului este obligatoriu.' };
  }

  if (name.length > 200) {
    return { valid: false, error: 'Numele folderului nu poate depasi 200 de caractere.' };
  }

  if (category && !DOCUMENT_CATEGORIES.includes(category)) {
    return { valid: false, error: `Categorie invalida. Valori permise: ${DOCUMENT_CATEGORIES.join(', ')}` };
  }

  return { valid: true };
}

module.exports = {
  sanitizeFileName,
  validateUploadFile,
  validateFolderInput,
};
