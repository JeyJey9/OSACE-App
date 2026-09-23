import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
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
  const [activeFloor, setActiveFloor] = useState('P');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStair, setSelectedStair] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showWalls, setShowWalls] = useState(true);
  const mapRef = useRef(null);

  // Configurare Header și dezactivare swipe drawer pentru pan fără interferențe
  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerShown: true,
        title: 'Harta Facultății',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        swipeEnabled: false,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowWalls((prev) => !prev)}
              style={{ marginRight: 12, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showWalls ? 'Ascunde pereți' : 'Afișează pereți'}
            >
              <Ionicons
                name={showWalls ? 'grid' : 'grid-outline'}
                size={20}
                color={showWalls ? colors.primary : isDark ? '#94a3b8' : '#64748b'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => mapRef.current?.resetView()}
              style={styles.headerResetButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Recentrare hartă"
            >
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, colors, showWalls, isDark]);

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

  // Pornire/oprire navigație către sală
  const handleToggleNavigation = useCallback((room) => {
    if (isNavigating) {
      setIsNavigating(false);
      setActiveRoute(null);
      return;
    }

    if (!room) return;

    // Calculăm traseul de la Intrarea Principală (sau poziția curentă) la sala selectată
    const result = findPath(null, room.code || room.id);

    if (result && result.nodes && result.nodes.length > 0) {
      const fullRoute = {
        nodes: result.nodes,
        floors: result.floors,
        totalDistanceMeters: result.totalDistanceMeters,
        targetRoom: room,
      };

      setActiveRoute(fullRoute);
      setIsNavigating(true);
      // Închidem fișa de detalii pentru a oferi vizibilitate maximă hărții
      setSelectedRoom(null);

      // Dacă traseul începe pe alt etaj decât cel curent, comutăm pe etajul de start
      const startFloor = result.floors[0] || 'P';
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
  }, [isNavigating, activeFloor]);

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
          />

          {/* 2. Top Header Overlay: Căutare sau Banner Navigație Activă */}
          {isNavigating && activeRoute ? (
            <NavigationBanner
              route={activeRoute}
              currentFloor={activeFloor}
              onSwitchFloor={handleNavSwitchFloor}
              onStopNavigation={handleStopNavigation}
              style={styles.topOverlayPosition}
            />
          ) : (
            <RoomSearchBar
              currentFloor={activeFloor}
              onSelectRoom={handleSearchSelect}
              style={styles.topOverlayPosition}
            />
          )}

          {/* 3. Selector Flotant de Etaje (dreapta ecranului) */}
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
    floorSelectorPosition: {
      position: 'absolute',
      right: 16,
      top: 86,
      zIndex: 15,
    },
  });

export default MapScreen;