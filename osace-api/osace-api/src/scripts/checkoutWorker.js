// src/scripts/checkoutWorker.js

const runAutoCheckout = async (pool) => {
  console.log('[System] Se rulează verificarea pentru Auto-Checkout (24h grace period)...');
  try {
    // 1. Identificăm voluntarii "uituci" - cei care au scanat check-in dar NU au scanat check-out
    //    după ce au trecut 24 de ore de la finalul evenimentului
    const queryFind = `
      SELECT ea.user_id, ea.event_id, ea.check_in_time, e.end_time, e.duration_hours
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.confirmation_status = 'checked_in'
        AND e.end_time < NOW() - INTERVAL '24 hours'
    `;
    const pendingCheckouts = await pool.query(queryFind);

    if (pendingCheckouts.rowCount === 0) {
      return; // Nimic de făcut
    }

    console.log(`[Auto-Checkout] S-au găsit ${pendingCheckouts.rowCount} voluntari care nu au scanat la plecare. Procesare...`);

    // 2. Procesăm fiecare voluntar individual
    for (const row of pendingCheckouts.rows) {
      const { user_id, event_id, check_in_time, end_time, duration_hours } = row;

      // Calculăm orele pe care ar fi trebuit să le primească (de la check-in până la finalul programat)
      const checkIn = new Date(check_in_time);
      const eventEnd = new Date(end_time);
      const expectedDiffMs = Math.max(0, eventEnd - checkIn);
      const requestedHours = Math.max(0.1, (expectedDiffMs / (1000 * 60 * 60))).toFixed(2);

      // A. Marcăm voluntarul ca ABSENT (nu ca "attended")
      //    Orele sunt 0 deoarece nu și-a confirmat prezența completă
      //    check_out_time = end_time pentru a închide pontajul corect
      await pool.query(
        `UPDATE event_attendance
         SET confirmation_status = 'absent',
             check_out_time = $1,
             checkout_method = 'auto',
             awarded_hours = 0,
             confirmed_at = $1
         WHERE user_id = $2 AND event_id = $3`,
        [end_time, user_id, event_id]
      );

      // B. Creăm cererea de revizuire în hour_requests pentru coordonatori
      //    Coordonatorul poate decide să aprobe orele parțiale dacă voluntarul a participat
      await pool.query(
        `INSERT INTO hour_requests (user_id, event_id, request_type, requested_hours)
         VALUES ($1, $2, 'forgot_checkout', $3)
         ON CONFLICT DO NOTHING`,
        [user_id, event_id, requestedHours]
      );

      console.log(`[Auto-Checkout] User ${user_id} la event ${event_id}: marcat ABSENT, cerere ${requestedHours}h creată.`);
    }
    
    console.log(`[Auto-Checkout] Procesare finalizată. ${pendingCheckouts.rowCount} utilizatori procesați.`);

  } catch (err) {
    console.error('[Auto-Checkout] Eroare:', err);
  }
};

const startCheckoutWorker = (pool) => {
  // Rulăm imediat la pornire, apoi la fiecare 30 de minute
  runAutoCheckout(pool);
  setInterval(() => runAutoCheckout(pool), 30 * 60 * 1000);
};

module.exports = { startCheckoutWorker };