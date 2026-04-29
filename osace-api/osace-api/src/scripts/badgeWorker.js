// src/scripts/badgeWorker.js
const path = require('path');

// 1. Calea .env este acum relativă la locația proiectului
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); 

// 2. Importăm pool-ul nostru partajat, nu mai creăm unul nou
const pool = require('../config/db');

// 3. Importăm funcția 'awardBadge' din locația sa corectă
const { awardBadge } = require('../features/Badge/badge.service');

console.log('[BadgeWorker] Worker-ul a pornit...');

// --- Funcția 1: Verifică Aniversările (Neschimbată) ---
const checkAnniversaryBadges = async () => {
  console.log('[BadgeWorker] Se verifică aniversările...');
  try {
    // 1. Găsește utilizatorii care au 1 an (dar nu 2)
    const oneYearUsers = await pool.query(
      `SELECT id FROM users WHERE 
       created_at <= (NOW() - '1 year'::interval) AND 
       created_at > (NOW() - '2 years'::interval)`
    );
    for (const user of oneYearUsers.rows) {
      await awardBadge(user.id, '1_YEAR_MEMBER', pool);
    }
    console.log(`[BadgeWorker] Verificat ${oneYearUsers.rowCount} utilizatori pentru 1 an.`);

    // 2. Găsește utilizatorii care au 3 ani sau mai mult
    const threeYearUsers = await pool.query(
      "SELECT id FROM users WHERE created_at <= (NOW() - '3 years'::interval)"
    );
    for (const user of threeYearUsers.rows) {
      await awardBadge(user.id, '3_YEAR_MEMBER', pool);
    }
    console.log(`[BadgeWorker] Verificat ${threeYearUsers.rowCount} utilizatori pentru 3 ani.`);

  } catch (err) {
    console.error('[BadgeWorker] Eroare la verificarea aniversărilor:', err);
  }
};

// --- Funcția 2: Verifică Câștigătorul Clasamentului (Neschimbată) ---
const checkLeaderboardBadge = async () => {
  const today = new Date();
  
  // Rulează DOAR Duminica (getDay() == 0)
  if (today.getDay() !== 0) { 
    console.log('[BadgeWorker] Nu este duminică. Se sare peste verificarea clasamentului.');
    return;
  }

  console.log('[BadgeWorker] Este duminică. Se verifică câștigătorul clasamentului...');
  try {
    // Folosim interogarea exactă din API-ul tău de clasament
    const query = `
      SELECT u.id, COALESCE(SUM(e.duration_hours), 0) AS total_hours
      FROM users u
      LEFT JOIN event_attendance ea ON u.id = ea.user_id AND ea.confirmation_status = 'attended'
      LEFT JOIN events e ON ea.event_id = e.id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY total_hours DESC
      LIMIT 1;
    `;
    const result = await pool.query(query);

    if (result.rows.length > 0) {
      const winnerId = result.rows[0].id;
      console.log(`[BadgeWorker] Câștigătorul săptămânii este User ID: ${winnerId}. Se acordă badge-ul.`);
      await awardBadge(winnerId, 'LEADERBOARD_TOP_1', pool);
    }
  } catch (err) {
    console.error('[BadgeWorker] Eroare la verificarea clasamentului:', err);
  }
};

// --- Funcția Principală (Main) (Neschimbată) ---
const runWorker = async () => {
  try {
    await checkAnniversaryBadges();
    await checkLeaderboardBadge();
    console.log('[BadgeWorker] Toate verificările au fost finalizate.');
  } catch (err) {
    console.error('[BadgeWorker] O eroare fatală a oprit worker-ul:', err);
  } finally {
    // Închidem conexiunea la baza de date pentru a opri script-ul
    await pool.end();
    console.log('[BadgeWorker] Worker-ul s-a oprit.');
  }
};

// Pornim script-ul
runWorker();