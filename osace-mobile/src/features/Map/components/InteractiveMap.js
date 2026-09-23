import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { G, Path, Text as SvgText, Circle, Polyline, Rect } from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { MAP_DIMENSIONS, ROOM_TYPE_COLORS, getRoomsByFloor } from '../data/buildingData';
import { floorOutlines, demisolUnfinishedAreas } from '../data/floorOutlines';
import { floorWalls } from '../data/floorWalls';
import { getStairsByFloor } from '../data/buildingStairs';
import { useThemeColor } from '../../../constants/useThemeColor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

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
  style,
}, ref) => {
  const zoomableViewRef = useRef(null);
  const dashOffset = useRef(new Animated.Value(0)).current;
  const lastSelectTime = useRef(0);
  const { colors, isDark } = useThemeColor();

  const themeColors = isDark ? ROOM_TYPE_COLORS.dark : ROOM_TYPE_COLORS.light;

  // Animație linie navigație când navigarea este activă
  useEffect(() => {
    if (isNavigating && routePoints && routePoints.length > 0) {
      dashOffset.setValue(0);
      const animation = Animated.loop(
        Animated.timing(dashOffset, {
          toValue: -24,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      dashOffset.stopAnimation();
    }
  }, [isNavigating, routePoints]);

  // Obținem contururile etajului curent
  const outlines = useMemo(() => floorOutlines[floorId] || [], [floorId]);

  // Calculăm etajele inferioare vizibile în fundal ca sub-strat fantomă (ghost underlay)
  const currentFloorIndex = useMemo(() => {
    return FLOOR_ORDER.indexOf(floorId);
  }, [floorId]);

  const underlyingFloors = useMemo(() => {
    if (currentFloorIndex <= 0) return [];
    return FLOOR_ORDER.slice(0, currentFloorIndex);
  }, [currentFloorIndex]);

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

  // Puncte navigație pentru etajul curent
  const currentFloorRoute = useMemo(() => {
    if (!routePoints || !Array.isArray(routePoints)) return null;
    return routePoints.filter((pt) => !pt.floor || pt.floor === floorId);
  }, [routePoints, floorId]);

  const routePolylineString = useMemo(() => {
    if (!currentFloorRoute || currentFloorRoute.length < 2) return '';
    return currentFloorRoute.map((p) => `${p.x},${p.y}`).join(' ');
  }, [currentFloorRoute]);

  // Verificăm dacă începutul sau sfârșitul întregului traseu este pe acest etaj
  const isStartOfTotalRoute = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return false;
    return routePoints[0].floor === floorId;
  }, [routePoints, floorId]);

  const isEndOfTotalRoute = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return false;
    return routePoints[routePoints.length - 1].floor === floorId;
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
          {/* 0. Strat Ghost Underlays (contururi și pereți exteriori etaje inferioare) */}
          {showUnderlay && underlyingFloors.length > 0 && (
            <G id="Ghost_Underlays" pointerEvents="none">
              {underlyingFloors.map((underFloorId) => {
                const underFloorIndex = FLOOR_ORDER.indexOf(underFloorId);
                const distanceBelow = currentFloorIndex - underFloorIndex;
                const baseOpacity =
                  distanceBelow === 1 ? 0.6 :
                  distanceBelow === 2 ? 0.45 :
                  distanceBelow === 3 ? 0.35 : 0.25;

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
                    opacity={baseOpacity}
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

          {/* 1.1 Strat Demisol Foundation Slab (corpuri G, K și canal tehnic) */}
          {floorId === 'B' && demisolUnfinishedAreas && (
            <G id="Demisol_Base">
              {demisolUnfinishedAreas.map((d, index) => (
                <Path
                  key={`demisol-unfinished-${index}`}
                  d={d}
                  fill={themeColors.corridor}
                  stroke={isDark ? '#334155' : '#94a3b8'}
                  strokeWidth={1.2}
                />
              ))}
            </G>
          )}

          {/* 2. Strat Coridoare */}
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

          {/* 3. Strat Săli Interactive */}
          <G id="Rooms">
            {regularRooms.map((room) => {
              const roomStyle = getRoomStyle(room);
              const isSelected = selectedRoomId === room.id || targetRoom?.id === room.id;

              return (
                <G key={room.id}>
                  <Path
                    d={room.pathData}
                    fill={roomStyle.fill}
                    stroke={roomStyle.stroke}
                    strokeWidth={roomStyle.strokeWidth}
                    opacity={roomStyle.opacity}
                  />

                  {/* Etichetă Cod Sală */}
                  {room.labelPos && (
                    <SvgText
                      x={room.labelPos.x}
                      y={room.labelPos.y}
                      fill={
                        isSelected
                          ? '#ffffff'
                          : isDark
                          ? '#e2e8f0'
                          : '#1e293b'
                      }
                      fontSize={isSelected ? '14' : '11'}
                      fontWeight={isSelected ? '800' : '700'}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {room.code}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </G>

          {/* 4. Strat Pereți Interiori (Walls Layer) */}
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

          {/* 4.0 Strat Uși și Badge Intrare Principală Demisol */}
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
                  const gd04 = rooms.find((r) => r.code === 'GD04' || r.id === 'room-GD04');
                  if (gd04 && onRoomSelect) {
                    onRoomSelect(gd04);
                  }
                }}
              >
                {/* Glow verde smarald */}
                <Circle
                  cx={389.0}
                  cy={1050.0}
                  r={22}
                  fill="#10b981"
                  opacity={isDark ? 0.3 : 0.2}
                />
                {/* Container Badge Pill */}
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
                {/* Icon cerc ușă */}
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
                {/* Text Badge */}
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

          {/* 4.1 Strat Scări / Conectori Verticali */}
          {stairs && stairs.length > 0 && (
            <G id="Stairs">
              {stairs.map((stair) => {
                const isPOI = stair.type === 'poi' || stair.direction === 'none';
                const isUp = stair.direction === 'up';
                const isDown = stair.direction === 'down';
                const dirSymbol = isPOI ? '➜' : isUp ? '▲' : isDown ? '▼' : '⇅';
                const dirColor = isPOI ? '#8b5cf6' : isUp ? '#10b981' : isDown ? '#f59e0b' : '#3b82f6';

                // Dimensiuni badge
                const badgeWidth = isPOI
                  ? Math.max(80, stair.label.length * 8 + 28)
                  : Math.max(46, stair.label.length * 8 + 26);
                const badgeHeight = 22;
                const badgeX = stair.x - badgeWidth / 2;
                const badgeY = stair.y - badgeHeight / 2;

                return (
                  <G key={stair.id}>
                    {/* Halo / Glow circular de fundal */}
                    <Circle
                      cx={stair.x}
                      cy={stair.y}
                      r={16}
                      fill={dirColor}
                      opacity={isDark ? 0.25 : 0.18}
                    />

                    {/* Pill Badge Container */}
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

                    {/* Indicator Cerc Direcție */}
                    <Circle
                      cx={badgeX + 11}
                      cy={stair.y}
                      r={7}
                      fill={dirColor}
                    />

                    {/* Simbol Direcție (▲ / ▼ / ⇅) */}
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

                    {/* Etichetă Etaj Destinație (P, B, E1, E1–E3, etc.) */}
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
          )}

          {/* 5. Strat Navigație (Rutare activă) */}
          {routePolylineString !== '' && (
            <G id="Navigation_Route">
              {/* Linia de traseu cu animație dash */}
              <AnimatedPolyline
                points={routePolylineString}
                fill="none"
                stroke="#0284c7"
                strokeWidth={5}
                strokeDasharray="14, 8"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {currentFloorRoute && currentFloorRoute.length > 0 && (
                <>
                  {/* Nod de Start pe acest etaj */}
                  <Circle
                    cx={currentFloorRoute[0].x}
                    cy={currentFloorRoute[0].y}
                    r={8}
                    fill={isStartOfTotalRoute ? '#10b981' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth={2.5}
                  />

                  {/* Nod de Sosire / Ieșire pe acest etaj */}
                  <Circle
                    cx={currentFloorRoute[currentFloorRoute.length - 1].x}
                    cy={currentFloorRoute[currentFloorRoute.length - 1].y}
                    r={8}
                    fill={isEndOfTotalRoute ? '#ef4444' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth={2.5}
                  />
                </>
              )}
            </G>
          )}
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

export default InteractiveMap;