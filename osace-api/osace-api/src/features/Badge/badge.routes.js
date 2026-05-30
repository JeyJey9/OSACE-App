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
    const userId = req.user.userId;
    try {
      const { awardBadge } = require('./badge.service');
      await awardBadge(userId, 'FOUND_EASTER_EGG', pool);
      res.json({ success: true, message: 'Felicitări! Ai deblocat badge-ul de Easter Egg!' });
    } catch (error) {
      console.error('Eroare la deblocarea badge-ului de Easter Egg:', error);
      res.status(500).json({ error: 'Eroare server la deblocarea badge-ului.' });
    }
  });

  return router;
};