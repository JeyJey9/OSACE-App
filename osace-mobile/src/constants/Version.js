// src/constants/Version.js
// Centrul de stocare al versiunii aplicației mobile OSACE și istoricul de Patch Notes.

export const APP_VERSION = '2.3.0';

export const PATCH_NOTES = [
  {
    version: '2.3.0',
    items: [
      'Feedback: Buton în bara laterală pentru raportare a problemelor și trimiterea sugestiilor.',
      'Format nou pentru export date.',
      'Reference in aceasta pagina de Patch Notes pentru cunoscători.',
      'Îmbunătățiri de interfață și stabilitate generală.',
    ],
  },
  {
    version: '2.2.6',
    items: [
      'Theme Selector: Selector de culori basic în profil pentru a schimba culoarea aplicației (not insanely great but it\'s there if you want to use it).',
      'Actualizare ecran Leaderboard/Clasament.',
      'Îmbunătățiri pentru ecranul de Trimitere Notificări (Admin/Coordonatori).',
      'Optimizare exporturi PDF și descărcare rapoarte.',
      'Fix pentru bara de navigare de jos (nu mai acoperă butoanele pe ecranele de activitate).',
      'Redirect App Store / Google Play la actualizări noi.',
    ],
  },
  {
    version: '2.1.2',
    items: [
      'Fix pentru bara gri din antetul aplicației.',
      'And some other things that I forgot about so I\'m typing this instead.',
    ],
  },
];

// Versiuni anterioare — afișate în subsolul dark al modalului de Patch Notes.
export const LEGACY_PATCH_NOTES = [
  {
    version: '2.0',
    items: [
      'Fix scanare QR - adaugat delay intre scanari.',
      'Add feature editare prezență și ore acordate individual per participant.',
      'Export PDF actualizat.',
      'Funcție de duplicare a evenimentelor.',
      'Fix text wrapping și îmbunătățiri generale de interfață.',
    ],
  },
  {
    version: '1.6',
    items: [
      'Redesign major al interfeței pe toate ecranele.',
      'Sistem de popup pentru actualizare versiune.',
      'Suport butoane „Înapoi" pe iOS în toate meniurile - sper.',
      'Optimizări pentru swipe și navigare laterală.',
      'Indicator de conexiune la internet în header.',
    ],
  },
  {
    version: '1.5',
    items: [
      'Implementare „Contribuții Speciale" pentru taskuri extra.',
      'Sistem actualizat de badge-uri.',
      'Raportare comentarii și blocare utilizatori (cerință iOS).',
      'Export PDF conform layout-ului documentelor O.S.A.C.E.',
      'Filtre pe ecranul de loguri.',
    ],
  },
  {
    version: '1.0 – 1.4',
    items: [
      'Lansare publică inițială a aplicației O.S.A.C.E.',
      'Feed de news (instagram posts basically).',
      'Sistem de loguri pentru acțiunile adminilor.',
      'Verificare legitimație studenți.',
      'Rate-limiting, notificări la evenimente noi, export date.',
      'Termeni & Condiții și Politică de Confidențialitate.',
    ],
  },
];
