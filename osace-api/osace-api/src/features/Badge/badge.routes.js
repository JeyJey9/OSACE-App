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

  return router;
};