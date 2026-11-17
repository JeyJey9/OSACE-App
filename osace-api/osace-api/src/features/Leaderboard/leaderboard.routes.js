// src/features/Leaderboard/leaderboard.routes.js
const express = require('express');
const router = express.Router();
const {
  getAcademicYear,
  getCurrentAcademicYear,
  parsePeriodParams,
  getPreviousMonthBounds,
} = require('../../utils/academicYear');

async function findPeriodWinner(pool, start, end) {
  const query = `
    SELECT
      u.id,
      u.display_name,
      u.avatar_url,
      (COALESCE(att.hours, 0) + COALESCE(sc_agg.hours, 0))::float AS total_hours,
      (COALESCE(att.cnt, 0) + COALESCE(sc_agg.cnt, 0))::int AS total_activities
    FROM users u
    LEFT JOIN (
      SELECT
        ea.user_id,
        SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0)) AS hours,
        COUNT(ea.event_id) AS cnt
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.confirmation_status = 'attended'
        AND e.start_time >= $1 AND e.start_time < $2
      GROUP BY ea.user_id
    ) att ON u.id = att.user_id
    LEFT JOIN (
      SELECT
        sc.user_id,
        SUM(sc.awarded_hours) AS hours,
        COUNT(sc.id) AS cnt
      FROM special_contributions sc
      WHERE sc.status = 'approved'
        AND sc.created_at >= $1 AND sc.created_at < $2
      GROUP BY sc.user_id
    ) sc_agg ON u.id = sc_agg.user_id
    WHERE u.role != 'admin'
      AND (COALESCE(att.hours, 0) + COALESCE(sc_agg.hours, 0)) > 0
    ORDER BY total_hours DESC, total_activities DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [start, end]);
  return result.rows[0] || null;
}

async function findBadgeHolderWinner(pool, badgeKey, periodLabel = null, periodStart = null, periodEnd = null) {
  const query = `
    SELECT
      base.id,
      base.display_name,
      base.avatar_url,
      base.period_label,
      CASE
        WHEN $3::timestamptz IS NOT NULL AND $4::timestamptz IS NOT NULL AND base.period_hours > 0
          THEN base.period_hours
        ELSE base.all_hours
      END::float AS total_hours,
      CASE
        WHEN $3::timestamptz IS NOT NULL AND $4::timestamptz IS NOT NULL AND base.period_hours > 0
          THEN base.period_activities
        ELSE base.all_activities
      END::int AS total_activities
    FROM (
      SELECT
        u.id,
        u.display_name,
        u.avatar_url,
        ub.period_label,
        ub.earned_at,
        (
          COALESCE((
            SELECT SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0))
            FROM event_attendance ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.user_id = u.id
              AND ea.confirmation_status = 'attended'
              AND ($3::timestamptz IS NULL OR e.start_time >= $3::timestamptz)
              AND ($4::timestamptz IS NULL OR e.start_time < $4::timestamptz)
          ), 0) +
          COALESCE((
            SELECT SUM(sc.awarded_hours)
            FROM special_contributions sc
            WHERE sc.user_id = u.id
              AND sc.status = 'approved'
              AND ($3::timestamptz IS NULL OR sc.created_at >= $3::timestamptz)
              AND ($4::timestamptz IS NULL OR sc.created_at < $4::timestamptz)
          ), 0)
        )::float AS period_hours,
        (
          COALESCE((
            SELECT COUNT(ea.event_id)
            FROM event_attendance ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.user_id = u.id
              AND ea.confirmation_status = 'attended'
              AND ($3::timestamptz IS NULL OR e.start_time >= $3::timestamptz)
              AND ($4::timestamptz IS NULL OR e.start_time < $4::timestamptz)
          ), 0) +
          COALESCE((
            SELECT COUNT(sc.id)
            FROM special_contributions sc
            WHERE sc.user_id = u.id
              AND sc.status = 'approved'
              AND ($3::timestamptz IS NULL OR sc.created_at >= $3::timestamptz)
              AND ($4::timestamptz IS NULL OR sc.created_at < $4::timestamptz)
          ), 0)
        )::int AS period_activities,
        (
          COALESCE((
            SELECT SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0))
            FROM event_attendance ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.user_id = u.id AND ea.confirmation_status = 'attended'
          ), 0) +
          COALESCE((
            SELECT SUM(sc.awarded_hours)
            FROM special_contributions sc
            WHERE sc.user_id = u.id AND sc.status = 'approved'
          ), 0)
        )::float AS all_hours,
        (
          COALESCE((
            SELECT COUNT(ea.event_id)
            FROM event_attendance ea
            WHERE ea.user_id = u.id AND ea.confirmation_status = 'attended'
          ), 0) +
          COALESCE((
            SELECT COUNT(sc.id)
            FROM special_contributions sc
            WHERE sc.user_id = u.id AND sc.status = 'approved'
          ), 0)
        )::int AS all_activities
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      JOIN users u ON ub.user_id = u.id
      WHERE b.key = $1
        AND u.role != 'admin'
        AND ($2::text IS NULL OR EXISTS (
          SELECT 1 FROM unnest(string_to_array(COALESCE(ub.period_label, ''), ',')) AS p
          WHERE LOWER(TRIM(p)) = LOWER(TRIM($2))
        ))
      ORDER BY ub.earned_at DESC
      LIMIT 1
    ) base;
  `;
  const result = await pool.query(query, [badgeKey, periodLabel, periodStart, periodEnd]);
  return result.rows[0] || null;
}

module.exports = (pool, verifyToken) => {

  // GET / — Leaderboard (filtered by academic year, optional month, or all-time)
  // Query params: ?year=2025|all &month=1..12|all
  router.get('/', verifyToken, async (req, res) => {
    try {
      const periodFilter = parsePeriodParams(req.query.year, req.query.month);
      const isBounded = Boolean(periodFilter && periodFilter.start && periodFilter.end);
      const eventDateCond = isBounded ? 'AND e.start_time >= $1 AND e.start_time < $2' : '';
      const contribDateCond = isBounded ? 'AND sc.created_at >= $1 AND sc.created_at < $2' : '';
      const params = isBounded ? [periodFilter.start, periodFilter.end] : [];

      let expectedMonthLabel = null;
      let expectedYearLabel = null;

      if (isBounded) {
        const currentAcademicYear = getCurrentAcademicYear();
        const parsedYear = req.query.year && req.query.year !== 'all' ? parseInt(req.query.year, 10) : NaN;
        const selectedStartYear = !isNaN(parsedYear) ? parsedYear : currentAcademicYear.startYear;

        expectedYearLabel = `${selectedStartYear - 1}-${selectedStartYear}`;

        if (periodFilter.month && periodFilter.year) {
          expectedMonthLabel = getPreviousMonthBounds(new Date(periodFilter.year, periodFilter.month - 1, 15)).label;
        } else if (selectedStartYear === currentAcademicYear.startYear) {
          expectedMonthLabel = getPreviousMonthBounds().label;
        }
      }

      const buildChampionSelect = (badgeKey, expectedLabel, alias) => {
        if (!expectedLabel) {
          return `NULL::text AS ${alias}`;
        }
        params.push(expectedLabel);
        const paramIdx = params.length;
        return `(
          SELECT ub.period_label
          FROM user_badges ub
          JOIN badges b ON ub.badge_id = b.id
          WHERE ub.user_id = u.id
            AND b.key = '${badgeKey}'
            AND EXISTS (
              SELECT 1 FROM unnest(string_to_array(COALESCE(ub.period_label, ''), ',')) AS p
              WHERE LOWER(TRIM(p)) = LOWER(TRIM($${paramIdx}))
            )
          LIMIT 1
        ) AS ${alias}`;
      };

      const monthChampionSelect = buildChampionSelect('VOLUNTEER_OF_THE_MONTH', expectedMonthLabel, 'month_champion_label');
      const yearChampionSelect = buildChampionSelect('VOLUNTEER_OF_THE_YEAR', expectedYearLabel, 'year_champion_label');

      const LEADERBOARD_QUERY = `
        SELECT
          u.id,
          u.display_name,
          u.avatar_url,
          (COALESCE(att.total_hours, 0) + COALESCE(sc_agg.contributie_hours, 0))::float AS total_hours,
          COALESCE(att.social_hours, 0)::float AS social_hours,
          COALESCE(att.proiect_hours, 0)::float AS proiect_hours,
          COALESCE(att.sedinta_hours, 0)::float AS sedinta_hours,
          COALESCE(sc_agg.contributie_hours, 0)::float AS contributie_hours,
          (COALESCE(att.total_events, 0) + COALESCE(sc_agg.contributie_count, 0))::int AS total_activities,
          COALESCE(att.social_count, 0)::int AS social_count,
          COALESCE(att.proiect_count, 0)::int AS proiect_count,
          COALESCE(att.sedinta_count, 0)::int AS sedinta_count,
          COALESCE(sc_agg.contributie_count, 0)::int AS contributie_count,
          ${monthChampionSelect},
          ${yearChampionSelect}
        FROM users u
        LEFT JOIN (
          SELECT
            ea.user_id,
            SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0)) AS total_hours,
            SUM(CASE WHEN e.category = 'social' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END) AS social_hours,
            SUM(CASE WHEN e.category = 'proiect' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END) AS proiect_hours,
            SUM(CASE WHEN e.category = 'sedinta' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END) AS sedinta_hours,
            COUNT(ea.event_id) AS total_events,
            COUNT(CASE WHEN e.category = 'social' THEN 1 END) AS social_count,
            COUNT(CASE WHEN e.category = 'proiect' THEN 1 END) AS proiect_count,
            COUNT(CASE WHEN e.category = 'sedinta' THEN 1 END) AS sedinta_count
          FROM event_attendance ea
          JOIN events e ON ea.event_id = e.id
          WHERE ea.confirmation_status = 'attended'
            ${eventDateCond}
          GROUP BY ea.user_id
        ) att ON u.id = att.user_id
        LEFT JOIN (
          SELECT
            sc.user_id,
            SUM(sc.awarded_hours) AS contributie_hours,
            COUNT(sc.id) AS contributie_count
          FROM special_contributions sc
          WHERE sc.status = 'approved'
            ${contribDateCond}
          GROUP BY sc.user_id
        ) sc_agg ON u.id = sc_agg.user_id
        WHERE u.role != 'admin'
        ORDER BY total_hours DESC
        LIMIT 500;
      `;

      const result = await pool.query(LEADERBOARD_QUERY, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea clasamentului:', error);
      res.status(500).json({ error: 'Eroare server la preluarea clasamentului.' });
    }
  });

  // GET /spotlights — Returns Volunteer of the Month & Volunteer of the Year (for selectedYear - 1)
  router.get('/spotlights', verifyToken, async (req, res) => {
    try {
      if (req.query.year === 'all') {
        return res.json({
          previousMonth: { label: null, winner: null },
          academicYear: { label: null, isCompleted: false, winner: null },
        });
      }

      const currentAcademicYear = getCurrentAcademicYear();
      const parsedStartYear = req.query.year ? parseInt(req.query.year, 10) : NaN;
      const selectedStartYear = !isNaN(parsedStartYear) ? parsedStartYear : currentAcademicYear.startYear;
      const isCurrentAcademicYear = selectedStartYear === currentAcademicYear.startYear;

      const prevMonth = getPreviousMonthBounds();
      const prevAcademicYear = getAcademicYear(selectedStartYear - 1);
      const yearCompleted = new Date(prevAcademicYear.end) <= new Date();

      const [badgeMonthWinner, badgeYearWinner, calculatedMonthWinner, calculatedYearWinner] = await Promise.all([
        isCurrentAcademicYear
          ? findBadgeHolderWinner(pool, 'VOLUNTEER_OF_THE_MONTH', prevMonth.label, prevMonth.start, prevMonth.end)
          : Promise.resolve(null),
        findBadgeHolderWinner(pool, 'VOLUNTEER_OF_THE_YEAR', prevAcademicYear.label, prevAcademicYear.start, prevAcademicYear.end),
        isCurrentAcademicYear
          ? findPeriodWinner(pool, prevMonth.start, prevMonth.end)
          : Promise.resolve(null),
        yearCompleted
          ? findPeriodWinner(pool, prevAcademicYear.start, prevAcademicYear.end)
          : Promise.resolve(null),
      ]);

      const finalMonthWinner = badgeMonthWinner || calculatedMonthWinner;
      const finalMonthLabel = badgeMonthWinner?.period_label || prevMonth.label;

      const finalYearWinner = badgeYearWinner || calculatedYearWinner;
      const finalYearLabel = prevAcademicYear.label;

      res.json({
        previousMonth: {
          label: finalMonthLabel,
          winner: finalMonthWinner,
        },
        academicYear: {
          label: finalYearLabel,
          isCompleted: yearCompleted,
          winner: finalYearWinner,
        },
      });
    } catch (error) {
      console.error('Eroare la preluarea spotlights clasament:', error);
      res.status(500).json({ error: 'Eroare server.' });
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