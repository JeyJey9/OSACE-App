// routes/services/badgeService.js
// Funcție ajutătoare (neschimbată)
const { authenticator } = require('otplib');

const earnedBadgesCache = new Map(); // Map<userId, Set<badgeKey>>

const loadUserBadgesToCache = async (userId, pool) => {
  const uid = parseInt(userId, 10);
  if (earnedBadgesCache.has(uid)) return earnedBadgesCache.get(uid);
  
  try {
    const res = await pool.query(`
      SELECT b.key FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
    `, [uid]);
    const badgeSet = new Set(res.rows.map(r => r.key));
    earnedBadgesCache.set(uid, badgeSet);
    return badgeSet;
  } catch (err) {
    console.error(`[BadgeService] Error loading user badges to cache for user ${uid}:`, err);
    return new Set();
  }
};

const invalidateUserBadgeCache = (userId) => {
  earnedBadgesCache.delete(parseInt(userId, 10));
};

const awardBadge = async (userId, badgeKey, pool) => {
  try {
    const cache = await loadUserBadgesToCache(userId, pool);
    if (cache.has(badgeKey)) {
      return { awarded: false, reason: 'ALREADY_EARNED' };
    }

    const query = `
      INSERT INTO user_badges (user_id, badge_id)
      SELECT $1, id FROM badges WHERE key = $2
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING badge_id;
    `;
    const result = await pool.query(query, [userId, badgeKey]);

    if (result.rowCount > 0) {
      cache.add(badgeKey);
      const badgeInfo = await pool.query(
        'SELECT id, name, description, icon_name, key FROM badges WHERE key = $1',
        [badgeKey]
      );
      const badge = badgeInfo.rows[0];
      console.log(`[BadgeService] Acordat cu succes ${badgeKey} pentru user ${userId}.`);
      return { awarded: true, badge };
    } else {
      const badgeExists = await pool.query('SELECT 1 FROM badges WHERE key = $1', [badgeKey]);
      if (badgeExists.rowCount === 0) {
        console.warn(`[BadgeService] Badge-ul ${badgeKey} nu există în tabela badges!`);
        return { awarded: false, reason: 'BADGE_NOT_FOUND' };
      }
      cache.add(badgeKey);
      return { awarded: false, reason: 'ALREADY_EARNED' };
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la acordarea badge-ului ${badgeKey} pentru user ${userId}:`, err);
    return { awarded: false, error: err.message };
  }
};

const checkCountAndAward = async (userId, pool, table, userColumn, badgeChecks) => {
  try {
    const query = `SELECT COUNT(*) FROM ${table} WHERE ${userColumn} = $1`;
    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].count, 10);

    for (const check of badgeChecks) {
      if (count >= check.threshold) {
        awardBadge(userId, check.key, pool);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkCountAndAward pentru tabela ${table}:`, err);
  }
};

// --- Logica DYNAMICĂ pentru Badge-urile de Evenimente ---

const checkAttendanceStatsBadges = async (userId, pool) => {
  try {
    // 1. Preluăm statisticile utilizatorului
    const statsQuery = `
      SELECT
        COUNT(ea.event_id) AS total_events,
        (COALESCE(SUM(e.duration_hours), 0) + COALESCE((SELECT SUM(awarded_hours) FROM special_contributions WHERE user_id = $1 AND status = 'approved'), 0)) AS total_hours,
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
    const hoursSedinte = parseFloat(stats.hours_sedinte);
    const hoursSocial = parseFloat(stats.hours_social);
    const hoursProiect = parseFloat(stats.hours_proiect);
    
    // 2. Preluăm toate badge-urile dinamice de tip stats
    const badgesQuery = `SELECT * FROM badges WHERE rule_type IN ('total_events', 'total_hours', 'category_count', 'category_hours', 'diversified')`;
    const badgesResult = await pool.query(badgesQuery);
    
    for (const badge of badgesResult.rows) {
      const type = badge.rule_type;
      const val = badge.rule_value;

      if (type === 'total_events' && totalEvents >= parseInt(val, 10)) {
        await awardBadge(userId, badge.key, pool);
      }
      else if (type === 'total_hours' && totalHours >= parseFloat(val)) {
        await awardBadge(userId, badge.key, pool);
      }
      else if (type === 'category_count' && val) {
        const [cat, count] = val.split(':');
        const targetCount = parseInt(count, 10);
        if ((cat === 'sedinta' && totalSedinte >= targetCount) ||
            (cat === 'social' && totalSocial >= targetCount) ||
            (cat === 'proiect' && totalProiect >= targetCount)) {
          await awardBadge(userId, badge.key, pool);
        }
      }
      else if (type === 'category_hours' && val) {
        const [cat, hours] = val.split(':');
        const targetHours = parseFloat(hours);
        if ((cat === 'sedinta' && hoursSedinte >= targetHours) ||
            (cat === 'social' && hoursSocial >= targetHours) ||
            (cat === 'proiect' && hoursProiect >= targetHours)) {
          await awardBadge(userId, badge.key, pool);
        }
      }
      else if (type === 'diversified') {
        if (totalSedinte > 0 && totalSocial > 0 && totalProiect > 0) {
          await awardBadge(userId, badge.key, pool);
        }
      }
    }

  } catch (err) {
  	console.error(`[BadgeService] Eroare la checkAttendanceStatsBadges pentru user ${userId}:`, err);
  }
};

const checkSpecificEventBadges = async (userId, eventId, pool) => {
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];
    
    const badgesResult = await pool.query(`SELECT * FROM badges WHERE rule_type IN ('night_owl', 'early_bird', 'evening_events')`);
    const badges = badgesResult.rows;

    const endTime = new Date(event.end_time);
    const startTime = new Date(event.start_time);

    // Verificăm dacă event-ul e 'night_owl'
    if (endTime.getHours() >= 0 && endTime.getHours() < 5) { 
      const noBadge = badges.find(b => b.rule_type === 'night_owl');
      if (noBadge) await awardBadge(userId, noBadge.key, pool);
    }

    // Verificăm dacă event-ul e 'early_bird'
    if (startTime.getHours() < 9) { 
      const ebBadge = badges.find(b => b.rule_type === 'early_bird');
      if (ebBadge) await awardBadge(userId, ebBadge.key, pool);
    }

    // Verificăm dacă event-ul e seară
    if (startTime.getHours() >= 18) {
      const eveningQuery = `
        SELECT COUNT(*) FROM event_attendance ea
        JOIN events e ON ea.event_id = e.id
        WHERE ea.user_id = $1
          AND ea.confirmation_status = 'attended'
          AND EXTRACT(HOUR FROM e.start_time) >= 18
      `;
      const eveningResult = await pool.query(eveningQuery, [userId]);
      const eveningCount = parseInt(eveningResult.rows[0].count, 10);

      const eveningBadges = badges.filter(b => b.rule_type === 'evening_events');
      for (const badge of eveningBadges) {
        if (eveningCount >= parseInt(badge.rule_value, 10)) {
          await awardBadge(userId, badge.key, pool);
        }
      }
    }

    if (event.totp_secret) {
      await awardBadge(userId, 'FIRST_SCAN_TOTP', pool); // Păstrat ca static/manual default pentru simplitate, dar poate fi adus în db ca 'specific_action'
    }

  } catch (err) {
    console.error(`[BadgeService] Eroare la checkSpecificEventBadges pentru user ${userId}, event ${eventId}:`, err);
  }
};

const checkQuickRegisterBadge = async (userId, eventId, pool) => {
  try {
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
    const diffHours = diffMs / 3600000;

    if (diffHours <= 1) { 
      const badgeQuery = `SELECT * FROM badges WHERE rule_type = 'quick_register'`;
      const badgesResult = await pool.query(badgeQuery);
      for (const b of badgesResult.rows) {
        await awardBadge(userId, b.key, pool);
      }
    }
    
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkQuickRegisterBadge pentru user ${userId}:`, err);
  }
};

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

    const badgesQuery = `SELECT * FROM badges WHERE rule_type = 'monthly_events'`;
    const badgesResult = await pool.query(badgesQuery);

    for (const badge of badgesResult.rows) {
      if (monthlyCount >= parseInt(badge.rule_value, 10)) {
        await awardBadge(userId, badge.key, pool);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkMonthlyBadges pentru user ${userId}:`, err);
  }
};

const checkWeeklyBadges = async (userId, pool) => {
  try {
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

    const badgesQuery = `SELECT * FROM badges WHERE rule_type = 'weekly_hours'`;
    const badgesResult = await pool.query(badgesQuery);

    for (const badge of badgesResult.rows) {
      if (weeklyHours >= parseFloat(badge.rule_value)) {
        await awardBadge(userId, badge.key, pool);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkWeeklyBadges pentru user ${userId}:`, err);
  }
};

const checkStreakBadges = async (userId, pool) => {
  try {
    const query = `
      SELECT ea.confirmation_status
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = $1
        AND e.end_time < NOW()
      ORDER BY e.start_time DESC;
    `;
    const result = await pool.query(query, [userId]);
    
    let currentStreak = 0;
    
    for (const row of result.rows) {
      if (row.confirmation_status === 'attended') {
        currentStreak++;
      } else {
        break; 
      }
    }

    const badgesQuery = `SELECT * FROM badges WHERE rule_type = 'perfect_streak'`;
    const badgesResult = await pool.query(badgesQuery);

    for (const badge of badgesResult.rows) {
      if (currentStreak >= parseInt(badge.rule_value, 10)) {
        await awardBadge(userId, badge.key, pool);
      }
    }
    
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkStreakBadges pentru user ${userId}:`, err);
  }
};

const checkBadgesOnConfirmation = async (userId, eventId, pool) => {
  await Promise.all([
    checkAttendanceStatsBadges(userId, pool),
    checkSpecificEventBadges(userId, eventId, pool),
    checkMonthlyBadges(userId, pool),
    checkWeeklyBadges(userId, pool),
    checkStreakBadges(userId, pool)
  ]).catch(err => {
    console.error(`[BadgeService] Eroare la rularea Promise.all pentru confirmare badge user ${userId}:`, err);
  });
};

// --- Alte funcții de verificare (păstrate statice pentru acțiuni unice) ---
const checkBadgesOnLike = async (userId, pool) => {
  try {
    const cache = await loadUserBadgesToCache(userId, pool);
    if (cache.has('100_LIKES')) return; // Short-circuit!

    checkCountAndAward(userId, pool, 'post_likes', 'user_id', [
      { key: 'FIRST_LIKE',    threshold: 1   },
      { key: '25_LIKES',      threshold: 25  },
      { key: '100_LIKES',     threshold: 100 },
    ]);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnLike pentru user ${userId}:`, err);
  }
};

const checkBadgesOnComment = async (userId, pool) => {
  try {
    const cache = await loadUserBadgesToCache(userId, pool);
    if (cache.has('100_COMMENTS')) return; // Short-circuit!

    checkCountAndAward(userId, pool, 'post_comments', 'user_id', [
      { key: 'FIRST_COMMENT', threshold: 1   },
      { key: '25_COMMENTS',   threshold: 25  },
      { key: '100_COMMENTS',  threshold: 100 },
    ]);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnComment pentru user ${userId}:`, err);
  }
};

const checkBadgesOnProfileView = async (userId, pool) => {
  try {
    await awardBadge(userId, 'VIEWED_PROFILE', pool);
  } catch (err) {}
};

const checkBadgesOnAvatarUpload = async (userId, pool) => {
  try {
    await awardBadge(userId, 'AVATAR_UPLOADED', pool);
  } catch (err) {}
};

const checkBadgesOnProfileEdit = async (userId, pool) => {
  try {
    await awardBadge(userId, 'FIRST_PROFILE_EDIT', pool);
  } catch (err) {}
};

const checkBadgesOnEventCreate = async (userId, pool) => {
  try {
    const cache = await loadUserBadgesToCache(userId, pool);
    if (cache.has('10_EVENTS_CREATED')) return; // Short-circuit!

    checkCountAndAward(userId, pool, 'events', 'created_by', [
      { key: 'FIRST_EVENT_CREATED', threshold: 1  },
      { key: '5_EVENTS_CREATED',    threshold: 5  },
      { key: '10_EVENTS_CREATED',   threshold: 10 },
    ]);
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkBadgesOnEventCreate pentru user ${userId}:`, err);
  }
};

const checkBadgesOnRoleChange = async (userId, newRole, pool) => {
  try {
    if (newRole === 'coordonator' || newRole === 'admin') {
      await awardBadge(userId, 'PROMOTED_COORDONATOR', pool);
    }
  } catch (err) {}
};

const checkBadgesOnUnattend = async (userId, pool) => {
  try {
    await awardBadge(userId, 'FIRST_UNATTEND', pool);
  } catch (err) {}
};

module.exports = {
  awardBadge,
  invalidateUserBadgeCache,
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