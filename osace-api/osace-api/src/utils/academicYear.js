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

const ROMANIAN_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

function formatYmd(year, month1Indexed, day = 1) {
  const m = String(month1Indexed).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Parse year + optional month query parameters into date boundaries.
 * - year='all' and (no month or month='all') => null (all-time)
 * - month=1..12 => single month bounds inside the chosen (or current) academic year
 *   Note: Months 9..12 belong to startYear; months 1..8 belong to startYear + 1.
 */
function parsePeriodParams(yearParam, monthParam) {
  const hasMonth = monthParam !== undefined && monthParam !== null && monthParam !== '' && monthParam !== 'all';
  if (yearParam === 'all' && !hasMonth) {
    return null;
  }

  let startYear = yearParam && yearParam !== 'all' ? parseInt(yearParam, 10) : NaN;
  if (isNaN(startYear)) {
    startYear = getCurrentAcademicYear().startYear;
  }

  if (hasMonth) {
    const monthNum = parseInt(monthParam, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      const calYear = monthNum >= 9 ? startYear : startYear + 1;
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? calYear + 1 : calYear;
      return {
        start: formatYmd(calYear, monthNum, 1),
        end: formatYmd(nextYear, nextMonth, 1),
        month: monthNum,
        year: calYear,
        label: `${ROMANIAN_MONTHS[monthNum - 1]} ${calYear}`,
      };
    }
  }

  return getAcademicYear(startYear);
}

/**
 * Returns bounds and Romanian label for the immediately preceding calendar month.
 */
function getPreviousMonthBounds(now = new Date()) {
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-indexed
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear = curMonth === 1 ? curYear - 1 : curYear;

  return {
    start: formatYmd(prevYear, prevMonth, 1),
    end: formatYmd(curYear, curMonth, 1),
    month: prevMonth,
    year: prevYear,
    label: `${ROMANIAN_MONTHS[prevMonth - 1]} ${prevYear}`,
  };
}

module.exports = {
  ROMANIAN_MONTHS,
  getAcademicYear,
  getCurrentAcademicYear,
  parseYearParam,
  parsePeriodParams,
  getPreviousMonthBounds,
};
