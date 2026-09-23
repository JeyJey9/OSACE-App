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

const InteractiveMap = forwardRef(({
  floorId = 'P',
  selectedRoomId = null,
  onRoomSelect,
  onStairSelect,
  routePoints = null,
  isNavigating = false,
  targetRoom = null,
  showWalls = true,
  style,
}, ref) => {
  const zoomableViewRef = useRef(null);
  const dashOffset = useRef(new Animated.Value(0)).current;
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
      >
        <Svg
          width={MAP_DIMENSIONS.width}
          height={MAP_DIMENSIONS.height}
          viewBox={MAP_DIMENSIONS.viewBox}
        >
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
            <G id="Demisol_Base" pointerEvents="none">
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
                    onPress={() => onRoomSelect && onRoomSelect(room)}
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
                      onPress={() => onRoomSelect && onRoomSelect(room)}
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
            <G id="Walls" pointerEvents="none">
              <Path
                d={wallsPathData}
                fill="none"
                stroke={isDark ? '#64748b' : '#3f4652'}
                strokeWidth={2.2}
                strokeLinecap="square"
              />
            </G>
          )}

          {/* 4.1 Strat Scări / Conectori Verticali */}
          {stairs && stairs.length > 0 && (
            <G id="Stairs">
              {stairs.map((stair) => {
                const isUp = stair.direction === 'up';
                const isDown = stair.direction === 'down';
                const dirSymbol = isUp ? '▲' : isDown ? '▼' : '⇅';
                const dirColor = isUp ? '#10b981' : isDown ? '#f59e0b' : '#3b82f6';

                // Dimensiuni badge
                const badgeWidth = Math.max(46, stair.label.length * 8 + 26);
                const badgeHeight = 22;
                const badgeX = stair.x - badgeWidth / 2;
                const badgeY = stair.y - badgeHeight / 2;

                return (
                  <G
                    key={stair.id}
                    onPress={() => onStairSelect && onStairSelect(stair)}
                  >
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