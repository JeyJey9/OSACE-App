  require('dotenv').config();
  process.env.PGTZ = 'Europe/Bucharest';
  const axios = require('axios');
  const express = require('express');
  const { Pool } = require('pg');
  const jwt = require('jsonwebtoken'); 
  const nodemailer = require('nodemailer');
  const cors = require('cors');
  const path = require('path');
  

  // --- 1. Importarea Rutelor ---
  const authRoutes = require('./src/features/Auth/auth.routes');
  const profileRoutes = require('./src/features/Profile/profile.routes');
  const eventRoutes = require('./src/features/Event/event.routes');
  const adminRoutes = require('./src/features/Admin/admin.routes');
  const notificationRoutes = require('./src/features/Notifications/notifications.routes');
  const postRoutes = require('./src/features/Posts/posts.routes');
  const badgeRoutes = require('./src/features/Badge/badge.routes');
  const leaderboardRoutes = require('./src/features/Leaderboard/leaderboard.routes');
  const { startCheckoutWorker } = require('./src/scripts/checkoutWorker');

  const app = express();
  const port = 3000;

  app.use(express.json());

  // --- 2. Inițializare Conexiuni ---
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  // ▼▼▼ MODIFICAT AICI: Configurația Nodemailer pentru BREVO ▼▼▼
  const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // Portul 587 folosește STARTTLS, deci 'secure' e false
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // ▲▲▲ SFÂRȘIT MODIFICARE ▲▲▲

  console.log('Transporter email configurat. Se verifică conexiunea...');
  mailTransporter.verify(function(error, success) {
    if (error) {
      console.error("Eroare conexiune SMTP:", error);
    } else {
      console.log("Serverul SMTP este pregătit să primească mesaje.");
    }
  });

  // --- 3. Configurare CORS (Actualizat) ---
  const allowedOrigins = [
    'https://osace.ro',
    'http://localhost:8081',
    'http://localhost:5173', // Vite default port
    'https://api.osace.ro',
    'https://app.osace.ro',
    'http://100.79.43.92:8081'
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // !origin permite cererile de pe dispozitive mobile (Expo Go) sau Postman
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error("CORS blocat pentru origin-ul:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
  
  app.use(cors(corsOptions));

  // Folderul 'uploads' (Neschimbat)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  // Ruta rădăcină
  app.get('/', (req, res) => {
    res.send('Serverul O.S.A.C.E. rulează! (Refactorizat)');
  });

  // --- 6. Pornirea Serverului ---
  app.listen(port, () => {
    startCheckoutWorker(pool);
    console.log(`Serverul a pornit la http://localhost:${port}`);
  });