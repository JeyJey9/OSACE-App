import React from 'react';
import { G, Polyline, Circle } from 'react-native-svg';

/**
 * RouteOverlay renders active multi-layer navigation paths and start/end pins.
 */
const RouteOverlay = ({ currentFloorSegments, routePoints }) => {
  if (!currentFloorSegments || currentFloorSegments.length === 0) return null;

  return (
    <G id="Navigation_Route" pointerEvents="none">
      {currentFloorSegments.map((segment, segIdx) => {
        if (segment.length === 0) return null;
        const pointsString = segment.map((p) => `${p.x},${p.y}`).join(' ');
        const firstNode = segment[0];
        const lastNode = segment[segment.length - 1];

        const isStartNodeOfTotal = routePoints && routePoints[0]?.id === firstNode?.id;
        const isEndNodeOfTotal = routePoints && routePoints[routePoints.length - 1]?.id === lastNode?.id;

        return (
          <G key={`route-segment-${segIdx}`}>
            {/* Linia de traseu este randată dacă segmentul conține cel puțin 2 noduri */}
            {segment.length >= 2 && (
              <>
                {/* Layer 1: Glow exterior / Halo de fundal pentru vizibilitate maximă */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth={10}
                  strokeOpacity={0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 2: Traseu principal vibrant */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Layer 3: Ghidaj central punctat pentru orientare intuitivă */}
                <Polyline
                  points={pointsString}
                  fill="none"
                  stroke="#e0f2fe"
                  strokeWidth={2}
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Pin Start pe acest segment de etaj */}
            <G key={`start-marker-${segIdx}`}>
              <Circle
                cx={firstNode.x}
                cy={firstNode.y}
                r={13}
                fill={isStartNodeOfTotal ? '#10b981' : '#0284c7'}
                opacity={0.25}
              />
              <Circle
                cx={firstNode.x}
                cy={firstNode.y}
                r={7.5}
                fill={isStartNodeOfTotal ? '#10b981' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth={2.5}
              />
              <Circle
                cx={firstNode.x}
                cy={firstNode.y}
                r={3}
                fill="#ffffff"
              />
            </G>

            {/* Pin Sosire / Schimbare etaj pe acest segment */}
            {segment.length >= 2 && (
              <G key={`end-marker-${segIdx}`}>
                <Circle
                  cx={lastNode.x}
                  cy={lastNode.y}
                  r={13}
                  fill={isEndNodeOfTotal ? '#ef4444' : '#f59e0b'}
                  opacity={0.25}
                />
                <Circle
                  cx={lastNode.x}
                  cy={lastNode.y}
                  r={7.5}
                  fill={isEndNodeOfTotal ? '#ef4444' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
                <Circle
                  cx={lastNode.x}
                  cy={lastNode.y}
                  r={3}
                  fill="#ffffff"
                />
              </G>
            )}
          </G>
        );
      })}
    </G>
  );
};

export default React.memo(RouteOverlay);
