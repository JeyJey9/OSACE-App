const express = require('express');
const router = express.Router();

module.exports = (pool, verifyToken) => {

  // Traseul original: /api/notifications
  // Traseul nou: /
  router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        `SELECT n.id, n.title, n.body, n.created_at, un.is_read, un.id as user_notification_id
         FROM notifications n
         JOIN user_notifications un ON n.id = un.notification_id
         WHERE un.user_id = $1
         ORDER BY n.created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea notificărilor:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // Traseul original: /api/notifications/mark-all-read
  // Traseul nou: /mark-all-read
  router.post('/mark-all-read', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      await pool.query(
        "UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false",
        [userId]
      );
      res.status(200).json({ message: 'Toate notificările au fost marcate ca citite.' });
    } catch (error) {
      console.error('Eroare la marcarea notificărilor:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  return router;
};