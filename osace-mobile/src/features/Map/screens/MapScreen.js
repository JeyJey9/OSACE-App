import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
import { useAuth } from '../../Auth/AuthContext';
import InteractiveMap from '../components/InteractiveMap';
import FloorSelector from '../components/FloorSelector';
import RoomSearchBar from '../components/RoomSearchBar';
import RoomDetailsSheet from '../components/RoomDetailsSheet';
import StairDetailsSheet from '../components/StairDetailsSheet';
import NavigationBanner from '../components/NavigationBanner';
import { findPath } from '../data/navigationGraph';
import { getRoomById, getRoomByCode } from '../data/buildingData';

const MapScreen = ({ navigation }) => {
  const { colors, isDark } = useThemeColor();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeFloor, setActiveFloor] = useState('B');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStair, setSelectedStair] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [showWalls, setShowWalls] = useState(true);
  const [showUnderlay, setShowUnderlay] = useState(true);
  const [showDebugGraph, setShowDebugGraph] = useState(false);
  const [debugTapCoords, setDebugTapCoords] = useState(null);
  const [selectedDebugNode, setSelectedDebugNode] = useState(null);
  const mapRef = useRef(null);

  // Configurare Header și dezactivare swipe drawer pentru pan fără interferențe
  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        swipeEnabled: false,
      });
    }
  }, [navigation]);

  // La prima intrare pe ecranul de hartă, focalizăm camera pe Intrarea Principală (Demisol, zoomed in)
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.focusOnPoint({ x: 389.0, y: 1010.0 }, 1.15);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Selectare sală din hartă
  const handleRoomSelect = useCallback((room) => {
    setSelectedStair(null);
    if (selectedRoom?.id === room?.id) {
      setSelectedRoom(null);
    } else {
      setSelectedRoom(room);
    }
  }, [selectedRoom]);

  // Selectare scară din hartă
  const handleStairSelect = useCallback((stair) => {
    if (selectedStair?.id === stair?.id) {
      setSelectedStair(null);
    } else {
      setSelectedRoom(null);
      setSelectedStair(stair);
    }
  }, [selectedStair]);

  // Schimbare etaj din fișa detaliilor scării
  const handleStairSwitchFloor = useCallback((stair, targetFloor) => {
    setSelectedStair(null);
    setActiveFloor(targetFloor);
    // Recentrare cameră pe scara respectivă de pe noul etaj
    setTimeout(() => {
      mapRef.current?.focusOnPoint({ x: stair.x, y: stair.y }, 1.35);
    }, 200);
  }, []);

  // Deschidere fișă de sală din fișa detaliilor scării / POI-ului (ex: Aula Constantin Belea)
  const handleOpenRoomFromStair = useCallback((roomId) => {
    setSelectedStair(null);
    const room = getRoomById(roomId) || getRoomByCode(roomId);
    if (room) {
      if (room.floor && room.floor !== activeFloor) {
        setActiveFloor(room.floor);
      }
      setTimeout(() => {
        setSelectedRoom(room);
        mapRef.current?.focusOnRoom(room);
      }, 150);
    }
  }, [activeFloor]);

  // Selectare sală din bara de căutare
  const handleSearchSelect = useCallback((room) => {
    if (!room) return;
    setSelectedStair(null);
    if (room.floor && room.floor !== activeFloor) {
      setActiveFloor(room.floor);
    }
    setSelectedRoom(room);
  }, [activeFloor]);

  // Comutare etaj manuală din selector
  const handleFloorChange = useCallback((floorId) => {
    setActiveFloor(floorId);
    setSelectedStair(null);
    if (selectedRoom && selectedRoom.floor !== floorId && !isNavigating) {
      setSelectedRoom(null);
    }
  }, [selectedRoom, isNavigating]);

  // Închidere Bottom Sheet detalii
  const handleCloseDetails = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  // Setare punct de plecare (ales de utilizator sau Intrarea Principală)
  const handleSetStartPoint = useCallback((room) => {
    setStartPoint(room);
    setSelectedRoom(null);
    // Dacă utilizatorul navighează deja, recalculăm traseul de la noul punct de plecare la destinația actuală
    if (isNavigating && activeRoute?.targetRoom) {
      const result = findPath(room.code || room.id, activeRoute.targetRoom.code || activeRoute.targetRoom.id);
      if (result && result.nodes && result.nodes.length > 0) {
        setActiveRoute({
          nodes: result.nodes,
          floors: result.floors,
          totalDistanceMeters: result.totalDistanceMeters,
          targetRoom: activeRoute.targetRoom,
          startPoint: room,
        });
        const startFloor = result.floors[0] || room.floor || 'B';
        if (startFloor !== activeFloor) {
          setActiveFloor(startFloor);
        }
        setTimeout(() => {
          mapRef.current?.focusOnPoint(result.nodes[0], 1.3);
        }, 200);
      }
    }
  }, [isNavigating, activeRoute, activeFloor]);

  // Resetare punct de plecare la Intrarea Principală
  const handleResetStartPoint = useCallback(() => {
    setStartPoint(null);
    if (isNavigating && activeRoute?.targetRoom) {
      const result = findPath(null, activeRoute.targetRoom.code || activeRoute.targetRoom.id);
      if (result && result.nodes && result.nodes.length > 0) {
        setActiveRoute({
          nodes: result.nodes,
          floors: result.floors,
          totalDistanceMeters: result.totalDistanceMeters,
          targetRoom: activeRoute.targetRoom,
          startPoint: { id: 'room-GD04', code: 'GD04', name: 'Intrarea Principală', floor: 'B' },
        });
        const startFloor = result.floors[0] || 'B';
        if (startFloor !== activeFloor) {
          setActiveFloor(startFloor);
        }
      }
    }
  }, [isNavigating, activeRoute, activeFloor]);

  // Inversare sens de mers (Schimbă plecarea cu destinația)
  const handleSwapEndpoints = useCallback(() => {
    if (!activeRoute?.targetRoom || !activeRoute?.startPoint) return;
    const oldStart = activeRoute.startPoint;
    const oldDest = activeRoute.targetRoom;

    const result = findPath(oldDest.code || oldDest.id, oldStart.code || oldStart.id);
    if (result && result.nodes && result.nodes.length > 0) {
      setStartPoint(oldDest);
      setActiveRoute({
        nodes: result.nodes,
        floors: result.floors,
        totalDistanceMeters: result.totalDistanceMeters,
        targetRoom: oldStart,
        startPoint: oldDest,
      });
      const newStartFloor = result.floors[0] || oldDest.floor || 'B';
      if (newStartFloor !== activeFloor) {
        setActiveFloor(newStartFloor);
      }
      setTimeout(() => {
        mapRef.current?.focusOnPoint(result.nodes[0], 1.3);
      }, 200);
    }
  }, [activeRoute, activeFloor]);

  // Pornire/oprire navigație către sală
  const handleToggleNavigation = useCallback((room) => {
    if (isNavigating) {
      setIsNavigating(false);
      setActiveRoute(null);
      return;
    }

    if (!room) return;

    // Punctul de plecare este cel setat de utilizator sau Intrarea Principală (Demisol GD04)
    const effectiveStartPoint = startPoint || {
      id: 'room-GD04',
      code: 'GD04',
      name: 'Intrarea Principală',
      floor: 'B',
    };
    const startId = startPoint ? (startPoint.code || startPoint.id) : null;
    const result = findPath(startId, room.code || room.id);

    if (result && result.nodes && result.nodes.length > 0) {
      const fullRoute = {
        nodes: result.nodes,
        floors: result.floors,
        totalDistanceMeters: result.totalDistanceMeters,
        targetRoom: room,
        startPoint: effectiveStartPoint,
      };

      setActiveRoute(fullRoute);
      setIsNavigating(true);
      // Închidem fișa de detalii pentru a oferi vizibilitate maximă hărții
      setSelectedRoom(null);

      // Dacă traseul începe pe alt etaj decât cel curent, comutăm pe etajul de start
      const startFloor = result.floors[0] || effectiveStartPoint.floor || 'B';
      if (startFloor !== activeFloor) {
        setActiveFloor(startFloor);
      }

      // Focalizăm pe primul punct al traseului
      setTimeout(() => {
        mapRef.current?.focusOnPoint(result.nodes[0], 1.3);
      }, 200);
    } else {
      Alert.alert(
        'Rută Indisponibilă',
        `Nu s-a putut calcula un traseu până la sala ${room.code}.`
      );
    }
  }, [isNavigating, activeFloor, startPoint]);

  // Oprire navigație din banner
  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setActiveRoute(null);
  }, []);

  // Comutare etaj din banner-ul de navigație (la scări)
  const handleNavSwitchFloor = useCallback((nextFloor) => {
    setActiveFloor(nextFloor);
    // Găsim primul nod de pe noul etaj pentru recentrare cameră
    if (activeRoute && activeRoute.nodes) {
      const firstNodeOnNextFloor = activeRoute.nodes.find((n) => n.floor === nextFloor);
      if (firstNodeOnNextFloor) {
        setTimeout(() => {
          mapRef.current?.focusOnPoint(firstNodeOnNextFloor, 1.4);
        }, 150);
      }
    }
  }, [activeRoute]);

  // Handlere debug graf memoizate
  const handleDebugTap = useCallback((coords) => {
    setDebugTapCoords(coords);
    setSelectedDebugNode(null);
  }, []);

  const handleDebugNodeSelect = useCallback((node) => {
    setSelectedDebugNode(node);
    setDebugTapCoords(null);
  }, []);

  const styles = createStyles(colors, isDark);

  return (
    <GestureHandlerRootView style={styles.rootGesture}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.container}>
          {/* 1. Harta Interactivă */}
          <InteractiveMap
            ref={mapRef}
            floorId={activeFloor}
            selectedRoomId={selectedRoom?.id || null}
            onRoomSelect={handleRoomSelect}
            onStairSelect={handleStairSelect}
            routePoints={activeRoute?.nodes || null}
            isNavigating={isNavigating}
            targetRoom={activeRoute?.targetRoom || null}
            showWalls={showWalls}
            showUnderlay={showUnderlay}
            showDebugGraph={isAdmin && showDebugGraph}
            onDebugTap={isAdmin ? handleDebugTap : undefined}
            onDebugNodeSelect={isAdmin ? handleDebugNodeSelect : undefined}
          />

          {/* 2. Top Header Overlay: Căutare sau Banner Navigație Activă */}
          {isNavigating && activeRoute ? (
            <NavigationBanner
              route={activeRoute}
              currentFloor={activeFloor}
              onSwitchFloor={handleNavSwitchFloor}
              onStopNavigation={handleStopNavigation}
              onSwapEndpoints={handleSwapEndpoints}
              style={styles.topOverlayPosition}
            />
          ) : (
            <View style={styles.topOverlayPosition} pointerEvents="box-none">
              <RoomSearchBar
                currentFloor={activeFloor}
                onSelectRoom={handleSearchSelect}
              />
              {startPoint && (
                <View style={styles.startPointChip}>
                  <Ionicons name="flag" size={14} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.startPointChipText} numberOfLines={1}>
                    Plecare: <Text style={{ fontWeight: '700' }}>{startPoint.name || startPoint.code}</Text> ({startPoint.floor === 'B' ? 'Demisol' : startPoint.floor === 'P' ? 'Parter' : 'Etaj ' + startPoint.floor.replace('E', '')})
                  </Text>
                  <TouchableOpacity
                    onPress={handleResetStartPoint}
                    style={styles.startPointChipClear}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 3. Controale Flotante Hartă (Stânga ecranului) - Vizibile doar pentru Admini */}
          {isAdmin && (
            <View style={styles.floatingControls}>
              {/* Buton Toggle Debug Graf */}
              <TouchableOpacity
                style={[
                  styles.floatingControlBtn,
                  showDebugGraph && styles.floatingControlBtnActive,
                ]}
                onPress={() => {
                  setShowDebugGraph((prev) => !prev);
                  setSelectedDebugNode(null);
                  setDebugTapCoords(null);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel={showDebugGraph ? 'Ascunde debug graf' : 'Afișează debug graf'}
              >
                <Ionicons
                  name={showDebugGraph ? 'git-network' : 'git-network-outline'}
                  size={20}
                  color={showDebugGraph ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
              </TouchableOpacity>

              {/* Buton Pereți */}
              <TouchableOpacity
                style={styles.floatingControlBtn}
                onPress={() => setShowWalls((prev) => !prev)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel={showWalls ? 'Ascunde pereți' : 'Afișează pereți'}
              >
                <Ionicons
                  name={showWalls ? 'grid' : 'grid-outline'}
                  size={20}
                  color={showWalls ? colors.primary : isDark ? '#94a3b8' : '#64748b'}
                />
              </TouchableOpacity>

              {/* Buton Etaje Inferioare (Underlay) */}
              <TouchableOpacity
                style={styles.floatingControlBtn}
                onPress={() => setShowUnderlay((prev) => !prev)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel={showUnderlay ? 'Ascunde etaje inferioare' : 'Afișează etaje inferioare'}
              >
                <Ionicons
                  name={showUnderlay ? 'layers' : 'layers-outline'}
                  size={20}
                  color={showUnderlay ? colors.primary : isDark ? '#94a3b8' : '#64748b'}
                />
              </TouchableOpacity>

              {/* Buton Recentrare */}
              <TouchableOpacity
                style={styles.floatingControlBtn}
                onPress={() => mapRef.current?.resetView()}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Recentrare hartă"
              >
                <Ionicons name="scan-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* 4. Selector Flotant de Etaje (dreapta ecranului) */}
          <FloorSelector
            activeFloor={activeFloor}
            onFloorChange={handleFloorChange}
            style={styles.floorSelectorPosition}
          />

          {/* 4. Bottom Sheet Detalii Sală (când o sală este selectată) */}
          {selectedRoom && !isNavigating && (
            <RoomDetailsSheet
              room={selectedRoom}
              onClose={handleCloseDetails}
              onNavigateHere={handleToggleNavigation}
              onSetStartPoint={handleSetStartPoint}
              isNavigating={isNavigating}
            />
          )}

          {/* 5. Bottom Sheet Detalii Scară (când o scară este selectată) */}
          {selectedStair && !isNavigating && (
            <StairDetailsSheet
              stair={selectedStair}
              currentFloor={activeFloor}
              onClose={() => setSelectedStair(null)}
              onSwitchFloor={handleStairSwitchFloor}
              onOpenRoom={handleOpenRoomFromStair}
            />
          )}

          {/* 6. Banner Coordonate & Noduri Mod Debug (Doar pentru Admini) */}
          {isAdmin && showDebugGraph && (
            <View style={styles.debugCoordsBanner}>
              <View style={styles.debugHeaderRow}>
                <View style={styles.debugBadge}>
                  <Ionicons name="bug" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.debugBadgeText}>DEBUG GRAF NAVIGAȚIE</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowDebugGraph(false);
                    setSelectedDebugNode(null);
                    setDebugTapCoords(null);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {selectedDebugNode ? (
                <View style={styles.debugContent}>
                  <Text style={styles.debugNodeTitle}>
                    Nod: <Text style={{ color: '#06b6d4', fontWeight: '800' }}>{selectedDebugNode.id}</Text>
                  </Text>
                  <Text style={styles.debugNodeCoords}>
                    Coordonate: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>X: {Math.round(selectedDebugNode.x)}, Y: {Math.round(selectedDebugNode.y)}</Text> • Tip: {selectedDebugNode.type}
                  </Text>
                  {selectedDebugNode.roomCode && (
                    <Text style={styles.debugNodeSub}>Sală asociată: {selectedDebugNode.roomCode}</Text>
                  )}
                </View>
              ) : debugTapCoords ? (
                <View style={styles.debugContent}>
                  <Text style={styles.debugNodeTitle}>
                    Punct Atins pe Hartă:
                  </Text>
                  <Text style={styles.debugNodeCoords}>
                    Coordonate SVG: <Text style={{ fontWeight: '800', color: '#10b981' }}>X: {debugTapCoords.x}, Y: {debugTapCoords.y}</Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.debugHint}>
                  Atinge un nod sau orice punct de pe hartă pentru a afla coordonatele X, Y exacte.
                </Text>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    rootGesture: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      position: 'relative',
    },
    headerResetButton: {
      marginRight: 16,
      padding: 4,
    },
    topOverlayPosition: {
      position: 'absolute',
      top: 12,
      left: 16,
      right: 16,
      zIndex: 25,
    },
    startPointChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    startPointChipText: {
      fontSize: 12,
      color: colors.textPrimary,
      maxWidth: 240,
    },
    startPointChipClear: {
      marginLeft: 6,
      padding: 2,
    },
    floorSelectorPosition: {
      position: 'absolute',
      right: 16,
      top: 86,
      zIndex: 15,
    },
    floatingControls: {
      position: 'absolute',
      left: 16,
      top: 86,
      zIndex: 15,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    floatingControlBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 2,
    },
    floatingControlBtnActive: {
      backgroundColor: '#0891b2',
      shadowColor: '#0891b2',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 3,
    },
    debugCoordsBanner: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1.5,
      borderColor: '#06b6d4',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 40,
    },
    debugHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    debugBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0891b2',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    debugBadgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: '800',
    },
    debugContent: {
      marginTop: 2,
    },
    debugNodeTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    debugNodeCoords: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    debugNodeSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    debugHint: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

export default MapScreen;