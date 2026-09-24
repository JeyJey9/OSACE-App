import React from 'react';
import { G, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';

/**
 * DebugOverlay renders navigation graph nodes, edges, IDs, and coordinates for admin inspection.
 */
const DebugOverlay = ({
  showDebugGraph,
  debugEdges,
  debugNodes,
  navNodes,
  isDark,
  onDebugNodeSelect,
}) => {
  if (!showDebugGraph) return null;

  return (
    <G id="Debug_Nav_Graph">
      {/* Liniile muchiilor */}
      <G id="Debug_Edges" pointerEvents="none">
        {debugEdges.map((e, idx) => {
          const n1 = navNodes[e.from];
          const n2 = navNodes[e.to];
          if (!n1 || !n2) return null;
          const isCrossFloor = n1.floor !== n2.floor;
          const edgeColor = isCrossFloor
            ? '#ec4899'
            : e.kind === 'corridor-room'
            ? '#10b981'
            : e.kind === 'corridor-stair'
            ? '#8b5cf6'
            : '#06b6d4';
          return (
            <Line
              key={`dbg-edge-${idx}`}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              stroke={edgeColor}
              strokeWidth={1.8}
              strokeDasharray={isCrossFloor ? '4 3' : undefined}
              opacity={0.8}
            />
          );
        })}
      </G>

      {/* Nodurile de navigație cu ID și coordonate */}
      <G id="Debug_Nodes">
        {debugNodes.map((n) => {
          const nodeColor =
            n.type === 'entrance'
              ? '#f59e0b'
              : n.type === 'stair'
              ? '#8b5cf6'
              : n.type === 'room'
              ? '#10b981'
              : '#06b6d4';

          const idText = n.id;
          const coordsText = `${Math.round(n.x)}, ${Math.round(n.y)}`;
          const badgeW = Math.max(54, idText.length * 6.5 + 10);
          const badgeH = 17;
          const badgeX = n.x - badgeW / 2;
          const badgeY = n.y - badgeH - 5;

          return (
            <G
              key={`dbg-node-${n.id}`}
              onPress={() => onDebugNodeSelect && onDebugNodeSelect(n)}
            >
              {/* Glow & Punct Nod */}
              <Circle
                cx={n.x}
                cy={n.y}
                r={8}
                fill={nodeColor}
                opacity={0.3}
              />
              <Circle
                cx={n.x}
                cy={n.y}
                r={3.8}
                fill={nodeColor}
                stroke="#ffffff"
                strokeWidth={1.2}
              />

              {/* Linie mică conector spre etichetă */}
              <Line
                x1={n.x}
                y1={n.y - 3.8}
                x2={n.x}
                y2={badgeY + badgeH}
                stroke={nodeColor}
                strokeWidth={1}
                opacity={0.8}
              />

              {/* Pill fundal etichetă */}
              <Rect
                x={badgeX}
                y={badgeY}
                width={badgeW}
                height={badgeH}
                rx={3}
                ry={3}
                fill={isDark ? '#0f172a' : '#ffffff'}
                stroke={nodeColor}
                strokeWidth={1.5}
              />

              {/* Text ID Nod */}
              <SvgText
                x={n.x}
                y={badgeY + 7}
                fill={isDark ? '#f8fafc' : '#0f172a'}
                fontSize="6"
                fontWeight="900"
                textAnchor="middle"
              >
                {idText}
              </SvgText>

              {/* Text Coordonate X, Y */}
              <SvgText
                x={n.x}
                y={badgeY + 14}
                fill={nodeColor}
                fontSize="5.2"
                fontWeight="700"
                textAnchor="middle"
              >
                {coordsText}
              </SvgText>
            </G>
          );
        })}
      </G>
    </G>
  );
};

export default React.memo(DebugOverlay);
