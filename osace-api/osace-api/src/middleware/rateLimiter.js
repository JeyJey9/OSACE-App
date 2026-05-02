const rateLimit = require('express-rate-limit');

// 1. Limitator Global: Pentru întregul API
// Permite 300 de request-uri la fiecare 15 minute pe IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
  message: { error: 'Prea multe cereri de la acest IP, te rugăm să încerci din nou mai târziu.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// 2. Limitator Autentificare: Pentru /login, /register
// Permite 5 request-uri la fiecare 5 minute pe IP
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 5, 
  message: { error: 'Prea multe încercări de autentificare, te rugăm să încerci din nou în 5 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Limitator Acțiuni Eveniment: Pentru /attend și /unattend
// Permite 10 request-uri pe minut pe IP
const eventActionLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: { error: 'Prea multe acțiuni rapide! Te rugăm să aștepți un minut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  eventActionLimiter
};
