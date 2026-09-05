const express = require('express');
const router = express.Router();

// Această rută va primi 'pool' și 'verifyToken'
module.exports = (pool, verifyToken) => {

  // GET /api/badges - Returnează TOATE badge-urile definite
  router.get('/', verifyToken, async (req, res) => {
    try {
      const query = `
        SELECT * FROM badges
        ORDER BY name ASC;
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea catalogului de badge-uri:', error);
      res.status(500).json({ error: 'Eroare server la preluarea badge-urilor.' });
    }
  });

  // POST /api/badges/claim-easter-egg - Claim the easter egg badge
  router.post('/claim-easter-egg', verifyToken, async (req, res) => {
    const userId = parseInt(req.user?.userId, 10);
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ error: 'Identificator utilizator invalid.' });
    }

    // Preluăm cheia în siguranță (default 'FOUND_EASTER_EGG')
    let key = 'FOUND_EASTER_EGG';
    if (req.body && typeof req.body.key === 'string' && req.body.key.trim().length > 0) {
      key = req.body.key.trim();
    }

    // 1. Validare format strict (doar caractere alfanumerice și underscore, 3-50 caractere)
    // Elimină din start orice caractere speciale SQL (ghilimele, punct și virgulă, spații etc.)
    const KEY_FORMAT_REGEX = /^[A-Z0-9_]{3,50}$/;
    if (!KEY_FORMAT_REGEX.test(key)) {
      return res.status(400).json({ error: 'Format cheie easter egg invalid.' });
    }

    // 2. Whitelist guard: doar cheile autorizate de tip secret/easter egg sunt permise
    const isSecretKey = key === 'FOUND_EASTER_EGG' || key.startsWith('SECRET_') || key.startsWith('EASTER_EGG_');
    if (!isSecretKey) {
      return res.status(400).json({ error: 'Cheie de easter egg neautorizată.' });
    }

    try {
      const { awardBadge } = require('./badge.service');
      const awardResult = await awardBadge(userId, key, pool);

      if (awardResult && awardResult.awarded) {
        return res.json({
          success: true,
          awarded: true,
          unlocked_badge: awardResult.badge,
          message: `Badge-ul "${awardResult.badge.name}" deblocat!`
        });
      }

      return res.json({
        success: true,
        awarded: false,
        message: 'Ai descoperit deja acest secret!'
      });
    } catch (error) {
      console.error('Eroare la deblocarea badge-ului de Easter Egg:', error);
      res.status(500).json({ error: 'Eroare server la deblocarea badge-ului.' });
    }
  });

  return router;
};