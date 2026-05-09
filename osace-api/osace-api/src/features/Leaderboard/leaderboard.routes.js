// src/features/Leaderboard/leaderboard.routes.js
const express = require('express');
const router = express.Router();
const { getCurrentAcademicYear, parseYearParam } = require('../../utils/academicYear');

module.exports = (pool, verifyToken) => {

  // GET / — Leaderboard (filtered by academic year)
  // Query params: ?year=2025 (start year) or ?year=all for all-time
  router.get('/', verifyToken, async (req, res) => {
    try {
      const yearFilter = parseYearParam(req.query.year) || getCurrentAcademicYear();
      
      const LEADERBOARD_QUERY = `
        SELECT
          u.id,
          u.display_name,
          u.avatar_url,
          (COALESCE(SUM(ea.awarded_hours), 0) + 
           COALESCE((SELECT SUM(sc.awarded_hours) FROM special_contributions sc 
                     WHERE sc.user_id = u.id AND sc.status = 'approved'
                     AND sc.created_at >= $1 AND sc.created_at < $2), 0)
          ) AS total_hours,
          COALESCE(SUM(CASE WHEN e.category = 'social' THEN ea.awarded_hours ELSE 0 END), 0) AS social_hours,
          COALESCE(SUM(CASE WHEN e.category = 'proiect' THEN ea.awarded_hours ELSE 0 END), 0) AS proiect_hours,
          COALESCE(SUM(CASE WHEN e.category = 'sedinta' THEN ea.awarded_hours ELSE 0 END), 0) AS sedinta_hours
        FROM
          users u
        LEFT JOIN
          event_attendance ea ON u.id = ea.user_id AND ea.confirmation_status = 'attended'
        LEFT JOIN
          events e ON ea.event_id = e.id AND e.start_time >= $1 AND e.start_time < $2
        WHERE 
          u.role != 'admin'
        GROUP BY
          u.id, u.display_name, u.avatar_url
        ORDER BY
          total_hours DESC
        LIMIT 100;
      `;

      const result = await pool.query(LEADERBOARD_QUERY, [yearFilter.start, yearFilter.end]);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea clasamentului:', error);
      res.status(500).json({ error: 'Eroare server la preluarea clasamentului.' });
    }
  });

  // GET /available-years — Returns the list of academic years that have data
  router.get('/available-years', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT
          CASE 
            WHEN EXTRACT(MONTH FROM e.start_time) >= 9 THEN EXTRACT(YEAR FROM e.start_time)
            ELSE EXTRACT(YEAR FROM e.start_time) - 1
          END AS start_year
        FROM events e
        ORDER BY start_year DESC
      `);
      
      const current = getCurrentAcademicYear();
      const years = result.rows.map(r => {
        const sy = parseInt(r.start_year);
        return { startYear: sy, label: `${sy}-${sy + 1}` };
      });

      // Ensure current year is always included even if no events yet
      if (!years.find(y => y.startYear === current.startYear)) {
        years.unshift({ startYear: current.startYear, label: current.label });
      }

      res.json(years);
    } catch (error) {
      console.error('Eroare la preluarea anilor disponibili:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  return router;
};