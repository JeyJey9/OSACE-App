// src/features/Leaderboard/leaderboard.routes.js
const express = require('express');
const router = express.Router();

// Am mutat query-ul aici, deoarece este folosit doar de acest fișier
const LEADERBOARD_QUERY = `
  SELECT
    u.id,
    u.display_name,
    u.avatar_url,
    COALESCE(SUM(ea.awarded_hours), 0) AS total_hours,
    COALESCE(SUM(CASE WHEN e.category = 'social' THEN ea.awarded_hours ELSE 0 END), 0) AS social_hours,
    COALESCE(SUM(CASE WHEN e.category = 'proiect' THEN ea.awarded_hours ELSE 0 END), 0) AS proiect_hours,
    COALESCE(SUM(CASE WHEN e.category = 'sedinta' THEN ea.awarded_hours ELSE 0 END), 0) AS sedinta_hours
  FROM
    users u
  LEFT JOIN
    event_attendance ea ON u.id = ea.user_id AND ea.confirmation_status = 'attended'
  LEFT JOIN
    events e ON ea.event_id = e.id
  WHERE 
    u.role != 'admin'
  GROUP BY
    u.id, u.display_name, u.avatar_url
  ORDER BY
    total_hours DESC
  LIMIT 100;
`;

module.exports = (pool, verifyToken) => {
  router.get('/', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(LEADERBOARD_QUERY);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea clasamentului:', error);
      res.status(500).json({ error: 'Eroare server la preluarea clasamentului.' });
    }
  });

  return router;
};