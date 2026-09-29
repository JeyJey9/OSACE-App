// src/scripts/checkoutWorker.js

const runAutoFinalize = async (pool) => {
  try {
    // Identificăm prezențele cu status 'checked_in' pentru evenimente care s-au încheiat (end_time <= NOW())
    const queryFind = `
      SELECT ea.user_id, ea.event_id, ea.check_in_time, ea.awarded_hours, e.start_time, e.end_time, e.duration_hours
      FROM event_attendance ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.confirmation_status = 'checked_in'
        AND e.end_time <= NOW()
    `;
    const pendingFinalizations = await pool.query(queryFind);

    if (pendingFinalizations.rowCount === 0) {
      return;
    }

    console.log(`[Event-Finalizer] S-au găsit ${pendingFinalizations.rowCount} prezențe de finalizat pentru evenimente încheiate.`);

    for (const row of pendingFinalizations.rows) {
      const { user_id, event_id, check_in_time, awarded_hours, start_time, end_time, duration_hours } = row;
      const fullDuration = parseFloat(duration_hours) || 2.0;

      let finalHours = awarded_hours !== null ? parseFloat(awarded_hours) : null;

      // Dacă cumva awarded_hours era null (ex: date mai vechi), calculăm pe baza orei de check-in
      if (finalHours === null) {
        if (check_in_time) {
          const checkIn = new Date(check_in_time);
          const eventStart = new Date(start_time);
          const eventEnd = new Date(end_time);
          const minutesLate = Math.round((checkIn.getTime() - eventStart.getTime()) / (1000 * 60));

          if (minutesLate <= 15) {
            finalHours = fullDuration;
          } else {
            const remainingMs = Math.max(0, eventEnd.getTime() - checkIn.getTime());
            const remainingHours = remainingMs / (1000 * 60 * 60);
            if (remainingHours <= 0.5) {
              finalHours = 0;
            } else {
              finalHours = Math.min(fullDuration, Math.max(0.25, Math.round(remainingHours * 4) / 4));
            }
          }
        } else {
          finalHours = fullDuration;
        }
      }

      await pool.query(
        `UPDATE event_attendance
         SET confirmation_status = 'attended',
             awarded_hours = $1,
             check_out_time = COALESCE(check_out_time, $2),
             confirmed_at = COALESCE(confirmed_at, $2),
             checkout_method = 'auto_finalize'
         WHERE user_id = $3 AND event_id = $4`,
        [finalHours, end_time, user_id, event_id]
      );

      console.log(`[Event-Finalizer] Finalizat user ${user_id} la event ${event_id}: status 'attended', ${finalHours} ore.`);
    }

  } catch (err) {
    console.error('[Event-Finalizer] Eroare:', err);
  }
};

const startCheckoutWorker = (pool) => {
  // Rulăm la pornire, apoi la fiecare 5 minute
  runAutoFinalize(pool);
  setInterval(() => runAutoFinalize(pool), 5 * 60 * 1000);
};

module.exports = { startCheckoutWorker };