// src/constants/periodFilters.js
// Constante și utilitare partajate pentru filtrarea după an universitar și lună.

export const ACADEMIC_MONTH_OPTIONS = [
  { label: 'Toate lunile', value: 'all' },
  { label: 'Septembrie', value: 9 },
  { label: 'Octombrie', value: 10 },
  { label: 'Noiembrie', value: 11 },
  { label: 'Decembrie', value: 12 },
  { label: 'Ianuarie', value: 1 },
  { label: 'Februarie', value: 2 },
  { label: 'Martie', value: 3 },
  { label: 'Aprilie', value: 4 },
  { label: 'Mai', value: 5 },
  { label: 'Iunie', value: 6 },
  { label: 'Iulie', value: 7 },
  { label: 'August', value: 8 },
];

export function getDefaultAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 9 ? year : year - 1;
}

export function buildPeriodQuery(year, month) {
  const params = [];
  if (year !== undefined && year !== null && year !== '') {
    params.push(`year=${encodeURIComponent(year)}`);
  }
  if (month && month !== 'all' && year !== 'all') {
    params.push(`month=${encodeURIComponent(month)}`);
  }
  return params.length > 0 ? `?${params.join('&')}` : '';
}
