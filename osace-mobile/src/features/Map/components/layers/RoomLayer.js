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

          // Detectare toalete / grupuri sanitare
          const isToilet =
            Boolean(room.restroomType) ||
            room.id.includes('san') ||
            room.code?.startsWith('GR-SAN') ||
            room.code === 'GR. SAN.' ||
            /wc|toalet|sanitar/i.test(room.name || '') ||
            /wc|toalet|sanitar/i.test(room.code || '') ||
            (room.type === 'service' && !/birou|tehnic/i.test(room.name || ''));

          let toiletType = room.restroomType;
          if (isToilet && !toiletType) {
            const lower = `${room.name || ''} ${room.code || ''}`.toLowerCase();
            if (/b[ăa]ie[țt]i|b[ăa]rba[țt]i/i.test(lower)) toiletType = 'male';
            else if (/fete|femei|doamne/i.test(lower)) toiletType = 'female';
            else if (/handicap|dizabilit|accesibil/i.test(lower)) toiletType = 'accessible';
          }

          // Text etichetă vizuală afișată pe hartă
          let displayLabel = String(room.code || '');
          if (isToilet) {
            if (toiletType === 'male') {
              displayLabel = 'WC BĂIEȚI';
            } else if (toiletType === 'female') {
              displayLabel = 'WC FETE';
            } else if (toiletType === 'accessible') {
              displayLabel = 'WC ACCESIBIL';
            } else {
              displayLabel = 'WC';
            }
          }

          // Dimensiuni badge
          let badgeW;
          const badgeH = isSelected ? 18 : 15;
          let fontSize;

          if (isToilet) {
            if (toiletType === 'accessible') {
              badgeW = isSelected ? 82 : 76;
              fontSize = isSelected ? '9.5' : '8.5';
            } else if (toiletType === 'male') {
              badgeW = isSelected ? 72 : 66;
              fontSize = isSelected ? '10.5' : '9.5';
            } else if (toiletType === 'female') {
              badgeW = isSelected ? 62 : 56;
              fontSize = isSelected ? '10.5' : '9.5';
            } else {
              badgeW = isSelected ? 40 : 34;
              fontSize = isSelected ? '11' : '10';
            }
          } else {
            badgeW = Math.max(28, displayLabel.length * 7.5 + 10);
            fontSize = isSelected ? '12.5' : '11';
          }

          // Culori badge și text
          let badgeFill, badgeStroke, textFill;
          if (isSelected) {
            badgeFill = '#0284c7';
            badgeStroke = '#ffffff';
            textFill = '#ffffff';
          } else if (isToilet) {
            if (toiletType === 'male') {
              badgeFill = isDark ? 'rgba(2, 132, 199, 0.25)' : '#f0f9ff';
              badgeStroke = isDark ? '#38bdf8' : '#0284c7';
              textFill = isDark ? '#7dd3fc' : '#0369a1';
            } else if (toiletType === 'female') {
              badgeFill = isDark ? 'rgba(236, 72, 153, 0.25)' : '#fdf2f8';
              badgeStroke = isDark ? '#f472b6' : '#ec4899';
              textFill = isDark ? '#f9a8d4' : '#be185d';
            } else if (toiletType === 'accessible') {
              badgeFill = isDark ? 'rgba(16, 185, 129, 0.25)' : '#ecfdf5';
              badgeStroke = isDark ? '#34d399' : '#10b981';
              textFill = isDark ? '#6ee7b7' : '#047857';
            } else {
              badgeFill = isDark ? 'rgba(100, 116, 139, 0.3)' : '#f8fafc';
              badgeStroke = isDark ? '#94a3b8' : '#64748b';
              textFill = isDark ? '#e2e8f0' : '#334155';
            }
          }

          return (
            <G key={`label-${room.id}`}>
              {(isToilet || isSelected) && (
                <Rect
                  x={room.labelPos.x - badgeW / 2}
                  y={room.labelPos.y - badgeH / 2}
                  width={badgeW}
                  height={badgeH}
                  rx={4}
                  ry={4}
                  fill={badgeFill}
                  stroke={badgeStroke}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
              )}
              {!isToilet && !isSelected && (
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
                  {displayLabel}
                </SvgText>
              )}
              <SvgText
                x={room.labelPos.x}
                y={room.labelPos.y + 0.5}
                fill={isSelected ? '#ffffff' : isToilet ? textFill : isDark ? '#f1f5f9' : '#0f172a'}
                fontSize={fontSize}
                fontWeight={isSelected ? '800' : '700'}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {displayLabel}
              </SvgText>
            </G>
          );
        })}
      </G>
    </>
  );
};

export default React.memo(RoomLayer);
