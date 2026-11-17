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

const awardBadge = async (userId, badgeKey, pool, periodLabel = null) => {
  try {
    const cache = await loadUserBadgesToCache(userId, pool);
    if (!periodLabel && cache.has(badgeKey)) {
      return { awarded: false, reason: 'ALREADY_EARNED' };
    }

    if (periodLabel) {
      const existingRes = await pool.query(
        `SELECT ub.user_id, ub.badge_id, ub.period_label, b.id, b.name, b.description, b.icon_name, b.key
         FROM user_badges ub
         JOIN badges b ON ub.badge_id = b.id
         WHERE ub.user_id = $1 AND b.key = $2`,
        [userId, badgeKey]
      );

      if (existingRes.rowCount > 0) {
        const row = existingRes.rows[0];
        const parts = (row.period_label || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        if (parts.includes(periodLabel)) {
          cache.add(badgeKey);
          return { awarded: false, reason: 'ALREADY_EARNED' };
        }

        const nextLabel = [...parts, periodLabel].join(', ');
        await pool.query(
          `UPDATE user_badges
           SET period_label = $1, earned_at = NOW()
           WHERE user_id = $2 AND badge_id = $3`,
          [nextLabel, userId, row.badge_id]
        );
        cache.add(badgeKey);
        console.log(`[BadgeService] Actualizat period_label (${nextLabel}) pentru ${badgeKey}, user ${userId}.`);
        return {
          awarded: false,
          periodUpdated: true,
          badge: {
            id: row.id,
            name: row.name,
            description: row.description,
            icon_name: row.icon_name,
            key: row.key,
            period_label: nextLabel,
          },
        };
      }
    }

    const query = `
      INSERT INTO user_badges (user_id, badge_id, period_label)
      SELECT $1, id, $3 FROM badges WHERE key = $2
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING badge_id;
    `;
    const result = await pool.query(query, [userId, badgeKey, periodLabel]);

    if (result.rowCount > 0) {
      cache.add(badgeKey);
      const badgeInfo = await pool.query(
        'SELECT id, name, description, icon_name, key FROM badges WHERE key = $1',
        [badgeKey]
      );
      const badge = badgeInfo.rows[0] ? { ...badgeInfo.rows[0], period_label: periodLabel } : null;
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
        await awardBadge(userId, check.key, pool);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkCountAndAward pentru tabela ${table}:`, err);
  }
};

// Mapare fallback pentru cheile standard de badge (dacă rule_type nu e setat explicit în DB)
const KEY_RULE_FALLBACK = {
  FIRST_EVENT:        { metric: 'total_events', target: 1 },
  '5_EVENTS':         { metric: 'total_events', target: 5 },
  '10_EVENTS':        { metric: 'total_events', target: 10 },
  '25_EVENTS':        { metric: 'total_events', target: 25 },
  '50_EVENTS':        { metric: 'total_events', target: 50 },
  '100_EVENTS':       { metric: 'total_events', target: 100 },
  '1_HOUR':           { metric: 'total_hours', target: 1 },
  '10_HOURS':         { metric: 'total_hours', target: 10 },
  '24_HOURS_TOTAL':   { metric: 'total_hours', target: 24 },
  '25_HOURS':         { metric: 'total_hours', target: 25 },
  '50_HOURS':         { metric: 'total_hours', target: 50 },
  '100_HOURS':        { metric: 'total_hours', target: 100 },
  '200_HOURS':        { metric: 'total_hours', target: 200 },
  '250_HOURS':        { metric: 'total_hours', target: 250 },
  '500_HOURS':        { metric: 'total_hours', target: 500 },
  '5_SEDINTE':        { metric: 'total_sedinte', target: 5 },
  '20_SEDINTE':       { metric: 'total_sedinte', target: 20 },
  '5_SOCIAL':         { metric: 'total_social', target: 5 },
  '20_SOCIAL':        { metric: 'total_social', target: 20 },
  '5_PROIECT':        { metric: 'total_proiect', target: 5 },
  '20_PROIECT':       { metric: 'total_proiect', target: 20 },
  '25_HOURS_SEDINTE': { metric: 'hours_sedinte', target: 25 },
  '50_HOURS_SEDINTE': { metric: 'hours_sedinte', target: 50 },
  '25_HOURS_SOCIAL':  { metric: 'hours_social', target: 25 },
  '25_HOURS_PROIECT': { metric: 'hours_proiect', target: 25 },
  DIVERSIFIED:        { metric: 'diversified_categories', target: 3 },
  PERFECT_STREAK_3:   { metric: 'current_streak', target: 3 },
  PERFECT_STREAK_10:  { metric: 'current_streak', target: 10 },
  PERFECT_STREAK_20:  { metric: 'current_streak', target: 20 },
  UNSTOPPABLE:        { metric: 'current_streak', target: 20 },
  '10_HOURS_WEEK':    { metric: 'weekly_hours', target: 10 },
  '20_HOURS_WEEK':    { metric: 'weekly_hours', target: 20 },
  '5_EVENTS_MONTH':   { metric: 'monthly_events', target: 5 },
  '10_EVENTS_MONTH':  { metric: 'monthly_events', target: 10 },
  '10_EVENING_EVENTS':{ metric: 'evening_events', target: 10 },
  FIRST_LIKE:         { metric: 'likes_count', target: 1 },
  '25_LIKES':         { metric: 'likes_count', target: 25 },
  '100_LIKES':        { metric: 'likes_count', target: 100 },
  FIRST_COMMENT:      { metric: 'comments_count', target: 1 },
  '25_COMMENTS':      { metric: 'comments_count', target: 25 },
  '100_COMMENTS':     { metric: 'comments_count', target: 100 },
  FIRST_EVENT_CREATED:{ metric: 'events_created', target: 1 },
  '5_EVENTS_CREATED': { metric: 'events_created', target: 5 },
  '10_EVENTS_CREATED':{ metric: 'events_created', target: 10 },
};

const resolveBadgeRule = (badge) => {
  const type = badge.rule_type;
  const val = badge.rule_value;

  if (type === 'total_events' && val) return { metric: 'total_events', target: parseFloat(val) };
  if (type === 'total_hours' && val) return { metric: 'total_hours', target: parseFloat(val) };
  if (type === 'monthly_events' && val) return { metric: 'monthly_events', target: parseFloat(val) };
  if (type === 'weekly_hours' && val) return { metric: 'weekly_hours', target: parseFloat(val) };
  if (type === 'perfect_streak' && val) return { metric: 'current_streak', target: parseFloat(val) };
  if (type === 'evening_events' && val) return { metric: 'evening_events', target: parseFloat(val) };
  if (type === 'diversified') return { metric: 'diversified_categories', target: 3 };
  if (type === 'category_count' && val) {
    const [cat, count] = val.split(':');
    if (cat === 'sedinta') return { metric: 'total_sedinte', target: parseFloat(count) };
    if (cat === 'social') return { metric: 'total_social', target: parseFloat(count) };
    if (cat === 'proiect') return { metric: 'total_proiect', target: parseFloat(count) };
  }
  if (type === 'category_hours' && val) {
    const [cat, hours] = val.split(':');
    if (cat === 'sedinta') return { metric: 'hours_sedinte', target: parseFloat(hours) };
    if (cat === 'social') return { metric: 'hours_social', target: parseFloat(hours) };
    if (cat === 'proiect') return { metric: 'hours_proiect', target: parseFloat(hours) };
  }

  return KEY_RULE_FALLBACK[badge.key] || null;
};

const getUserAttendanceMetrics = async (userId, pool, includeSocial = false) => {
  const statsQuery = `
    SELECT
      COUNT(ea.event_id) AS total_events,
      (COALESCE(SUM(COALESCE(ea.awarded_hours, e.duration_hours, 0)), 0) +
       COALESCE((SELECT SUM(awarded_hours) FROM special_contributions WHERE user_id = $1 AND status = 'approved'), 0)
      ) AS total_hours,
      COUNT(CASE WHEN e.category = 'sedinta' THEN 1 END) AS total_sedinte,
      COUNT(CASE WHEN e.category = 'social' THEN 1 END) AS total_social,
      COUNT(CASE WHEN e.category = 'proiect' THEN 1 END) AS total_proiect,
      COALESCE(SUM(CASE WHEN e.category = 'sedinta' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END), 0) AS hours_sedinte,
      COALESCE(SUM(CASE WHEN e.category = 'social' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END), 0) AS hours_social,
      COALESCE(SUM(CASE WHEN e.category = 'proiect' THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END), 0) AS hours_proiect,
      COUNT(CASE WHEN date_trunc('month', e.start_time) = date_trunc('month', CURRENT_TIMESTAMP) THEN 1 END) AS monthly_events,
      COALESCE(SUM(CASE WHEN date_trunc('week', e.start_time) = date_trunc('week', CURRENT_TIMESTAMP) THEN COALESCE(ea.awarded_hours, e.duration_hours, 0) ELSE 0 END), 0) AS weekly_hours,
      COUNT(CASE WHEN EXTRACT(HOUR FROM e.start_time) >= 18 THEN 1 END) AS evening_events
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = $1 AND ea.confirmation_status IN ('attended', 'checked_in');
  `;

  const streakQuery = `
    SELECT ea.confirmation_status
    FROM event_attendance ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = $1 AND e.end_time < NOW()
    ORDER BY e.start_time DESC;
  `;

  const queries = [pool.query(statsQuery, [userId]), pool.query(streakQuery, [userId])];
  if (includeSocial) {
    queries.push(
      pool.query('SELECT COUNT(*)::int AS cnt FROM post_likes WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS cnt FROM post_comments WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS cnt FROM events WHERE created_by = $1', [userId])
    );
  }

  const results = await Promise.all(queries);
  const stats = results[0].rows[0] || {};
  const streakRows = results[1].rows || [];

  let currentStreak = 0;
  for (const row of streakRows) {
    if (row.confirmation_status === 'attended') {
      currentStreak++;
    } else {
      break;
    }
  }

  const totalSedinte = parseInt(stats.total_sedinte, 10) || 0;
  const totalSocial = parseInt(stats.total_social, 10) || 0;
  const totalProiect = parseInt(stats.total_proiect, 10) || 0;

  return {
    total_events: parseInt(stats.total_events, 10) || 0,
    total_hours: parseFloat(stats.total_hours) || 0,
    total_sedinte: totalSedinte,
    total_social: totalSocial,
    total_proiect: totalProiect,
    hours_sedinte: parseFloat(stats.hours_sedinte) || 0,
    hours_social: parseFloat(stats.hours_social) || 0,
    hours_proiect: parseFloat(stats.hours_proiect) || 0,
    monthly_events: parseInt(stats.monthly_events, 10) || 0,
    weekly_hours: parseFloat(stats.weekly_hours) || 0,
    evening_events: parseInt(stats.evening_events, 10) || 0,
    diversified_categories: (totalSedinte > 0 ? 1 : 0) + (totalSocial > 0 ? 1 : 0) + (totalProiect > 0 ? 1 : 0),
    current_streak: currentStreak,
    likes_count: includeSocial ? (results[2].rows[0]?.cnt || 0) : 0,
    comments_count: includeSocial ? (results[3].rows[0]?.cnt || 0) : 0,
    events_created: includeSocial ? (results[4].rows[0]?.cnt || 0) : 0,
  };
};

const getUserBadgeProgressMap = async (userId, pool, badgesList) => {
  try {
    const [metrics, cache] = await Promise.all([
      getUserAttendanceMetrics(userId, pool, true),
      loadUserBadgesToCache(userId, pool),
    ]);
    const map = {};

    for (const badge of badgesList) {
      const rule = resolveBadgeRule(badge);
      if (!rule || !rule.target || isNaN(rule.target) || rule.target <= 0) {
        map[badge.id] = { progress_current: 0, progress_target: 0, progress_pct: 0 };
        continue;
      }
      const rawCurrent = metrics[rule.metric] ?? 0;
      const capped = Math.min(rawCurrent, rule.target);
      const roundedCurrent = Number.isInteger(capped) ? capped : Math.round(capped * 10) / 10;
      const pct = Math.min(100, Math.max(0, Math.floor((rawCurrent / rule.target) * 100)));

      if (pct >= 100 && !cache.has(badge.key)) {
        await awardBadge(userId, badge.key, pool);
      }

      map[badge.id] = {
        progress_current: roundedCurrent,
        progress_target: rule.target,
        progress_pct: pct,
      };
    }

    return map;
  } catch (err) {
    console.error(`[BadgeService] Eroare la calcularea progresului pentru user ${userId}:`, err);
    return {};
  }
};

// --- Logica DYNAMICĂ pentru Badge-urile de Evenimente ---

const checkAttendanceStatsBadges = async (userId, pool, cachedMetrics = null) => {
  const awardedBadges = [];
  try {
    const metrics = cachedMetrics || await getUserAttendanceMetrics(userId, pool, false);
    const badgesResult = await pool.query('SELECT * FROM badges');

    for (const badge of badgesResult.rows) {
      const rule = resolveBadgeRule(badge);
      if (!rule || !rule.target || isNaN(rule.target)) continue;
      // Sărim peste cheile de like/comment/event_created aici (au hook-urile lor)
      if (['likes_count', 'comments_count', 'events_created'].includes(rule.metric)) continue;

      const currentVal = metrics[rule.metric] ?? 0;
      if (currentVal >= rule.target) {
        const res = await awardBadge(userId, badge.key, pool);
        if (res.awarded && res.badge) awardedBadges.push(res.badge);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkAttendanceStatsBadges pentru user ${userId}:`, err);
  }
  return awardedBadges;
};

const checkSpecificEventBadges = async (userId, eventId, pool) => {
  const awardedBadges = [];
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];
    if (!event) return awardedBadges;

    const badgesResult = await pool.query(`SELECT * FROM badges WHERE rule_type IN ('night_owl', 'early_bird') OR key IN ('NIGHT_OWL', 'EARLY_BIRD')`);
    const badges = badgesResult.rows;

    const endTime = new Date(event.end_time);
    const startTime = new Date(event.start_time);

    if (endTime.getHours() >= 0 && endTime.getHours() < 5) {
      const noBadge = badges.find(b => b.rule_type === 'night_owl' || b.key === 'NIGHT_OWL');
      if (noBadge) {
        const res = await awardBadge(userId, noBadge.key, pool);
        if (res.awarded && res.badge) awardedBadges.push(res.badge);
      }
    }

    if (startTime.getHours() < 9) {
      const ebBadge = badges.find(b => b.rule_type === 'early_bird' || b.key === 'EARLY_BIRD');
      if (ebBadge) {
        const res = await awardBadge(userId, ebBadge.key, pool);
        if (res.awarded && res.badge) awardedBadges.push(res.badge);
      }
    }

    if (event.totp_secret) {
      const res = await awardBadge(userId, 'FIRST_SCAN_TOTP', pool);
      if (res.awarded && res.badge) awardedBadges.push(res.badge);
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkSpecificEventBadges pentru user ${userId}, event ${eventId}:`, err);
  }
  return awardedBadges;
};

const checkQuickRegisterBadge = async (userId, eventId, pool) => {
  const awardedBadges = [];
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
    if (result.rows.length === 0) return awardedBadges;

    const eventTime = new Date(result.rows[0].event_created_at);
    const attendTime = new Date(result.rows[0].attendance_created_at);
    const diffHours = (attendTime - eventTime) / 3600000;

    if (diffHours <= 1) {
      const badgesResult = await pool.query(`SELECT * FROM badges WHERE rule_type = 'quick_register' OR key = 'QUICK_REGISTER'`);
      for (const b of badgesResult.rows) {
        const res = await awardBadge(userId, b.key, pool);
        if (res.awarded && res.badge) awardedBadges.push(res.badge);
      }
    }
  } catch (err) {
    console.error(`[BadgeService] Eroare la checkQuickRegisterBadge pentru user ${userId}:`, err);
  }
  return awardedBadges;
};

const checkBadgesOnConfirmation = async (userId, eventId, pool) => {
  try {
    const metrics = await getUserAttendanceMetrics(userId, pool, false);
    const [statsAwarded, specificAwarded] = await Promise.all([
      checkAttendanceStatsBadges(userId, pool, metrics),
      checkSpecificEventBadges(userId, eventId, pool),
    ]);
    const combined = [...statsAwarded, ...specificAwarded];
    const seen = new Set();
    return combined.filter((b) => {
      if (!b || seen.has(b.key)) return false;
      seen.add(b.key);
      return true;
    });
  } catch (err) {
    console.error(`[BadgeService] Eroare la rularea checkBadgesOnConfirmation user ${userId}:`, err);
    return [];
  }
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
  getUserBadgeProgressMap,
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