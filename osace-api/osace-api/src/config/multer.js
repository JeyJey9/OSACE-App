// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Definim locația de bază pentru toate upload-urile
const UPLOAD_DIRECTORY = '/var/www/osace-uploads';

// --- Validare strictă tip fișier ---
// Verificăm ATÂT extensia fișierului CÂT ȘI MIME type-ul declarat.
// Ambele trebuie să fie în lista albă pentru a preveni upload-uri malițioase
// (ex: un .php redenumit în .jpg cu MIME type falsificat).

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * File filter strict pentru imagini.
 * Verifică atât extensia cât și MIME type-ul.
 */
const strictImageFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext) && ALLOWED_IMAGE_MIMETYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`Tip de fișier nepermis (${ext}). Sunt acceptate doar: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`), false);
  }
};

// --- Configurare 1: Upload Avatar (pentru Profile) ---
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salvăm avatarele într-un subfolder dedicat
    const uploadPath = path.join(UPLOAD_DIRECTORY, 'avatars');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Asigură-te că verifyToken a rulat înainte pentru a avea req.user
    if (!req.user || !req.user.userId) {
      return cb(new Error('Utilizator neautentificat pentru upload avatar'), null);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.user.userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// Exportăm un middleware gata configurat pentru AVATAR
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: strictImageFilter
});

// --- Configurare 2: Upload Imagini Postări (pentru Posts) ---
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salvăm postările într-un subfolder dedicat (nu la rădăcina upload-urilor)
    const uploadPath = path.join(UPLOAD_DIRECTORY, 'posts');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'osace-post-' + uniqueSuffix + ext);
  }
});

// Exportăm un middleware gata configurat pentru POSTĂRI
const uploadPostImages = multer({ 
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: strictImageFilter
});

// --- Configurare 3: Upload Legitimație Student (pentru Verificare) ---
const studentIdStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(UPLOAD_DIRECTORY, 'student-ids');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    if (!req.user || !req.user.userId) {
      return cb(new Error('Utilizator neautentificat pentru upload legitimație'), null);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const secureToken = crypto.randomBytes(16).toString('hex');
    const uniqueName = `student-id-${req.user.userId}-${Date.now()}-${secureToken}${ext}`;
    cb(null, uniqueName);
  }
});

const uploadStudentId = multer({
  storage: studentIdStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: strictImageFilter
});

// --- Exportăm toate trei ---
module.exports = {
  uploadAvatar,
  uploadPostImages,
  uploadStudentId
};