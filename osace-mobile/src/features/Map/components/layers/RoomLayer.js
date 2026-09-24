import React from 'react';
import { G, Path, Text as SvgText, Circle, Rect } from 'react-native-svg';

/**
 * RoomLayer renders corridors, regular rooms, room labels, and the main entrance badge.
 */
const RoomLayer = ({
  corridors,
  regularRooms,
  selectedRoomId,
  targetRoom,
  themeColors,
  isDark,
  floorId,
  onRoomSelect,
}) => {
  // Calculăm stilul pentru fiecare încăpere
  const getRoomStyle = (room) => {
    const isSelected = selectedRoomId === room.id;
    const isTarget = targetRoom?.id === room.id;

    if (isSelected || isTarget) {
      return {
        fill: themeColors.selectedFill,
        stroke: themeColors.selectedStroke,
        strokeWidth: 3,
        opacity: 0.95,
      };
    }

    const typeColor = themeColors[room.type] || themeColors.default;
    return {
      fill: typeColor,
      stroke: themeColors.stroke,
      strokeWidth: room.isTechnical ? 1.5 : 1.2,
      opacity: isDark ? 0.85 : 0.9,
    };
  };

  return (
    <>
      {/* 1. Coridoare */}
      <G id="Corridors">
        {corridors.map((corridor) => (
          <Path
            key={corridor.id}
            d={corridor.pathData}
            fill={themeColors.corridor}
            stroke={isDark ? '#334155' : '#94a3b8'}
            strokeWidth={1.2}
          />
        ))}
      </G>

      {/* 2. Săli Interactive (poligoane de fundal) */}
      <G id="Rooms">
        {regularRooms.map((room) => {
          const roomStyle = getRoomStyle(room);
          return (
            <Path
              key={room.id}
              d={room.pathData}
              fill={roomStyle.fill}
              stroke={roomStyle.stroke}
              strokeWidth={roomStyle.strokeWidth}
              opacity={roomStyle.opacity}
            />
          );
        })}
      </G>

      {/* 3. Uși și Badge Intrare Principală Demisol */}
      {floorId === 'B' && (
        <G id="Main_Entrance">
          {/* Trepte exterioare de acces */}
          <Path
            d="M 285 1083.5 L 495 1083.5 M 288 1087.5 L 492 1087.5 M 291 1091.5 L 489 1091.5"
            stroke={isDark ? '#64748b' : '#94a3b8'}
            strokeWidth={1.8}
            strokeLinecap="round"
            pointerEvents="none"
          />
          {/* 4 Uși Duble de Intrare cu deschidere arc */}
          {[310, 365, 415, 470].map((doorX, dIdx) => (
            <G key={`main-door-${dIdx}`} pointerEvents="none">
              <Path
                d={`M ${doorX - 14} 1079.7 L ${doorX - 14} 1069 A 14 14 0 0 1 ${doorX} 1079.7`}
                fill="none"
                stroke="#10b981"
                strokeWidth={1.4}
                strokeDasharray="2 2"
              />
              <Path
                d={`M ${doorX + 14} 1079.7 L ${doorX + 14} 1069 A 14 14 0 0 0 ${doorX} 1079.7`}
                fill="none"
                stroke="#10b981"
                strokeWidth={1.4}
                strokeDasharray="2 2"
              />
              <Path
                d={`M ${doorX - 14} 1079.7 L ${doorX - 14} 1069 M ${doorX + 14} 1079.7 L ${doorX + 14} 1069`}
                stroke={isDark ? '#34d399' : '#059669'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </G>
          ))}

          {/* Badge Interactiv Intrare Principală Facultate */}
          <G
            onPress={() => {
              const gd04 = regularRooms.find((r) => r.code === 'GD04' || r.id === 'room-GD04');
              if (gd04 && onRoomSelect) {
                onRoomSelect(gd04);
              }
            }}
          >
            <Circle
              cx={389.0}
              cy={1050.0}
              r={22}
              fill="#10b981"
              opacity={isDark ? 0.3 : 0.2}
            />
            <Rect
              x={389.0 - 95}
              y={1050.0 - 13}
              width={190}
              height={26}
              rx={13}
              ry={13}
              fill={isDark ? '#064e3b' : '#ecfdf5'}
              stroke="#10b981"
              strokeWidth={2}
            />
            <Circle
              cx={389.0 - 78}
              cy={1050.0}
              r={8}
              fill="#10b981"
            />
            <SvgText
              x={389.0 - 78}
              y={1050.0 + 3.5}
              fill="#ffffff"
              fontSize="10"
              textAnchor="middle"
            >
              🚪
            </SvgText>
            <SvgText
              x={389.0 + 10}
              y={1050.0 + 4}
              fill={isDark ? '#6ee7b7' : '#047857'}
              fontSize="10.5"
              fontWeight="800"
              textAnchor="middle"
            >
              INTRAREA PRINCIPALĂ
            </SvgText>
          </G>
        </G>
      )}

      {/* 4. Etichete Săli (randat deasupra pentru lizibilitate maximă) */}
      <G id="Room_Labels" pointerEvents="none">
        {regularRooms.map((room) => {
          if (!room.labelPos) return null;
          const isSelected = selectedRoomId === room.id || targetRoom?.id === room.id;
          const textStr = String(room.code || '');
          const isSanitary = room.id.includes('san') || room.code?.startsWith('GR-SAN') || room.code === 'GR. SAN.';
          const badgeW = isSanitary ? 52 : Math.max(28, textStr.length * 7.5 + 10);
          const badgeH = isSelected ? 18 : 14;

          return (
            <G key={`label-${room.id}`}>
              {(isSanitary || isSelected) && (
                <Rect
                  x={room.labelPos.x - badgeW / 2}
                  y={room.labelPos.y - badgeH / 2}
                  width={badgeW}
                  height={badgeH}
                  rx={4}
                  ry={4}
                  fill={
                    isSelected
                      ? '#0284c7'
                      : isDark
                      ? 'rgba(15, 23, 42, 0.96)'
                      : 'rgba(255, 255, 255, 0.96)'
                  }
                  stroke={
                    isSelected
                      ? '#ffffff'
                      : isSanitary
                      ? (isDark ? '#475569' : '#cbd5e1')
                      : 'none'
                  }
                  strokeWidth={1}
                />
              )}
              {!isSanitary && !isSelected && (
                <SvgText
                  x={room.labelPos.x}
                  y={room.labelPos.y + 0.5}
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth={3}
                  fill="none"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {room.code}
                </SvgText>
              )}
              <SvgText
                x={room.labelPos.x}
                y={room.labelPos.y + 0.5}
                fill={
                  isSelected
                    ? '#ffffff'
                    : isDark
                    ? '#f1f5f9'
                    : '#0f172a'
                }
                fontSize={isSelected ? '12.5' : isSanitary ? '9' : '11'}
                fontWeight={isSelected ? '800' : '700'}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {room.code}
              </SvgText>
            </G>
          );
        })}
      </G>
    </>
  );
};

export default React.memo(RoomLayer);
