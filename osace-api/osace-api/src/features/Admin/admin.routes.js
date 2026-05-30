const express = require('express');
const router = express.Router();
const { STATS_QUERY, USER_DETAILS_QUERY } = require('./admin.queries');
const { logAction } = require('../../utils/auditLog');
const { getCurrentAcademicYear } = require('../../utils/academicYear');
const { invalidateUserBadgeCache } = require('../Badge/badge.service');

// Primește 'pool', 'axios' și middleware-urile
module.exports = (pool, axios, verifyToken, verifyAdmin, verifyManager) => {

  // ==========================================
  // ▼▼▼ RUTE NOI PENTRU APROBĂRI ORE (OVERTIME / UITUCI) ▼▼▼
  // ==========================================

  // GET /api/admin/pending-counts - Get consolidated counts of pending requests for badges (Admin/Coordinator)
  router.get('/pending-counts', [verifyToken, verifyManager], async (req, res) => {
    const { role } = req.user;
    
    try {
      // 1. Hour requests (coordinators only count pending_coordinator; admins count both pending_coordinator and pending_admin)
      const hourRequestQuery = role === 'coordonator' 
        ? "SELECT COUNT(*)::int FROM hour_requests WHERE status = 'pending_coordinator'" 
        : "SELECT COUNT(*)::int FROM hour_requests WHERE status IN ('pending_coordinator', 'pending_admin')";
      
      // 2. Reported comments (visible to both roles)
      const reportsQuery = "SELECT COUNT(*)::int FROM comment_reports WHERE status = 'pending'";
      
      // 3. Contribution requests (visible to Admins only)
      const contribQuery = role === 'admin'
        ? "SELECT COUNT(*)::int FROM special_contributions WHERE status = 'pending'"
        : "SELECT 0::int";
        
      // 4. Student verifications (visible to Admins only)
      const verifQuery = role === 'admin'
        ? "SELECT COUNT(*)::int FROM student_id_verifications WHERE status = 'pending'"
        : "SELECT 0::int";

      const [hourRes, reportsRes, contribRes, verifRes] = await Promise.all([
        pool.query(hourRequestQuery),
        pool.query(reportsQuery),
        pool.query(contribQuery),
        pool.query(verifQuery)
      ]);

      res.json({
        hourRequests: parseInt(hourRes.rows[0].count, 10) || 0,
        reportedComments: parseInt(reportsRes.rows[0].count, 10) || 0,
        contributionRequests: parseInt(contribRes.rows[0].count, 10) || 0,
        studentVerifications: parseInt(verifRes.rows[0].count, 10) || 0
      });
    } catch (error) {
      console.error('Eroare la preluarea numerelor de cereri pending:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // 1. GET /api/admin/hour-requests - Preluăm cererile (Protejat de verifyManager - Admin/Coordonator)
  router.get('/hour-requests', [verifyToken, verifyManager], async (req, res) => {
    const { userId, role } = req.user;
    
    try {
      // Coordonatorii văd cererile abia sosite. Adminii văd toate cererile nesoluționate final (și cele ce așteaptă coordonatorii, și cele ce sunt la admini).
      const statusFilterSQL = role === 'coordonator' 
        ? "hr.status = 'pending_coordinator'" 
        : "hr.status IN ('pending_coordinator', 'pending_admin')";
      
      const query = `
        SELECT 
          hr.id, hr.request_type, hr.requested_hours, hr.status, hr.created_at,
          u.id as user_id, u.display_name, u.first_name, u.last_name, u.avatar_url,
          e.id as event_id, e.title as event_title, e.start_time, e.end_time,
          ea.check_in_time, ea.check_out_time, ea.awarded_hours as base_hours, ea.checkout_method
        FROM hour_requests hr
        JOIN users u ON hr.user_id = u.id
        JOIN events e ON hr.event_id = e.id
        LEFT JOIN event_attendance ea ON hr.user_id = ea.user_id AND hr.event_id = ea.event_id
        WHERE ${statusFilterSQL}
        ORDER BY hr.created_at ASC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea cererilor de ore:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // 2. POST /api/admin/hour-requests/:id/approve - Aprobare cerere
  router.post('/hour-requests/:id/approve', [verifyToken, verifyManager], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    const { approved_hours } = req.body; 

    if (approved_hours === undefined || approved_hours < 0) {
      return res.status(400).json({ error: 'Număr de ore invalid.' });
    }

    try {
      const requestCheck = await pool.query('SELECT * FROM hour_requests WHERE id = $1', [id]);
      if (requestCheck.rowCount === 0) return res.status(404).json({ error: 'Cerere negăsită.' });
      
      const request = requestCheck.rows[0];

      // Dacă este Coordonator -> Împinge cererea către Admin
      if (role === 'coordonator' && request.status === 'pending_coordinator') {
        await pool.query(
          `UPDATE hour_requests 
           SET status = 'pending_admin', approved_hours = $1, coordinator_id = $2, updated_at = NOW() 
           WHERE id = $3`,
          [approved_hours, userId, id]
        );
        await logAction(pool, userId, 'HOUR_REQUEST_COORDINATOR_APPROVE', 'hour_request', parseInt(id), { approved_hours, target_user_id: request.user_id, event_id: request.event_id });
        return res.json({ message: 'Aprobat! Trimis către Admin pentru validarea finală.' });
      }

      // Dacă este Admin -> Aprobă final (indiferent dacă e în pending_coordinator sau pending_admin) și adaugă orele în pontaj
      if (role === 'admin' && (request.status === 'pending_admin' || request.status === 'pending_coordinator')) {
        await pool.query('BEGIN'); // Deschidem o tranzacție pentru siguranță

        await pool.query(
          `UPDATE hour_requests 
           SET status = 'approved', approved_hours = $1, admin_id = $2, updated_at = NOW() 
           WHERE id = $3`,
          [approved_hours, userId, id]
        );

        await pool.query(
          `INSERT INTO event_attendance (user_id, event_id, confirmation_status, awarded_hours, confirmed_at)
           VALUES ($1, $2, 'attended', $3, NOW())
           ON CONFLICT (user_id, event_id) 
           DO UPDATE SET 
             confirmation_status = 'attended', 
             awarded_hours = event_attendance.awarded_hours + EXCLUDED.awarded_hours,
             confirmed_at = NOW()`,
          [request.user_id, request.event_id, approved_hours]
        );

        await pool.query('COMMIT'); // Salvăm tranzacția
        await logAction(pool, userId, 'HOUR_REQUEST_ADMIN_APPROVE', 'hour_request', parseInt(id), { approved_hours, target_user_id: request.user_id, event_id: request.event_id });
        return res.json({ message: 'Aprobare finală realizată! Orele au fost adăugate voluntarului.' });
      }

      res.status(400).json({ error: 'Nu poți aproba această cerere din stadiul curent.' });
    } catch (error) {
      await pool.query('ROLLBACK'); // Anulăm modificările dacă dă eroare
      console.error('Eroare la aprobare:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // 3. POST /api/admin/hour-requests/:id/reject - Respingere cerere
  router.post('/hour-requests/:id/reject', [verifyToken, verifyManager], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;

    try {
      await pool.query(
        `UPDATE hour_requests 
         SET status = 'rejected', updated_at = NOW(),
         coordinator_id = CASE WHEN $1 = 'coordonator' THEN $2 ELSE coordinator_id END,
         admin_id = CASE WHEN $1 = 'admin' THEN $2 ELSE admin_id END
         WHERE id = $3`,
        [role, userId, id]
      );
      await logAction(pool, userId, 'HOUR_REQUEST_REJECT', 'hour_request', parseInt(id), {});
      res.json({ message: 'Cererea a fost respinsă.' });
    } catch (error) {
      console.error('Eroare la respingere:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });
  // ==========================================
  // ▼▼▼ RUTE CONTRIBUȚII SPECIALE ▼▼▼
  // ==========================================
  
  router.post('/contributions', [verifyToken, verifyManager], async (req, res) => {
    const { userIds, title, description, awarded_hours, event_id } = req.body;
    const { userId } = req.user;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !description || awarded_hours == null) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii și trebuie selectat cel puțin un voluntar.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const uid of userIds) {
        await client.query(
          `INSERT INTO special_contributions (user_id, coordinator_id, title, description, awarded_hours, event_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [uid, userId, title, description, awarded_hours, event_id || null]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ message: 'Contribuția specială a fost înregistrată și așteaptă aprobarea unui Admin.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Eroare la crearea contribuției:', error);
      res.status(500).json({ error: 'Eroare server.' });
    } finally {
      client.release();
    }
  });

  router.get('/contributions/pending', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT c.*, 
               u.display_name as target_name, u.first_name as target_first, u.last_name as target_last,
               coord.display_name as coord_name, coord.first_name as coord_first, coord.last_name as coord_last
        FROM special_contributions c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN users coord ON c.coordinator_id = coord.id
        WHERE c.status = 'pending'
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea contribuțiilor pending:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  router.post('/contributions/:id/approve', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
      await pool.query('BEGIN');
      
      const check = await pool.query('SELECT status FROM special_contributions WHERE id = $1', [id]);
      if (check.rowCount === 0) throw new Error('Not found');
      if (check.rows[0].status !== 'pending') throw new Error('Not pending');

      const contribData = await pool.query('SELECT user_id, title, awarded_hours FROM special_contributions WHERE id = $1', [id]);
      await pool.query(
        `UPDATE special_contributions 
         SET status = 'approved', admin_id = $1, updated_at = NOW() 
         WHERE id = $2`,
        [userId, id]
      );
      
      await pool.query('COMMIT');
      if (contribData.rowCount > 0) {
        const c = contribData.rows[0];
        await logAction(pool, userId, 'CONTRIBUTION_APPROVE', 'special_contribution', parseInt(id), { target_user_id: c.user_id, title: c.title, awarded_hours: c.awarded_hours });
      }
      res.json({ message: 'Contribuție aprobată cu succes!' });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Eroare la aprobarea contribuției:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  router.post('/contributions/:id/reject', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
      await pool.query(
        `UPDATE special_contributions 
         SET status = 'rejected', admin_id = $1, updated_at = NOW() 
         WHERE id = $2`,
        [userId, id]
      );
      await logAction(pool, userId, 'CONTRIBUTION_REJECT', 'special_contribution', parseInt(id), {});
      res.json({ message: 'Contribuție respinsă.' });
    } catch (error) {
      console.error('Eroare la respingerea contribuției:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  router.get('/contributions/all', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT c.*, 
               u.display_name as target_name, u.first_name as target_first, u.last_name as target_last,
               coord.display_name as coord_name, coord.first_name as coord_first, coord.last_name as coord_last,
               e.title as event_title
        FROM special_contributions c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN users coord ON c.coordinator_id = coord.id
        LEFT JOIN events e ON c.event_id = e.id
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea tuturor contribuțiilor:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  router.put('/contributions/:id', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { title, description, awarded_hours, event_id } = req.body;

    if (!title || !description || awarded_hours == null) {
      return res.status(400).json({ error: 'Titlul, descrierea și orele sunt obligatorii.' });
    }

    try {
      const updated = await pool.query(
        `UPDATE special_contributions 
         SET title = $1, description = $2, awarded_hours = $3, event_id = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING *`,
        [title, description, awarded_hours, event_id || null, id]
      );

      if (updated.rowCount === 0) {
        return res.status(404).json({ error: 'Contribuția nu a fost găsită.' });
      }

      res.json({ message: 'Contribuția a fost actualizată.', contribution: updated.rows[0] });
    } catch (error) {
      console.error('Eroare la editarea contribuției:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  router.delete('/contributions/:id', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;

    try {
      const deleted = await pool.query('DELETE FROM special_contributions WHERE id = $1 RETURNING *', [id]);
      if (deleted.rowCount === 0) {
        return res.status(404).json({ error: 'Contribuția nu a fost găsită.' });
      }

      res.json({ message: 'Contribuția a fost ștearsă.' });
    } catch (error) {
      console.error('Eroare la ștergerea contribuției:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // ==========================================
  // ▲▲▲ SFÂRȘIT RUTE CONTRIBUȚII SPECIALE ▲▲▲
  // ==========================================


  // Traseul: /api/admin/notifications/send-all
  router.post('/notifications/send-all', [verifyToken, verifyAdmin], async (req, res) => {
  const { title, message, roles } = req.body; 
  if (!title || !message) {
    return res.status(400).json({ error: 'Titlul și mesajul sunt obligatorii.' });
  }
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ error: 'Trebuie selectat cel puțin un rol țintă.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const notificationResult = await client.query('INSERT INTO notifications (title, body) VALUES ($1, $2) RETURNING id', [title, message]);
    const newNotificationId = notificationResult.rows[0].id;
    const usersQuery = `
      SELECT u.id, pt.token 
      FROM users u
      LEFT JOIN push_tokens pt ON u.id = pt.user_id 
      WHERE u.role = ANY($1::text[])
    `;
    const usersResult = await client.query(usersQuery, [roles]); 
    if (usersResult.rows.length === 0) {
      await client.query('COMMIT'); 
      return res.status(200).json({ message: 'Notificare salvată, dar nu au fost găsiți utilizatori în grupurile selectate.' });
    }
    const userIds = [...new Set(usersResult.rows.map(user => user.id))];
    const userNotificationValues = userIds.map(id => `(${id}, ${newNotificationId})`).join(',');
    await client.query(`INSERT INTO user_notifications (user_id, notification_id) VALUES ${userNotificationValues} ON CONFLICT DO NOTHING`);
    const pushTokens = usersResult.rows.filter(user => user.token).map(user => user.token);
    if (pushTokens.length > 0) {
      const expoMessage = { to: pushTokens, sound: 'default', title: title, body: message, data: { _displayInForeground: true } };
      try {
        console.log(`[Push Notify] Se trimit ${pushTokens.length} notificări către rolurile: ${roles.join(', ')}`);
        console.log(`[Push Notify] Tokenuri:`, JSON.stringify(pushTokens));
        const expoResponse = await axios.post('https://api.expo.dev/v2/push/send', expoMessage, {
          headers: { 
            'Accept': 'application/json', 
            'Accept-encoding': 'gzip, deflate', 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
          }
        });
        console.log(`[Push Notify] Răspuns Expo API:`, JSON.stringify(expoResponse.data, null, 2));
      } catch (expoError) {
        console.error('--- EROARE CRITICĂ EXPO API ---');
        if (expoError.response) {
          console.error('Status:', expoError.response.status);
          console.dir(expoError.response.data, { depth: null }); 
        } else {
          console.error('Eroare rețea/Axios:', expoError.message);
        }
      }
    }
    await client.query('COMMIT');
    await logAction(pool, req.user.userId, 'NOTIFICATION_SEND', 'notification', newNotificationId, { title, roles, recipient_count: pushTokens.length });
    res.status(200).json({ message: `Notificare salvată și trimisă către ${pushTokens.length} dispozitive.` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Eroare la trimiterea notificărilor (tranzacție):', error);
    res.status(500).json({ error: 'Eroare server la trimiterea notificărilor.' });
  } finally {
    client.release();
  }
});

  // Traseul: /api/admin/users
  router.get('/users', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const year = getCurrentAcademicYear();
      const usersResult = await pool.query(
       `SELECT u.id, u.display_name, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.created_at, u.student_verification_status,
               (
                 (SELECT COALESCE(SUM(ea.awarded_hours), 0) 
                  FROM event_attendance ea 
                  JOIN events e ON ea.event_id = e.id
                  WHERE ea.user_id = u.id AND ea.confirmation_status = 'attended'
                    AND e.start_time >= $1 AND e.start_time < $2) +
                 (SELECT COALESCE(SUM(sc.awarded_hours), 0) 
                  FROM special_contributions sc 
                  WHERE sc.user_id = u.id AND sc.status = 'approved'
                    AND sc.created_at >= $1 AND sc.created_at < $2)
               ) AS total_hours
        FROM users u
        ORDER BY u.last_name ASC;`,
        [year.start, year.end]
    );
      res.json(usersResult.rows);
    } catch (error) {
      console.error('Eroare la preluarea listei de utilizatori:', error);
      res.status(500).json({ error: 'Eroare server la preluarea utilizatorilor.' });
    }
  });

  // Traseul: /api/admin/users/managed - Accesibil pentru Admin SI Coordonator
  router.get('/users/managed', [verifyToken, verifyManager], async (req, res) => {
    try {
      const year = getCurrentAcademicYear();
      const usersResult = await pool.query(
       `SELECT u.id, u.display_name, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.created_at, u.student_verification_status,
               (
                 (SELECT COALESCE(SUM(ea.awarded_hours), 0) 
                  FROM event_attendance ea 
                  JOIN events e ON ea.event_id = e.id
                  WHERE ea.user_id = u.id AND ea.confirmation_status = 'attended'
                    AND e.start_time >= $1 AND e.start_time < $2) +
                 (SELECT COALESCE(SUM(sc.awarded_hours), 0) 
                  FROM special_contributions sc 
                  WHERE sc.user_id = u.id AND sc.status = 'approved'
                    AND sc.created_at >= $1 AND sc.created_at < $2)
               ) AS total_hours
        FROM users u
        ORDER BY u.last_name ASC;`,
        [year.start, year.end]
    );
      res.json(usersResult.rows);
    } catch (error) {
      console.error('Eroare la preluarea listei de utilizatori (managed):', error);
      res.status(500).json({ error: 'Eroare server la preluarea utilizatorilor.' });
    }
  });

  // Traseul: /api/admin/users/:id/role
  router.put('/users/:id/role', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.userId;
    try {
      const validRoles = ['user', 'coordonator', 'admin'];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({ error: 'Rol invalid. Rolurile permise sunt: user, coordonator, admin.' });
      }
      if (parseInt(id, 10) === adminId) {
        return res.status(403).json({ error: 'Acțiune interzisă. Nu îți poți schimba propriul rol.' });
      }
      const updateResult = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, display_name, email, role', [newRole, id]);
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
      }
      await logAction(pool, adminId, 'USER_ROLE_CHANGE', 'user', parseInt(id), { new_role: newRole, target_name: updateResult.rows[0].display_name });
      res.status(200).json({ message: 'Rolul a fost actualizat cu succes.', user: updateResult.rows[0] });
    } catch (error) {
      console.error('Eroare la schimbarea rolului:', error);
      res.status(500).json({ error: 'Eroare server la schimbarea rolului.' });
    }
  });

  // Traseul: /api/admin/users/:id
  router.delete('/users/:id', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId; 
    try {
      if (parseInt(id) === adminId) {
        return res.status(403).json({ error: 'Nu poți șterge propriul cont.' });
      }
      const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
      }
      await logAction(pool, adminId, 'USER_DELETE', 'user', parseInt(id), { deleted_email: deleteResult.rows[0].email, deleted_name: deleteResult.rows[0].display_name });
      res.status(200).json({ message: 'Utilizatorul a fost șters cu succes.' });
    } catch (error) {
      console.error('Eroare la ștergere utilizator:', error);
      res.status(500).json({ error: 'Eroare server la ștergere.' });
    }
  });

  // Traseul: /api/admin/events/all
  router.get('/events/all', [verifyToken, verifyManager], async (req, res) => {
    const { search, category } = req.query;

    let queryString = 'SELECT * FROM events';
    const queryParams = [];
    let whereClauses = [];

    if (search) {
      queryParams.push(`%${search}%`); 
      whereClauses.push(`title ILIKE $${queryParams.length}`);
    }

    if (category) {
      queryParams.push(category);
      whereClauses.push(`category = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      queryString += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryString += ' ORDER BY start_time DESC';

    try {
      const allEvents = await pool.query(queryString, queryParams);
      res.json(allEvents.rows);
    } catch (error) {
      console.error('Eroare la listarea tuturor evenimentelor (filtrate):', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // Traseul: /api/admin/statistics
  router.get('/statistics', [verifyToken, verifyManager], async (req, res) => {
    try {
      const statsResult = await pool.query(STATS_QUERY); 
      res.json(statsResult.rows[0]); 
    } catch (error) {
      console.error('Eroare la preluarea statisticilor:', error);
      res.status(500).json({ error: 'Eroare server la preluarea statisticilor.' });
    }
  });

  // Traseu: GET /api/admin/users/:id/details
  router.get('/users/:id/details', [verifyToken, verifyManager], async (req, res) => {
    const { id } = req.params; 
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID utilizator invalid.' });
    }

    try {
      const statsResult = await pool.query(USER_DETAILS_QUERY, [id]);

      if (!statsResult.rows[0] || !statsResult.rows[0].user_info) {
        return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
      }
      res.json(statsResult.rows[0]);
    } catch (error) {
      console.error(`Eroare la preluarea detaliilor pentru utilizatorul ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea detaliilor.' });
    }
  });

  // --- RUTE CRUD PENTRU ADMIN BADGES ---
  
  router.post('/badges', [verifyToken, verifyAdmin], async (req, res) => {
    const { name, description, icon_name, key, rule_type, rule_value } = req.body;
    if (!name || !description || !icon_name || !key) {
      return res.status(400).json({ error: 'Câmpurile (name, description, icon_name, key) sunt obligatorii.' });
    }
    try {
      const newBadge = await pool.query(
        `INSERT INTO badges (name, description, icon_name, key, rule_type, rule_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [name, description, icon_name, key, rule_type || 'manual', rule_value || null]
      );
      res.status(201).json(newBadge.rows[0]);
    } catch (err) {
      if (err.code === '23505') { 
        return res.status(409).json({ error: `Cheia (key) '${key}' există deja.` });
      }
      console.error('Eroare la crearea badge-ului:', err);
      res.status(500).json({ error: 'Eroare server la crearea badge-ului.' });
    }
  });

  router.get('/badges', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const allBadges = await pool.query('SELECT * FROM badges ORDER BY name ASC');
      res.json(allBadges.rows);
    } catch (err) {
      console.error('Eroare la preluarea badge-urilor (admin):', err);
      res.status(500).json({ error: 'Eroare server la preluarea badge-urilor.' });
    }
  });

  router.put('/badges/:id', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { name, description, icon_name, rule_type, rule_value } = req.body; 

    if (!name || !description || !icon_name) {
      return res.status(400).json({ error: 'Câmpurile (name, description, icon_name) sunt obligatorii.' });
    }
    try {
      const updatedBadge = await pool.query(
        `UPDATE badges
         SET name = $1, description = $2, icon_name = $3, rule_type = $4, rule_value = $5
         WHERE id = $6
         RETURNING *;`,
        [name, description, icon_name, rule_type || 'manual', rule_value || null, id]
      );
      if (updatedBadge.rows.length === 0) {
        return res.status(404).json({ error: 'Badge-ul nu a fost găsit.' });
      }
      res.json(updatedBadge.rows[0]);
    } catch (err) {
      console.error(`Eroare la actualizarea badge-ului ${id}:`, err);
      res.status(500).json({ error: 'Eroare server la actualizarea badge-ului.' });
    }
  });

  router.delete('/badges/:id', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    try {
      const deleteResult = await pool.query(
        'DELETE FROM badges WHERE id = $1 RETURNING *;',
        [id]
      );
      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Badge-ul nu a fost găsit.' });
      }
      res.status(200).json({ message: `Badge-ul '${deleteResult.rows[0].name}' a fost șters.` });
    } catch (err) {
      if (err.code === '23503') { 
        return res.status(409).json({ 
          error: 'Acest badge nu poate fi șters deoarece este deja deținut de utilizatori.' 
        });
      }
      console.error(`Eroare la ștergerea badge-ului ${id}:`, err);
      res.status(500).json({ error: 'Eroare server la ștergerea badge-ului.' });
    }
  });

  // --- ACORDARE / REVOCARE MANUALA BADGE-URI ---

  router.get('/users/:id/badges', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
      `, [req.params.id]);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare preluare badge-uri utilizator:', error);
      res.status(500).json({ error: 'Eroare server la preluarea badge-urilor.' });
    }
  });

  router.post('/users/:id/badges', [verifyToken, verifyAdmin], async (req, res) => {
    const { id } = req.params;
    const { badge_id } = req.body;
    try {
      await pool.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, badge_id]
      );
      invalidateUserBadgeCache(id); // Invalidează cache-ul local pentru acest utilizator
      await logAction(pool, req.user.userId, 'BADGE_AWARD_MANUAL', 'user', parseInt(id), { badge_id });
      res.json({ message: 'Badge acordat cu succes.' });
    } catch (error) {
      console.error('Eroare acordare badge manual:', error);
      res.status(500).json({ error: 'Eroare server la acordarea badge-ului.' });
    }
  });

  router.delete('/users/:id/badges/:badgeId', [verifyToken, verifyAdmin], async (req, res) => {
    const { id, badgeId } = req.params;
    try {
      await pool.query(
        'DELETE FROM user_badges WHERE user_id = $1 AND badge_id = $2',
        [id, badgeId]
      );
      invalidateUserBadgeCache(id); // Invalidează cache-ul local pentru acest utilizator
      await logAction(pool, req.user.userId, 'BADGE_REVOKE_MANUAL', 'user', parseInt(id), { badge_id: badgeId });
      res.json({ message: 'Badge revocat cu succes.' });
    } catch (error) {
      console.error('Eroare revocare badge manual:', error);
      res.status(500).json({ error: 'Eroare server la revocarea badge-ului.' });
    }
  });

  // --- GESTIUNE PERMISIUNI GLOBALE PER UTILIZATOR ---

  router.get('/users/:id/permissions', [verifyToken, verifyAdmin], async (req, res) => {
    try {
      const result = await pool.query('SELECT permission_key FROM user_permissions WHERE user_id = $1', [req.params.id]);
      const permissions = result.rows.map(row => row.permission_key);
      res.json(permissions);
    } catch (error) {
      console.error('Eroare preluare permisiuni:', error);
      res.status(500).json({ error: 'Eroare server la preluarea permisiunilor.' });
    }
  });

  router.post('/users/:id/permissions/toggle', [verifyToken, verifyAdmin], async (req, res) => {
    const userId = req.params.id;
    const { permissionKey, isGranted } = req.body;

    try {
      if (isGranted) {
        await pool.query(
          'INSERT INTO user_permissions (user_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', 
          [userId, permissionKey]
        );
      } else {
        await pool.query(
          'DELETE FROM user_permissions WHERE user_id = $1 AND permission_key = $2', 
          [userId, permissionKey]
        );
      }
      res.json({ message: 'Permisiune actualizată cu succes.' });
    } catch (error) {
      console.error('Eroare actualizare permisiune:', error);
      res.status(500).json({ error: 'Eroare server la actualizarea permisiunii.' });
    }
  });

  // POST /api/admin/bulk-request-hours (Adăugare manuală ore ca cereri în așteptare)
  router.post('/bulk-request-hours', [verifyToken], async (req, res) => {
    const { userIds, eventId, hours } = req.body;
    const { role } = req.user;

    // Verificăm permisiunile manageriale
    if (role !== 'admin' && role !== 'coordonator') {
      return res.status(403).json({ error: 'Nu ai permisiunea de a crea cereri.' });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !eventId || !hours) {
      return res.status(400).json({ error: 'Date incomplete.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const userId of userIds) {
        // În loc să acordăm direct, creăm o cerere de tip 'manual' pentru fiecare utilizator selectat
        await client.query(
          `INSERT INTO hour_requests (user_id, event_id, request_type, requested_hours)
           VALUES ($1, $2, 'manual', $3)`,
          [userId, eventId, hours]
        );
      }

      await client.query('COMMIT');
      res.status(200).json({ message: `S-au trimis spre aprobare cererile pentru ${userIds.length} voluntari!` });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Eroare la adăugarea cererilor manuale:', error);
      res.status(500).json({ error: 'Eroare la crearea cererilor în așteptare.' });
    } finally {
      client.release();
    }
  });

  // ==========================================
  // GET /api/admin/audit-logs (Admin only)
  // ==========================================
  router.get('/audit-logs', [verifyToken, verifyAdmin], async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    const { action, actor_id } = req.query;

    let whereClauses = [];
    const params = [];

    if (action) {
      const actions = action.split(',');
      const placeholders = actions.map(a => {
        params.push(a);
        return `$${params.length}`;
      });
      whereClauses.push(`al.action IN (${placeholders.join(', ')})`);
    }
    if (actor_id) {
      params.push(parseInt(actor_id));
      whereClauses.push(`al.actor_id = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    params.push(limit, offset);

    try {
      const result = await pool.query(
        `SELECT
           al.id,
           al.action,
           al.target_type,
           al.target_id,
           al.details,
           al.created_at,
           u.id        AS actor_id,
           u.display_name AS actor_name,
           u.role      AS actor_role,
           COALESCE(tu1.display_name, tu2.display_name) AS resolved_target_name
         FROM audit_logs al
         LEFT JOIN users u ON al.actor_id = u.id
         LEFT JOIN users tu1 ON al.target_type = 'user' AND al.target_id = tu1.id
         LEFT JOIN users tu2 ON (al.details->>'target_user_id') IS NOT NULL AND (al.details->>'target_user_id') ~ '^[0-9]+$' AND tu2.id = (al.details->>'target_user_id')::int
         ${whereSQL}
         ORDER BY al.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM audit_logs al ${whereSQL}`,
        params.slice(0, params.length - 2)
      );

      res.json({
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      });
    } catch (error) {
      console.error('Eroare la preluarea jurnalelor de audit:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  return router;
};