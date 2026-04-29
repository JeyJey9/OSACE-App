// src/features/Event/event.routes.js
const express = require('express');
const router = express.Router();
const { authenticator } = require('otplib'); 
const { 
  checkBadgesOnConfirmation, 
  checkBadgesOnEventCreate, 
  checkBadgesOnUnattend, 
  awardBadge,
  checkQuickRegisterBadge 
} = require('../Badge/badge.service');

// Importăm interogările SQL din fișierul helper
const {
  HOME_EVENTS_QUERY,
  PARTICIPANTS_QUERY,
  ATTENDEES_QUERY,
  EVENT_DETAILS_QUERY,
  PUBLIC_CALENDAR_QUERY
} = require('./event.queries');

module.exports = (pool, mailTransporter, verifyToken, verifyManager) => {
  
  // --- PAZNICUL UNIVERSAL DE PERMISIUNI (V2 - Granular) ---
  const checkGlobalPermission = async (userId, role, permissionKey) => {
    if (role === 'admin') return true;
    const permCheck = await pool.query(
      "SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission_key = $2",
      [userId, permissionKey]
    );
    return permCheck.rowCount > 0;
  };

  const checkEventAccess = async (eventId, userId, role, requiredPermission) => {
    if (role === 'admin') return true;

    // 1. Are permisiunea globală specifică pentru această acțiune?
    if (requiredPermission) {
      const hasGlobal = await checkGlobalPermission(userId, role, requiredPermission);
      if (hasGlobal) return true;
    }

    // 2. Este creatorul evenimentului? (Creatorul are voie să facă orice la evenimentul lui)
    const creatorCheck = await pool.query('SELECT 1 FROM events WHERE id = $1 AND created_by = $2', [eventId, userId]);
    if (creatorCheck.rowCount > 0) return true;

    // 3. Este în echipa evenimentului? 
    // (Cei din echipă pot edita și scana, dar NU le dăm voie să șteargă evenimentul cu totul)
    if (requiredPermission !== 'CAN_DELETE_EVENTS') {
      const teamCheck = await pool.query(
        "SELECT 1 FROM event_teams WHERE event_id = $1 AND user_id = $2 AND access_level = 'editor'", 
        [eventId, userId]
      );
      if (teamCheck.rowCount > 0) return true;
    }

    return false; // Acces respins
  };

  // --- RUTE SPECIALE (Fără :id, trebuie să fie primele) ---

  // PRELUARE ACCES CURENT (PENTRU UI)
  router.get('/my-access', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      // 1. Tragem permisiunile globale ale userului
      const permResult = await pool.query('SELECT permission_key FROM user_permissions WHERE user_id = $1', [userId]);
      const globalPermissions = permResult.rows.map(r => r.permission_key);

      // 2. Tragem ID-urile evenimentelor unde userul este în Echipă
      const teamResult = await pool.query('SELECT event_id FROM event_teams WHERE user_id = $1', [userId]);
      const teamEvents = teamResult.rows.map(r => r.event_id);

      res.json({ globalPermissions, teamEvents });
    } catch (error) {
      console.error('Eroare la preluarea accesului:', error);
      res.status(500).json({ error: 'Eroare server la preluarea accesului.' });
    }
  });

  // PRELUARE COORDONATORI DISPONIBILI
  router.get('/available-coordinators', verifyToken, async (req, res) => {
    try {
      const result = await pool.query(
    "SELECT id, display_name, first_name, last_name, email FROM users WHERE role IN ('admin', 'coordonator') ORDER BY last_name ASC"
  );
      res.json(result.rows);
    } catch (error) {
      console.error('!!! EROARE LA COORDONATORI:', error);
      res.status(500).json({ error: 'Eroare la preluarea coordonatorilor.' });
    }
  });

  // Rută pentru Calendar (Accesibilă și de WordPress)
  router.get('/public/calendar', async (req, res) => {
    try {
      const result = await pool.query(PUBLIC_CALENDAR_QUERY);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea calendarului public:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // GET /my-created (Evenimente create de un manager)
  router.get('/my-created', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        `SELECT id, title, description, start_time, end_time, location, created_by, duration_hours, category, totp_secret, created_at 
         FROM events 
         WHERE created_by = $1 
         ORDER BY start_time DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea evenimentelor create de coordonator:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // --- RUTE PRINCIPALE EVENIMENTE ---

  // GET / (Lista evenimentelor pentru HomeScreen)
  router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const result = await pool.query(HOME_EVENTS_QUERY, [userId]); 
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la listarea evenimentelor:', error);
      res.status(500).json({ error: 'Eroare server la preluarea evenimentelor.' });
    }
  });

  // POST / (Creare eveniment)
  router.post('/', verifyToken, async (req, res) => {
    const { userId, role } = req.user;
    // NOU: Am adăugat allow_overtime
    const { title, description, start_time, end_time, location, duration_hours, category, allow_overtime } = req.body;
    
    const canCreate = role === 'admin' || role === 'coordonator' || await checkGlobalPermission(userId, role, 'CAN_CREATE_EVENTS');
    if (!canCreate) return res.status(403).json({ error: 'Nu ai permisiunea de a crea evenimente.' });

    const validCategories = ['sedinta', 'social', 'proiect'];
    if (!category || !validCategories.includes(category)) return res.status(400).json({ error: 'Categorie invalidă.' });
    if (!title || !description || !start_time || !end_time || !location || !duration_hours) return res.status(400).json({ error: 'Câmpuri obligatorii lipsă.' });

    const isOvertimeAllowed = allow_overtime !== false; // default true
    const secret = authenticator.generateSecret();
    
    try {
      const newEvent = await pool.query(
        `INSERT INTO events (title, description, start_time, end_time, location, created_by, duration_hours, category, totp_secret, allow_overtime) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [title, description, start_time, end_time, location, userId, duration_hours, category, secret, isOvertimeAllowed]
      );
      checkBadgesOnEventCreate(userId, pool);
      res.status(201).json(newEvent.rows[0]);
    } catch (error) {
      console.error('Eroare la crearea evenimentului:', error);
      res.status(500).json({ error: 'Eroare server la creare.' });
    }
  });

  // --- RUTE CU PARAMETRU /:id (Trebuie să fie mereu jos) ---

  // GET /:id/participants (Lista de admin)
  router.get('/:id/participants', verifyToken, async (req, res) => {
    const { id } = req.params; 
    const { userId, role } = req.user;
    try {
      // Întrebăm "Paznicul" nostru inteligent dacă are permisiunea specifică
      const hasAccess = await checkEventAccess(id, userId, role, 'CAN_MANAGE_PARTICIPANTS');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Evenimentul nu a fost găsit sau nu aveți permisiunea.' });
      }
      
      const participantsResult = await pool.query(PARTICIPANTS_QUERY, [id]);
      res.json(participantsResult.rows);
    } catch (error) {
      console.error(`Eroare la preluarea participanților pentru evenimentul ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea participanților.' });
    }
  });

  // GET /:id/current-code (Ruta pentru generare QR)
  router.get('/:id/current-code', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    
    try {
      const hasAccess = await checkEventAccess(id, userId, role, 'CAN_SCAN_QR_ANYWHERE');
      if (!hasAccess) {
        return res.status(403).json({ error: 'Nu ai permisiunea de a genera codul QR.' });
      }

      const eventResult = await pool.query('SELECT totp_secret FROM events WHERE id = $1', [id]);
      if (eventResult.rows.length === 0) {
        return res.status(404).json({ error: 'Eveniment negăsit.' });
      }
      const secret = eventResult.rows[0].totp_secret;
      if (!secret) {
        return res.status(400).json({ error: 'Acest eveniment este vechi și nu are un cod dinamic.' });
      }
      const token = authenticator.generate(secret);
      res.json({ code: token });
    } catch (error) {
      console.error('Eroare la generarea codului TOTP:', error);
        res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // GET /:id/attendees (Lista publică de participanți)
  router.get('/:id/attendees', verifyToken, async (req, res) => {
    const { id } = req.params; 
    try {
      const result = await pool.query(ATTENDEES_QUERY, [id]);
      res.json(result.rows);
    } catch (error) {
      console.error(`Eroare la preluarea participanților publici pentru evenimentul ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea participanților.' });
    }
  });

  // GET /:id/team (Vezi cine e în echipa evenimentului)
  router.get('/:id/team', verifyToken, async (req, res) => {
    try {
      // Opțional: Aici am putea adăuga o verificare `checkEventAccess` dacă vrei ca doar membrii echipei să vadă echipa, 
      // momentan lăsăm deschis pentru toți managerii prin rutele din frontend.
      const result = await pool.query(
        `SELECT u.id, u.display_name, u.first_name, u.last_name, u.email, et.access_level 
      FROM event_teams et 
      JOIN users u ON et.user_id = u.id 
       WHERE et.event_id = $1`,
      [req.params.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('!!! EROARE LA ECHIPA EVENIMENTULUI:', error); 
      res.status(500).json({ error: 'Eroare la preluarea echipei.' });
    }
  });

  // GET /:id (Detaliile evenimentului)
  router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    
    try {
      const eventResult = await pool.query(EVENT_DETAILS_QUERY, [id, userId]);

      if (eventResult.rows.length === 0) {
        return res.status(404).json({ error: 'Evenimentul nu a fost găsit.' });
      }
      
      res.json(eventResult.rows[0]);
    } catch (error) {
      console.error(`Eroare la preluarea detaliilor evenimentului ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea detaliilor.' });
    }
  });

  // --- ACȚIUNI PE EVENIMENT ---

  // POST /:id/attend (Înscriere)
  router.post('/:id/attend', verifyToken, async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user.userId;
      
      const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
      if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Evenimentul nu a fost găsit.' });
      
      const event = eventResult.rows[0];
      const creatorId = event.created_by; 
      
      if (new Date(event.end_time) < new Date()) {
        return res.status(400).json({ error: 'Nu te poți înscrie la un eveniment care s-a terminat.' });
      }
      
      const userResult = await pool.query('SELECT display_name, email FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: 'Utilizator negăsit.' });
      
      const attendanceResult = await pool.query(
        `INSERT INTO event_attendance (user_id, event_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, event_id) DO NOTHING
         RETURNING *`, 
        [userId, eventId]
      );
      
      if (attendanceResult.rows.length === 0) {
        return res.status(409).json({ message: 'Ești deja înscris la acest eveniment.' });
      }

      try {
        const countResult = await pool.query("SELECT COUNT(*) FROM event_attendance WHERE event_id = $1", [eventId]);
        const participantCount = parseInt(countResult.rows[0].count, 10);

        if (participantCount >= 20) {
          await awardBadge(creatorId, 'EVENT_20_ATTENDEES', pool);
        }
      } catch (badgeError) {
        console.error(`[BadgeService] Eroare la verificarea 'EVENT_20_ATTENDEES' pentru event ${eventId}:`, badgeError);
      }
      
      checkQuickRegisterBadge(userId, eventId, pool);
      res.status(201).json({ message: 'Înscriere reușită!', attendance: attendanceResult.rows[0] });
    } catch (error) {
      console.error('Eroare la înscrierea la eveniment:', error);
      res.status(500).json({ error: 'Eroare server la înscrierea la eveniment.' });
    }
  });
  
  // POST /:id/unattend (Retragere)
  router.post('/:id/unattend', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.userId;
    try {
      const eventResult = await pool.query('SELECT end_time FROM events WHERE id = $1', [eventId]);
      if (eventResult.rows.length === 0) {
        return res.status(404).json({ error: 'Evenimentul nu a fost găsit.' });
      }
      if (new Date(eventResult.rows[0].end_time) < new Date()) {
        return res.status(400).json({ error: 'Nu te poți retrage de la un eveniment care s-a terminat.' });
      }
      const deleteResult = await pool.query(
        'DELETE FROM event_attendance WHERE event_id = $1 AND user_id = $2 RETURNING *',
        [eventId, userId]
      );
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ error: 'Nu erai înscris la acest eveniment.' });
      }
      checkBadgesOnUnattend(userId, pool);
      res.status(200).json({ message: 'Retragere reușită.' });
    } catch (error) {
      console.error('Eroare la retragerea de la eveniment:', error);
      res.status(500).json({ error: 'Eroare server la retragere.' });
    }
  });

  // POST /:id/confirm-presence (Scanare QR)
  router.post('/:id/confirm-presence', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.userId;
    const { code } = req.body; 

    if (!code) return res.status(400).json({ error: 'Codul de confirmare lipsă.' });

    try {
      // 1. Preluăm datele evenimentului și statusul actual al voluntarului
      const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
      const attendanceResult = await pool.query(
        'SELECT confirmation_status, check_in_time FROM event_attendance WHERE user_id = $1 AND event_id = $2', 
        [userId, eventId]
      );
      
      if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Eveniment negăsit.' });
      if (attendanceResult.rows.length === 0) return res.status(404).json({ error: 'Nu ești înscris la acest eveniment.' });

      const event = eventResult.rows[0];
      const attendance = attendanceResult.rows[0];

      // 2. Verificăm codul QR (TOTP)
      const isValid = authenticator.check(code, event.totp_secret);
      if (!isValid) return res.status(401).json({ error: 'Cod invalid sau expirat.' });

      // --- LOGICA DE STATUS ---

      // CAZ A: Voluntarul face CHECK-IN (este 'registered' sau 'pending')
      if (attendance.confirmation_status === 'registered' || attendance.confirmation_status === 'pending') {
        await pool.query(
          `UPDATE event_attendance 
           SET confirmation_status = 'checked_in', check_in_time = NOW() 
           WHERE user_id = $1 AND event_id = $2`,
          [userId, eventId]
        );
        return res.status(200).json({ 
          message: 'Check-in realizat cu succes! Spor la treabă.',
          status: 'checked_in' 
        });
      }

      // CAZ B: Voluntarul face CHECK-OUT (este 'checked_in')
      if (attendance.confirmation_status === 'checked_in') {
        const checkOutTime = new Date();
        const checkInTime = new Date(attendance.check_in_time);
        const eventStartTime = new Date(event.start_time);
        const eventEndTime = new Date(event.end_time);
        
        let awardedHours = 0;
        let isOvertime = false;
        let overtimeHours = 0;

        // Dacă overtime-ul este strict interzis pentru acest eveniment
        if (event.allow_overtime === false) {
          const diffMs = checkOutTime - checkInTime;
          const maxMs = eventEndTime - eventStartTime;
          awardedHours = (Math.min(diffMs, maxMs) / (1000 * 60 * 60));
        } else {
          // Tolerance window = 30 minutes on either side
          const TOLERANCE_MS = 30 * 60 * 1000;

          // --- BASE HOURS ---
          // Always bounded strictly by the event schedule.
          // Early arrival and late departure are NEVER auto-awarded.
          const effectiveStart = checkInTime > eventStartTime ? checkInTime : eventStartTime;
          const effectiveEnd   = checkOutTime < eventEndTime  ? checkOutTime : eventEndTime;

          let overlapMs = Math.max(0, effectiveEnd - effectiveStart);
          awardedHours = overlapMs / (1000 * 60 * 60);

          // --- OVERTIME CHECK ---
          // How early did they arrive before the event started?
          const earlyMs = Math.max(0, eventStartTime - checkInTime);
          // How long did they stay after the event ended?
          const lateMs  = Math.max(0, checkOutTime - eventEndTime);

          let overtimeMs = 0;

          // Early arrival: within 30 min → ignored (they may just be waiting around).
          //                beyond 30 min → full early time sent to coordinator for review.
          if (earlyMs > TOLERANCE_MS) {
            overtimeMs += earlyMs;
          }

          // Late departure: within 30 min → ignored (post-event chat, etc).
          //                 beyond 30 min → full late time sent to coordinator for review.
          if (lateMs > TOLERANCE_MS) {
            overtimeMs += lateMs;
          }

          overtimeHours = overtimeMs / (1000 * 60 * 60);

          if (overtimeHours >= 0.1) {
            isOvertime = true;
          }
        }

        awardedHours = Math.max(0.1, awardedHours).toFixed(2);
        
        // 1. Închidem prezența
        await pool.query(
          `UPDATE event_attendance 
           SET confirmation_status = 'attended', 
               check_out_time = $1, 
               awarded_hours = $2, 
               checkout_method = 'scanned',
               confirmed_at = $1
           WHERE user_id = $3 AND event_id = $4`,
          [checkOutTime, awardedHours, userId, eventId]
        );

        // 2. Creăm cererea de overtime (dacă e cazul)
        if (isOvertime) {
          overtimeHours = Math.max(0.1, overtimeHours).toFixed(2);
          await pool.query(
            `INSERT INTO hour_requests (user_id, event_id, request_type, requested_hours)
             VALUES ($1, $2, 'overtime', $3)`,
            [userId, eventId, overtimeHours]
          );
        }

        checkBadgesOnConfirmation(userId, eventId, pool);

        let message = `Check-out realizat! Ai primit ${awardedHours} ore.`;
        if (isOvertime) {
          message += `\n\nS-a creat automat o cerere de Overtime pentru cele ${overtimeHours} ore suplimentare (ai depășit toleranța de 30 min).`;
        }

        return res.status(200).json({ 
          message: message,
          status: 'attended',
          hours: awardedHours,
          isOvertime: isOvertime
        });
      }

      // CAZ C: Deja a terminat
      if (attendance.confirmation_status === 'attended') {
        return res.status(400).json({ error: 'Ai confirmat deja prezența și plecarea pentru acest eveniment.' });
      }

    // (După if-ul cu 'attended')
      
      // PLASA DE SIGURANȚĂ: Dacă statusul este null sau nerecunoscut, îl tratăm ca pe un check-in
      if (!attendance.confirmation_status || attendance.confirmation_status === null) {
        await pool.query(
          `UPDATE event_attendance 
           SET confirmation_status = 'checked_in', check_in_time = NOW() 
           WHERE user_id = $1 AND event_id = $2`,
          [userId, eventId]
        );
        return res.status(200).json({ 
          message: 'Check-in realizat cu succes (Status corectat)! Spor la treabă.',
          status: 'checked_in' 
        });
      }

      // Dacă totuși e un status complet ciudat, dăm eroare ca să nu blocăm telefonul:
      return res.status(400).json({ error: `Status nerecunoscut: ${attendance.confirmation_status}` });

    } catch (error) {
      console.error('Eroare la procesul de scanare:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // --- MANAGEMENT ECHIPĂ ---

  router.post('/:id/team', verifyToken, async (req, res) => {
    const eventId = req.params.id;
    const { userId, role } = req.user;
    const { targetUserId } = req.body;

    try {
      const hasAccess = await checkEventAccess(eventId, userId, role, 'CAN_MANAGE_EVENT_TEAMS');
      if (!hasAccess) return res.status(403).json({ error: 'Nu poți modifica echipa acestui eveniment.' });

      await pool.query(
        "INSERT INTO event_teams (event_id, user_id, access_level) VALUES ($1, $2, 'editor') ON CONFLICT DO NOTHING",
        [eventId, targetUserId]
      );
      res.status(201).json({ message: 'Membru adăugat în echipă cu succes!' });
    } catch (error) {
      res.status(500).json({ error: 'Eroare la adăugarea membrului.' });
    }
  });

  router.delete('/:id/team/:targetUserId', verifyToken, async (req, res) => {
    const { id: eventId, targetUserId } = req.params;
    const { userId, role } = req.user;

    try {
      const hasAccess = await checkEventAccess(eventId, userId, role, 'CAN_MANAGE_EVENT_TEAMS');
      if (!hasAccess) return res.status(403).json({ error: 'Nu poți modifica echipa acestui eveniment.' });

      await pool.query('DELETE FROM event_teams WHERE event_id = $1 AND user_id = $2', [eventId, targetUserId]);
      res.status(200).json({ message: 'Membru eliminat.' });
    } catch (error) {
      res.status(500).json({ error: 'Eroare la eliminarea membrului.' });
    }
  });

  // --- EDITARE ȘI ȘTERGERE EVENIMENT ---

  // PUT /:id (Editare eveniment)
  router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    const { title, description, start_time, end_time, location, duration_hours, category, allow_overtime } = req.body;
    
    try {
      const hasAccess = await checkEventAccess(id, userId, role, 'CAN_EDIT_EVENTS');
      if (!hasAccess) return res.status(403).json({ error: 'Nu ai permisiunea de a edita acest eveniment.' });

      const isOvertimeAllowed = allow_overtime !== false;

      const updatedEvent = await pool.query(
        `UPDATE events SET title = $1, description = $2, start_time = $3, end_time = $4, location = $5, duration_hours = $6, category = $7, allow_overtime = $8 WHERE id = $9 RETURNING *`,
        [title, description, start_time, end_time, location, duration_hours, category, isOvertimeAllowed, id]
      );
      res.json(updatedEvent.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Eroare server la editare.' });
    }
  });

  // DELETE /:id (Ștergere eveniment)
  router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.user;
    
    try {
      const hasAccess = await checkEventAccess(id, userId, role, 'CAN_DELETE_EVENTS');
      if (!hasAccess) return res.status(403).json({ error: 'Nu ai permisiunea de a șterge acest eveniment.' });

      await pool.query('DELETE FROM events WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Eveniment șters cu succes.' });
    } catch (error) {
      res.status(500).json({ error: 'Eroare server la ștergere.' });
    }
  });

  return router;
};