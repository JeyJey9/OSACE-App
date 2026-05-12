const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { verifyToken } = require('../../middleware/auth');

// GET /api/profile/my-data  — returns a full snapshot of all data held for the authenticated user
router.get('/my-data', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const [userResult, eventsResult, contribResult, badgesResult, notifResult] = await Promise.all([
      pool.query(
        `SELECT id, display_name, first_name, last_name, email, role,
                student_verification_status, created_at
         FROM users WHERE id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT e.title, e.start_time, e.end_time, e.category, e.location,
                ep.confirmation_status, ep.awarded_hours, ep.created_at AS registered_at
         FROM event_participants ep
         JOIN events e ON e.id = ep.event_id
         WHERE ep.user_id = $1
         ORDER BY e.start_time DESC`,
        [userId]
      ),
      pool.query(
        `SELECT title, description, awarded_hours, created_at
         FROM special_contributions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT b.name, b.description, b.icon, ub.awarded_at
         FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = $1
         ORDER BY ub.awarded_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT title, body, created_at, is_read
         FROM user_notifications un
         JOIN notifications n ON n.id = un.notification_id
         WHERE un.user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      ),
    ]);

    res.json({
      exported_at: new Date().toISOString(),
      user: userResult.rows[0],
      events_attended: eventsResult.rows,
      special_contributions: contribResult.rows,
      badges: badgesResult.rows,
      recent_notifications: notifResult.rows,
    });
  } catch (err) {
    console.error('[DataExport] Eroare:', err);
    res.status(500).json({ error: 'Eroare server la exportul datelor.' });
  }
});

// PUT /api/profile/notification-preferences — store per-user notification preferences
router.put('/notification-preferences', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const { event_announcements = true, verification_updates = true } = req.body;
  try {
    await pool.query(
      `UPDATE users
         SET notification_preferences = $1::jsonb
       WHERE id = $2`,
      [JSON.stringify({ event_announcements, verification_updates }), userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[NotifPrefs] Eroare:', err);
    res.status(500).json({ error: 'Eroare server.' });
  }
});

// GET /api/profile/notification-preferences
router.get('/notification-preferences', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT notification_preferences FROM users WHERE id = $1`,
      [userId]
    );
    const prefs = result.rows[0]?.notification_preferences || {};
    res.json({
      event_announcements: prefs.event_announcements !== false,
      verification_updates: prefs.verification_updates !== false,
    });
  } catch (err) {
    console.error('[NotifPrefs] Eroare:', err);
    res.status(500).json({ error: 'Eroare server.' });
  }
});

module.exports = router;
