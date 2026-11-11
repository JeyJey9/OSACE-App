// src/services/instagramTokenService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Asigură existența tabelei app_settings și sincronizează token-ul inițial din .env dacă este necesar.
 */
async function initInstagramToken(pool) {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const envToken = (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    const res = await pool.query("SELECT value, updated_at FROM app_settings WHERE key = 'instagram_access_token'");

    if (res.rowCount === 0) {
      if (envToken) {
        await pool.query(
          "INSERT INTO app_settings (key, value, updated_at) VALUES ('instagram_access_token', $1, NOW())",
          [envToken]
        );
        console.log('[IG Token] Token Instagram inițializat în baza de date din .env.');
      }
    } else {
      const dbToken = (res.rows[0].value || '').trim();
      // Dacă în .env există un token diferit de cel din DB (de ex. adminul a pus manual un token nou în .env), actualizăm DB-ul
      if (envToken && envToken !== dbToken) {
        await pool.query(
          "UPDATE app_settings SET value = $1, updated_at = NOW() WHERE key = 'instagram_access_token'",
          [envToken]
        );
        console.log('[IG Token] Token Instagram actualizat în baza de date cu noua valoare din .env.');
      } else if (dbToken) {
        // Asigurăm că memoria procesului are cel mai recent token
        process.env.INSTAGRAM_ACCESS_TOKEN = dbToken;
      }
    }
  } catch (err) {
    console.error('[IG Token] Eroare la inițializarea token-ului în DB:', err.message);
  }
}

/**
 * Returnează token-ul de Instagram curent (preferă valoarea din DB, fallback la process.env).
 */
async function getInstagramAccessToken(pool) {
  if (pool) {
    try {
      const res = await pool.query("SELECT value FROM app_settings WHERE key = 'instagram_access_token'");
      if (res.rowCount > 0 && res.rows[0].value) {
        return res.rows[0].value.trim();
      }
    } catch (_) {}
  }
  return (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
}

/**
 * Obține starea actuală a token-ului (câte zile au trecut, când urmează reînnoirea).
 */
async function getInstagramTokenStatus(pool) {
  try {
    let currentToken = '';
    let updatedAt = null;

    if (pool) {
      const res = await pool.query("SELECT value, updated_at FROM app_settings WHERE key = 'instagram_access_token'");
      if (res.rowCount > 0) {
        currentToken = res.rows[0].value.trim();
        updatedAt = res.rows[0].updated_at;
      }
    }
    if (!currentToken) {
      currentToken = (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    }

    if (!currentToken) {
      return { configured: false, message: 'Niciun token Instagram configurat.' };
    }

    const now = Date.now();
    const updatedTime = updatedAt ? new Date(updatedAt).getTime() : now;
    const daysSinceLastUpdate = Math.max(0, (now - updatedTime) / (1000 * 60 * 60 * 24));
    const tokenPreview = currentToken.length > 15
      ? `${currentToken.substring(0, 10)}...${currentToken.substring(currentToken.length - 5)}`
      : '***';

    return {
      configured: true,
      tokenPreview,
      lastUpdated: updatedAt || new Date(updatedTime).toISOString(),
      daysSinceLastUpdate: parseFloat(daysSinceLastUpdate.toFixed(1)),
      nextAutoRefreshInDays: Math.max(0, parseFloat((25 - daysSinceLastUpdate).toFixed(1))),
      estimatedExpiresInDays: Math.max(0, parseFloat((60 - daysSinceLastUpdate).toFixed(1)))
    };
  } catch (err) {
    return { configured: false, error: err.message };
  }
}

/**
 * Reînnoiește token-ul de Instagram apelând endpoint-ul oficial Meta:
 * GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={token}
 *
 * @param {object} pool - Instanța de PostgreSQL pool
 * @param {object} options
 * @param {boolean} options.force - Dacă este true, forțează reînnoirea chiar dacă nu au trecut 25 de zile (dar cel puțin 24h)
 */
async function refreshInstagramToken(pool, { force = false } = {}) {
  try {
    let currentToken = '';
    let updatedAt = null;

    if (pool) {
      const res = await pool.query("SELECT value, updated_at FROM app_settings WHERE key = 'instagram_access_token'");
      if (res.rowCount > 0) {
        currentToken = (res.rows[0].value || '').trim();
        updatedAt = res.rows[0].updated_at;
      }
    }
    if (!currentToken) {
      currentToken = (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    }

    if (!currentToken) {
      console.warn('[IG Token Refresh] Niciun token configurat pentru reînnoire.');
      return { success: false, message: 'Niciun token configurat.' };
    }

    const now = Date.now();
    const updatedTime = updatedAt ? new Date(updatedAt).getTime() : now;
    const daysSinceRefresh = (now - updatedTime) / (1000 * 60 * 60 * 24);

    // Meta permite reînnoirea doar dacă token-ul este de cel puțin 24 de ore
    if (daysSinceRefresh < 1) {
      const hoursAgo = Math.max(0.1, daysSinceRefresh * 24).toFixed(1);
      console.log(`[IG Token Refresh] Token-ul este foarte recent (actualizat acum ${hoursAgo} ore). Meta permite refresh doar după 24 ore.`);
      return {
        success: true,
        refreshed: false,
        daysSinceRefresh: parseFloat(daysSinceRefresh.toFixed(2)),
        message: 'Token-ul a fost generat recent (<24 ore). Meta permite prelungirea doar după 24h.'
      };
    }

    // Reînnoim la fiecare ~25-30 de zile (Meta oferă 60 de zile valabilitate)
    if (!force && daysSinceRefresh < 25) {
      const daysLeft = (25 - daysSinceRefresh).toFixed(1);
      console.log(`[IG Token Refresh] Token-ul este valid (actualizat acum ${daysSinceRefresh.toFixed(1)} zile). Următoarea reînnoire în ~${daysLeft} zile.`);
      return {
        success: true,
        refreshed: false,
        daysSinceRefresh: parseFloat(daysSinceRefresh.toFixed(1)),
        message: `Token valid. Reînnoirea automată va fi declanșată peste ~${daysLeft} zile.`
      };
    }

    console.log(`[IG Token Refresh] Se solicită prelungirea token-ului la Meta Graph API (vârstă: ${daysSinceRefresh.toFixed(1)} zile)...`);

    const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: currentToken
      },
      timeout: 15000
    });

    if (response.data && response.data.access_token) {
      const newToken = response.data.access_token;
      const expiresInSec = response.data.expires_in || 5184000;
      const expiresInDays = Math.round(expiresInSec / 86400);

      // 1. Salvăm în baza de date
      if (pool) {
        await pool.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ('instagram_access_token', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
          [newToken]
        );
      }

      // 2. Actualizăm în memoria procesului curent
      process.env.INSTAGRAM_ACCESS_TOKEN = newToken;

      // 3. Actualizăm fișierul .env de pe disc (dacă este accesibil)
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('INSTAGRAM_ACCESS_TOKEN=')) {
            envContent = envContent.replace(/INSTAGRAM_ACCESS_TOKEN=.*/g, `INSTAGRAM_ACCESS_TOKEN=${newToken}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('[IG Token Refresh] Fișierul .env a fost sincronizat cu noul token.');
          }
        }
      } catch (fsErr) {
        console.warn('[IG Token Refresh] Fișierul .env nu a putut fi actualizat pe disc:', fsErr.message);
      }

      console.log(`[IG Token Refresh] Succes! Token-ul Instagram a fost prelungit cu încă ~${expiresInDays} zile.`);
      return {
        success: true,
        refreshed: true,
        expiresInDays,
        message: `Token Instagram reînnoit cu succes pentru încă ${expiresInDays} zile.`
      };
    } else {
      throw new Error('Răspunsul primit de la Meta nu conține un token nou.');
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error('[IG Token Refresh] Eroare la prelungirea token-ului:', errorMsg);
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Inițializează și pornește worker-ul de background pentru auto-refresh Instagram.
 * Verifică o dată la 12 ore și reînnoiește automat token-ul dacă a depășit 25 de zile.
 */
function startInstagramTokenWorker(pool) {
  initInstagramToken(pool).then(() => {
    // Verificare inițială la pornire
    refreshInstagramToken(pool).catch((err) => {
      console.warn('[IG Token] Eroare la verificarea inițială:', err.message);
    });
  });

  // Verificare periodică la fiecare 12 ore
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setInterval(() => {
    refreshInstagramToken(pool).catch((err) => {
      console.warn('[IG Token] Eroare la verificarea periodică:', err.message);
    });
  }, TWELVE_HOURS);

  console.log('[IG Token] Worker-ul de auto-refresh Instagram a pornit (verificare la 12h, refresh automat la ~25-30 zile).');
}

module.exports = {
  initInstagramToken,
  getInstagramAccessToken,
  getInstagramTokenStatus,
  refreshInstagramToken,
  startInstagramTokenWorker
};
