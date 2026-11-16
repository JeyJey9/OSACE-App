// src/features/Tutorial/tutorialSteps.js

export const TUTORIAL_STEPS = [
  // Pasul 0: Bun venit
  {
    id: 'welcome',
    title: 'Bun venit!',
    text: 'Hai să vezi cum se navighează în aplicație.',
    target: null,
    isInteractive: false,
    primaryButtonText: 'Începe',
    showSkip: true,
  },

  // Pasul 1: Avatar (deschidere meniu lateral)
  {
    id: 'avatar',
    title: 'Meniul lateral',
    text: 'Atinge poza ta de profil ca să deschizi meniul lateral.',
    target: 'avatar',
    targetShape: 'circle',
    isInteractive: true,
    advanceOn: 'targetTap',
    showSkip: true,
    fallbackTimeoutMs: 4000,
  },

  // Pasul 2: Meniu deschis
  {
    id: 'drawer_overview',
    title: 'Meniul principal',
    text: 'Aici găsești Profilul, Clasamentul, Catalogul de realizări, Harta și Help.',
    target: null,
    isInteractive: false,
    primaryButtonText: 'Mai departe',
    showSkip: true,
  },

  // Pasul 3: Swipe din marginea stângă
  {
    id: 'drawer_swipe',
    title: 'Deschidere rapidă',
    text: 'Meniul se deschide și dacă glisezi din marginea stângă spre dreapta.',
    target: null,
    gesture: 'fromLeftEdge',
    isInteractive: true,
    advanceOn: 'drawerOpen',
    showSkip: true,
    fallbackTimeoutMs: 4000,
  },

  // Pasul 4: Butonul QR
  {
    id: 'qr_button',
    title: 'Scanare prezență',
    text: 'Când ajungi la o activitate, apasă aici ca să-ți scanezi prezența.',
    target: 'qr',
    targetShape: 'circle',
    isInteractive: false,
    primaryButtonText: 'Am înțeles',
    showSkip: true,
  },

  // Pasul 5: Bara de navigare
  {
    id: 'tab_bar',
    title: 'Bara de navigare',
    text: 'Bara de jos conține secțiunile principale: Noutăți, Activități, Activitățile Mele și Istoric.',
    target: 'tabBar',
    targetShape: 'rect',
    isInteractive: false,
    primaryButtonText: 'Mai departe',
    showSkip: true,
  },

  // Pasul 6: Swipe între taburi
  {
    id: 'tab_swipe',
    title: 'Schimbare taburi',
    text: 'Nu trebuie să apeși pe bară: glisează stânga ca să treci la tabul următor.',
    target: null,
    gesture: 'horizontal',
    isInteractive: true,
    advanceOn: 'tabSwipe',
    showSkip: true,
    fallbackTimeoutMs: 4000,
  },

  // Pasul 7: Final
  {
    id: 'finish',
    title: 'Gata! 🎉',
    text: 'Poți relua tutorialul oricând din meniul lateral → Tutorial aplicație.',
    target: null,
    isInteractive: false,
    primaryButtonText: 'Am înțeles',
    showSkip: false,
  },
];
