import React, { useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import { floorOutlines, demisolUnfinishedAreas, demisolHatchPath } from '../../data/floorOutlines';
import { floorWalls } from '../../data/floorWalls';

/**
 * FloorBaseLayer renders architectural outlines, ghost underlays from lower floors,
 * Demisol slab fills, and interior walls.
 */
const FloorBaseLayer = ({
  floorId,
  underlyingFloors = [],
  showWalls = true,
  showUnderlay = true,
  isNavigating = false,
  isDark = false,
}) => {
  const outlines = useMemo(() => floorOutlines[floorId] || [], [floorId]);
  const wallsPathData = useMemo(() => (showWalls ? floorWalls[floorId] || null : null), [floorId, showWalls]);

  const outlineFill = isDark ? '#161f30' : '#ffffff';
  const outlineStroke = isDark ? '#334155' : '#1e293b';

  return (
    <>
      {/* 0. Strat Ghost Underlays */}
      {!isNavigating && showUnderlay && underlyingFloors.length > 0 && (
        <G id="Ghost_Underlays" pointerEvents="none">
          {underlyingFloors.map((underFloorId) => {
            const underPaths = floorOutlines[underFloorId] || [];
            return underPaths.map((d, i) => (
              <Path
                key={`ghost-${underFloorId}-${i}`}
                d={d}
                fill={isDark ? 'rgba(30, 41, 59, 0.22)' : 'rgba(226, 232, 240, 0.4)'}
                stroke={isDark ? '#64748b' : '#94a3b8'}
                strokeWidth={1.8}
                strokeDasharray="6 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.45}
              />
            ));
          })}
        </G>
      )}

      {/* 1. Strat Outline Clădire */}
      <G id="Building_Outline">
        {outlines.map((d, index) => (
          <Path
            key={`outline-${index}`}
            d={d}
            fill={outlineFill}
            stroke={outlineStroke}
            strokeWidth={4.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </G>

      {/* 1.1 Strat Demisol Foundation Slab */}
      {floorId === 'B' && demisolUnfinishedAreas && (
        <G id="Demisol_Base">
          {demisolUnfinishedAreas.map((d, index) => (
            <Path
              key={`demisol-unfinished-${index}`}
              d={d}
              fill={isDark ? '#1e293b' : '#e2e8f0'}
              fillOpacity={0.65}
              stroke={isDark ? '#334155' : '#94a3b8'}
              strokeWidth={1.2}
            />
          ))}
          {demisolHatchPath && (
            <Path
              d={demisolHatchPath}
              stroke={isDark ? '#475569' : '#94a3b8'}
              strokeWidth={0.9}
              strokeOpacity={0.7}
            />
          )}
        </G>
      )}

      {/* 4. Strat Pereți Interiori */}
      {showWalls && wallsPathData && (
        <G id="Walls">
          <Path
            d={wallsPathData}
            fill="none"
            stroke={isDark ? '#64748b' : '#3f4652'}
            strokeWidth={2.2}
            strokeLinecap="square"
          />
        </G>
      )}
    </>
  );
};

export default React.memo(FloorBaseLayer);
