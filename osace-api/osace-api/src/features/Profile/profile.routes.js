const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const argon2 = require('argon2'); 
const { uploadAvatar } = require('../../config/multer');

const { 
  checkBadgesOnProfileView, 
  checkBadgesOnAvatarUpload, 
  checkBadgesOnProfileEdit 
} = require('../Badge/badge.service');

module.exports = (pool, verifyToken) => {


  // Traseul: /me (Profilul TĂU)
  router.get('/me', verifyToken, async (req, res) => {
  	try {
  	  const userResult = await pool.query(
   		 'SELECT id, display_name, first_name, last_name, email, role, created_at, avatar_url FROM users WHERE id = $1',
  		 [req.user.userId]
  );
  	  if (userResult.rows.length === 0) {
  	  	return res.status(404).json({ error: 'Utilizator negăsit.' });
  	  }
  	  res.json(userResult.rows[0]);
  	} catch (error) {
  	  console.error('Eroare la preluarea profilului:', error);
  	  res.status(500).json({ error: 'Eroare server la preluarea profilului.' });
  	}
  });

  // Traseul: /my-events (Neschimbat)
  router.get('/my-events', verifyToken, async (req, res) => {
  	const userId = req.user.userId;
  	try {
  	  const result = await pool.query(
  	  	`SELECT e.id, e.title, e.description, e.start_time, e.end_time, e.location, e.category, ea.confirmation_status, ea.confirmed_at
  	  	 FROM events e
  	  	 JOIN event_attendance ea ON e.id = ea.event_id
  	  	 WHERE ea.user_id = $1 AND e.end_time > NOW()
  	  	 ORDER BY e.start_time ASC`,
  	  	[userId]
  	  );
  	  res.json(result.rows);
  	} catch (error) {
  	  console.error('Eroare la preluarea evenimentelor viitoare ale utilizatorului:', error);
  	  res.status(500).json({ error: 'Eroare server la preluarea evenimentelor.' });
  	}
  });
  
  // Traseul: /my-past-events (Neschimbat)
  router.get('/my-past-events', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const result = await pool.query(
        `SELECT e.id, e.title, e.start_time, e.end_time, e.location, e.duration_hours, e.category, 
                ea.confirmation_status, ea.awarded_hours 
         FROM events e
         JOIN event_attendance ea ON e.id = ea.event_id
         WHERE ea.user_id = $1 AND e.end_time <= NOW()
         ORDER BY e.start_time DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea istoricului:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  {/* ▼▼▼ NOU: Ruta pentru a prelua badge-urile câștigate ▼▼▼ */}
  router.get('/my-badges', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
      const query = `
        SELECT
          b.id,
          b.name,
          b.description,
          b.icon_name,
          b.key,
          ub.earned_at
        FROM
          user_badges ub
        JOIN
          badges b ON ub.badge_id = b.id
        WHERE
          ub.user_id = $1
        ORDER BY
          ub.earned_at DESC; -- Afișăm cele mai recente badge-uri primele
      `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error(`Eroare la preluarea badge-urilor pentru utilizatorul ${userId}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea badge-urilor.' });
    }
  });
  {/* ▲▲▲ SFÂRȘIT BLOC NOU ▲▲▲ */}


  // PUT /me (Schimbare nume)
  router.put('/me', verifyToken, async (req, res) => {
    const { display_name, first_name, last_name } = req.body;
    const userId = req.user.userId;

    if (!display_name || !first_name || !last_name) {
      return res.status(400).json({ error: 'Toate câmpurile numelui sunt obligatorii.' });
    }

    try {
      const result = await pool.query(
        'UPDATE users SET display_name = $1, first_name = $2, last_name = $3 WHERE id = $4 RETURNING id, display_name, first_name, last_name, email, role, avatar_url',
        [display_name.trim(), first_name.trim(), last_name.trim(), userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Utilizator negăsit.' });
      }
      checkBadgesOnProfileEdit(req.user.userId, pool);
      res.status(200).json({ 
        message: 'Profilul a fost actualizat cu succes!',
        user: result.rows[0] 
      });
    } catch (error) {
      console.error('Eroare la actualizarea profilului:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // PUT /password (Schimbare parolă)
  router.put('/password', verifyToken, async (req, res) => {
  	const { oldPassword, newPassword } = req.body;
  	const userId = req.user.userId;

  	if (!oldPassword || !newPassword) {
  	  return res.status(400).json({ error: 'Parola veche și parola nouă sunt obligatorii.' });
  	}
  	if (newPassword.length < 8) {
  	  return res.status(400).json({ error: 'Parola nouă trebuie să aibă cel puțin 8 caractere.' });
  	}

  	try {
  	  const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  	  if (userResult.rows.length === 0) {
  	  	return res.status(404).json({ error: 'Utilizator negăsit.' });
  	  }
  	  const storedHash = userResult.rows[0].password_hash;

  	  const isOldPasswordValid = await argon2.verify(storedHash, oldPassword);
  	  if (!isOldPasswordValid) {
  	  	return res.status(401).json({ error: 'Parola veche este incorectă.' });
  	  }

  	  const newPasswordHash = await argon2.hash(newPassword);

  	  await pool.query(
  	  	'UPDATE users SET password_hash = $1 WHERE id = $2',
  	  	[newPasswordHash, userId]
  	  );
	  checkBadgesOnProfileEdit(req.user.userId, pool);
  	  res.status(200).json({ message: 'Parola a fost schimbată cu succes!' });

  	} catch (error) {
  	  console.error('Eroare la schimbarea parolei:', error);
  	  res.status(500).json({ error: 'Eroare server la schimbarea parolei.' });
  	}
  });

  // Traseul: /push-token (Neschimbat)
  router.post('/push-token', verifyToken, async (req, res) => {
  	const { token } = req.body;
  	const userId = req.user.userId;
  	if (!token) return res.status(400).json({ error: 'Token lipsă.' });

  	try {
  	  await pool.query(
  	  	`INSERT INTO push_tokens (user_id, token) VALUES ($1, $2)
  	  	 ON CONFLICT (token) DO UPDATE SET user_id = $1, created_at = NOW()`,
  	  	[userId, token]
  	  );
  	  res.status(200).json({ message: 'Token înregistrat.' });
  	} catch (error) {
  	  console.error('Eroare la salvarea push token:', error);
  	  res.status(500).json({ error: 'Eroare server la salvarea token-ului.' });
  	}
  });

  // POST /avatar (Upload avatar)
  router.post(
  	'/avatar', 
  	[verifyToken, uploadAvatar.single('avatar')],
  	async (req, res) => {
  	  if (!req.file) {
  	  	return res.status(400).json({ error: 'Niciun fișier încărcat sau format invalid (doar imagini sub 2MB).' });
  	  }
  	  const userId = req.user.userId;
  	  const avatarUrlPath = `/uploads/avatars/${req.file.filename}`;
  	  try {
  	  	const oldData = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
  	  	const oldAvatarPath = oldData.rows[0]?.avatar_url;
  	  	if (oldAvatarPath) {
  	  	  const localPath = path.join('/var/www/osace-uploads/', oldAvatarPath.replace('/uploads/', ''));
  	  	  fs.unlink(localPath, (err) => {
  	  	  	if (err) console.error(`Eroare la ștergerea avatarului vechi (${localPath}):`, err.message);
  	  	  	else console.log(`Avatarul vechi (${localPath}) a fost șters.`);
  	  	  });
  	  	}
  	  	const result = await pool.query(
  	  	  'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
  	  	  [avatarUrlPath, userId]
  	  	);
  	  	const newAvatarUrl = result.rows[0].avatar_url;
		checkBadgesOnAvatarUpload(userId, pool);
  	  	res.status(200).json({ 
  	  	  message: 'Avatar încărcat cu succes!',
  	  	  avatar_url: newAvatarUrl 
  	  	});
  	  } catch (error) {
  	  	console.error('Eroare la salvarea avatarului în DB:', error);
  	  	res.status(500).json({ error: 'Eroare server la actualizarea avatarului.' });
  	  }
  	}
  );

  // DELETE /me (Ștergere cont)
  router.delete('/me', verifyToken, async (req, res) => {
  	const userId = req.user.userId;
  	console.log(`[DELETE ACCOUNT] Utilizatorul ${userId} a inițiat ștergerea contului.`);
  	try {
  	  const deleteResult = await pool.query("DELETE FROM users WHERE id = $1 RETURNING email", [userId]);
  	  if (deleteResult.rowCount === 0) {
  	  	return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
  	  }
  	  console.log(`[DELETE SUCCESS] Utilizatorul ${deleteResult.rows[0].email} (ID: ${userId}) a fost șters.`);
  	  res.status(200).json({ message: 'Contul tău a fost șters cu succes.' });
  	} catch (err) {
  	  console.error(`Eroare la ștergerea contului pentru user ${userId}:`, err);
  	  res.status(500).json({ error: 'Eroare server la ștergerea contului.' });
  	}
  });

  // DELETE /push-token/delete (Ștergere push token)
  router.post('/push-token/delete', verifyToken, async (req, res) => {
  	const { token } = req.body;
  	const userId = req.user.userId;

  	if (!token) {
  	  return res.status(400).json({ error: 'Token lipsă.' });
  	}

  	try {
  	  const deleteResult = await pool.query(
  	  	'DELETE FROM push_tokens WHERE token = $1 AND user_id = $2',
  	  	[token, userId]
  	  );

  	  if (deleteResult.rowCount > 0) {
  	  	console.log(`[Logout] Token-ul ${token.substring(0, 15)}... a fost șters pentru user-ul ${userId}`);
  	  	res.status(200).json({ message: 'Token de-înregistrat cu succes.' });
  	  } else {
  	  	console.log(`[Logout] Token-ul ${token.substring(0, 15)}... nu a fost găsit pentru user-ul ${userId}`);
  	  	res.status(404).json({ message: 'Token-ul nu a fost găsit sau nu aparține acestui utilizator.' });
  	  }
  	  
  	} catch (error) {
  	  console.error('Eroare la ștergerea push token:', error);
  	  res.status(500).json({ error: 'Eroare server la ștergerea token-ului.' });
  	}
  });

  // Traseu: GET /api/profile/:id/badges (Badge-urile PUBLICE ale altcuiva)
router.get('/:id/badges', verifyToken, async (req, res) => {
  const { id } = req.params; // ID-ul utilizatorului pe care îl vizualizăm

  // Verificăm dacă ID-ul este un număr valid
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID utilizator invalid.' });
  }

  try {
    const query = `
      SELECT
        b.id,
        b.name,
        b.description,
        b.icon_name,
        b.key,
        ub.earned_at
      FROM
        user_badges ub
      JOIN
        badges b ON ub.badge_id = b.id
      WHERE
        ub.user_id = $1
      ORDER BY
        ub.earned_at DESC;
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Eroare la preluarea badge-urilor pentru utilizatorul ${id}:`, error);
    res.status(500).json({ error: 'Eroare server la preluarea badge-urilor.' });
  }
});

  // Ruta dinamică /:id (Profilul PUBLIC al altcuiva) - Rămâne la sfârșit
  router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params; 

    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID utilizator invalid.' });
    }

    try {
      const profileQuery = `
        SELECT
          u.id, u.display_name, u.first_name, u.last_name, u.avatar_url, u.created_at,
          (
            SELECT COALESCE(SUM(ea.awarded_hours), 0)
            FROM event_attendance ea
            WHERE ea.user_id = u.id AND ea.confirmation_status = 'attended'
          ) AS total_hours
        FROM users u
        WHERE u.id = $1;
      `;
      
      const result = await pool.query(profileQuery, [id]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'Utilizator negăsit.' });
      
      if (req.user.userId != req.params.id) { 
         checkBadgesOnProfileView(req.user.userId, pool);
      }
      res.json(result.rows[0]);

    } catch (error) {
      console.error(`Eroare preluare profil public:`, error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });
  
  return router;
};