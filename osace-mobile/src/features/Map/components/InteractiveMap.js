import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { G, Path, Text as SvgText, Circle, Polyline, Rect, Line } from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { MAP_DIMENSIONS, ROOM_TYPE_COLORS, getRoomsByFloor } from '../data/buildingData';
import { floorOutlines, demisolUnfinishedAreas, demisolHatchPath } from '../data/floorOutlines';
import { floorWalls } from '../data/floorWalls';
import { getStairsByFloor } from '../data/buildingStairs';
import { NAV_NODES, NAV_EDGES } from '../data/navigationGraph';
import { useThemeColor } from '../../../constants/useThemeColor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ordinea nivelurilor de jos în sus pentru stratificarea arhitecturală (underlay)
const FLOOR_ORDER = ['B', 'P', 'E1', 'E2', 'E3'];

// Funcție ray-casting pentru verificare dacă un punct (px, py) este în interiorul unui poligon
function isPointInPolygon(px, py, vertices) {
  if (!vertices || vertices.length < 3) return false;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const InteractiveMap = forwardRef(({
  floorId = 'P',
  selectedRoomId = null,
  onRoomSelect,
  onStairSelect,
  routePoints = null,
  isNavigating = false,
  targetRoom = null,
  showWalls = true,
  showUnderlay = true,
  showDebugGraph = false,
  onDebugTap = null,
  onDebugNodeSelect = null,
  style,
}, ref) => {
  const zoomableViewRef = useRef(null);
  const lastSelectTime = useRef(0);
  const { colors, isDark } = useThemeColor();

  const themeColors = isDark ? ROOM_TYPE_COLORS.dark : ROOM_TYPE_COLORS.light;

  // Obținem contururile etajului curent
  const outlines = useMemo(() => floorOutlines[floorId] || [], [floorId]);

  // Calculăm etajul inferior vizibil în fundal ca sub-strat fantomă (ghost underlay)
  const currentFloorIndex = useMemo(() => {
    return FLOOR_ORDER.indexOf(floorId);
  }, [floorId]);

  const underlyingFloors = useMemo(() => {
    // În timpul navigării active dezactivăm complet sub-straturile pentru performanță maximă și claritate
    if (isNavigating || !showUnderlay || currentFloorIndex <= 0) return [];
    // Rendăm doar etajul direct inferior (n-1) pentru referință arhitecturală curată,
    // evitând stivuirea a până la 4 etaje simultan în SVG (care supraîncărca dispozitivul)
    return [FLOOR_ORDER[currentFloorIndex - 1]];
  }, [isNavigating, showUnderlay, currentFloorIndex]);

  // Obținem pereții interiori ai etajului curent
  const wallsPathData = useMemo(() => floorWalls[floorId] || null, [floorId]);

  // Obținem scările și conectorii verticali ai etajului curent
  const stairs = useMemo(() => getStairsByFloor(floorId), [floorId]);

  // Obținem toate încăperile pentru etajul curent
  const rooms = useMemo(() => getRoomsByFloor(floorId), [floorId]);

  // Separăm coridoarele de săli
  const { corridors, regularRooms } = useMemo(() => {
    const corr = [];
    const reg = [];
    for (const r of rooms) {
      if (r.isCorridor) {
        corr.push(r);
      } else {
        reg.push(r);
      }
    }
    return { corridors: corr, regularRooms: reg };
  }, [rooms]);

  // Nodurile de navigație pentru modul debug
  const debugNodes = useMemo(() => {
    if (!showDebugGraph) return [];
    return Object.values(NAV_NODES).filter((n) => n.floor === floorId);
  }, [showDebugGraph, floorId]);

  // Muchiile de navigație pentru modul debug
  const debugEdges = useMemo(() => {
    if (!showDebugGraph) return [];
    return NAV_EDGES.filter((e) => {
      const n1 = NAV_NODES[e.from];
      const n2 = NAV_NODES[e.to];
      return n1 && n2 && (n1.floor === floorId || n2.floor === floorId);
    });
  }, [showDebugGraph, floorId]);

  // Parsăm vârfurile poligoanelor o singură dată per etaj
  const roomsWithVertices = useMemo(() => {
    return regularRooms.map((r) => {
      const vertices = [];
      const regex = /([0-9.]+)\s+([0-9.]+)/g;
      let match;
      while ((match = regex.exec(r.pathData)) !== null) {
        vertices.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
      }
      return { ...r, vertices };
    });
  }, [regularRooms]);

  // Handler tactil pentru tap direct pe suprafața hărții
  const handleSingleTap = (event, zoomObj) => {
    if (!zoomObj) return;

    const {
      zoomLevel = 1,
      offsetX = 0,
      offsetY = 0,
      originalWidth,
      originalHeight,
      originalPageX = 0,
      originalPageY = 0,
    } = zoomObj;

    const containerWidth = originalWidth || SCREEN_WIDTH;
    const containerHeight = originalHeight || SCREEN_HEIGHT;
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    const svgCenterX = MAP_DIMENSIONS.width / 2;
    const svgCenterY = MAP_DIMENSIONS.height / 2;

    let screenX = 0;
    let screenY = 0;

    if (
      event?.nativeEvent?.pageX !== undefined &&
      event?.nativeEvent?.pageY !== undefined &&
      originalPageX !== undefined
    ) {
      screenX = event.nativeEvent.pageX - originalPageX;
      screenY = event.nativeEvent.pageY - originalPageY;
    } else if (
      event?.nativeEvent?.locationX !== undefined &&
      event?.nativeEvent?.locationY !== undefined
    ) {
      screenX = event.nativeEvent.locationX;
      screenY = event.nativeEvent.locationY;
    }

    // Conversie inversă precisă: din coordonate ecran -> coordonate interne SVG
    const svgX = (screenX - containerCenterX) / zoomLevel + svgCenterX - offsetX;
    const svgY = (screenY - containerCenterY) / zoomLevel + svgCenterY - offsetY;

    const now = Date.now();
    if (now - lastSelectTime.current < 250) return;

    // 0. În modul Debug, verificăm prioritar atingerea unui nod sau raportăm coordonatele
    if (showDebugGraph) {
      let closestNode = null;
      let minNodeDist = 20;
      for (const n of debugNodes) {
        const d = Math.hypot(svgX - n.x, svgY - n.y);
        if (d < minNodeDist) {
          closestNode = n;
          minNodeDist = d;
        }
      }
      if (closestNode) {
        lastSelectTime.current = now;
        onDebugNodeSelect && onDebugNodeSelect(closestNode);
        return;
      }
      if (onDebugTap) {
        onDebugTap({ x: Math.round(svgX), y: Math.round(svgY) });
      }
    }

    // 1. Verificare atingere pe scări și puncte de interes (prioritate mare)
    if (stairs && stairs.length > 0) {
      let foundStair = null;
      let minStairDist = 48; // toleranță generoasă în spațiul SVG
      for (const s of stairs) {
        const dx = Math.abs(svgX - s.x);
        const dy = Math.abs(svgY - s.y);
        const halfWidth = s.label && s.label.length > 5 ? s.label.length * 4.5 + 16 : 42;
        if (dx <= halfWidth && dy <= 30) {
          foundStair = s;
          break;
        }
        const dist = Math.hypot(svgX - s.x, svgY - s.y);
        if (dist <= minStairDist) {
          foundStair = s;
          minStairDist = dist;
        }
      }
      if (foundStair) {
        lastSelectTime.current = now;
        onStairSelect && onStairSelect(foundStair);
        return;
      }
    }

    // 2. Verificare atingere pe săli normale
    for (const r of roomsWithVertices) {
      if (
        svgX >= r.bounds.minX - 10 &&
        svgX <= r.bounds.maxX + 10 &&
        svgY >= r.bounds.minY - 10 &&
        svgY <= r.bounds.maxY + 10
      ) {
        if (
          isPointInPolygon(svgX, svgY, r.vertices) ||
          (r.center && Math.hypot(svgX - r.center.x, svgY - r.center.y) <= 32)
        ) {
          lastSelectTime.current = now;
          onRoomSelect && onRoomSelect(r);
          return;
        }
      }
    }
  };

  // Centrare precisă pe sală sau punct
  const focusOnPoint = (point, zoomLevel = 1.35) => {
    if (!point || !zoomableViewRef.current) return;
    const zoomable = zoomableViewRef.current;

    // Centrul SVG-ului în coordonate interne
    const contentCenterX = MAP_DIMENSIONS.width / 2; // 673.4
    const contentCenterY = MAP_DIMENSIONS.height / 2; // 696.0

    // Deplasare necesară pentru a aduce punctul în centrul viewport-ului
    // Dacă point.x < contentCenterX (stânga), targetOffsetX > 0 (deplasare spre dreapta)
    // Dacă point.x > contentCenterX (dreapta), targetOffsetX < 0 (deplasare spre stânga)
    const targetOffsetX = contentCenterX - point.x;
    // Decalăm ușor în sus (-60px) pentru ca sala să fie perfect vizibilă deasupra cardului de detalii
    const targetOffsetY = contentCenterY - point.y - 60;

    zoomable.zoomTo(zoomLevel);

    if (zoomable.panAnim) {
      Animated.timing(zoomable.panAnim, {
        toValue: { x: targetOffsetX, y: targetOffsetY },
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        zoomable.offsetX = targetOffsetX;
        zoomable.offsetY = targetOffsetY;
      });
    } else if (typeof zoomable._setNewOffsetPosition === 'function') {
      zoomable._setNewOffsetPosition(targetOffsetX, targetOffsetY);
    }
  };

  const focusOnRoom = (room, zoomLevel = 1.35) => {
    if (room?.center) {
      focusOnPoint(room.center, zoomLevel);
    }
  };

  const resetView = () => {
    if (!zoomableViewRef.current) return;
    const zoomable = zoomableViewRef.current;
    zoomable.zoomTo(0.65);
    if (zoomable.panAnim) {
      Animated.timing(zoomable.panAnim, {
        toValue: { x: 0, y: 0 },
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        zoomable.offsetX = 0;
        zoomable.offsetY = 0;
      });
    } else if (typeof zoomable._setNewOffsetPosition === 'function') {
      zoomable._setNewOffsetPosition(0, 0);
    }
  };

  useImperativeHandle(ref, () => ({
    focusOnRoom,
    focusOnPoint,
    resetView,
    zoomableViewRef,
  }));

  // Când se selectează o sală din exterior (ex: căutare), centrăm automat camera
  useEffect(() => {
    if (selectedRoomId) {
      const found = rooms.find((r) => r.id === selectedRoomId);
      if (found) {
        const timer = setTimeout(() => {
          focusOnRoom(found, 1.35);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedRoomId, floorId]);

  // Segmente de navigație contigue pentru etajul curent
  const currentFloorSegments = useMemo(() => {
    if (!routePoints || !Array.isArray(routePoints) || routePoints.length === 0) return [];
    const segments = [];
    let currentSegment = [];

    for (let i = 0; i < routePoints.length; i++) {
      const pt = routePoints[i];
      if (!pt.floor || pt.floor === floorId) {
        currentSegment.push(pt);
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    }
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
    return segments;
  }, [routePoints, floorId]);

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

  const mapBgColor = isDark ? '#0b0f19' : '#f1f5f9';
  const outlineFill = isDark ? '#161f30' : '#ffffff';
  const outlineStroke = isDark ? '#334155' : '#1e293b';

  // 0. Strat Ghost Underlays memoizat
  const memoizedGhostUnderlays = useMemo(() => {
    if (isNavigating || !showUnderlay || underlyingFloors.length === 0) return null;
    return (
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
    );
  }, [isNavigating, showUnderlay, underlyingFloors, isDark]);

  // 1. Strat Outline Clădire memoizat
  const memoizedOutlines = useMemo(() => (
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
  ), [outlines, outlineFill, outlineStroke]);

  // 1.1 Strat Demisol Foundation Slab memoizat
  const memoizedDemisolBase = useMemo(() => {
    if (floorId !== 'B' || !demisolUnfinishedAreas) return null;
    return (
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
    );
  }, [floorId, isDark]);

  // 2. Strat Coridoare memoizat
  const memoizedCorridors = useMemo(() => (
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
  ), [corridors, themeColors.corridor, isDark]);

  // 3. Strat Săli Interactive memoizat (doar poligoane fundal)
  const memoizedRooms = useMemo(() => (
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
  ), [regularRooms, selectedRoomId, targetRoom?.id, themeColors, isDark]);

  // 4.1 Strat Etichete Săli memoizat (randat deasupra pereților pentru lizibilitate maximă)
  const memoizedRoomLabels = useMemo(() => (
    <G id="Room_Labels" pointerEvents="none">
      {regularRooms.map((room) => {
        if (!room.labelPos) return null;
        const isSelected = selectedRoomId === room.id || targetRoom?.id === room.id;
        const textStr = String(room.code || '');
        const isSanitary = room.id.includes('san') || room.code === 'GR. SAN.';
        const badgeW = isSanitary ? 52 : Math.max(28, textStr.length * 7.5 + 10);
        const badgeH = isSelected ? 18 : 14;

        return (
          <G key={`label-${room.id}`}>
            {/* Pill de fundal pentru grupuri sanitare sau sala selectată, acoperind orice linie de perete */}
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
            {/* Halo text pentru sălile obișnuite */}
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
  ), [regularRooms, selectedRoomId, targetRoom?.id, isDark]);

  // 4. Strat Pereți Interiori memoizat
  const memoizedWalls = useMemo(() => {
    if (!showWalls || !wallsPathData) return null;
    return (
      <G id="Walls">
        <Path
          d={wallsPathData}
          fill="none"
          stroke={isDark ? '#64748b' : '#3f4652'}
          strokeWidth={2.2}
          strokeLinecap="square"
        />
      </G>
    );
  }, [showWalls, wallsPathData, isDark]);

  // 4.0 Strat Uși și Badge Intrare Principală Demisol memoizat
  const memoizedMainEntrance = useMemo(() => {
    if (floorId !== 'B') return null;
    return (
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
            const gd04 = rooms.find((r) => r.code === 'GD04' || r.id === 'room-GD04');
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
    );
  }, [floorId, isDark, onRoomSelect, rooms]);

  // 4.1 Strat Scări / Conectori Verticali memoizat
  const memoizedStairs = useMemo(() => {
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
  }, [stairs, isDark]);

  // 5. Strat Navigație (Rutare activă de înaltă performanță - static GPU accelerated)
  const memoizedRouteLayer = useMemo(() => {
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
  }, [currentFloorSegments, routePoints]);

  // 6. Strat Debug Graf Navigație memoizat
  const memoizedDebugGraph = useMemo(() => {
    if (!showDebugGraph) return null;
    return (
      <G id="Debug_Nav_Graph">
        {/* Liniile muchiilor */}
        <G id="Debug_Edges" pointerEvents="none">
          {debugEdges.map((e, idx) => {
            const n1 = NAV_NODES[e.from];
            const n2 = NAV_NODES[e.to];
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
  }, [showDebugGraph, debugEdges, debugNodes, isDark, onDebugNodeSelect]);

  return (
    <View style={[styles.container, { backgroundColor: mapBgColor }, style]}>
      <ReactNativeZoomableView
        ref={zoomableViewRef}
        maxZoom={3.5}
        minZoom={0.35}
        initialZoom={0.65}
        bindToBorders={false}
        contentWidth={MAP_DIMENSIONS.width}
        contentHeight={MAP_DIMENSIONS.height}
        onSingleTap={handleSingleTap}
        doubleTapDelay={150}
        onMoveShouldSetPanResponderCapture={(evt, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4
        }
      >
        <Svg
          width={MAP_DIMENSIONS.width}
          height={MAP_DIMENSIONS.height}
          viewBox={MAP_DIMENSIONS.viewBox}
          pointerEvents="none"
        >
          {/* 0. Strat Ghost Underlays */}
          {memoizedGhostUnderlays}

          {/* 1. Strat Outline Clădire */}
          {memoizedOutlines}

          {/* 1.1 Strat Demisol Foundation Slab */}
          {memoizedDemisolBase}

          {/* 2. Strat Coridoare */}
          {memoizedCorridors}

          {/* 3. Strat Săli Interactive */}
          {memoizedRooms}

          {/* 4. Strat Pereți Interiori */}
          {memoizedWalls}

          {/* 4.0 Strat Uși și Badge Intrare Principală Demisol */}
          {memoizedMainEntrance}

          {/* 4.1 Strat Etichete Săli (Text deasupra pereților) */}
          {memoizedRoomLabels}

          {/* 4.2 Strat Scări / Conectori Verticali */}
          {memoizedStairs}

          {/* 5. Strat Navigație (Rutare activă de înaltă performanță) */}
          {memoizedRouteLayer}

          {/* 6. Strat Debug Graf Navigație */}
          {memoizedDebugGraph}
        </Svg>
      </ReactNativeZoomableView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default React.memo(InteractiveMap);