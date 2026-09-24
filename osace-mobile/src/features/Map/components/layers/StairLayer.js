import React from 'react';
import { G, Circle, Rect, Text as SvgText } from 'react-native-svg';

/**
 * StairLayer renders vertical stair connectors and points of interest.
 */
const StairLayer = ({ stairs, isDark }) => {
  if (!stairs || stairs.length === 0) return null;

  return (
    <G id="Stairs">
      {stairs.map((stair) => {
        const isPOI = stair.type === 'poi' || stair.direction === 'none';
        const isUp = stair.direction === 'up';
        const isDown = stair.direction === 'down';
        const dirSymbol = isPOI ? '➜' : isUp ? '▲' : isDown ? '▼' : '⇅';
        const dirColor = isPOI ? '#8b5cf6' : isUp ? '#10b981' : isDown ? '#f59e0b' : '#3b82f6';

        const badgeWidth = isPOI
          ? Math.max(80, stair.label.length * 8 + 28)
          : Math.max(46, stair.label.length * 8 + 26);
        const badgeHeight = 22;
        const badgeX = stair.x - badgeWidth / 2;
        const badgeY = stair.y - badgeHeight / 2;

        return (
          <G key={stair.id}>
            <Circle
              cx={stair.x}
              cy={stair.y}
              r={16}
              fill={dirColor}
              opacity={isDark ? 0.25 : 0.18}
            />
            <Rect
              x={badgeX}
              y={badgeY}
              width={badgeWidth}
              height={badgeHeight}
              rx={11}
              ry={11}
              fill={isDark ? '#1e293b' : '#ffffff'}
              stroke={dirColor}
              strokeWidth={2}
            />
            <Circle
              cx={badgeX + 11}
              cy={stair.y}
              r={7}
              fill={dirColor}
            />
            <SvgText
              x={badgeX + 11}
              y={stair.y + 1}
              fill="#ffffff"
              fontSize="8"
              fontWeight="900"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {dirSymbol}
            </SvgText>
            <SvgText
              x={badgeX + 11 + (badgeWidth - 11) / 2}
              y={stair.y + 1}
              fill={isDark ? '#f8fafc' : '#0f172a'}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {stair.label}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
};

export default React.memo(StairLayer);
