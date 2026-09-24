import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { MAP_DIMENSIONS, ROOM_TYPE_COLORS, getRoomsByFloor } from '../data/buildingData';
import { getStairsByFloor } from '../data/buildingStairs';
import { NAV_NODES, NAV_EDGES } from '../data/navigationGraph';
import { useThemeColor } from '../../../constants/useThemeColor';

// Modular layers
import FloorBaseLayer from './layers/FloorBaseLayer';
import RoomLayer from './layers/RoomLayer';
import StairLayer from './layers/StairLayer';
import RouteOverlay from './layers/RouteOverlay';
import DebugOverlay from './layers/DebugOverlay';

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
  floorId = 'B',
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
  initialZoom = 1.15,
  initialOffsetX = 284.4,
  initialOffsetY = -374,
  style,
}, ref) => {
  const zoomableViewRef = useRef(null);
  const lastSelectTime = useRef(0);
  const { colors, isDark } = useThemeColor();

  const themeColors = isDark ? ROOM_TYPE_COLORS.dark : ROOM_TYPE_COLORS.light;

  // Calculăm etajul inferior vizibil în fundal ca sub-strat fantomă (ghost underlay)
  const currentFloorIndex = useMemo(() => {
    return FLOOR_ORDER.indexOf(floorId);
  }, [floorId]);

  const underlyingFloors = useMemo(() => {
    if (isNavigating || !showUnderlay || currentFloorIndex <= 0) return [];
    return [FLOOR_ORDER[currentFloorIndex - 1]];
  }, [isNavigating, showUnderlay, currentFloorIndex]);

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

    const contentCenterX = MAP_DIMENSIONS.width / 2; // 673.4
    const contentCenterY = MAP_DIMENSIONS.height / 2; // 696.0

    const targetOffsetX = contentCenterX - point.x;
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

  const mapBgColor = isDark ? '#0b0f19' : '#f1f5f9';

  return (
    <View style={[styles.container, { backgroundColor: mapBgColor }, style]}>
      <ReactNativeZoomableView
        ref={zoomableViewRef}
        maxZoom={3.5}
        minZoom={0.35}
        initialZoom={initialZoom}
        initialOffsetX={initialOffsetX}
        initialOffsetY={initialOffsetY}
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
          {/* 0, 1, 4. Strat Outlines, Ghost Underlays, Demisol Base și Pereți Interiori */}
          <FloorBaseLayer
            floorId={floorId}
            underlyingFloors={underlyingFloors}
            showWalls={showWalls}
            showUnderlay={showUnderlay}
            isNavigating={isNavigating}
            isDark={isDark}
          />

          {/* 2, 3, 4.0, 4.1. Strat Coridoare, Săli Interactive, Intrare Principală și Etichete */}
          <RoomLayer
            corridors={corridors}
            regularRooms={regularRooms}
            selectedRoomId={selectedRoomId}
            targetRoom={targetRoom}
            themeColors={themeColors}
            isDark={isDark}
            floorId={floorId}
            onRoomSelect={onRoomSelect}
          />

          {/* 4.2. Strat Scări și Conectori Verticali */}
          <StairLayer
            stairs={stairs}
            isDark={isDark}
          />

          {/* 5. Strat Navigație (Rutare activă multi-layer de înaltă performanță) */}
          <RouteOverlay
            currentFloorSegments={currentFloorSegments}
            routePoints={routePoints}
          />

          {/* 6. Strat Debug Graf Navigație */}
          <DebugOverlay
            showDebugGraph={showDebugGraph}
            debugEdges={debugEdges}
            debugNodes={debugNodes}
            navNodes={NAV_NODES}
            isDark={isDark}
            onDebugNodeSelect={onDebugNodeSelect}
          />
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