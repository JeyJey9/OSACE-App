/**
 * Academic Year Utility
 * 
 * An "academic year" runs from September 1 to August 31.
 * Example: Academic Year 2025-2026 = Sept 1, 2025 00:00:00 → Sept 1, 2026 00:00:00
 * 
 * We use the start year as the identifier, so "2025" means the 2025-2026 year.
 */

/**
 * Get the academic year boundaries for a given start year.
 * @param {number} startYear - The year September falls in (e.g., 2025 for 2025-2026)
 * @returns {{ start: string, end: string, label: string }}
 */
function getAcademicYear(startYear) {
  return {
    start: `${startYear}-09-01`,
    end: `${startYear + 1}-09-01`, // exclusive upper bound for < comparison
    label: `${startYear}-${startYear + 1}`,
  };
}

/**
 * Get the current academic year based on today's date.
 * If today is Jan-Aug, we're still in the previous September's year.
 * If today is Sep-Dec, we're in this September's year.
 * @returns {{ start: string, end: string, label: string, startYear: number }}
 */
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();

  // Sept-Dec → this year is the start year
  // Jan-Aug  → last year is the start year
  const startYear = month >= 9 ? year : year - 1;

  return {
    ...getAcademicYear(startYear),
    startYear,
  };
}

/**
 * Parse a year query parameter into academic year boundaries.
 * If the param is missing or 'all', returns null (meaning no filter / all-time).
 * @param {string|undefined} yearParam - The ?year= query parameter
 * @returns {{ start: string, end: string, label: string } | null}
 */
function parseYearParam(yearParam) {
  if (!yearParam || yearParam === 'all') return null;
  const startYear = parseInt(yearParam, 10);
  if (isNaN(startYear)) return null;
  return getAcademicYear(startYear);
}

module.exports = {
  getAcademicYear,
  getCurrentAcademicYear,
  parseYearParam,
};
