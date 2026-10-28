import React from 'react';
import { G, Path, Rect, Circle, Line } from 'react-native-svg';

/**
 * ArchitecturalFixtures renders architectural doors with swing arcs,
 * circular/turning stairs (trepte, parapet central, podest plat și linie de mers),
 * vertical connectors between Demisol and Parter (15 trepte cu balustradă),
 * internal level-change stairs, and landmark amphitheatre entrances.
 */
const ArchitecturalFixtures = ({ floorId, isDark }) => {
  const hasCorpG = floorId === 'P' || floorId === 'E1';
  const hasCorpK = floorId === 'P' || floorId === 'E1' || floorId === 'E2' || floorId === 'E3';
  const isDemisol = floorId === 'B';
  const isParter = floorId === 'P';
  const isEtaj1 = floorId === 'E1';
  const isEtaj3 = floorId === 'E3';

  if (!hasCorpG && !hasCorpK && !isDemisol) return null;

  // Culori adaptate la temă
  const doorLeafColor = isDark ? '#38bdf8' : '#0284c7';
  const doorArcColor = isDark ? '#64748b' : '#94a3b8';
  const stairBg = isDark ? '#161f30' : '#f8fafc';
  const stairLandingBg = isDark ? '#1a2436' : '#f1f5f9';
  const stairBorder = isDark ? '#334155' : '#cbd5e1';
  const treadColor = isDark ? '#475569' : '#94a3b8';
  const newelFill = isDark ? '#0f172a' : '#e2e8f0';
  const newelStroke = isDark ? '#64748b' : '#94a3b8';
  const walkLineColor = isDark ? '#38bdf8' : '#0284c7';

  return (
    <G id="Architectural_Fixtures" pointerEvents="none">
      {/* ======================================================== */}
      {/* 1A. CORP G NORD (Parter și Etaj 1)                       */}
      {/* ======================================================== */}
      {hasCorpG && (
        <G id="Corp_G_Nord_Fixtures">
          {/* --- UȘA ACCES CASĂ SCĂRII CORP G NORD (X:351, Y:175.5..205.5) --- */}
          <G id="Door_Stairwell_CorpG_Nord">
            <Path
              d="M 351.0 205.5 L 321.0 205.5"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 321.0 205.5 A 30 30 0 0 1 351.0 175.5"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="351" y1="173.5" x2="351" y2="177.5" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="351" y1="203.5" x2="351" y2="207.5" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- SCĂRI ÎN CERC CORP G NORD (X:270..347, Y:88..176) --- */}
          <G id="Stairs_CorpG_Nord">
            {/* Contur casă scării */}
            <Rect
              x={270}
              y={88}
              width={77}
              height={88}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={2}
            />

            {/* Podest plat intermediar (partea de nord): X:270..347, Y:88..124 */}
            <Rect
              x={270}
              y={88}
              width={77}
              height={36}
              fill={stairLandingBg}
              stroke={stairBorder}
              strokeWidth={0.8}
              rx={1}
            />

            {/* Rampa 1 (stânga / vest): X: 270..297, Y: 124..176 */}
            <Path
              d="M 270 124 H 297 M 270 128 H 297 M 270 132 H 297 M 270 136 H 297 M 270 140 H 297 M 270 144 H 297 M 270 148 H 297 M 270 152 H 297 M 270 156 H 297 M 270 160 H 297 M 270 164 H 297 M 270 168 H 297 M 270 172 H 297"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării: X: 297..321, Y: 124..176 */}
            <Rect
              x={297}
              y={124}
              width={24}
              height={52}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (dreapta / est): X: 321..347, Y: 124..176 */}
            <Path
              d="M 321 124 H 347 M 321 128 H 347 M 321 132 H 347 M 321 136 H 347 M 321 140 H 347 M 321 144 H 347 M 321 148 H 347 M 321 152 H 347 M 321 156 H 347 M 321 160 H 347 M 321 164 H 347 M 321 168 H 347 M 321 172 H 347"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (Parter: urcare spre E1; Etaj 1: coborâre spre P) */}
            {isParter ? (
              <>
                <Circle cx={334.0} cy={173} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 334.0 173 L 334.0 114 A 25.25 15 0 0 0 283.5 114 L 283.5 163"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 279.0 160 L 283.5 170 L 288.0 160 Z"
                  fill={walkLineColor}
                />
              </>
            ) : (
              <>
                <Circle cx={283.5} cy={173} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 283.5 173 L 283.5 114 A 25.25 15 0 0 1 334.0 114 L 334.0 163"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 329.5 160 L 334.0 170 L 338.5 160 Z"
                  fill={walkLineColor}
                />
              </>
            )}
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 1B. CORP G SUD (Parter și Etaj 1)                        */}
      {/* ======================================================== */}
      {hasCorpG && (
        <G id="Corp_G_Sud_Fixtures">
          {/* --- UȘA 1: Ușă dublă coridor (X:351..409, Y:687..688) care se deschide spre toaletele de nord --- */}
          <G id="Door_Corridor_CorpG">
            <Path
              d="M 351.0 687.5 L 351.0 658.5 M 409.0 687.5 L 409.0 658.5"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 351.0 658.5 A 29 29 0 0 1 380.0 687.5"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Path
              d="M 409.0 658.5 A 29 29 0 0 0 380.0 687.5"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="349" y1="687.5" x2="353" y2="687.5" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="407" y1="687.5" x2="411" y2="687.5" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- UȘA 2: Ușă acces casă scării (X:351, Y:689..727) care se deschide spre scări (vest) --- */}
          <G id="Door_Stairwell_CorpG">
            <Path
              d="M 351.0 689.0 L 313.0 689.0"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 313.0 689.0 A 38 38 0 0 0 351.0 727.0"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="351" y1="687" x2="351" y2="691" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="351" y1="725" x2="351" y2="729" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- UȘA 3 (Parter): Ușă ieșire casă scării (X:321..347, Y:820..823) care se deschide spre sud / G003 --- */}
          {isParter && (
            <G id="Door_Stairwell_Exit_G003">
              {/* Foaie de ușă solidă deschisă spre sud */}
              <Path
                d="M 347.0 821.5 L 347.0 847.5"
                stroke={doorLeafColor}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              {/* Arc punctat de deschidere pivotând spre sud */}
              <Path
                d="M 347.0 847.5 A 26 26 0 0 1 321.0 821.5"
                fill="none"
                stroke={doorArcColor}
                strokeWidth={1.3}
                strokeDasharray="3 3"
              />
              <Line x1="319" y1="821.5" x2="323" y2="821.5" stroke={doorLeafColor} strokeWidth={2.5} />
              <Line x1="345" y1="821.5" x2="349" y2="821.5" stroke={doorLeafColor} strokeWidth={2.5} />
            </G>
          )}

          {/* --- SCĂRI ÎN CERC / URCARE (X:270..347, Y:732..820) --- */}
          <G id="Stairs_CorpG_Sud">
            {/* Contur casă scării */}
            <Rect
              x={270}
              y={732}
              width={77}
              height={88}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={2}
            />

            {/* Podest plat intermediar (spațiu de legătură la baza scării): X:270..347, Y:784..820 */}
            <Rect
              x={270}
              y={784}
              width={77}
              height={36}
              fill={stairLandingBg}
              stroke={stairBorder}
              strokeWidth={0.8}
              rx={1}
            />

            {/* Rampa 1 (stânga): X: 270..297, Y: 732..784 */}
            <Path
              d="M 270 736 H 297 M 270 740 H 297 M 270 744 H 297 M 270 748 H 297 M 270 752 H 297 M 270 756 H 297 M 270 760 H 297 M 270 764 H 297 M 270 768 H 297 M 270 772 H 297 M 270 776 H 297 M 270 780 H 297 M 270 784 H 297"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării: X: 297..321, Y: 732..784 */}
            <Rect
              x={297}
              y={732}
              width={24}
              height={52}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (dreapta): X: 321..347, Y: 732..784 (doar până la Y:784) */}
            <Path
              d="M 321 736 H 347 M 321 740 H 347 M 321 744 H 347 M 321 748 H 347 M 321 752 H 347 M 321 756 H 347 M 321 760 H 347 M 321 764 H 347 M 321 768 H 347 M 321 772 H 347 M 321 776 H 347 M 321 780 H 347 M 321 784 H 347"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (sensul de urcare pe Parter / coborâre pe Etaj 1) */}
            {isParter ? (
              <>
                <Circle cx={283.5} cy={735} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 283.5 735 L 283.5 794 A 25.25 15 0 0 0 334.0 794 L 334.0 745"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 329.5 748 L 334.0 738 L 338.5 748 Z"
                  fill={walkLineColor}
                />
              </>
            ) : (
              <>
                <Circle cx={334.0} cy={735} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 334.0 735 L 334.0 794 A 25.25 15 0 0 1 283.5 794 L 283.5 745"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 279.0 748 L 283.5 738 L 288.0 748 Z"
                  fill={walkLineColor}
                />
              </>
            )}
          </G>

          {/* --- SCARĂ SECUNDARĂ 7 TREPTE CORIDOR CORP G ETAJ 1 (X:408.8..422.9, Y:472.7..502.6) --- */}
          {isEtaj1 && (
            <G id="CorpG_E1_Side_Stairs_7Tr">
              <Rect
                x={408.8}
                y={472.7}
                width={14.1}
                height={29.9}
                fill={stairBg}
                stroke={stairBorder}
                strokeWidth={1.1}
                rx={1}
              />
              <Path
                d="M 410.8 472.7 V 502.6 M 412.8 472.7 V 502.6 M 414.8 472.7 V 502.6 M 416.8 472.7 V 502.6 M 418.8 472.7 V 502.6 M 420.8 472.7 V 502.6"
                stroke={treadColor}
                strokeWidth={1.0}
              />
              <Circle cx={410.5} cy={487.6} r={1.8} fill={walkLineColor} />
              <Line x1={410.5} y1={487.6} x2={420.5} y2={487.6} stroke={walkLineColor} strokeWidth={1.4} />
              <Path d="M 418.0 485.3 L 422.2 487.6 L 418.0 489.9 Z" fill={walkLineColor} />
            </G>
          )}
        </G>
      )}

      {/* ======================================================== */}
      {/* 1C. SCARĂ HOL CORP G (Demisol B <-> Parter P, 15 Trepte) */}
      {/* ======================================================== */}
      {(isDemisol || isParter) && (
        <G id="Corp_G_Hol_Connector_Stairs">
          {/* Fundal scară dreaptă 15 trepte (X:355..408.8, Y:754..814) */}
          <Rect
            x={355}
            y={754}
            width={53.8}
            height={60}
            fill={stairBg}
            stroke={stairBorder}
            strokeWidth={1.2}
            rx={1.5}
          />

          {/* 15 trepte orizontale (pas de 4px pe Y: 754..814) */}
          <Path
            d="
              M 355 758 H 408.8
              M 355 762 H 408.8
              M 355 766 H 408.8
              M 355 770 H 408.8
              M 355 774 H 408.8
              M 355 778 H 408.8
              M 355 782 H 408.8
              M 355 786 H 408.8
              M 355 790 H 408.8
              M 355 794 H 408.8
              M 355 798 H 408.8
              M 355 802 H 408.8
              M 355 806 H 408.8
              M 355 810 H 408.8
            "
            stroke={treadColor}
            strokeWidth={1.1}
          />

          {/* Balustradă laterală stânga & dreapta */}
          <Line x1={356.5} y1={754} x2={356.5} y2={814} stroke={walkLineColor} strokeWidth={1.6} />
          <Line x1={407.3} y1={754} x2={407.3} y2={814} stroke={walkLineColor} strokeWidth={1.6} />
          <Circle cx={356.5} cy={754} r={1.8} fill={walkLineColor} />
          <Circle cx={356.5} cy={784} r={1.4} fill={walkLineColor} />
          <Circle cx={356.5} cy={814} r={1.8} fill={walkLineColor} />
          <Circle cx={407.3} cy={754} r={1.8} fill={walkLineColor} />
          <Circle cx={407.3} cy={784} r={1.4} fill={walkLineColor} />
          <Circle cx={407.3} cy={814} r={1.8} fill={walkLineColor} />

          {isDemisol ? (
            <>
              {/* Linie de secțiune arhitecturală pe Demisol */}
              <Line x1={353} y1={772} x2={411} y2={766} stroke={newelStroke} strokeWidth={1.2} />
              <Line x1={353} y1={774} x2={411} y2={768} stroke={newelStroke} strokeWidth={1.2} />

              {/* Sens de urcare spre Parter (spre nord / sus) */}
              <Circle cx={381.9} cy={810} r={2.2} fill={walkLineColor} />
              <Line x1={381.9} y1={810} x2={381.9} y2={760} stroke={walkLineColor} strokeWidth={1.7} strokeLinecap="round" />
              <Path d="M 378.2 764 L 381.9 756 L 385.6 764 Z" fill={walkLineColor} />
            </>
          ) : (
            <>
              {/* Balustradă capăt nord la nivelul Parterului */}
              <Line x1={355} y1={754} x2={408.8} y2={754} stroke={walkLineColor} strokeWidth={2.0} />

              {/* Sens de coborâre spre Demisol (spre sud / jos) */}
              <Circle cx={381.9} cy={758} r={2.2} fill={walkLineColor} />
              <Line x1={381.9} y1={758} x2={381.9} y2={808} stroke={walkLineColor} strokeWidth={1.7} strokeLinecap="round" />
              <Path d="M 378.2 804 L 381.9 812 L 385.6 804 Z" fill={walkLineColor} />
            </>
          )}
        </G>
      )}

      {/* ======================================================== */}
      {/* 2A. CORP K NORD (Parter, Etaj 1, Etaj 2, Etaj 3)         */}
      {/* ======================================================== */}
      {hasCorpK && (
        <G id="Corp_K_Nord_Fixtures">
          {/* --- UȘA ACCES CASĂ SCĂRII CORP K NORD (X:1068, Y:78..116) care se deschide spre vest --- */}
          <G id="Door_Stairwell_CorpK_Nord">
            <Path
              d="M 1068.0 116.0 L 1030.0 116.0"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 1030.0 116.0 A 38 38 0 0 1 1068.0 78.0"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="1068" y1="76" x2="1068" y2="80" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="1068" y1="114" x2="1068" y2="118" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- SCĂRI ÎN CERC CORP K NORD (X:970..1068, Y:26..116) --- */}
          <G id="Stairs_CorpK_Nord">
            {/* Contur casă scării */}
            <Rect
              x={970}
              y={26}
              width={98}
              height={90}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={2}
            />

            {/* Podest plat intermediar (partea de nord): X:970..1068, Y:26..62 */}
            <Rect
              x={970}
              y={26}
              width={98}
              height={36}
              fill={stairLandingBg}
              stroke={stairBorder}
              strokeWidth={0.8}
              rx={1}
            />

            {/* Rampa 1 (vest): X: 970..1012, Y: 62..116 */}
            <Path
              d="M 970 62 H 1012 M 970 66 H 1012 M 970 70 H 1012 M 970 74 H 1012 M 970 78 H 1012 M 970 82 H 1012 M 970 86 H 1012 M 970 90 H 1012 M 970 94 H 1012 M 970 98 H 1012 M 970 102 H 1012 M 970 106 H 1012 M 970 110 H 1012 M 970 114 H 1012"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării: X: 1012..1026, Y: 62..116 */}
            <Rect
              x={1012}
              y={62}
              width={14}
              height={54}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (est): X: 1026..1068, Y: 62..116 */}
            <Path
              d="M 1026 62 H 1068 M 1026 66 H 1068 M 1026 70 H 1068 M 1026 74 H 1068 M 1026 78 H 1068 M 1026 82 H 1068 M 1026 86 H 1068 M 1026 90 H 1068 M 1026 94 H 1068 M 1026 98 H 1068 M 1026 102 H 1068 M 1026 106 H 1068 M 1026 110 H 1068 M 1026 114 H 1068"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (sens urcare pe P/E1/E2, coborâre pe E3) */}
            {!isEtaj3 ? (
              <>
                <Circle cx={991.0} cy={112} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 991.0 112 L 991.0 50 A 28 15 0 0 1 1047.0 50 L 1047.0 100"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 1042.5 97 L 1047.0 107 L 1051.5 97 Z"
                  fill={walkLineColor}
                />
              </>
            ) : (
              <>
                <Circle cx={1047.0} cy={112} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 1047.0 112 L 1047.0 50 A 28 15 0 0 0 991.0 50 L 991.0 100"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 986.5 97 L 991.0 107 L 995.5 97 Z"
                  fill={walkLineColor}
                />
              </>
            )}
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 2B. CORP K SUD (Parter, Etaj 1, Etaj 2, Etaj 3)          */}
      {/* ======================================================== */}
      {hasCorpK && (
        <G id="Corp_K_Sud_Fixtures">
          {/* --- UȘA ACCES CASĂ SCĂRII CORP K (X:1068, Y:776..814) care se deschide spre vest --- */}
          <G id="Door_Stairwell_CorpK">
            <Path
              d="M 1068.0 776.0 L 1030.0 776.0"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 1030.0 776.0 A 38 38 0 0 0 1068.0 814.0"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="1068" y1="774" x2="1068" y2="778" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="1068" y1="812" x2="1068" y2="816" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- SCĂRI ÎN CERC / URCARE (X:970..1068, Y:776..866) --- */}
          <G id="Stairs_CorpK_Sud">
            {/* Contur casă scării */}
            <Rect
              x={970}
              y={776}
              width={98}
              height={90}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={2}
            />

            {/* Podest plat intermediar (spațiu de legătură la baza scării): X:970..1068, Y:830..866 */}
            <Rect
              x={970}
              y={830}
              width={98}
              height={36}
              fill={stairLandingBg}
              stroke={stairBorder}
              strokeWidth={0.8}
              rx={1}
            />

            {/* Rampa 1 (vest): X: 970..1012, Y: 776..830 */}
            <Path
              d="M 970 780 H 1012 M 970 784 H 1012 M 970 788 H 1012 M 970 792 H 1012 M 970 796 H 1012 M 970 800 H 1012 M 970 804 H 1012 M 970 808 H 1012 M 970 812 H 1012 M 970 816 H 1012 M 970 820 H 1012 M 970 824 H 1012 M 970 828 H 1012 M 970 830 H 1012"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării: X: 1012..1026, Y: 776..830 */}
            <Rect
              x={1012}
              y={776}
              width={14}
              height={54}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (est): X: 1026..1068, Y: 776..830 (doar până la Y:830) */}
            <Path
              d="M 1026 780 H 1068 M 1026 784 H 1068 M 1026 788 H 1068 M 1026 792 H 1068 M 1026 796 H 1068 M 1026 800 H 1068 M 1026 804 H 1068 M 1026 808 H 1068 M 1026 812 H 1068 M 1026 816 H 1068 M 1026 820 H 1068 M 1026 824 H 1068 M 1026 828 H 1068 M 1026 830 H 1068"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (sens urcare pe P/E1/E2, coborâre pe E3) */}
            {!isEtaj3 ? (
              <>
                <Circle cx={991.0} cy={780} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 991.0 780 L 991.0 842 A 28 15 0 0 0 1047.0 842 L 1047.0 792"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 1042.5 795 L 1047.0 785 L 1051.5 795 Z"
                  fill={walkLineColor}
                />
              </>
            ) : (
              <>
                <Circle cx={1047.0} cy={780} r={2.5} fill={walkLineColor} />
                <Path
                  d="M 1047.0 780 L 1047.0 842 A 28 15 0 0 1 991.0 842 L 991.0 792"
                  fill="none"
                  stroke={walkLineColor}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path
                  d="M 986.5 795 L 991.0 785 L 995.5 795 Z"
                  fill={walkLineColor}
                />
              </>
            )}
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 2C. AMFITEATRUL AK1 (Parter P: Uși duble + 4 Trepte)     */}
      {/* ======================================================== */}
      {isParter && (
        <G id="Amfiteatru_AK1_Fixtures">
          {/* --- INTRAREA DE NORD AK1 (X:1053.2..1063.6, Y:344.8..380.8) --- */}
          <G id="AK1_Entrance_North">
            <Rect
              x={1053.2}
              y={344.8}
              width={10.4}
              height={36.0}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.0}
            />
            <Path
              d="M 1055.8 344.8 V 380.8 M 1058.4 344.8 V 380.8 M 1061.0 344.8 V 380.8"
              stroke={treadColor}
              strokeWidth={1.0}
            />
            {/* Ușă dublă deschisă spre coridorul K (est) */}
            <Path
              d="M 1063.6 344.8 L 1081.6 344.8 M 1063.6 380.8 L 1081.6 380.8"
              stroke={doorLeafColor}
              strokeWidth={2.0}
              strokeLinecap="round"
            />
            <Path
              d="M 1081.6 344.8 A 18 18 0 0 1 1063.6 362.8"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <Path
              d="M 1081.6 380.8 A 18 18 0 0 0 1063.6 362.8"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <Line x1="1063.6" y1="343" x2="1063.6" y2="346.6" stroke={doorLeafColor} strokeWidth={2.4} />
            <Line x1="1063.6" y1="379" x2="1063.6" y2="382.6" stroke={doorLeafColor} strokeWidth={2.4} />
          </G>

          {/* --- INTRAREA DE SUD AK1 (X:1053.2..1063.6, Y:510.6..546.6) --- */}
          <G id="AK1_Entrance_South">
            <Rect
              x={1053.2}
              y={510.6}
              width={10.4}
              height={36.0}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.0}
            />
            <Path
              d="M 1055.8 510.6 V 546.6 M 1058.4 510.6 V 546.6 M 1061.0 510.6 V 546.6"
              stroke={treadColor}
              strokeWidth={1.0}
            />
            {/* Ușă dublă deschisă spre coridorul K (est) */}
            <Path
              d="M 1063.6 510.6 L 1081.6 510.6 M 1063.6 546.6 L 1081.6 546.6"
              stroke={doorLeafColor}
              strokeWidth={2.0}
              strokeLinecap="round"
            />
            <Path
              d="M 1081.6 510.6 A 18 18 0 0 1 1063.6 528.6"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <Path
              d="M 1081.6 546.6 A 18 18 0 0 0 1063.6 528.6"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.2}
              strokeDasharray="3 3"
            />
            <Line x1="1063.6" y1="508.8" x2="1063.6" y2="512.4" stroke={doorLeafColor} strokeWidth={2.4} />
            <Line x1="1063.6" y1="544.8" x2="1063.6" y2="548.4" stroke={doorLeafColor} strokeWidth={2.4} />
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 3. SCĂRI & INTRĂRI CORP I DEMISOL (B): 15 Tr, 4 Tr, Aulă */}
      {/* ======================================================== */}
      {isDemisol && (
        <G id="Demisol_Stairs_Fixtures">
          {/* --- SCARA 1 (15 Trepte spre Parter): X:919..985, Y:880..920 --- */}
          <G id="Demisol_Stairs_15Tr">
            {/* Fundal casă scării */}
            <Rect
              x={919}
              y={880}
              width={66}
              height={40}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={1}
            />

            {/* 15 trepte verticale */}
            <Path
              d="
                M 923.4 880 V 920
                M 927.8 880 V 920
                M 932.2 880 V 920
                M 936.6 880 V 920
                M 941.0 880 V 920
                M 945.4 880 V 920
                M 949.8 880 V 920
                M 954.2 880 V 920
                M 958.6 880 V 920
                M 963.0 880 V 920
                M 967.4 880 V 920
                M 971.8 880 V 920
                M 976.2 880 V 920
                M 980.6 880 V 920
                M 985.0 880 V 920
              "
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de secțiune arhitecturală (tăietură de plan diagonală dublă) */}
            <Line x1={956} y1={922} x2={962} y2={878} stroke={newelStroke} strokeWidth={1.3} />
            <Line x1={958} y1={922} x2={964} y2={878} stroke={newelStroke} strokeWidth={1.3} />

            {/* Balustrada / delimitator de-a lungul laturii de sud (Y=920) */}
            <Line x1={919} y1={920} x2={985} y2={920} stroke={walkLineColor} strokeWidth={2.0} />
            <Line x1={919} y1={918.5} x2={985} y2={918.5} stroke={walkLineColor} strokeWidth={0.8} opacity={0.6} />
            <Circle cx={919} cy={920} r={2.0} fill={walkLineColor} />
            <Circle cx={941} cy={920} r={1.5} fill={walkLineColor} />
            <Circle cx={963} cy={920} r={1.5} fill={walkLineColor} />
            <Circle cx={985} cy={920} r={2.0} fill={walkLineColor} />

            {/* Linia de mers (sens de urcare spre Parter -> spre dreapta) */}
            <Circle cx={921} cy={900} r={2.2} fill={walkLineColor} />
            <Line x1={921} y1={900} x2={981} y2={900} stroke={walkLineColor} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M 977 896.5 L 984 900 L 977 903.5 Z" fill={walkLineColor} />
          </G>

          {/* Stâlp / Pilon de colț între cele două scări: X:916..922, Y:920..929 */}
          <Rect x={916} y={920} width={6} height={9} fill={newelFill} stroke={newelStroke} strokeWidth={1.4} rx={0.5} />

          {/* --- SCARA 2 (4 Trepte - schimbare nivel Demisol -3.33 la -2.63): X:917..931, Y:929..989 --- */}
          <G id="Demisol_Stairs_4Tr">
            <Rect
              x={917}
              y={929}
              width={14}
              height={60}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.1}
              rx={1}
            />

            {/* 4 trepte verticale */}
            <Path
              d="
                M 920.5 929 V 989
                M 924.0 929 V 989
                M 927.5 929 V 989
                M 931.0 929 V 989
              "
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (urcare de la -3.33 la -2.63 -> spre stânga) */}
            <Circle cx={930} cy={959} r={2.0} fill={walkLineColor} />
            <Line x1={930} y1={959} x2={918} y2={959} stroke={walkLineColor} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 922 956.5 L 916 959 L 922 961.5 Z" fill={walkLineColor} />
          </G>

          {/* --- SCARA 3 & UȘI INTRARE AULA CONSTANTIN BELEA (X:778.5..828.5, Y:982..1033) --- */}
          <G id="Aula_Constantin_Belea_Entrance_Fixtures">
            {/* 3 trepte acces vestibul Aulă (sub badge-ul stair-B-08 la 802, 990) */}
            <Rect
              x={778.5}
              y={982.0}
              width={50.0}
              height={12.5}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.1}
              rx={1}
            />
            <Path
              d="M 778.5 986.2 H 828.5 M 778.5 990.4 H 828.5"
              stroke={treadColor}
              strokeWidth={1.1}
            />
            <Circle cx={803.5} cy={983.5} r={1.8} fill={walkLineColor} />
            <Line x1={803.5} y1={983.5} x2={803.5} y2={992.5} stroke={walkLineColor} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 800.8 990.5 L 803.5 994.8 L 806.2 990.5 Z" fill={walkLineColor} />

            {/* Ușă intrare principală Aulă (vest: X:794.5..812.5, Y:1032.5) */}
            <Path
              d="M 794.5 1032.5 L 794.5 1014.5"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 794.5 1014.5 A 18 18 0 0 1 812.5 1032.5"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="792.5" y1="1032.5" x2="796.5" y2="1032.5" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="810.5" y1="1032.5" x2="814.5" y2="1032.5" stroke={doorLeafColor} strokeWidth={2.5} />

            {/* Ușă intrare secundară Aulă (est: X:1033.7..1051.7, Y:1032.5) */}
            <Path
              d="M 1051.7 1032.5 L 1051.7 1014.5"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d="M 1051.7 1014.5 A 18 18 0 0 0 1033.7 1032.5"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            <Line x1="1031.7" y1="1032.5" x2="1035.7" y2="1032.5" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="1049.7" y1="1032.5" x2="1053.7" y2="1032.5" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 4. SCĂRI PARTER (P): 15 Tr. spre Demisol + 6 Tr. Nivel   */}
      {/* ======================================================== */}
      {isParter && (
        <G id="Parter_Stairs_To_Demisol">
          {/* Gol de scară conturat */}
          <Rect
            x={919}
            y={880}
            width={66}
            height={40}
            fill={stairBg}
            stroke={stairBorder}
            strokeWidth={1.2}
            rx={1}
          />

          {/* 15 trepte verticale */}
          <Path
            d="
              M 923.4 880 V 920
              M 927.8 880 V 920
              M 932.2 880 V 920
              M 936.6 880 V 920
              M 941.0 880 V 920
              M 945.4 880 V 920
              M 949.8 880 V 920
              M 954.2 880 V 920
              M 958.6 880 V 920
              M 963.0 880 V 920
              M 967.4 880 V 920
              M 971.8 880 V 920
              M 976.2 880 V 920
              M 980.6 880 V 920
              M 985.0 880 V 920
            "
            stroke={treadColor}
            strokeWidth={1.1}
          />

          {/* Balustradă delimitatoare de scară față de parter (latura de sud și capătul de vest) */}
          <Line x1={919} y1={920} x2={985} y2={920} stroke={walkLineColor} strokeWidth={2.0} />
          <Line x1={919} y1={918.5} x2={985} y2={918.5} stroke={walkLineColor} strokeWidth={0.8} opacity={0.6} />
          <Line x1={919} y1={880} x2={919} y2={920} stroke={walkLineColor} strokeWidth={2.0} />

          {/* Montanți balustradă */}
          <Circle cx={919} cy={880} r={2.0} fill={walkLineColor} />
          <Circle cx={919} cy={900} r={1.5} fill={walkLineColor} />
          <Circle cx={919} cy={920} r={2.0} fill={walkLineColor} />
          <Circle cx={941} cy={920} r={1.5} fill={walkLineColor} />
          <Circle cx={963} cy={920} r={1.5} fill={walkLineColor} />
          <Circle cx={985} cy={920} r={2.0} fill={walkLineColor} />

          {/* Linia de mers (sens de coborâre spre Demisol -> spre stânga) */}
          <Circle cx={983} cy={900} r={2.2} fill={walkLineColor} />
          <Line x1={983} y1={900} x2={923} y2={900} stroke={walkLineColor} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M 927 896.5 L 920 900 L 927 903.5 Z" fill={walkLineColor} />

          {/* Stâlp / Pilon de colț între cele două scări: X:916..922, Y:920..929 */}
          <Rect x={916} y={920} width={6} height={9} fill={newelFill} stroke={newelStroke} strokeWidth={1.4} rx={0.5} />

          {/* --- SCARA 2 PARTER (6 Trepte - schimbare nivel Parter ±0.00 la +1.05): X:902.4..932.4, Y:929..999 --- */}
          <G id="Parter_Stairs_6Tr">
            <Rect
              x={902.4}
              y={929}
              width={30}
              height={70}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.1}
              rx={1}
            />

            {/* 6 trepte verticale */}
            <Path
              d="
                M 907.4 929 V 999
                M 912.4 929 V 999
                M 917.4 929 V 999
                M 922.4 929 V 999
                M 927.4 929 V 999
              "
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Balustradă intermediară pe mijlocul rampei (Y=964.1) */}
            <Line x1={902.4} y1={964.1} x2={932.4} y2={964.1} stroke={walkLineColor} strokeWidth={1.2} opacity={0.75} />

            {/* Linia de mers (urcare de la ±0.00 la +1.05 -> spre vest / stânga) */}
            <Circle cx={930} cy={946} r={2.0} fill={walkLineColor} />
            <Line x1={930} y1={946} x2={905} y2={946} stroke={walkLineColor} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 909 943.5 L 903 946 L 909 948.5 Z" fill={walkLineColor} />

            <Circle cx={930} cy={982} r={2.0} fill={walkLineColor} />
            <Line x1={930} y1={982} x2={905} y2={982} stroke={walkLineColor} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 909 979.5 L 903 982 L 909 984.5 Z" fill={walkLineColor} />
          </G>
        </G>
      )}
    </G>
  );
};

export default React.memo(ArchitecturalFixtures);

