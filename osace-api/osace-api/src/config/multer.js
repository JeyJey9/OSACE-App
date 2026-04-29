// src/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Definim locația de bază pentru toate upload-urile
const UPLOAD_DIRECTORY = '/var/www/osace-uploads';

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
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const avatarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sunt permise doar imagini!'), false);
  }
};

// Exportăm un middleware gata configurat pentru AVATAR
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: avatarFileFilter
});

// --- Configurare 2: Upload Imagini Postări (pentru Posts) ---
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salvăm postările la rădăcina folderului de upload
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
    cb(null, UPLOAD_DIRECTORY);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'osace-post-' + uniqueSuffix + extension);
  }
});

// Exportăm un middleware gata configurat pentru POSTĂRI
const uploadPostImages = multer({ 
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Exportăm ambele ---
module.exports = {
  uploadAvatar,
  uploadPostImages
};