const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
// ▼▼▼ NOU: Importăm 'crypto' pentru a genera token-uri sigure ▼▼▼
const crypto = require('crypto');
const { authLimiter } = require('../../middleware/rateLimiter');
const { validateRegistrationEmail } = require('../../utils/emailValidator');

module.exports = (pool, mailTransporter) => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. POST /api/auth/register-request (Pasul 1: Inițiere înregistrare & trimitere cod)
  // ─────────────────────────────────────────────────────────────────────────────
  router.post('/register-request', authLimiter, async (req, res) => {
    const { display_name, first_name, last_name, email, password } = req.body;
    if (!display_name || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }

    const trimmedName = display_name.trim().substring(0, 50);
    const trimmedFirst = first_name.trim().substring(0, 50);
    const trimmedLast = last_name.trim().substring(0, 50);
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedFirst || !trimmedLast) {
      return res.status(400).json({ error: 'Numele nu poate fi gol.' });
    }
    if (trimmedName.length < 3) {
      return res.status(400).json({ error: 'Numele de utilizator trebuie să aibă cel puțin 3 caractere.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 8 caractere.' });
    }

    // Validare email & blocare servicii temporare (temp-mail, .su etc.)
    const emailValidation = validateRegistrationEmail(normalizedEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    try {
      // 1. Verificăm dacă email-ul există deja în tabela principală users
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Acest email este deja înregistrat.' });
      }

      // 2. Verificăm cooldown de retrimitere pe cererile existente
      const existingPending = await pool.query(
        'SELECT last_sent_at FROM pending_registrations WHERE email = $1',
        [normalizedEmail]
      );
      if (existingPending.rows.length > 0) {
        const lastSent = new Date(existingPending.rows[0].last_sent_at).getTime();
        const diffMs = Date.now() - lastSent;
        if (diffMs < 60 * 1000) {
          const waitSec = Math.ceil((60 * 1000 - diffMs) / 1000);
          return res.status(429).json({
            error: `Te rugăm să aștepți ${waitSec} secunde înainte de a solicita un nou cod.`,
            retryAfter: waitSec
          });
        }
      }

      // 3. Curățare oportunistă cereri expirate vechi (> 1 zi)
      pool.query("DELETE FROM pending_registrations WHERE expires_at < NOW() - INTERVAL '1 day'").catch(() => {});

      // 4. Hash-uim parola
      const passwordHash = await argon2.hash(password);

      // 5. Generăm codul de 6 cifre și hash-ul său SHA-256
      const verificationCode = crypto.randomInt(100000, 999999).toString();
      const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minute

      // 6. Inserăm sau actualizăm în pending_registrations
      await pool.query(
        `INSERT INTO pending_registrations (
          email, display_name, first_name, last_name, password_hash, code_hash, expires_at, attempts, last_sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW())
        ON CONFLICT (email) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          password_hash = EXCLUDED.password_hash,
          code_hash = EXCLUDED.code_hash,
          expires_at = EXCLUDED.expires_at,
          attempts = 0,
          last_sent_at = NOW()`,
        [normalizedEmail, trimmedName, trimmedFirst, trimmedLast, passwordHash, hashedCode, expiresAt]
      );

      // 7. Trimitem email-ul cu codul prin Brevo SMTP
      try {
        await mailTransporter.sendMail({
          from: `"O.S.A.C.E." <contact@osace.ro>`,
          to: normalizedEmail,
          subject: 'Codul tău de verificare OSACE',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #1566B9; font-size: 24px; margin-bottom: 8px;">Bun venit în O.S.A.C.E.!</h1>
                <p style="color: #64748b; font-size: 15px; margin: 0;">Organizația Studenților din Administrație și Conducere</p>
              </div>
              <div style="background-color: #ffffff; padding: 24px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Salut <strong>${trimmedFirst}</strong>,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.5;">
                  Pentru a-ți activa contul și a confirma adresa de email, introdu codul de verificare de mai jos în aplicație:
                </p>
                <div style="background: #f0f7ff; border: 2px dashed #1566B9; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0;">
                  <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1566B9;">${verificationCode}</span>
                </div>
                <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                  ⏱️ Codul este valabil timp de <strong>15 minute</strong>.
                </p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
                Dacă nu ai solicitat crearea unui cont în aplicația OSACE, poți ignora în siguranță acest email.
              </p>
            </div>
          `
        });
        console.log(`[Register] Cod de verificare trimis către ${normalizedEmail}`);
      } catch (emailError) {
        console.error(`[Register] Eroare la trimiterea email-ului de verificare către ${normalizedEmail}:`, emailError);
      }

      res.status(200).json({
        message: 'Codul de verificare a fost trimis pe email.',
        email: normalizedEmail
      });

    } catch (err) {
      console.error('[Register] Eroare la inițierea înregistrării:', err);
      res.status(500).json({ error: 'Eroare server la inițierea înregistrării.' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. POST /api/auth/register-verify (Pasul 2: Verificare cod & creare cont activ)
  // ─────────────────────────────────────────────────────────────────────────────
  router.post('/register-verify', authLimiter, async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email-ul și codul sunt obligatorii.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    try {
      // 1. Căutăm cererea în pending_registrations
      const pendingRes = await pool.query(
        'SELECT * FROM pending_registrations WHERE email = $1',
        [normalizedEmail]
      );

      if (pendingRes.rows.length === 0) {
        return res.status(400).json({
          error: 'Nu a fost găsită nicio cerere de înregistrare activă pentru acest email sau contul a fost deja verificat.'
        });
      }

      const pending = pendingRes.rows[0];

      // 2. Verificăm numărul de încercări eșuate (anti brute-force)
      if (pending.attempts >= 5) {
        return res.status(400).json({
          error: 'Ai depășit numărul maxim de încercări permise (5). Te rugăm să soliciți un nou cod.'
        });
      }

      // 3. Verificăm expirarea codului
      if (new Date() > new Date(pending.expires_at)) {
        return res.status(400).json({
          error: 'Codul de verificare a expirat. Te rugăm să soliciți altul.'
        });
      }

      // 4. Verificăm hash-ul codului
      const hashedInput = crypto.createHash('sha256').update(cleanCode).digest('hex');
      if (hashedInput !== pending.code_hash) {
        await pool.query(
          'UPDATE pending_registrations SET attempts = attempts + 1 WHERE email = $1',
          [normalizedEmail]
        );
        const remainingAttempts = 5 - (pending.attempts + 1);
        return res.status(400).json({
          error: `Codul introdus este incorect.${remainingAttempts > 0 ? ` Mai ai ${remainingAttempts} încercări.` : ' Solicită un cod nou.'}`
        });
      }

      // 5. Verificăm dacă email-ul a fost cumva înregistrat între timp în users
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (emailCheck.rows.length > 0) {
        await pool.query('DELETE FROM pending_registrations WHERE email = $1', [normalizedEmail]);
        return res.status(409).json({ error: 'Acest email este deja înregistrat.' });
      }

      // 6. Inserăm utilizatorul definitiv în users
      const newUser = await pool.query(
        `INSERT INTO users (
          display_name, first_name, last_name, email, password_hash, role, student_verification_status
        ) VALUES ($1, $2, $3, $4, $5, 'user', 'unverified')
        RETURNING id, display_name, first_name, last_name, email, role, created_at, avatar_url`,
        [pending.display_name, pending.first_name, pending.last_name, pending.email, pending.password_hash]
      );
      const user = newUser.rows[0];

      // 7. Ștergem cererea temporară din pending_registrations
      await pool.query('DELETE FROM pending_registrations WHERE email = $1', [normalizedEmail]);

      // 8. Generăm JWT token pentru autentificare directă
      const token = jwt.sign(
        { userId: user.id, role: user.role, displayName: user.display_name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // 9. Trimitem email-ul de bun venit (asincron / non-blocant)
      mailTransporter.sendMail({
        from: `"O.S.A.C.E." <contact@osace.ro>`,
        to: user.email,
        subject: 'Bun venit în O.S.A.C.E.!',
        html: `<h1>Salut ${user.first_name},</h1><p>Contul tău a fost creat și verificat cu succes! Bun venit în comunitatea O.S.A.C.E.!</p>`
      }).catch(err => console.error('[Register] Eroare email bun venit:', err));

      console.log(`[Register] Cont creat și verificat cu succes pentru: ${user.email}`);
      res.status(201).json({
        message: 'Cont creat și verificat cu succes!',
        user,
        token
      });

    } catch (err) {
      console.error('[Register] Eroare la verificarea codului de înregistrare:', err);
      res.status(500).json({ error: 'Eroare server la verificarea codului.' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. POST /api/auth/register-resend (Retrimitere cod nou de verificare)
  // ─────────────────────────────────────────────────────────────────────────────
  router.post('/register-resend', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresa de email este obligatorie.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const pendingRes = await pool.query(
        'SELECT * FROM pending_registrations WHERE email = $1',
        [normalizedEmail]
      );

      if (pendingRes.rows.length === 0) {
        return res.status(400).json({
          error: 'Nu există nicio cerere de înregistrare în așteptare pentru acest email.'
        });
      }

      const pending = pendingRes.rows[0];

      // Verificare cooldown de 60 de secunde
      const lastSent = new Date(pending.last_sent_at).getTime();
      const diffMs = Date.now() - lastSent;
      if (diffMs < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - diffMs) / 1000);
        return res.status(429).json({
          error: `Te rugăm să aștepți ${waitSec} secunde înainte de a cere un alt cod.`,
          retryAfter: waitSec
        });
      }

      // Generare cod nou
      const newCode = crypto.randomInt(100000, 999999).toString();
      const hashedCode = crypto.createHash('sha256').update(newCode).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `UPDATE pending_registrations 
         SET code_hash = $1, expires_at = $2, attempts = 0, last_sent_at = NOW()
         WHERE email = $3`,
        [hashedCode, expiresAt, normalizedEmail]
      );

      // Trimitere email
      try {
        await mailTransporter.sendMail({
          from: `"O.S.A.C.E." <contact@osace.ro>`,
          to: normalizedEmail,
          subject: 'Noul tău cod de verificare OSACE',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1566B9; text-align: center;">Noul tău cod de verificare</h2>
              <p style="font-size: 15px; color: #475569;">Salut <strong>${pending.first_name}</strong>,</p>
              <p style="font-size: 15px; color: #475569;">Ai solicitat retrimiterea codului de verificare pentru contul tău OSACE:</p>
              <div style="background: #f0f7ff; border: 2px dashed #1566B9; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1566B9;">${newCode}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; text-align: center;">Codul este valabil 15 minute.</p>
            </div>
          `
        });
        console.log(`[Register] Noul cod a fost retrimis către ${normalizedEmail}`);
      } catch (mailErr) {
        console.error('[Register] Eroare la retrimiterea codului:', mailErr);
      }

      res.status(200).json({ message: 'Un nou cod de verificare a fost trimis pe email.' });

    } catch (err) {
      console.error('[Register] Eroare la retrimitere cod:', err);
      res.status(500).json({ error: 'Eroare server la retrimitere cod.' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. POST /api/auth/register (Păstrat temporar pentru compatibilitate Store-uri)
  // ─────────────────────────────────────────────────────────────────────────────
  router.post('/register', authLimiter, async (req, res) => {
    // Extragem câmpurile
    const { display_name, first_name, last_name, email, password } = req.body;
    if (!display_name || !first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }
    // Sanitizare input: trim + lungime maximă
    const trimmedName = display_name.trim().substring(0, 50);
    const trimmedFirst = first_name.trim().substring(0, 50);
    const trimmedLast = last_name.trim().substring(0, 50);
    const normalizedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedFirst || !trimmedLast) {
      return res.status(400).json({ error: 'Numele nu poate fi gol.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 8 caractere.' });
    }

    // Blocare domenii disposable chiar și pe ruta veche
    const emailValidation = validateRegistrationEmail(normalizedEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    try {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Acest email este deja înregistrat.' });
      }
      const passwordHash = await argon2.hash(password);
      
      const newUser = await pool.query(
        `INSERT INTO users (
          display_name, first_name, last_name, email, password_hash, role, student_verification_status
        ) VALUES ($1, $2, $3, $4, $5, 'user', 'unverified') 
        RETURNING id, display_name, first_name, last_name, email, role, created_at, avatar_url`,
        [trimmedName, trimmedFirst, trimmedLast, normalizedEmail, passwordHash]
      );
      const user = newUser.rows[0];
      
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
          html: `<h1>Salut ${user.first_name},</h1><p>Îți mulțumim că ți-ai creat cont în aplicația O.S.A.C.E.!</p>`
        });
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
  router.post('/login', authLimiter, async (req, res) => {
    // ... (codul tău existent pentru autentificare)
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email-ul și parola sunt obligatorii.' });
    }
    try {
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Acreditări invalide.' });
      }
      const user = userResult.rows[0];
      const validPassword = await argon2.verify(user.password_hash, password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Acreditări invalide.' });
      }
      // Update last seen timestamp (fire-and-forget, non-blocking)
      pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]).catch(() => {});

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
  router.post('/request-reset', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email-ul este obligatoriu.' });
    }

    try {
      // 1. Găsim utilizatorul
      const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
      if (userResult.rows.length === 0) {
        // NU vrem să spunem dacă email-ul există sau nu.
        // Trimitem un răspuns de succes fals pentru securitate.
        return res.status(200).json({ message: 'Dacă email-ul există, un cod a fost trimis.' });
      }
      const user = userResult.rows[0];

      // 2. Generăm un cod de 6 cifre
      const resetToken = crypto.randomInt(100000, 999999).toString();
      // Hash-uim tokenul înainte de stocare (apărăm împotriva dump-urilor de bază de date)
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      // Setăm expirarea la 10 minute de acum
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minute

      // 3. Salvăm hash-ul codului și data expirării în baza de date
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [hashedToken, expires, user.id]
      );

      // 4. Trimitem email-ul prin Brevo
      try {
        await mailTransporter.sendMail({
          from: `"O.S.A.C.E." <contact@osace.ro>`,
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

  router.post('/perform-reset', authLimiter, async (req, res) => {
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
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Codul sau emailul este invalid.' });
    }
    const user = userResult.rows[0];

    // 2. Verificăm dacă hash-ul token-ului este corect ȘI dacă nu a expirat
    const hashedInputToken = crypto.createHash('sha256').update(token).digest('hex');
    if (user.reset_token !== hashedInputToken || new Date() > new Date(user.reset_token_expires)) {
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