// src/utils/periodFilters.js
export const APP_WEB_VERSION = 'V3.0.9';

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

export const CATEGORY_SEGMENTS = [
  { key: 'social',      label: 'Social',      color: '#27ae60' },
  { key: 'proiect',     label: 'Proiecte',    color: '#f39c12' },
  { key: 'sedinta',     label: 'Ședințe',     color: '#1C748C' },
  { key: 'contributie', label: 'Contribuții', color: '#8e44ad' },
];

export function displayRole(role) {
  const map = {
    admin: 'Administrator',
    coordonator: 'Coordonator',
    user: 'Voluntar',
    voluntar: 'Voluntar',
  };
  return map[role] || 'Voluntar';
}

export function formatDateRo(dateStr) {
  if (!dateStr) return '';
  const normalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.PROD ? 'https://api.osace.ro' : 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function resolveRankFallback(api, targetUserId, year, month) {
  try {
    const query = buildPeriodQuery(year, month);
    const res = await api.get(`/leaderboard${query}`);
    const ranked = [...(res.data || [])]
      .filter((u) => parseFloat(u.total_hours || 0) > 0)
      .sort((a, b) => {
        const diff = parseFloat(b.total_hours || 0) - parseFloat(a.total_hours || 0);
        if (diff !== 0) return diff;
        return (parseInt(b.total_activities || 0, 10) || 0) - (parseInt(a.total_activities || 0, 10) || 0);
      });
    const idx = ranked.findIndex((u) => Number(u.id) === Number(targetUserId));
    return idx !== -1 ? idx + 1 : null;
  } catch {
    return null;
  }
}
