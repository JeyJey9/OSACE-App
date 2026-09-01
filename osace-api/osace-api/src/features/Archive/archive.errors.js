// src/features/Archive/archive.errors.js

class ArchiveError extends Error {
  constructor(message, statusCode = 500, code = 'ARCHIVE_ERROR') {
    super(message);
    this.name = 'ArchiveError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class FolderNotFoundError extends ArchiveError {
  constructor(folderId) {
    super(`Folderul cu ID-ul ${folderId} nu a fost gasit.`, 404, 'FOLDER_NOT_FOUND');
  }
}

class DocumentNotFoundError extends ArchiveError {
  constructor(documentId) {
    super(`Documentul cu ID-ul ${documentId} nu a fost gasit.`, 404, 'DOCUMENT_NOT_FOUND');
  }
}

class ArchivePermissionDeniedError extends ArchiveError {
  constructor(action = 'accesare') {
    super(`Nu ai permisiunea necesara pentru ${action} in aceasta sectiune a arhivei.`, 403, 'ARCHIVE_PERMISSION_DENIED');
  }
}

class InvalidFileTypeError extends ArchiveError {
  constructor(mimeType) {
    super(`Tipul de fisier (${mimeType}) nu este permis in arhiva.`, 400, 'INVALID_FILE_TYPE');
  }
}

class FileSizeExceededError extends ArchiveError {
  constructor(size, maxSize) {
    super(`Dimensiunea fisierului (${Math.round(size / 1024 / 1024)}MB) depaseste limita maxima de ${maxSize}MB.`, 400, 'FILE_SIZE_EXCEEDED');
  }
}

module.exports = {
  ArchiveError,
  FolderNotFoundError,
  DocumentNotFoundError,
  ArchivePermissionDeniedError,
  InvalidFileTypeError,
  FileSizeExceededError,
};
