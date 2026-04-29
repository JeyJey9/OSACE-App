const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
// ▼▼▼ NOU: Importăm 'crypto' pentru a genera token-uri sigure ▼▼▼
const crypto = require('crypto');

module.exports = (pool, mailTransporter) => {

  // --- Ruta de Înregistrare (neschimbată) ---
router.post('/register', async (req, res) => {
    // Extragem noile câmpuri
    const { display_name, first_name, last_name, email, password } = req.body;
    if (!display_name || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 8 caractere.' });
    }
    try {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Acest email este deja înregistrat.' });
      }
      const passwordHash = await argon2.hash(password);
      
      // Inserăm noile coloane
      const newUser = await pool.query(
        'INSERT INTO users (display_name, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, display_name, first_name, last_name, email, role, created_at, avatar_url',
        [display_name, first_name, last_name, email, passwordHash]
      );
      const user = newUser.rows[0];
      
      // Punem display_name în token
      const token = jwt.sign(
        { userId: user.id, role: user.role, displayName: user.display_name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      try {
        await mailTransporter.sendMail({
          from: `"O.S.A.C.E." <contact@osace.ro>`, 
          to: user.email,
          subject: 'Bun venit în O.S.A.C.E.!',
          // Folosim first_name pentru salut
          html: `<h1>Salut ${user.first_name},</h1><p>Îți mulțumim că ți-ai creat cont în aplicația O.S.A.C.E.!</p>`
        });
        console.log(`Email de bun venit trimis către ${user.email}`);
      } catch (emailError) {
        console.error(`Eroare la trimiterea email-ului:`, emailError);
      }
      res.status(201).json({ user, token });
    } catch (err) {
      console.error('Eroare la înregistrare:', err);
      res.status(500).json({ error: 'Eroare server la înregistrare.' });
    }
  });

  // --- Ruta de Autentificare (neschimbată) ---
  router.post('/login', async (req, res) => {
    // ... (codul tău existent pentru autentificare)
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email-ul și parola sunt obligatorii.' });
    }
    try {
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Acreditări invalide.' });
      }
      const user = userResult.rows[0];
      const validPassword = await argon2.verify(user.password_hash, password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Acreditări invalide.' });
      }
const token = jwt.sign(
        { userId: user.id, role: user.role, displayName: user.display_name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.json({
        user: {
          id: user.id,
          display_name: user.display_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          avatar_url: user.avatar_url,
        },
        token
      });
    } catch (err) {
      console.error('Eroare la autentificare:', err);
      res.status(500).json({ error: 'Eroare server la autentificare.' });
    }
  });


  // ▼▼▼ NOU: Ruta pentru a cere resetarea parolei (Pasul 1) ▼▼▼
  router.post('/request-reset', async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email-ul este obligatoriu.' });
    }

    try {
      // 1. Găsim utilizatorul
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userResult.rows.length === 0) {
        // NU vrem să spunem dacă email-ul există sau nu.
        // Trimitem un răspuns de succes fals pentru securitate.
        return res.status(200).json({ message: 'Dacă email-ul există, un cod a fost trimis.' });
      }
      const user = userResult.rows[0];

      // 2. Generăm un cod de 6 cifre
      const resetToken = crypto.randomInt(100000, 999999).toString();
      // Setăm expirarea la 10 minute de acum
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minute

      // 3. Salvăm codul și data expirării în baza de date
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [resetToken, expires, user.id]
      );

      // 4. Trimitem email-ul prin Brevo
      try {
        await mailTransporter.sendMail({
          from: `"O.S.A.C.E." <osace2001@gmail.com>`, // Asigură-te că acest email e valid/permis în Brevo
          to: user.email,
          subject: 'Resetarea Parolei OSACE',
          html: `
            <h1>Salut ${user.first_name},</h1>
            <p>Am primit o cerere de resetare a parolei pentru contul tău.</p>
            <p>Folosește codul de mai jos pentru a-ți seta o parolă nouă. Codul este valabil 10 minute:</p>
            <h2 style="font-size: 28px; letter-spacing: 5px; text-align: center;">
              ${resetToken}
            </h2>
            <p>Dacă nu ai cerut tu asta, poți ignora acest email.</p>
          `
        });
        console.log(`Email de resetare trimis către ${user.email}`);
      } catch (emailError) {
        console.error(`Eroare la trimiterea email-ului de resetare către ${user.email}:`, emailError);
        // Chiar dacă email-ul eșuează, nu informăm utilizatorul (din motive de securitate)
      }

      // 5. Trimitem răspunsul de succes
      res.status(200).json({ message: 'Dacă email-ul există, un cod a fost trimis.' });

    } catch (err) {
      console.error('Eroare la cererea de resetare a parolei:', err);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });
  // ▲▲▲ SFÂRȘIT BLOC NOU ▲▲▲

  router.post('/perform-reset', async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Parola nouă trebuie să aibă cel puțin 8 caractere.' });
  }

  try {
    // 1. Găsim utilizatorul DUPĂ email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Codul sau emailul este invalid.' });
    }
    const user = userResult.rows[0];

    // 2. Verificăm dacă token-ul este corect ȘI dacă nu a expirat
    if (user.reset_token !== token || new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Codul este invalid sau a expirat.' });
    }

    // 3. Totul este valid. Hash-uim noua parolă
    const newPasswordHash = await argon2.hash(newPassword);

    // 4. Actualizăm parola și ștergem token-ul de resetare (foarte important!)
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [newPasswordHash, user.id]
    );

    // 5. Trimitem un răspuns de succes
    res.status(200).json({ message: 'Parola a fost resetată cu succes!' });

  } catch (err) {
    console.error('Eroare la efectuarea resetării parolei:', err);
    res.status(500).json({ error: 'Eroare server.' });
  }
});

  return router;
};