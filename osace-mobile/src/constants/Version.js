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
      'Corectură pentru bara gri din antetul aplicației.',
      'Optimizări de stabilitate și actualizări de pachete de sistem.',
    ],
  },
];

// Versiuni anterioare — afișate în subsolul modalului de Patch Notes.
export const LEGACY_PATCH_NOTES = [
  {
    version: '2.0 (până la 2.1.2)',
    date: 'Iulie – August 2026',
    items: [
      'Tranziție completă la arhitectura modernă V2 a platformei.',
      'Sincronizare automată Instagram și feed dinamic de activități.',
      'Scanare QR cu protecție anti-duplicate și delay optimizat.',
      'Management prezență & editare ore acordate individual per voluntar.',
      'Export PDF actualizat cu selecție multiplă și duplicare evenimente.',
      'Corecții majore pentru butoane și navigare Android/iOS.',
    ],
  },
  {
    version: '1.6',
    date: 'Iunie 2026',
    items: [
      'Redesign major al interfeței pe toate ecranele principale.',
      'Sistem automat de pop-up pentru actualizări de versiune.',
      'Navigare avansată prin swipe și suport gesturi native iOS/Android.',
      'Indicator inteligent de conexiune la internet în antetul aplicației.',
      'Optimizări de memorie și caching pentru tab-urile active.',
    ],
  },
  {
    version: '1.5',
    date: 'Mai 2026',
    items: [
      'Implementare modul „Contribuții Speciale" pentru ore și taskuri extra.',
      'Sistem extins de Gamification și deblocare de badge-uri.',
      'Raportare comentarii și mecanism de protecție / blocare conturi.',
      'Export PDF oficial aliniat cu machetele documentelor O.S.A.C.E.',
      'Filtrare avansată pe tipuri de acțiuni în istoricul de loguri.',
    ],
  },
  {
    version: '1.0 – 1.4',
    date: 'Ianuarie – Aprilie 2026',
    items: [
      'Lansarea publică inițială a aplicației pe Google Play și App Store.',
      'Sistem complet de verificare a legitimației de student.',
      'Notificări push automate la crearea de activități noi.',
      'Sistem de audit și loguri administrative pentru coordonatori.',
      'Protecții anti-spam, rate-limiting și securitate conturi.',
    ],
  },
];

