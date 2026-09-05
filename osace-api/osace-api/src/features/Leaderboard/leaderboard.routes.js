// src/features/Leaderboard/leaderboard.routes.js
const express = require('express');
const router = express.Router();
const { getCurrentAcademicYear, parseYearParam } = require('../../utils/academicYear');

module.exports = (pool, verifyToken) => {

  // GET / — Leaderboard (filtered by academic year or all-time)
  // Query params: ?year=2025 (start year) or ?year=all for all-time
  router.get('/', verifyToken, async (req, res) => {
    try {
      const isAllTime = req.query.year === 'all';
      const yearFilter = isAllTime ? null : (parseYearParam(req.query.year) || getCurrentAcademicYear());

      let LEADERBOARD_QUERY;
      let params;

      if (isAllTime) {
        LEADERBOARD_QUERY = `
          SELECT
            u.id,
            u.display_name,
            u.avatar_url,
            (COALESCE(SUM(att.awarded_hours), 0) + 
             COALESCE((SELECT SUM(sc.awarded_hours) FROM special_contributions sc 
                       WHERE sc.user_id = u.id AND sc.status = 'approved'), 0)
            ) AS total_hours,
            COALESCE(SUM(CASE WHEN att.category = 'social' THEN att.awarded_hours ELSE 0 END), 0) AS social_hours,
            COALESCE(SUM(CASE WHEN att.category = 'proiect' THEN att.awarded_hours ELSE 0 END), 0) AS proiect_hours,
            COALESCE(SUM(CASE WHEN att.category = 'sedinta' THEN att.awarded_hours ELSE 0 END), 0) AS sedinta_hours
          FROM
            users u
          LEFT JOIN (
            SELECT 
              ea.user_id, 
              ea.awarded_hours, 
              e.category
            FROM event_attendance ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.confirmation_status = 'attended'
          ) att ON u.id = att.user_id
          WHERE 
            u.role != 'admin'
          GROUP BY
            u.id, u.display_name, u.avatar_url
          ORDER BY
            total_hours DESC
          LIMIT 100;
        `;
        params = [];
      } else {
        LEADERBOARD_QUERY = `
          SELECT
            u.id,
            u.display_name,
            u.avatar_url,
            (COALESCE(SUM(att.awarded_hours), 0) + 
             COALESCE((SELECT SUM(sc.awarded_hours) FROM special_contributions sc 
                       WHERE sc.user_id = u.id AND sc.status = 'approved'
                       AND sc.created_at >= $1 AND sc.created_at < $2), 0)
            ) AS total_hours,
            COALESCE(SUM(CASE WHEN att.category = 'social' THEN att.awarded_hours ELSE 0 END), 0) AS social_hours,
            COALESCE(SUM(CASE WHEN att.category = 'proiect' THEN att.awarded_hours ELSE 0 END), 0) AS proiect_hours,
            COALESCE(SUM(CASE WHEN att.category = 'sedinta' THEN att.awarded_hours ELSE 0 END), 0) AS sedinta_hours
          FROM
            users u
          LEFT JOIN (
            SELECT 
              ea.user_id, 
              ea.awarded_hours, 
              e.category
            FROM event_attendance ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.confirmation_status = 'attended'
              AND e.start_time >= $1 AND e.start_time < $2
          ) att ON u.id = att.user_id
          WHERE 
            u.role != 'admin'
          GROUP BY
            u.id, u.display_name, u.avatar_url
          ORDER BY
            total_hours DESC
          LIMIT 100;
        `;
        params = [yearFilter.start, yearFilter.end];
      }

      const result = await pool.query(LEADERBOARD_QUERY, params);
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
            WHEN EXTRACT(MONTH FROM date_val) >= 9 THEN EXTRACT(YEAR FROM date_val)
            ELSE EXTRACT(YEAR FROM date_val) - 1
          END AS start_year
        FROM (
          SELECT start_time AS date_val FROM events WHERE start_time IS NOT NULL
          UNION ALL
          SELECT created_at AS date_val FROM special_contributions WHERE created_at IS NOT NULL
        ) combined_dates
        ORDER BY start_year DESC
      `);
      
      const current = getCurrentAcademicYear();
      const years = result.rows
        .filter(r => r.start_year !== null && !isNaN(parseInt(r.start_year)))
        .map(r => {
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