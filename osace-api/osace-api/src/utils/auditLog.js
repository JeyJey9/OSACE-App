/**
 * auditLog.js — Reusable helper to write to the audit_logs table.
 *
 * @param {object} pool       - pg Pool instance
 * @param {number} actorId    - ID of the user performing the action
 * @param {string} action     - Action label e.g. 'EVENT_CREATE'
 * @param {string} targetType - Entity type e.g. 'event', 'user', 'post'
 * @param {number|null} targetId - ID of the affected row (null if N/A)
 * @param {object} details    - Free-form object with extra context
 */
async function logAction(pool, actorId, action, targetType = null, targetId = null, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorId, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    // Never let a logging failure crash the main request
    console.error('[AuditLog] Failed to write log entry:', err.message);
  }
}

module.exports = { logAction };
