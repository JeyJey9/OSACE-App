/**
 * Normalized building data and rooms index for OSACE Indoor Map.
 * Auto-generated from OSACE_building.json with corrections applied.
 */

export const MAP_DIMENSIONS = {
  width: 1346.8,
  height: 1392.0,
  viewBox: "0 0 1346.8 1392.0",
};

export const ROOM_TYPE_COLORS = {
  light: {
    classroom: '#d6e7fb',
    laboratory: '#d6e7fb',
    office: '#e3f3e6',
    cabinet: '#e3f3e6',
    amphitheatre: '#ece4fb',
    'student-space': '#fdf3cd',
    entrance: '#dcfce7',
    service: '#f0f2f5',
    'other-public-space': '#f0f2f5',
    technical: '#f4f5f7',
    corridor: '#eef4fa',
    default: '#f8fafc',
    stroke: '#8a93a3',
    selectedFill: '#0284c7',
    selectedStroke: '#0369a1',
  },
  dark: {
    classroom: '#1e3a5f',
    laboratory: '#1e3a5f',
    office: '#1a3d2e',
    cabinet: '#1a3d2e',
    amphitheatre: '#362359',
    'student-space': '#4d3d14',
    entrance: '#064e3b',
    service: '#2a2f3a',
    'other-public-space': '#2a2f3a',
    technical: '#252932',
    corridor: '#1c2433',
    default: '#1e293b',
    stroke: '#475569',
    selectedFill: '#38bdf8',
    selectedStroke: '#7dd3fc',
  },
};

import buildingFloors from './buildingFloors.json';

export { buildingFloors };

export const allRooms = Object.values(buildingFloors).flatMap((floor) => floor.rooms);

export const getRoomsByFloor = (floorId) => {
  return buildingFloors[floorId]?.rooms || [];
};

export const getRoomById = (roomId) => {
  return allRooms.find((r) => r.id === roomId) || null;
};

export const getRoomByCode = (code) => {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return allRooms.find((r) => r.code.toUpperCase() === upper) || null;
};

export const normalizeSearchStr = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const getRoomCategory = (room) => {
  if (!room) {
    return {
      category: 'other',
      label: 'Sală',
      icon: 'business-outline',
      badge: 'SALĂ',
      color: '#64748b',
      tags: ['sală'],
      tagsList: [],
    };
  }

  const name = (room.name || '').toLowerCase();
  const code = (room.code || '').toLowerCase();
  const type = (room.type || '').toLowerCase();
  const floor = room.floor || 'P';
  const floorLabel =
    floor === 'B' ? 'Demisol' : floor === 'P' ? 'Parter' : `Etaj ${floor.replace('E', '')}`;
  const wing = room.wing || 'Corp Central';

  let category = 'other';
  let label = room.isCorridor ? 'Coridor' : 'Sală';
  let icon = room.isCorridor ? 'walk-outline' : 'business-outline';
  let badge = room.code || 'SALĂ';
  let color = '#64748b';
  let searchTags = [code, name, wing.toLowerCase(), floorLabel.toLowerCase()];
  let primaryTag = { label, icon, isPrimary: true };
  let pdfSubSpec = null;

  if (
    /sanitar|wc|toalet|gr\.\s*san/i.test(name) ||
    /sanitar|wc|gr\.\s*san/i.test(code) ||
    (type === 'service' && !/birou/i.test(name))
  ) {
    category = 'toilet';
    label = 'Grup Sanitar';
    icon = 'water-outline';
    badge = 'WC';
    color = '#06b6d4';
    searchTags.push('grup sanitar', 'toaleta', 'toaletă', 'toalete', 'wc', 'baie', 'bai', 'băi');
    primaryTag = { label: 'Grup Sanitar', icon: 'water-outline', isPrimary: true };
  } else if (
    type === 'amphitheatre' ||
    /amfiteatru|aula|belea/i.test(name) ||
    code === 'acb' ||
    code === 'ak1'
  ) {
    category = 'amphitheatre';
    label = 'Amfiteatru';
    icon = 'people-outline';
    badge = code === 'acb' ? 'AULA' : 'AK1';
    color = '#8b5cf6';
    searchTags.push('amfiteatru', 'aula', 'ak1', 'acb', 'belea');
    primaryTag = { label: code === 'acb' ? 'Aulă' : 'Amfiteatru', icon: 'people-outline', isPrimary: true };
  } else if (type === 'laboratory' || /laborator|lab\b/i.test(name)) {
    category = 'laboratory';
    label = 'Laborator';
    icon = 'flask-outline';
    badge = 'LAB';
    color = '#0284c7';
    searchTags.push('laborator', 'lab');
    if (/e\.l\.f/i.test(name)) {
      pdfSubSpec = 'E.L.F.';
      searchTags.push('elf', 'e.l.f.');
    } else if (/servosist/i.test(name)) {
      pdfSubSpec = 'Servosisteme';
      searchTags.push('servosisteme', 'servosist.');
    } else if (/multimedia/i.test(name)) {
      pdfSubSpec = 'Multimedia';
      searchTags.push('multimedia');
    }
    primaryTag = { label: 'Laborator', icon: 'flask-outline', isPrimary: true };
  } else if (type === 'classroom' || /curs|seminar/i.test(name)) {
    category = 'classroom';
    label = 'Sală de Curs';
    icon = 'school-outline';
    badge = 'CURS';
    color = '#3b82f6';
    searchTags.push('sala de curs', 'sală de curs', 'curs');
    primaryTag = { label: 'Sală de Curs', icon: 'school-outline', isPrimary: true };
  } else if (type === 'cabinet' || /cabinet/i.test(name)) {
    category = 'cabinet';
    label = 'Cabinet';
    icon = 'briefcase-outline';
    badge = 'CABINET';
    color = '#0d9488';
    searchTags.push('cabinet');
    if (/m\.e\./i.test(name)) {
      pdfSubSpec = 'M.E.';
      searchTags.push('m.e.');
    }
    primaryTag = { label: 'Cabinet', icon: 'briefcase-outline', isPrimary: true };
  } else if (type === 'office' || /birou/i.test(name)) {
    category = 'office';
    label = 'Birou';
    icon = 'folder-outline';
    badge = 'BIROU';
    color = '#10b981';
    searchTags.push('birou');
    primaryTag = { label: 'Birou', icon: 'folder-outline', isPrimary: true };
  } else if (/bibliotec/i.test(name)) {
    category = 'library';
    label = 'Bibliotecă';
    icon = 'book-outline';
    badge = 'BIBLIOTECĂ';
    color = '#f59e0b';
    searchTags.push('biblioteca', 'bibliotecă');
    primaryTag = { label: 'Bibliotecă', icon: 'book-outline', isPrimary: true };
  } else if (/copiator/i.test(name)) {
    category = 'copier';
    label = 'Copiator';
    icon = 'print-outline';
    badge = 'COPIATOR';
    color = '#0284c7';
    searchTags.push('copiator');
    primaryTag = { label: 'Copiator', icon: 'print-outline', isPrimary: true };
  } else if (type === 'entrance' || code === 'gd04' || /intrare/i.test(name)) {
    category = 'entrance';
    label = 'Intrare Facultate';
    icon = 'log-in-outline';
    badge = 'INTRARE';
    color = '#10b981';
    searchTags.push('intrare', 'acces');
    primaryTag = { label: 'Intrare Principală', icon: 'log-in-outline', isPrimary: true };
  } else if (room.isCorridor || /hol|coridor|culoar/i.test(name)) {
    category = 'corridor';
    label = /hol/i.test(name) ? 'Hol' : 'Coridor';
    icon = 'walk-outline';
    badge = 'HOL';
    color = '#64748b';
    searchTags.push('hol', 'coridor', 'culoar');
    primaryTag = { label, icon: 'walk-outline', isPrimary: true };
  }

  const tagsList = [
    primaryTag,
    { label: wing, icon: 'location-outline' },
    { label: floorLabel, icon: 'layers-outline' },
  ];
  if (pdfSubSpec) {
    tagsList.push({ label: pdfSubSpec, icon: 'bookmark-outline' });
  }

  return {
    category,
    label,
    icon,
    badge,
    color,
    tags: searchTags,
    tagsList,
  };
};

export const searchRooms = (query, currentFloor = null) => {
  if (!query || typeof query !== 'string') return [];
  const q = normalizeSearchStr(query);
  if (q.length === 0) return [];

  const scored = [];

  for (const room of allRooms) {
    // Ignore corridors and technical rooms unless searched directly
    if (room.isCorridor && !q.includes('coridor') && !q.includes('hol')) continue;

    const codeNorm = normalizeSearchStr(room.code);
    const nameNorm = normalizeSearchStr(room.name);
    const cat = getRoomCategory(room);
    const tagsNorm = cat.tags.map((t) => normalizeSearchStr(t));

    let score = 0;

    // Exact code match (e.g. "K101", "ACB", "AK1", "GD04")
    if (codeNorm === q) {
      score += 100;
    } else if (codeNorm.startsWith(q)) {
      score += 75;
    } else if (codeNorm.includes(q)) {
      score += 50;
    }

    // Name match
    if (nameNorm === q) {
      score += 90;
    } else if (nameNorm.startsWith(q)) {
      score += 70;
    } else if (nameNorm.includes(q)) {
      score += 45;
    }

    // Tag matches (e.g. "toaleta", "baie", "wc", "lab", "curs", "amfiteatru")
    for (const t of tagsNorm) {
      if (t === q) {
        score = Math.max(score, 65);
      } else if (t.startsWith(q)) {
        score = Math.max(score, 55);
      } else if (t.includes(q) && q.length >= 3) {
        score = Math.max(score, 40);
      }
    }

    if (score > 0) {
      // Prioritate pentru etajul curent
      if (currentFloor && room.floor === currentFloor) {
        score += 15;
      }
      scored.push({ room, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (currentFloor) {
      if (a.room.floor === currentFloor && b.room.floor !== currentFloor) return -1;
      if (a.room.floor !== currentFloor && b.room.floor === currentFloor) return 1;
    }
    return a.room.code.localeCompare(b.room.code);
  });

  return scored.map((s) => s.room);
};

export default {
  MAP_DIMENSIONS,
  ROOM_TYPE_COLORS,
  buildingFloors,
  allRooms,
  getRoomsByFloor,
  getRoomById,
  getRoomByCode,
  getRoomCategory,
  normalizeSearchStr,
  searchRooms,
};

