import React from 'react';
import { G, Path, Rect, Circle, Line, Text as SvgText } from 'react-native-svg';

/**
 * ArchitecturalFixtures renders architectural doors with swing arcs,
 * circular/turning stairs (trepte, parapet central, podest plat și linie de mers),
 * vertical connectors between Demisol and Parter (15 trepte cu balustradă)
 * and internal Demisol level stairs (4 trepte).
 */
const ArchitecturalFixtures = ({ floorId, isDark }) => {
  const hasCorpG = floorId === 'P' || floorId === 'E1';
  const hasCorpK = floorId === 'P' || floorId === 'E1' || floorId === 'E2' || floorId === 'E3';
  const isDemisol = floorId === 'B';
  const isParter = floorId === 'P';

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
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <G id="Architectural_Fixtures" pointerEvents="none">
      {/* ======================================================== */}
      {/* 1. CORP G SUD (Parter și Etaj 1)                        */}
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

            {/* Linia de mers (sensul de urcare în cerc: coborâre pe rampa 1, viraj pe podestul plat, urcare pe rampa 2) */}
            <Circle cx={283.5} cy={735} r={2.5} fill={walkLineColor} />
            <Path
              d="M 283.5 735 L 283.5 794 A 25.25 15 0 0 0 334.0 794 L 334.0 745"
              fill="none"
              stroke={walkLineColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            {/* Săgeată de urcare sus */}
            <Path
              d="M 329.5 748 L 334.0 738 L 338.5 748 Z"
              fill={walkLineColor}
            />
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 2. CORP K SUD (Parter, Etaj 1, Etaj 2, Etaj 3)           */}
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

            {/* Linia de mers (sensul de urcare în cerc) */}
            <Circle cx={991.0} cy={780} r={2.5} fill={walkLineColor} />
            <Path
              d="M 991.0 780 L 991.0 842 A 28 15 0 0 0 1047.0 842 L 1047.0 792"
              fill="none"
              stroke={walkLineColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            {/* Săgeată de urcare sus */}
            <Path
              d="M 1042.5 795 L 1047.0 785 L 1051.5 795 Z"
              fill={walkLineColor}
            />
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 3. SCĂRI CORP I DEMISOL (B): 15 Tr. spre Parter + 4 Tr.  */}
      {/* ======================================================== */}
      {isDemisol && (
        <G id="Demisol_Stairs_Fixtures">
          {/* --- SCARA 1 (15 Trepte spre Parter): X:921..985, Y:785..825 --- */}
          <G id="Demisol_Stairs_15Tr">
            {/* Fundal casă scării */}
            <Rect
              x={921}
              y={785}
              width={64}
              height={40}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.2}
              rx={1}
            />

            {/* 15 trepte verticale */}
            <Path
              d="
                M 925.3 785 V 825
                M 929.5 785 V 825
                M 933.8 785 V 825
                M 938.0 785 V 825
                M 942.3 785 V 825
                M 946.5 785 V 825
                M 950.8 785 V 825
                M 955.0 785 V 825
                M 959.3 785 V 825
                M 963.5 785 V 825
                M 967.8 785 V 825
                M 972.0 785 V 825
                M 976.3 785 V 825
                M 980.5 785 V 825
                M 984.8 785 V 825
              "
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de secțiune arhitecturală (tăietură de plan diagonală dublă) */}
            <Line x1={958} y1={827} x2={964} y2={783} stroke={newelStroke} strokeWidth={1.3} />
            <Line x1={960} y1={827} x2={966} y2={783} stroke={newelStroke} strokeWidth={1.3} />

            {/* Balustrada / delimitator de-a lungul laturii de sud (Y=825) */}
            <Line x1={921} y1={825} x2={985} y2={825} stroke={walkLineColor} strokeWidth={2.0} />
            <Line x1={921} y1={823.5} x2={985} y2={823.5} stroke={walkLineColor} strokeWidth={0.8} opacity={0.6} />
            <Circle cx={921} cy={825} r={2.0} fill={walkLineColor} />
            <Circle cx={942} cy={825} r={1.5} fill={walkLineColor} />
            <Circle cx={963} cy={825} r={1.5} fill={walkLineColor} />
            <Circle cx={985} cy={825} r={2.0} fill={walkLineColor} />

            {/* Linia de mers (sens de urcare spre Parter -> spre dreapta) */}
            <Circle cx={923} cy={805} r={2.2} fill={walkLineColor} />
            <Line x1={923} y1={805} x2={981} y2={805} stroke={walkLineColor} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M 977 801.5 L 984 805 L 977 808.5 Z" fill={walkLineColor} />

            {/* Etichetă */}
            <SvgText x={938} y={799} fill={labelColor} fontSize="6" fontWeight="700">15 Tr.</SvgText>
          </G>

          {/* Stâlp / Pilon de colț între cele două scări: X:918..924, Y:825..835 */}
          <Rect x={918} y={825} width={6} height={10} fill={newelFill} stroke={newelStroke} strokeWidth={1.4} rx={0.5} />

          {/* --- SCARA 2 (4 Trepte - schimbare nivel Demisol -3.33 la -2.63): X:921..937, Y:835..905 --- */}
          <G id="Demisol_Stairs_4Tr">
            <Rect
              x={921}
              y={835}
              width={16}
              height={70}
              fill={stairBg}
              stroke={stairBorder}
              strokeWidth={1.1}
              rx={1}
            />

            {/* 4 trepte verticale */}
            <Path
              d="
                M 925 835 V 905
                M 929 835 V 905
                M 933 835 V 905
                M 937 835 V 905
              "
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (urcare de la -3.33 la -2.63 -> spre stânga) */}
            <Circle cx={935} cy={870} r={2.0} fill={walkLineColor} />
            <Line x1={935} y1={870} x2={923} y2={870} stroke={walkLineColor} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M 926 867.5 L 920 870 L 926 872.5 Z" fill={walkLineColor} />

            {/* Etichetă */}
            <SvgText x={929} y={855} fill={labelColor} fontSize="5.5" fontWeight="700" textAnchor="middle">4 Tr.</SvgText>
          </G>
        </G>
      )}

      {/* ======================================================== */}
      {/* 4. SCARĂ PARTER (P): 15 Tr. spre Demisol cu Balustradă   */}
      {/* ======================================================== */}
      {isParter && (
        <G id="Parter_Stairs_To_Demisol">
          {/* Gol de scară conturat */}
          <Rect
            x={921}
            y={785}
            width={64}
            height={40}
            fill={stairBg}
            stroke={stairBorder}
            strokeWidth={1.2}
            rx={1}
          />

          {/* 15 trepte verticale */}
          <Path
            d="
              M 925.3 785 V 825
              M 929.5 785 V 825
              M 933.8 785 V 825
              M 938.0 785 V 825
              M 942.3 785 V 825
              M 946.5 785 V 825
              M 950.8 785 V 825
              M 955.0 785 V 825
              M 959.3 785 V 825
              M 963.5 785 V 825
              M 967.8 785 V 825
              M 972.0 785 V 825
              M 976.3 785 V 825
              M 980.5 785 V 825
              M 984.8 785 V 825
            "
            stroke={treadColor}
            strokeWidth={1.1}
          />

          {/* Balustradă delimitatoare de scară față de parter (latura de sud și capătul de vest) */}
          <Line x1={921} y1={825} x2={985} y2={825} stroke={walkLineColor} strokeWidth={2.0} />
          <Line x1={921} y1={823.5} x2={985} y2={823.5} stroke={walkLineColor} strokeWidth={0.8} opacity={0.6} />
          <Line x1={921} y1={785} x2={921} y2={825} stroke={walkLineColor} strokeWidth={2.0} />

          {/* Montanți balustradă */}
          <Circle cx={921} cy={785} r={2.0} fill={walkLineColor} />
          <Circle cx={921} cy={805} r={1.5} fill={walkLineColor} />
          <Circle cx={921} cy={825} r={2.0} fill={walkLineColor} />
          <Circle cx={942} cy={825} r={1.5} fill={walkLineColor} />
          <Circle cx={963} cy={825} r={1.5} fill={walkLineColor} />
          <Circle cx={985} cy={825} r={2.0} fill={walkLineColor} />

          {/* Linia de mers (sens de coborâre spre Demisol -> spre stânga) */}
          <Circle cx={983} cy={805} r={2.2} fill={walkLineColor} />
          <Line x1={983} y1={805} x2={925} y2={805} stroke={walkLineColor} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M 929 801.5 L 922 805 L 929 808.5 Z" fill={walkLineColor} />

          {/* Etichetă */}
          <SvgText x={968} y={799} fill={labelColor} fontSize="6" fontWeight="700" textAnchor="end">15 Tr.</SvgText>
        </G>
      )}
    </G>
  );
};

export default React.memo(ArchitecturalFixtures);
