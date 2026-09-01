require('dotenv').config();
process.env.PGTZ = 'Europe/Bucharest';
const axios = require('axios');
const express = require('express');
const helmet = require('helmet');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const mailTransporter = require('./src/config/mailer');


// --- 1. Importarea Rutelor ---
const authRoutes = require('./src/features/Auth/auth.routes');
const profileRoutes = require('./src/features/Profile/profile.routes');
const eventRoutes = require('./src/features/Event/event.routes');
const adminRoutes = require('./src/features/Admin/admin.routes');
const notificationRoutes = require('./src/features/Notifications/notifications.routes');
const postRoutes = require('./src/features/Posts/posts.routes');
const badgeRoutes = require('./src/features/Badge/badge.routes');
const leaderboardRoutes = require('./src/features/Leaderboard/leaderboard.routes');
const verificationRoutes = require('./src/features/StudentVerification/verification.routes');
const configRoutes = require('./src/features/Config/config.routes');
const archiveRoutes = require('./src/features/Archive/archive.routes');
const { startCheckoutWorker } = require('./src/scripts/checkoutWorker');

const app = express();
const port = 3000;

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.)
app.use(helmet());

app.use(express.json({ limit: '1mb' }));

// --- 2. Inițializare Conexiuni ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// --- 3. Configurare CORS (Actualizat) ---
const allowedOrigins = [
  'https://osace.ro',
  'http://localhost:8081',
  'http://localhost:5173', // Vite default port (app)
  'http://localhost:5174', // Vite port (drive)
  'https://api.osace.ro',
  'https://app.osace.ro',
  'https://drive.osace.ro',
  'http://100.79.43.92:8081'
];

const corsOptions = {
  origin: function (origin, callback) {
    // !origin sau 'null' permite cererile de pe dispozitive mobile (Expo Go/WebViews) sau Postman
    if (
      !origin || 
      origin === 'null' || 
      allowedOrigins.indexOf(origin) !== -1 ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      callback(null, true);
    } else {
      console.error("CORS blocat pentru origin-ul:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Servire fișiere uploadate (Servit ÎNAINTE de globalLimiter pentru a preveni blocarea imaginilor statice)
app.use('/uploads', express.static('/var/www/osace-uploads', {
  dotfiles: 'deny',         // Nu servi fișiere ascunse (.env, .htaccess etc.)
  index: false,             // Dezactivează listarea directorului
  maxAge: '7d',             // Cache-Control: 7 zile pentru imagini statice
}));

// --- Rate Limiting Global ---
app.set('trust proxy', 1); // Trust first proxy (Nginx) for correct IP
const { globalLimiter } = require('./src/middleware/rateLimiter');
app.use(globalLimiter);

// --- 4. Middleware-uri (Neschimbat) ---
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Acces refuzat. Token lipsă.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) {
      console.error('Eroare verificare JWT:', err.message);
      return res.status(403).json({ error: 'Token invalid sau expirat.' });
    }
    req.user = userPayload;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acces interzis. Acțiune permisă doar administratorilor.' });
  }
  next();
}

function verifyManager(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'coordonator') {
    return res.status(403).json({ error: 'Acces interzis. Acțiune permisă doar administratorilor sau coordonatorilor.' });
  }
  next();
}

// --- 5. Folosirea Rutelor (Neschimbat) ---
app.use('/api/auth', authRoutes(pool, mailTransporter));
app.use('/api/profile', profileRoutes(pool, verifyToken));
app.use('/api/events', eventRoutes(pool, mailTransporter, verifyToken, verifyManager));
app.use('/api/admin', adminRoutes(pool, axios, verifyToken, verifyAdmin, verifyManager));
app.use('/api/notifications', notificationRoutes(pool, verifyToken));
app.use('/api/posts', postRoutes(pool, verifyToken, verifyManager));
app.use('/api/badges', badgeRoutes(pool, verifyToken));
app.use('/api/leaderboard', leaderboardRoutes(pool, verifyToken));
app.use('/api/verification', verificationRoutes(pool, verifyToken, verifyAdmin));
app.use('/api/config', configRoutes());
app.use('/api/archive', archiveRoutes(pool, verifyToken, verifyAdmin, verifyManager));

// Ruta rădăcină
app.get('/', (req, res) => {
  res.send('Serverul O.S.A.C.E. rulează! (Refactorizat)');
});

// --- 6. Pornirea Serverului ---
app.listen(port, async () => {
  startCheckoutWorker(pool);
  // Safe migration: add last_seen_at if it doesn't exist yet
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`);
    console.log('[DB] Column last_seen_at ensured on users table.');
  } catch (e) {
    console.warn('[DB] Could not ensure last_seen_at column:', e.message);
  }
  console.log(`Serverul a pornit la http://localhost:${port}`);
});