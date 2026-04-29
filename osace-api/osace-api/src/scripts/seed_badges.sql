-- ============================================================
-- OSACE Badge Seed / Migration
-- Run this against the production DB to insert all badges.
-- Safe to re-run: ON CONFLICT (key) DO NOTHING
-- ============================================================

INSERT INTO badges (name, description, icon_name, key) VALUES

-- ── MILESTONE: EVENTS ────────────────────────────────────────
('Prima Activitate',        'Ai participat la prima ta activitate.',                           'star-outline',              'FIRST_EVENT'),
('Membru de Bază',          'Ai participat la 5 activități. Un început excelent!',             'briefcase-outline',         '5_EVENTS'),
('10 Activități',           'Ai participat la 10 activități. Ești pe drumul cel bun.',         'star',                      '10_EVENTS'),
('25 Activități',           'Ai participat la 25 de activități. Respect!',                     'trophy-outline',            '25_EVENTS'),
('50 Activități',           'Jumătate de secol de activitate. Ești un stâlp al organizației.', 'trophy',                    '50_EVENTS'),
('100 Activități',          'Centenarul. Legendă în devenire.',                                'flame-outline',             '100_EVENTS'),

-- ── MILESTONE: HOURS ─────────────────────────────────────────
('Prima Oră',               'Prima oră confirmată. Drumul lung începe cu un pas.',             'time-outline',              '1_HOUR'),
('10 Ore',                  'Ai acumulat 10 ore de voluntariat.',                              'time-outline',              '10_HOURS'),
('24 de Ore',               'O zi întreagă de voluntariat. Zi și noapte pentru comunitate.',   'moon-outline',              '24_HOURS_TOTAL'),
('25 de Ore',               'Sfert de sută. Continui să construiești.',                        'hourglass-outline',         '25_HOURS'),
('50 de Ore',               'Jumătate de sută de ore. Nu glumim.',                             'hourglass',                 '50_HOURS'),
('100 de Ore',              'O sută de ore. Mergi cu noi de mult timp.',                       'medal-outline',             '100_HOURS'),
('250 de Ore',              '250 de ore. Ești practic angajat, dar fără leafă.',               'medal',                     '250_HOURS'),
('500 de Ore',              '500 de ore. Ai dedicat mai mult timp decât unii la job.',         'diamond-outline',           '500_HOURS'),

-- ── CATEGORIES ───────────────────────────────────────────────
('5 Ședințe',               'Ai participat la 5 ședințe. Știi pe dinafară ordinea de zi.',     'clipboard-outline',         '5_SEDINTE'),
('20 Ședințe',              '20 de ședințe. Câte cafele ai băut?',                             'clipboard',                 '20_SEDINTE'),
('5 Activități Sociale',    'Ești prezent acolo unde contează. 5 activități sociale.',         'people-outline',            '5_SOCIAL'),
('20 Activități Sociale',   'Sufletul petrecerilor. 20 de activități sociale.',                'people',                    '20_SOCIAL'),
('5 Proiecte',              'Ai contribuit la 5 proiecte. Mâinile nu te mint.',                'construct-outline',         '5_PROIECT'),
('20 Proiecte',             '20 de proiecte. Ești un om al faptelor.',                         'construct',                 '20_PROIECT'),
('25 Ore Ședințe',          '25 de ore de ședințe. Ai supraviețuit PowerPoint-urilor.',        'easel-outline',             '25_HOURS_SEDINTE'),
('25 Ore Sociale',          '25 de ore de activități sociale. Viața e frumoasă cu tine.',      'balloon-outline',           '25_HOURS_SOCIAL'),
('25 Ore Proiecte',         '25 de ore în proiecte. Lucrezi serios.',                          'hammer-outline',            '25_HOURS_PROIECT'),
('Om Complet',              'Ai participat la toate cele 3 categorii de activități.',           'apps-outline',              'DIVERSIFIED'),

-- ── STREAKS ──────────────────────────────────────────────────
('Serie de 3',              'Prezent la 3 activități consecutive fără nicio absență.',          'flame-outline',             'PERFECT_STREAK_3'),
('Serie de 10',             'O serie de 10! Ai venit la fiecare activitate. Impecabil.',        'flame',                     'PERFECT_STREAK_10'),
('Serie de 20',             '20 consecutive. Ești mai consistent decât internetul la noi.',    'nuclear-outline',           'PERFECT_STREAK_20'),

-- ── WEEKLY / MONTHLY ─────────────────────────────────────────
('10 Ore în 7 Zile',        'Ai adunat 10 ore de voluntariat într-o singură săptămână.',       'calendar-outline',          '10_HOURS_WEEK'),
('20 Ore în 7 Zile',        '20 de ore într-o săptămână. Ești full-time, fără contract.',      'calendar',                  '20_HOURS_WEEK'),
('5 Activități pe Lună',    '5 activități într-o singură lună. Devotament pur.',               'calendar-number-outline',   '5_EVENTS_MONTH'),
('10 Activități pe Lună',   '10 activități într-o lună. Ești o prezență constantă.',           'calendar-number',           '10_EVENTS_MONTH'),

-- ── COMMUNITY / SOCIAL ───────────────────────────────────────
('Primul Like',             'Ai dat primul like. Apreciezi munca altora.',                     'heart-outline',             'FIRST_LIKE'),
('25 Likes',                '25 de aprecieri date. Ești un suflet generos.',                   'heart',                     '25_LIKES'),
('Primul Comentariu',       'Ai lăsat primul tău comentariu. Vocea ta contează.',              'chatbubble-outline',        'FIRST_COMMENT'),
('25 Comentarii',           '25 de comentarii. Ai multe de spus și bine faci.',                'chatbubbles-outline',       '25_COMMENTS'),
('Curioșit',                'Ai vizitat profilul altcuiva. Ești curios de natură.',             'search-outline',            'VIEWED_PROFILE'),

-- ── PROFILE / ACCOUNT ────────────────────────────────────────
('Față de Om',              'Ai încărcat o poză de profil. Acum te știm!',                     'person-circle-outline',     'AVATAR_UPLOADED'),
('Primele Modificări',      'Ai editat profilul pentru prima dată.',                           'create-outline',            'FIRST_PROFILE_EDIT'),
('Promovat!',               'Felicitări pentru rolul de Coordonator sau Admin!',               'ribbon-outline',            'PROMOTED_COORDONATOR'),

-- ── SCANNING / QR ────────────────────────────────────────────
('Prima Scanare',           'Ai scanat primul cod QR pentru confirmare.',                      'qr-code-outline',           'FIRST_SCAN_TOTP'),
('Flash Register',          'Înscris la un eveniment în mai puțin de o oră de la creare.',    'flash-outline',             'QUICK_REGISTER'),
('Bufniță de Noapte',       'Ai participat la o activitate care s-a terminat după miezul nopții.','moon',                  'NIGHT_OWL'),
('Cântătorul Cocoș',        'Ai participat la o activitate care a început înainte de 9 dimineața.','sunny-outline',         'EARLY_BIRD'),

-- ── EVENTS CREATED ───────────────────────────────────────────
('Primul Eveniment Creat',  'Ai creat primul tău eveniment. Organizatorul a trezit!',          'add-circle-outline',        'FIRST_EVENT_CREATED'),
('5 Evenimente Create',     'Ai creat 5 evenimente. Ești un organizator adevărat.',            'add-circle',                '5_EVENTS_CREATED'),
('Crowd Puller',            'Un eveniment creat de tine a adunat 20 de participanți.',         'people-circle-outline',     'EVENT_20_ATTENDEES'),

-- ── FUNNY / SPECIAL ──────────────────────────────────────────
('La Plăcinte Înainte',
 'La plăcinte înainte, la război înapoi! Te-ai retras de la primul tău eveniment.',
 'fast-food-outline',                                                                                                       'FIRST_UNATTEND'),

('Filozoful Organizației',
 'Ai 50 de ore de ședință. La acest nivel, înțelegi deja sensul vieții.',
 'bulb-outline',                                                                                                            '50_HOURS_SEDINTE'),

('Gură Spartă',
 'Ai comentat de 100 de ori. Dacă ai fi tăcut, tot era bine, dar ești tu.',
 'chatbox',                                                                                                                 '100_COMMENTS'),

('Apreciator Universal',
 'Ai dat 100 de like-uri. Ești fan al tuturor.',
 'thumbs-up',                                                                                                               '100_LIKES'),

('Veteranul',
 'Ai 200 de ore totale de voluntariat. Ești parte din fundație.',
 'library-outline',                                                                                                         '200_HOURS'),

('Contabil de Suflete',
 'Ai creat 10 evenimente. Organizezi mai mult decât te odihnești.',
 'calculator-outline',                                                                                                      '10_EVENTS_CREATED'),

('Omul Serii',
 'Ai participat la 10 activități seara (după 18:00). Nopțile sunt ale tale.',
 'wine-outline',                                                                                                            '10_EVENING_EVENTS'),

('Campionul Lunii',
 'Ai câștigat titlul de cel mai activ voluntar al săptămânii.',
 'podium-outline',                                                                                                          'WEEKLY_CHAMPION'),

('Neoprit',
 'O serie de 20 de activități consecutive. Pur și simplu de neoprit.',
 'infinite-outline',                                                                                                        'UNSTOPPABLE')

ON CONFLICT (key) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  icon_name = EXCLUDED.icon_name;
