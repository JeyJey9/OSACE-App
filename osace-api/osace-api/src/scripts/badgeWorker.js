// src/scripts/badgeWorker.js
const path = require('path');
const { getAcademicYear, getPreviousMonthBounds } = require('../utils/academicYear');
const { awardBadge } = require('../features/Badge/badge.service');

// Verifică aniversările de membru (1 an și 3 ani)
const checkAnniversaryBadges = async (pool) => {
  try {
    const oneYearUsers = await pool.query(
      `SELECT id FROM users WHERE 
       created_at <= (NOW() - '1 year'::interval) AND 
       created_at > (NOW() - '2 years'::interval)`
    );
    for (const user of oneYearUsers.rows) {
      await awardBadge(user.id, '1_YEAR_MEMBER', pool);
    }

    const threeYearUsers = await pool.query(
      "SELECT id FROM users WHERE created_at <= (NOW() - '3 years'::interval)"
    );
    for (const user of threeYearUsers.rows) {
      await awardBadge(user.id, '3_YEAR_MEMBER', pool);
    }
  } catch (err) {
    console.error('[BadgeWorker] Eroare la verificarea aniversărilor:', err);
  }
};

// Găsește câștigătorul #1 (non-admin, total_hours > 0) dintr-un interval [start, end)
const findPeriodChampion = async (pool, start, end) => {
  const query = `
    SELECT
      u.id,
      (
        COALESCE((
          SELECT SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0))
          FROM event_attendance ea
          JOIN events e ON ea.event_id = e.id
          WHERE ea.user_id = u.id
            AND ea.confirmation_status = 'attended'
            AND e.start_time >= $1 AND e.start_time < $2
        ), 0) +
        COALESCE((
          SELECT SUM(sc.awarded_hours)
          FROM special_contributions sc
          WHERE sc.user_id = u.id
            AND sc.status = 'approved'
            AND sc.created_at >= $1 AND sc.created_at < $2
        ), 0)
      ) AS total_hours
    FROM users u
    WHERE u.role != 'admin'
    ORDER BY total_hours DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [start, end]);
  if (result.rows.length === 0) return null;
  const top = result.rows[0];
  if (parseFloat(top.total_hours) <= 0) return null;
  return top;
};

// Acordă automat "Voluntarul Lunii" (luna precedentă) și "Voluntarul Anului" (cel mai recent an universitar încheiat)
const checkMonthlyAndYearlyChampions = async (pool) => {
  try {
    const prevMonth = getPreviousMonthBounds();
    const monthChampion = await findPeriodChampion(pool, prevMonth.start, prevMonth.end);
    if (monthChampion) {
      await awardBadge(monthChampion.id, 'VOLUNTEER_OF_THE_MONTH', pool, prevMonth.label);
    }

    const now = new Date();
    const yearsResult = await pool.query(`
      SELECT DISTINCT
        CASE 
          WHEN EXTRACT(MONTH FROM date_val) >= 9 THEN EXTRACT(YEAR FROM date_val)
          ELSE EXTRACT(YEAR FROM date_val) - 1
        END AS start_year
      FROM (
        SELECT start_time AS date_val FROM events WHERE start_time IS NOT NULL
        UNION ALL
        SELECT created_at AS date_val FROM special_contributions WHERE created_at IS NOT NULL
      ) combined
      ORDER BY start_year DESC
    `);

    const completedYears = yearsResult.rows
      .map((r) => parseInt(r.start_year, 10))
      .filter((sy) => !isNaN(sy))
      .map((sy) => getAcademicYear(sy))
      .filter((y) => new Date(y.end) <= now);

    if (completedYears.length > 0) {
      const latestCompleted = completedYears[0];
      const yearChampion = await findPeriodChampion(pool, latestCompleted.start, latestCompleted.end);
      if (yearChampion) {
        await awardBadge(yearChampion.id, 'VOLUNTEER_OF_THE_YEAR', pool, latestCompleted.label);
      }
    }
  } catch (err) {
    console.error('[BadgeWorker] Eroare la verificarea campionilor lunii/anului:', err);
  }
};

const runBadgeWorkerChecks = async (pool) => {
  await checkAnniversaryBadges(pool);
  await checkMonthlyAndYearlyChampions(pool);
};

const startBadgeWorker = (pool) => {
  // Mică întârziere ca migrațiile DB din app.listen să se finalizeze înainte
  setTimeout(() => runBadgeWorkerChecks(pool), 5000);
  setInterval(() => runBadgeWorkerChecks(pool), 12 * 60 * 60 * 1000);
};

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
  const pool = require('../config/db');
  runBadgeWorkerChecks(pool)
    .then(() => {
      console.log('[BadgeWorker] Rularea manuală s-a încheiat.');
      return pool.end();
    })
    .catch((err) => {
      console.error('[BadgeWorker] Eroare:', err);
      return pool.end();
    });
}

module.exports = {
  startBadgeWorker,
  runBadgeWorkerChecks,
  checkMonthlyAndYearlyChampions,
};