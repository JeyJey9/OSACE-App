// src/constants/Version.js
// Centrul de stocare al versiunii aplicației mobile OSACE și istoricul de Patch Notes.

export const APP_VERSION = '2.3.0';

export const PATCH_NOTES = [
  {
    version: '2.3.0',
    date: 'Septembrie 2026',
    items: [
      'Feedback: Buton în bara laterală pentru raportare a problemelor și trimiterea sugestiilor.',
      'Format nou pentru export date.',
      'Reference in aceasta pagina de Patch Notes pentru cunoscători.',
      'Îmbunătățiri de interfață și stabilitate generală.',
    ],
  },
  {
    version: '2.2.6',
    date: 'Septembrie 2026',
    items: [
      'Theme Selector: Selector de culori basic în profil pentru a schimba culoarea aplicației (not insanely great but it\'s there if you want to use it).',
      'Actualizare ecran Leaderboard/Clasament.',
      'Îmbunătățiri pentru ecranul de Trimitere Notificări (Admin/Coordonatori).',
      'Optimizare exporturi PDF și descărcare rapoarte.',
      'Corecturi pentru bara de navigare de jos (nu mai acoperă butoanele pe ecranele de activitate).',
      'Redirecționare către App Store / Google Play la actualizări noi.',
    ],
  },
  {
    version: '2.1.2',
    date: 'August 2026',
    items: [
      'Fkx pentru bara gri din antetul aplicației.',
      'Optimizări de stabilitate și actualizări de pachete de sistem.',
    ],
  },
];

// Versiuni anterioare — afișate în subsolul dark al modalului de Patch Notes.
export const LEGACY_PATCH_NOTES = [
  {
    version: '2.0',
    date: 'Iulie – August 2026',
    items: [
      'Scanare QR cu delay pentru o scanare mai stabilă.',
      'Fix butoane blocate pe ecranele de Admin/Coordonator.',
      'Editare prezență și ore acordate individual per participant.',
      'Export PDF actualizat și selecție multiplă la actualizarea statusurilor.',
      'Funcție de duplicare a evenimentelor.',
      'Fix text wrapping și îmbunătățiri generale de interfață.',
    ],
  },
  {
    version: '1.6',
    date: 'Iunie 2026',
    items: [
      'Redesign major al interfeței pe toate ecranele.',
      'Sistem de popup pentru actualizare versiune.',
      'Suport butoane „Înapoi" pe iOS în toate meniurile.',
      'Optimizări pentru swipe și navigare laterală.',
      'Indicator de conexiune la internet în header.',
    ],
  },
  {
    version: '1.5',
    date: 'Mai 2026',
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
    date: 'Ianuarie – Aprilie 2026',
    items: [
      'Lansare publică inițială a aplicației O.S.A.C.E.',
      'Feed de știri și contribuții noi.',
      'Sistem de loguri pentru acțiunile adminilor.',
      'Verificare legitimație studentească.',
      'Rate-limiting, notificări la evenimente noi, export date.',
      'Termeni & Condiții și Politică de Confidențialitate.',
    ],
  },
];
