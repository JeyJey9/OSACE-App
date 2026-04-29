// routes/services/badgeService.js
// Funcție ajutătoare (neschimbată)
const { authenticator } = require('otplib');

const awardBadge = async (userId, badgeKey, pool) => {
  try {
    const query = `
      INSERT INTO user_badges (user_id, badge_id)
      SELECT $1, id FROM badges WHERE key = $2
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    `;
    await pool.query(query, [userId, badgeKey]);
    console.log(`[BadgeService] Verificat ${badgeKey} pentru user ${userId}.`);
  } catch (err) {
  	console.error(`[BadgeService] Eroare la acordarea badge-ului ${badgeKey} pentru user ${userId}:`, err);
  }
};

/**
 * O funcție ajutătoare generică pentru a acorda badge-uri bazate pe COUNT.
 * @param {string} userId - ID-ul utilizatorului
 * @param {object} pool - Conexiunea la baza de date
 * @param {string} table - Tabela pe care se face COUNT (ex: 'post_likes')
 * @param {string} userColumn - Coloana de user pe care se filtrează (ex: 'user_id')
 * @param {Array<object>} badgeChecks - Un array de obiecte de verificat.
 * Exemplu: [
 * { key: 'FIRST_LIKE', threshold: 1 },
 * { key: '25_LIKES', threshold: 25 }
 * ]
 */
const checkCountAndAward = async (userId, pool, table, userColumn, badgeChecks) => {
  try {
    const query = `SELECT COUNT(*) FROM ${table} WHERE ${userColumn} = $1`;
    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].count, 10);

    // Iterăm prin toate verificările și acordăm badge-urile necesare
    for (const check of badgeChecks) {
      if (count >= check.threshold) {
        // Nu e nevoie de 'await' aici, lăsăm 'awardBadge' să ruleze în fundal
        awardBadge(userId, check.key, pool);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkCountAndAward pentru tabela ${table}:`, err);
  }
};

// --- Logica pentru Badge-urile de Evenimente ---



// checkAttendanceStatsBadges (neschimbată)
const checkAttendanceStatsBadges = async (userId, pool) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(ea.event_id) AS total_events,
        COALESCE(SUM(e.duration_hours), 0) AS total_hours,
        COUNT(CASE WHEN e.category = 'sedinta' THEN 1 END) AS total_sedinte,
      	COUNT(CASE WHEN e.category = 'social' THEN 1 END) AS total_social,
    	  COUNT(CASE WHEN e.category = 'proiect' THEN 1 END) AS total_proiect,
      	SUM(CASE WHEN e.category = 'sedinta' THEN e.duration_hours ELSE 0 END) AS hours_sedinte,
    	  SUM(CASE WHEN e.category = 'social' THEN e.duration_hours ELSE 0 END) AS hours_social,
    	  SUM(CASE WHEN e.category = 'proiect' THEN e.duration_hours ELSE 0 END) AS hours_proiect
    	FROM event_attendance ea
  	  JOIN events e ON ea.event_id = e.id
  	  WHERE ea.user_id = $1 AND ea.confirmation_status = 'attended';
  	`;
    const statsResult = await pool.query(statsQuery, [userId]);
  	const stats = statsResult.rows[0];

  	const totalEvents = parseInt(stats.total_events, 10);
  	const totalHours = parseFloat(stats.total_hours);
    const totalSedinte = parseInt(stats.total_sedinte, 10);
    const totalSocial = parseInt(stats.total_social, 10);
    const totalProiect = parseInt(stats.total_proiect, 10);
    
    // --- 2. Verificăm badge-urile pe rând ---
    
    // Total Evenimente
    if (totalEvents >= 1)   await awardBadge(userId, 'FIRST_EVENT', pool);
    if (totalEvents >= 5)   await awardBadge(userId, '5_EVENTS', pool);
    if (totalEvents >= 10)  await awardBadge(userId, '10_EVENTS', pool);
    if (totalEvents >= 25)  await awardBadge(userId, '25_EVENTS', pool);
    if (totalEvents >= 50)  await awardBadge(userId, '50_EVENTS', pool);
    if (totalEvents >= 100) await awardBadge(userId, '100_EVENTS', pool);

    // Total Ore
    if (totalHours >= 1) 	  await awardBadge(userId, '1_HOUR', pool);
    if (totalHours >= 10) 	  await awardBadge(userId, '10_HOURS', pool);
  	if (totalHours >= 24)   await awardBadge(userId, '24_HOURS_TOTAL', pool);
  	if (totalHours >= 25)   await awardBadge(userId, '25_HOURS', pool);
  	if (totalHours >= 50)   await awardBadge(userId, '50_HOURS', pool);
    if (totalHours >= 100)  await awardBadge(userId, '100_HOURS', pool);
  	if (totalHours >= 200)  await awardBadge(userId, '200_HOURS', pool);
  	if (totalHours >= 250)  await awardBadge(userId, '250_HOURS', pool);
  	if (totalHours >= 500)  await awardBadge(userId, '500_HOURS', pool);

  	// Total pe Categorii
  	if (totalSedinte >= 5) 	await awardBadge(userId, '5_SEDINTE', pool);
  	if (totalSocial >= 5) 	await awardBadge(userId, '5_SOCIAL', pool);
  	if (totalProiect >= 5) 	await awardBadge(userId, '5_PROIECT', pool);
  	if (totalSedinte >= 20) await awardBadge(userId, '20_SEDINTE', pool);
  	if (totalSocial >= 20) 	await awardBadge(userId, '20_SOCIAL', pool);
  	if (totalProiect >= 20) await awardBadge(userId, '20_PROIECT', pool);

  	// Ore pe Categorii
  	if (parseFloat(stats.hours_sedinte) >= 25)  await awardBadge(userId, '25_HOURS_SEDINTE', pool);
  	if (parseFloat(stats.hours_sedinte) >= 50)  await awardBadge(userId, '50_HOURS_SEDINTE', pool);
  	if (parseFloat(stats.hours_social) >= 25) 	 await awardBadge(userId, '25_HOURS_SOCIAL', pool);
  	if (parseFloat(stats.hours_proiect) >= 25)  await awardBadge(userId, '25_HOURS_PROIECT', pool);

    // Verificarea pentru 'DIVERSIFIED'
    if (totalSedinte > 0 && totalSocial > 0 && totalProiect > 0) {
      await awardBadge(userId, 'DIVERSIFIED', pool);
    }

  } catch (err) {
  	console.error(`[BadgeService] Eroare majoră la checkAttendanceStatsBadges pentru user ${userId}:`, err);
  }
};

// checkSpecificEventBadges (neschimbată)
const checkSpecificEventBadges = async (userId, eventId, pool) => {
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];

    if (event.totp_secret) {
      await awardBadge(userId, 'FIRST_SCAN_TOTP', pool);
    }
    
    const endTime = new Date(event.end_time);
    if (endTime.getHours() >= 0 && endTime.getHours() < 5) { 
      await awardBadge(userId, 'NIGHT_OWL', pool);
    }

    const startTime = new Date(event.start_time);
    if (startTime.getHours() < 9) { 
      await awardBadge(userId, 'EARLY_BIRD', pool);
    }

    // Evening event (starts at or after 18:00)
    if (startTime.getHours() >= 18) {
      // Count how many evening events this user has attended
      const eveningQuery = `
        SELECT COUNT(*) FROM event_attendance ea
        JOIN events e ON ea.event_id = e.id
        WHERE ea.user_id = $1
          AND ea.confirmation_status = 'attended'
          AND EXTRACT(HOUR FROM e.start_time) >= 18
      `;
      const eveningResult = await pool.query(eveningQuery, [userId]);
      if (parseInt(eveningResult.rows[0].count, 10) >= 10) {
        await awardBadge(userId, '10_EVENING_EVENTS', pool);
      }
    }

  } catch (err) {
    console.error(`[BadgeService] Eroare la checkSpecificEventBadges pentru user ${userId}, event ${eventId}:`, err);
  }
};

const checkQuickRegisterBadge = async (userId, eventId, pool) => {
  try {
    // Preluăm ora creării evenimentului ȘI ora înscrierii (care acum există)
    const query = `
      SELECT 
        e.created_at AS event_created_at,
        ea.created_at AS attendance_created_at
      FROM events e
      JOIN event_attendance ea ON e.id = ea.event_id
      WHERE e.id = $1 AND ea.user_id = $2;
    `;
    const result = await pool.query(query, [eventId, userId]);
    
    if (result.rows.length === 0) return; 

    const eventTime = new Date(result.rows[0].event_created_at);
    const attendTime = new Date(result.rows[0].attendance_created_at);

    const diffMs = attendTime - eventTime;
    const diffHours = diffMs / 3600000; // 1 oră = 3,600,000 ms

    if (diffHours <= 1) { // Dacă s-a înscris în mai puțin de 1 oră
      await awardBadge(userId, 'QUICK_REGISTER', pool);
    }
    
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkQuickRegisterBadge pentru user ${userId}:`, err);
  }
};

// checkMonthlyBadges (neschimbată)
const checkMonthlyBadges = async (userId, pool) => {
  try {
    const query = `
      SELECT COUNT(e.id)
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = $1
        AND ea.confirmation_status = 'attended'
        AND date_trunc('month', e.start_time) = date_trunc('month', CURRENT_TIMESTAMP);
    `;
    const result = await pool.query(query, [userId]);
    const monthlyCount = parseInt(result.rows[0].count, 10);

    if (monthlyCount >= 5)  await awardBadge(userId, '5_EVENTS_MONTH', pool);
    if (monthlyCount >= 10) await awardBadge(userId, '10_EVENTS_MONTH', pool);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkMonthlyBadges pentru user ${userId}:`, err);
  }
};

// ▼▼▼ NOU: Funcție pentru a verifica badge-urile săptămânale ▼▼▼
const checkWeeklyBadges = async (userId, pool) => {
  try {
    // Calculăm totalul orelor confirmate
    // a căror dată de start a fost în săptămâna curentă (Luni-Duminică)
    const query = `
      SELECT COALESCE(SUM(e.duration_hours), 0) AS weekly_hours
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = $1
        AND ea.confirmation_status = 'attended'
        AND date_trunc('week', e.start_time) = date_trunc('week', CURRENT_TIMESTAMP);
    `;
    const result = await pool.query(query, [userId]);
    const weeklyHours = parseFloat(result.rows[0].weekly_hours);

    if (weeklyHours >= 10) {
      await awardBadge(userId, '10_HOURS_WEEK', pool);
    }
    if (weeklyHours >= 20) {
      await awardBadge(userId, '20_HOURS_WEEK', pool);
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkWeeklyBadges pentru user ${userId}:`, err);
  }
};
// ▲▲▲ SFÂRȘIT BLOC NOU ▲▲▲

const checkStreakBadges = async (userId, pool) => {
  try {
    // Preluăm TOATE participările (confirmate sau nu) la evenimente TRECUTE
    // Ordonăm de la cel mai recent la cel mai vechi
    const query = `
      SELECT ea.confirmation_status
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = $1
        AND e.end_time < NOW() -- Doar evenimente care s-au terminat
      ORDER BY e.start_time DESC; -- De la cel mai recent
    `;
    const result = await pool.query(query, [userId]);
    
    let currentStreak = 0;
    
    // Iterăm prin istoricul participărilor
    for (const row of result.rows) {
      if (row.confirmation_status === 'attended') {
        currentStreak++; // Continuăm seria
      } else {
        // Dacă dăm peste un 'registered' (neconfirmat) sau alt status, seria s-a rupt
        break; 
      }
    }

    // Acordăm badge-urile pe baza seriei curente
    if (currentStreak >= 3)  await awardBadge(userId, 'PERFECT_STREAK_3', pool);
    if (currentStreak >= 10) await awardBadge(userId, 'PERFECT_STREAK_10', pool);
    if (currentStreak >= 20) await awardBadge(userId, 'PERFECT_STREAK_20', pool);
    if (currentStreak >= 20) await awardBadge(userId, 'UNSTOPPABLE', pool);
    
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkStreakBadges pentru user ${userId}:`, err);
  }
};
// ▲▲▲ SFÂRȘIT BLOC NOU ▲▲▲


// ▼▼▼ MODIFICAT: Funcția principală de confirmare ▼▼▼
const checkBadgesOnConfirmation = async (userId, eventId, pool) => {
  await Promise.all([
    checkAttendanceStatsBadges(userId, pool),
    checkSpecificEventBadges(userId, eventId, pool),
    checkMonthlyBadges(userId, pool),
    checkWeeklyBadges(userId, pool),
    checkStreakBadges(userId, pool) // <-- Am adăugat noua verificare
  ]).catch(err => {
    console.error(`[BadgeService] Eroare la rularea Promise.all pentru confirmare badge user ${userId}:`, err);
  });
};
// ▲▲▲ SFÂRȘIT MODIFICARE ▲▲▲


// --- Alte funcții de verificare (neschimbate) ---
const checkBadgesOnLike = (userId, pool) => {
  checkCountAndAward(userId, pool, 'post_likes', 'user_id', [
    { key: 'FIRST_LIKE',    threshold: 1   },
    { key: '25_LIKES',      threshold: 25  },
    { key: '100_LIKES',     threshold: 100 },
  ]);
};

const checkBadgesOnComment = (userId, pool) => {
  checkCountAndAward(userId, pool, 'post_comments', 'user_id', [
    { key: 'FIRST_COMMENT', threshold: 1   },
    { key: '25_COMMENTS',   threshold: 25  },
    { key: '100_COMMENTS',  threshold: 100 },
  ]);
};

const checkBadgesOnProfileView = async (userId, pool) => {
  try {
    // Acordă badge-ul 'VIEWED_PROFILE' la prima vizualizare a unui profil
    await awardBadge(userId, 'VIEWED_PROFILE', pool);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnProfileView pentru user ${userId}:`, err);
  }
};

const checkBadgesOnAvatarUpload = async (userId, pool) => {
  try {
    // Acordă badge-ul 'AVATAR_UPLOADED' la prima încărcare de avatar
    await awardBadge(userId, 'AVATAR_UPLOADED', pool);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnAvatarUpload pentru user ${userId}:`, err);
  }
};

const checkBadgesOnProfileEdit = async (userId, pool) => {
  try {
    // Acordă badge-ul 'FIRST_PROFILE_EDIT' la prima editare de nume/parolă
    await awardBadge(userId, 'FIRST_PROFILE_EDIT', pool);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnProfileEdit pentru user ${userId}:`, err);
  }
};

const checkBadgesOnEventCreate = (userId, pool) => {
  checkCountAndAward(userId, pool, 'events', 'created_by', [
    { key: 'FIRST_EVENT_CREATED', threshold: 1  },
    { key: '5_EVENTS_CREATED',    threshold: 5  },
    { key: '10_EVENTS_CREATED',   threshold: 10 },
  ]);
};

const checkBadgesOnRoleChange = async (userId, newRole, pool) => {
  try {
    // Acordă badge-ul 'PROMOTED_COORDONATOR' la promovare
    if (newRole === 'coordonator' || newRole === 'admin') {
      await awardBadge(userId, 'PROMOTED_COORDONATOR', pool);
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnRoleChange pentru user ${userId}:`, err);
  }
};

const checkBadgesOnUnattend = async (userId, pool) => {
  try {
    // Acordă badge-ul 'FIRST_UNATTEND' la prima retragere de la un eveniment
    await awardBadge(userId, 'FIRST_UNATTEND', pool);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnUnattend pentru user ${userId}:`, err);
  }
};

// Exportăm toate funcțiile
module.exports = {
  awardBadge,
  checkBadgesOnConfirmation,
  checkBadgesOnLike,
  checkBadgesOnComment,
  checkBadgesOnProfileView,
  checkBadgesOnAvatarUpload,
  checkBadgesOnProfileEdit,
  checkBadgesOnEventCreate,
  checkBadgesOnRoleChange,
  checkBadgesOnUnattend,
  checkQuickRegisterBadge
};