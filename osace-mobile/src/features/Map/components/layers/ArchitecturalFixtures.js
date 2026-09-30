import React from 'react';
import { G, Path, Rect, Circle, Line } from 'react-native-svg';

/**
 * ArchitecturalFixtures renders architectural doors with swing arcs
 * and circular/turning stairs (trepte, parapet central și linie de mers cu sens de urcare)
 * for Corp G Sud (P, E1) and Corp K Sud (P, E1, E2, E3).
 */
const ArchitecturalFixtures = ({ floorId, isDark }) => {
  const hasCorpG = floorId === 'P' || floorId === 'E1';
  const hasCorpK = floorId === 'P' || floorId === 'E1' || floorId === 'E2' || floorId === 'E3';

  if (!hasCorpG && !hasCorpK) return null;

  // Culori adaptate la temă
  const doorLeafColor = isDark ? '#38bdf8' : '#0284c7';
  const doorArcColor = isDark ? '#64748b' : '#94a3b8';
  const stairBg = isDark ? '#161f30' : '#f8fafc';
  const stairBorder = isDark ? '#334155' : '#cbd5e1';
  const treadColor = isDark ? '#475569' : '#94a3b8';
  const newelFill = isDark ? '#0f172a' : '#e2e8f0';
  const newelStroke = isDark ? '#64748b' : '#94a3b8';
  const walkLineColor = isDark ? '#38bdf8' : '#0284c7';

  return (
    <G id="Architectural_Fixtures" pointerEvents="none">
      {/* ======================================================== */}
      {/* 1. CORP G SUD (Parter și Etaj 1)                        */}
      {/* ======================================================== */}
      {hasCorpG && (
        <G id="Corp_G_Sud_Fixtures">
          {/* --- UȘA 1: Ușă dublă coridor (X:351..409, Y:687..688) care se deschide spre toaletele de nord --- */}
          <G id="Door_Corridor_CorpG">
            {/* Foi de ușă solide */}
            <Path
              d="M 351.0 687.5 L 351.0 658.5 M 409.0 687.5 L 409.0 658.5"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            {/* Arcuri de deschidere (curbate spre nord) */}
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
            {/* Marcaje tocuri */}
            <Line x1="349" y1="687.5" x2="353" y2="687.5" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="407" y1="687.5" x2="411" y2="687.5" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

          {/* --- UȘA 2: Ușă acces casă scării (X:351, Y:689..727) care se deschide spre scări (vest) --- */}
          <G id="Door_Stairwell_CorpG">
            {/* Foaie de ușă solidă */}
            <Path
              d="M 351.0 689.0 L 313.0 689.0"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            {/* Arc de deschidere (curbat spre vest) */}
            <Path
              d="M 313.0 689.0 A 38 38 0 0 0 351.0 727.0"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            {/* Marcaje tocuri */}
            <Line x1="351" y1="687" x2="351" y2="691" stroke={doorLeafColor} strokeWidth={2.5} />
            <Line x1="351" y1="725" x2="351" y2="729" stroke={doorLeafColor} strokeWidth={2.5} />
          </G>

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

            {/* Rampa 1 (stânga): X: 270..295, Y: 732..784 */}
            <Path
              d="M 270 736 H 295 M 270 740 H 295 M 270 744 H 295 M 270 748 H 295 M 270 752 H 295 M 270 756 H 295 M 270 760 H 295 M 270 764 H 295 M 270 768 H 295 M 270 772 H 295 M 270 776 H 295 M 270 780 H 295 M 270 784 H 295"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării */}
            <Rect
              x={295}
              y={732}
              width={26}
              height={52}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (dreapta): X: 321..347, Y: 732..784 */}
            <Path
              d="M 321 736 H 347 M 321 740 H 347 M 321 744 H 347 M 321 748 H 347 M 321 752 H 347 M 321 756 H 347 M 321 760 H 347 M 321 764 H 347 M 321 768 H 347 M 321 772 H 347 M 321 776 H 347 M 321 780 H 347 M 321 784 H 347"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Podest de întoarcere în semicerc / trepte radiale: X: 270..347, Y: 784..820 */}
            <Path
              d="M 270 790 H 295 M 270 798 L 295 794 M 270 808 L 302 798 M 276 818 L 308 795 M 293 820 L 308 784 M 311 820 L 314 784 M 327 818 L 314 795 M 347 808 L 320 798 M 347 798 L 321 794 M 347 790 H 321"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (sensul de urcare în cerc) */}
            <Circle cx={282.5} cy={735} r={2.5} fill={walkLineColor} />
            <Path
              d="M 282.5 735 L 282.5 792 A 25.5 25.5 0 0 0 334.0 792 L 334.0 745"
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
            {/* Foaie de ușă solidă */}
            <Path
              d="M 1068.0 776.0 L 1030.0 776.0"
              stroke={doorLeafColor}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            {/* Arc de deschidere (curbat spre vest) */}
            <Path
              d="M 1030.0 776.0 A 38 38 0 0 0 1068.0 814.0"
              fill="none"
              stroke={doorArcColor}
              strokeWidth={1.3}
              strokeDasharray="3 3"
            />
            {/* Marcaje tocuri */}
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

            {/* Rampa 1 (vest): X: 972..1012, Y: 778..830 */}
            <Path
              d="M 972 782 H 1012 M 972 786 H 1012 M 972 790 H 1012 M 972 794 H 1012 M 972 798 H 1012 M 972 802 H 1012 M 972 806 H 1012 M 972 810 H 1012 M 972 814 H 1012 M 972 818 H 1012 M 972 822 H 1012 M 972 826 H 1012 M 972 830 H 1012"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Parapet central / ochiul scării */}
            <Rect
              x={1012}
              y={778}
              width={14}
              height={52}
              fill={newelFill}
              stroke={newelStroke}
              strokeWidth={1.4}
              rx={1}
            />

            {/* Rampa 2 (est): X: 1026..1066, Y: 778..830 */}
            <Path
              d="M 1026 782 H 1066 M 1026 786 H 1066 M 1026 790 H 1066 M 1026 794 H 1066 M 1026 798 H 1066 M 1026 802 H 1066 M 1026 806 H 1066 M 1026 810 H 1066 M 1026 814 H 1066 M 1026 818 H 1066 M 1026 822 H 1066 M 1026 826 H 1066 M 1026 830 H 1066"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Podest de întoarcere în semicerc / trepte radiale: X: 972..1066, Y: 830..866 */}
            <Path
              d="M 972 836 H 1012 M 972 844 L 1012 840 M 972 854 L 1017 843 M 978 864 L 1020 842 M 996 866 L 1020 830 M 1018 866 L 1026 830 M 1038 864 L 1026 842 M 1066 854 L 1029 843 M 1066 844 L 1026 840 M 1066 836 H 1026"
              stroke={treadColor}
              strokeWidth={1.1}
            />

            {/* Linia de mers (sensul de urcare în cerc) */}
            <Circle cx={992} cy={782} r={2.5} fill={walkLineColor} />
            <Path
              d="M 992 782 L 992 840 A 27 27 0 0 0 1046 840 L 1046 792"
              fill="none"
              stroke={walkLineColor}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            {/* Săgeată de urcare sus */}
            <Path
              d="M 1041.5 798 L 1046.0 788 L 1050.5 798 Z"
              fill={walkLineColor}
            />
          </G>
        </G>
      )}
    </G>
  );
};

export default React.memo(ArchitecturalFixtures);
