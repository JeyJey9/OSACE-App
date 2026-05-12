const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { uploadStudentId } = require('../../config/multer');
const { logAction } = require('../../utils/auditLog');

module.exports = (pool, verifyToken, verifyAdmin) => {

  // ─────────────────────────────────────────────
  // GET /api/verification/my-status
  // Returns the current user's verification status + optional rejection reason
  // ─────────────────────────────────────────────
  router.get('/my-status', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const userResult = await pool.query(
        'SELECT student_verification_status FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length === 0) return res.status(404).json({ error: 'Utilizator negăsit.' });
      
      const status = userResult.rows[0].student_verification_status;
      
      // If rejected, find the most recent rejection reason
      let rejection_reason = null;
      let reviewed_at = null;
      if (status === 'unverified') {
        const rejResult = await pool.query(
          `SELECT rejection_reason, updated_at FROM student_id_verifications
           WHERE user_id = $1 AND status = 'rejected'
           ORDER BY updated_at DESC LIMIT 1`,
          [userId]
        );
        if (rejResult.rows.length > 0) {
          rejection_reason = rejResult.rows[0].rejection_reason;
          reviewed_at = rejResult.rows[0].updated_at;
        }
      }
      
      res.json({ status, rejection_reason, reviewed_at });
    } catch (error) {
      console.error('[Verification] Eroare la preluarea statusului:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/verification/submit
  // Upload student ID image — multipart/form-data field: "student_id_image"
  // ─────────────────────────────────────────────
  router.post(
    '/submit',
    [verifyToken, uploadStudentId.single('student_id_image')],
    async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'Niciun fișier încărcat sau format invalid (doar imagini sub 10MB).' });
      }

      const userId = req.user.userId;
      const imageUrlPath = `/uploads/student-ids/${req.file.filename}`;

      try {
        // Remove any prior pending request so only one exists at a time
        await pool.query(
          `DELETE FROM student_id_verifications WHERE user_id = $1 AND status = 'pending'`,
          [userId]
        );

        // Insert the new verification request
        await pool.query(
          `INSERT INTO student_id_verifications (user_id, image_url, status)
           VALUES ($1, $2, 'pending')`,
          [userId, imageUrlPath]
        );

        // Update user's overall verification status
        await pool.query(
          `UPDATE users SET student_verification_status = 'pending' WHERE id = $1`,
          [userId]
        );

        res.status(201).json({ message: 'Cererea de verificare a fost trimisă cu succes! Vei fi notificat când este procesată.', status: 'pending' });
      } catch (error) {
        console.error('[Verification] Eroare la submit:', error);
        res.status(500).json({ error: 'Eroare server la trimiterea cererii.' });
      }
    }
  );

  // ─────────────────────────────────────────────
  // GET /api/verification/pending  (Admin only)
  // Returns all pending verification requests with user info
  // ─────────────────────────────────────────────
  router.get('/pending', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT siv.id, siv.image_url, siv.created_at,
                u.id AS user_id, u.display_name, u.first_name, u.last_name,
                u.email, u.avatar_url, u.student_verification_status
         FROM student_id_verifications siv
         JOIN users u ON siv.user_id = u.id
         WHERE siv.status = 'pending'
         ORDER BY siv.created_at ASC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error('[Verification] Eroare la listarea cererilor pending:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/verification/:id/approve  (Admin only)
  // ─────────────────────────────────────────────
  router.post('/:id/approve', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const check = await client.query(
        'SELECT * FROM student_id_verifications WHERE id = $1 AND status = $2',
        [id, 'pending']
      );
      if (check.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Cerere negăsită sau deja procesată.' });
      }

      const request = check.rows[0];

      // Update verification record
      await client.query(
        `UPDATE student_id_verifications
           SET status = 'approved', reviewed_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [adminId, id]
      );

      // Update user status
      await client.query(
        `UPDATE users SET student_verification_status = 'verified' WHERE id = $1`,
        [request.user_id]
      );

      await client.query('COMMIT');

      await logAction(pool, adminId, 'STUDENT_ID_APPROVE', 'student_id_verification', parseInt(id), { target_user_id: request.user_id });

      // Send push notification to the user
      try {
        const tokenResult = await pool.query(
          'SELECT token FROM push_tokens WHERE user_id = $1 LIMIT 10',
          [request.user_id]
        );
        const tokens = tokenResult.rows.map(r => r.token).filter(Boolean);
        if (tokens.length > 0) {
          await axios.post('https://api.expo.dev/v2/push/send', {
            to: tokens,
            sound: 'default',
            title: '✅ Cont verificat!',
            body: 'Legitimația ta de student a fost aprobată. Acum te poți înscrie la activități!',
            data: { screen: 'NewsFeed' },
          }, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
            }
          });
        }
      } catch (pushError) {
        console.error('[Verification] Eroare push notificare aprobare:', pushError.message);
      }

      res.json({ message: 'Cont verificat cu succes! Utilizatorul a fost notificat.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Verification] Eroare la aprobare:', error);
      res.status(500).json({ error: 'Eroare server la aprobare.' });
    } finally {
      client.release();
    }
  });

  // ─────────────────────────────────────────────
  // POST /api/verification/:id/reject  (Admin only)
  // Body: { reason: "Motivul respingerii" }
  // ─────────────────────────────────────────────
  router.post('/:id/reject', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Te rugăm să specifici un motiv de respingere.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const check = await client.query(
        'SELECT * FROM student_id_verifications WHERE id = $1 AND status = $2',
        [id, 'pending']
      );
      if (check.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Cerere negăsită sau deja procesată.' });
      }

      const request = check.rows[0];

      await client.query(
        `UPDATE student_id_verifications
           SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, updated_at = NOW()
         WHERE id = $3`,
        [reason.trim(), adminId, id]
      );

      // Reset user status to 'unverified' so they can resubmit
      await client.query(
        `UPDATE users SET student_verification_status = 'unverified' WHERE id = $1`,
        [request.user_id]
      );

      // Also store the rejection reason on the user's latest rejected record for easy retrieval
      await client.query('COMMIT');

      await logAction(pool, adminId, 'STUDENT_ID_REJECT', 'student_id_verification', parseInt(id), { target_user_id: request.user_id, reason: reason.trim() });

      // Send push notification
      try {
        const tokenResult = await pool.query(
          'SELECT token FROM push_tokens WHERE user_id = $1 LIMIT 10',
          [request.user_id]
        );
        const tokens = tokenResult.rows.map(r => r.token).filter(Boolean);
        if (tokens.length > 0) {
          await axios.post('https://api.expo.dev/v2/push/send', {
            to: tokens,
            sound: 'default',
            title: '⚠️ Verificare respinsă',
            body: `Legitimația ta a fost respinsă: ${reason.trim()}. Te poți re-verifica oricând.`,
            data: { screen: 'StudentVerification' },
          }, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
            }
          });
        }
      } catch (pushError) {
        console.error('[Verification] Eroare push notificare respingere:', pushError.message);
      }

      res.json({ message: 'Cererea a fost respinsă. Utilizatorul poate re-trimite.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Verification] Eroare la respingere:', error);
      res.status(500).json({ error: 'Eroare server la respingere.' });
    } finally {
      client.release();
    }
  });

  return router;
};
