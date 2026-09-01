/**
 * ============================================================================
 * OSACE - Google Drive OAuth 2.0 Setup Script (One-Time Execution)
 * ============================================================================
 * 
 * Acest script te ajuta sa obtii Refresh Token-ul permanent pentru contul
 * Google Drive (developers@osace.ro) fara a fi nevoie de un flow complex.
 * 
 * Cum se foloseste:
 *   node scripts/google-drive-setup.js
 * 
 * Scriptul va genera un link de autorizare Google, va deschide un server temporar
 * local pe portul 3000 pentru a captura codul de redirectionare si va afisa
 * direct variabilele gata configurate pentru fisierul tau .env!
 */

require('dotenv').config();
const http = require('http');
const url = require('url');
const readline = require('readline');
const { google } = require('googleapis');

// Valori preluate din .env
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
];

async function runSetup() {
  console.log('\n=============================================================');
  console.log('       O.S.A.C.E. - Google Drive OAuth Setup Wizard');
  console.log('=============================================================\n');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ EROARE: GOOGLE_DRIVE_CLIENT_ID sau GOOGLE_DRIVE_CLIENT_SECRET lipsesc!');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',     // OBLIGATORIU pentru a primi refresh_token
    prompt: 'consent',          // OBLIGATORIU pentru a forta Google sa returneze un refresh_token nou
    scope: SCOPES,
  });

  console.log('📌 PASUL 1: Deschide urmatorul link in browser conectat pe contul developers@osace.ro:');
  console.log('----------------------------------------------------------------------------------');
  console.log(authUrl);
  console.log('----------------------------------------------------------------------------------\n');

  console.log('📌 PASUL 2: Se asteapta autorizarea...');
  console.log('   (Serverul temporar asculta la: ' + REDIRECT_URI + ')');
  console.log('   Daca browserul nu face redirect automat, poti copia codul din URL si sa-l introduci mai jos.\n');

  let server;
  let isResolved = false;

  const handleAuthCode = async (code) => {
    if (isResolved) return;
    isResolved = true;

    try {
      console.log('\n🔄 Se face schimbul de token-uri cu Google API...');
      const { tokens } = await oauth2Client.getToken(code);

      console.log('\n=============================================================');
      console.log('✅ AUTORIZARE REUSITA CU SUCCES!');
      console.log('=============================================================\n');

      if (!tokens.refresh_token) {
        console.warn('⚠️ ATENTIE: Google nu a returnat un nou refresh_token (posibil a fost emis anterior).');
        console.warn('Daca nu il ai deja salvat, sterge permisiunile aplicatiei din Google Account Security si ruleaza din nou.');
      }

      console.log('Adauga urmatoarele linii in fisierul .env (pe local si pe VPS):\n');
      console.log('-------------------------------------------------------------');
      console.log('GOOGLE_DRIVE_ENABLED=true');
      console.log(`GOOGLE_DRIVE_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_DRIVE_REDIRECT_URI=${REDIRECT_URI}`);
      console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${ROOT_FOLDER_ID}`);
      if (tokens.refresh_token) {
        console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
      }
      console.log('GOOGLE_DRIVE_MAX_UPLOAD_MB=50');
      console.log('-------------------------------------------------------------\n');

      if (server) {
        server.close();
      }
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Eroare la obtinerea token-urilor:', err.message);
      if (err.response && err.response.data) {
        console.error('Detalii Google:', JSON.stringify(err.response.data, null, 2));
      }
      if (server) {
        server.close();
      }
      process.exit(1);
    }
  };

  // 1. Pornire server HTTP temporar pe portul 3000
  try {
    const parsedRedirect = url.parse(REDIRECT_URI);
    const port = parsedRedirect.port || 3000;
    const pathname = parsedRedirect.pathname || '/api/auth/google/callback';

    server = http.createServer(async (req, res) => {
      const reqUrl = url.parse(req.url, true);
      if (reqUrl.pathname === pathname) {
        const code = reqUrl.query.code;
        const error = reqUrl.query.error;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>Eroare la autorizare: ' + error + '</h1><p>Poti inchide aceasta fereastra.</p>');
          console.error('❌ Autorizare refuzata de utilizator:', error);
          server.close();
          process.exit(1);
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
                <h1 style="color: #22c55e;">✅ Autorizare Google Drive reusita!</h1>
                <p>Token-ul a fost generat in terminal. Poti inchide acest tab.</p>
              </body>
            </html>
          `);
          await handleAuthCode(code);
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      // Server listening
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`ℹ️ Portul ${port} este deja folosit de un alt proces (ex: serverul API principal).`);
        console.log('   Nicio problema! Dupa autorizare, copiaza parametrul ?code=... din URL si introdu-l mai jos.\n');
      }
    });
  } catch (e) {
    // Fallback CLI
  }

  // 2. Fallback CLI readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Introdu codul de autorizare manual (daca nu s-a redirectionat automat): ', async (manualCode) => {
    rl.close();
    if (manualCode && manualCode.trim()) {
      let cleanCode = manualCode.trim();
      if (cleanCode.includes('code=')) {
        const match = cleanCode.match(/code=([^&]+)/);
        if (match) cleanCode = decodeURIComponent(match[1]);
      }
      await handleAuthCode(cleanCode);
    }
  });
}

runSetup();
