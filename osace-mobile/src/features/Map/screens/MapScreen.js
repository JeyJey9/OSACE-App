import React, { useState, useLayoutEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, 
  FlatList, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import InteractiveMap from '../components/InteractiveMap';
import { BlurView } from 'expo-blur';
import { mapData } from '../data/MapData'; 
import { Ionicons } from '@expo/vector-icons'; 

// ▼▼▼ NOU: Importuri Temă ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

const FLOORS = [
  { id: 'etaj2', label: '2' },
  { id: 'etaj1', label: '1' },
  { id: 'parter', label: 'P' },
];

const MapScreen = ({ navigation }) => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentFloor, setCurrentFloor] = useState('parter');
  const [isFloorPickerOpen, setIsFloorPickerOpen] = useState(false);

  // ▼▼▼ NOU: Hook-ul de temă ▼▼▼
  const { colors, isDark } = useThemeColor();

  const floorMapData = mapData[currentFloor] || {};
  const currentRoomData = selectedRoomId ? floorMapData[selectedRoomId] : null;

  useLayoutEffect(() => {
    if (navigation) navigation.setOptions({ headerShown: false, swipeEnabled: false });
    return () => { if (navigation) navigation.setOptions({ swipeEnabled: true, headerShown: true }); };
  }, [navigation]);

  const searchResults = useMemo(() => {
    if (!searchText || searchText.length < 2) return [];
    let allResults = [];
    Object.keys(mapData).forEach((floorKey) => {
      const floorData = mapData[floorKey];
      const rooms = Object.keys(floorData).map(key => ({ 
        id: key, 
        floorId: floorKey,
        ...floorData[key] 
      }));
      allResults = [...allResults, ...rooms];
    });
    return allResults.filter(room => 
      room.title.toLowerCase().includes(searchText.toLowerCase()) ||
      room.type.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  const handleSearchSelect = (room) => {
    if (room.floorId !== currentFloor) setCurrentFloor(room.floorId);
    setSelectedRoomId(room.id);
    setIsNavigating(false);
    setSearchText('');
    setIsSearching(false);
    Keyboard.dismiss();
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(selectedRoomId === roomId ? null : roomId);
    setIsNavigating(false);
  };

  const getCurrentFloorLabel = () => {
    const floor = FLOORS.find(f => f.id === currentFloor);
    return floor ? floor.label : '?';
  };

  const styles = createStyles(colors, isDark);

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsSearching(false); setIsFloorPickerOpen(false); }}>
      <View style={styles.mainContainer}>
        
        {/* HARTA */}
        <View style={styles.mapLayer}>
          {currentFloor === 'parter' ? (
            <InteractiveMap 
              onRoomSelect={handleRoomSelect} 
              selectedRoomId={selectedRoomId} 
              isNavigating={isNavigating} 
            />
          ) : (
            <View style={styles.emptyFloorContainer}>
               <Ionicons name="construct-outline" size={64} color={colors.border} />
               <Text style={[styles.emptyFloorText, {color: colors.textPrimary}]}>Etajul {getCurrentFloorLabel()}</Text>
               <Text style={[styles.emptyFloorSubtext, {color: colors.textSecondary}]}>Harta nu este încă disponibilă.</Text>
            </View>
          )}
        </View>

        {/* TOP LAYER (Search + Floor) */}
        <View style={styles.topFloatingLayer}>
            <View style={styles.topRowContainer}>
                
                <View style={styles.searchBarContainer}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <Ionicons name="menu" size={28} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Caută o sală..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchText}
                        onChangeText={(text) => { setSearchText(text); setIsSearching(true); }}
                        onFocus={() => { setIsSearching(true); setIsFloorPickerOpen(false); }}
                        keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                    
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color={colors.border} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity 
                    style={[styles.floorTriggerBtn, isFloorPickerOpen && styles.floorTriggerBtnActive]}
                    onPress={() => { setIsFloorPickerOpen(!isFloorPickerOpen); setIsSearching(false); }}
                >
                    <Text style={[styles.floorTriggerText, isFloorPickerOpen && styles.floorTriggerTextActive]}>
                        {getCurrentFloorLabel()}
                    </Text>
                    <View style={[styles.onlineDot, isFloorPickerOpen ? {backgroundColor: 'white'} : {backgroundColor: colors.primary}]} /> 
                </TouchableOpacity>
            </View>

            {/* DROPDOWN ETAJE */}
            {isFloorPickerOpen && (
                <View style={styles.floorDropdown}>
                    {FLOORS.map((floor) => (
                        <TouchableOpacity 
                            key={floor.id} 
                            style={[styles.floorItem, currentFloor === floor.id && styles.floorItemActive]}
                            onPress={() => {
                                setCurrentFloor(floor.id);
                                setIsFloorPickerOpen(false);
                                setSelectedRoomId(null);
                                setIsNavigating(false);
                            }}
                        >
                            <Text style={[styles.floorItemText, currentFloor === floor.id && styles.floorItemTextActive]}>
                                Etajul {floor.label}
                            </Text>
                            {currentFloor === floor.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* REZULTATE SEARCH */}
            {isSearching && searchResults.length > 0 && (
                <View style={styles.searchResultsList}>
                    <FlatList 
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.searchItem} onPress={() => handleSearchSelect(item)}>
                                <View style={styles.searchItemIcon}>
                                    <Ionicons name="location-outline" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.searchItemTitle}>{item.title}</Text>
                                    <Text style={styles.searchItemSubtitle}>
                                        {item.type} • {item.floorId === 'parter' ? 'Parter' : (item.floorId === 'etaj1' ? 'Etaj 1' : 'Etaj 2')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>

        {/* BOTTOM CARD */}
        {currentRoomData && (
          <View style={styles.absoluteBottomContainer}>
              <BlurView 
                intensity={Platform.OS === 'android' ? 100 : 90} 
                tint={isDark ? "dark" : "light"} 
                style={styles.blurContainer}
              >
                <View style={styles.bottomCardContent}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.badgeText}>{currentRoomData.type}</Text>
                      <Text style={styles.roomTitle}>{currentRoomData.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setSelectedRoomId(null); setIsNavigating(false); }} style={styles.closeBtn}>
                      <View style={styles.closeBtnCircle}>
                          <Ionicons name="close" size={20} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.roomDesc}>{currentRoomData.description}</Text>
                  
                  {!isNavigating ? (
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => setIsNavigating(true)}>
                        <Text style={styles.actionBtnText}>🚶‍♂️ Pornește Navigația</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.navigatingContainer}>
                        <Text style={styles.navigatingText}>Se afișează ruta...</Text>
                    </View>
                  )}
                </View>
              </BlurView>
          </View>
        )}

      </View>
    </TouchableWithoutFeedback>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.background },
  mapLayer: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  emptyFloorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyFloorText: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  emptyFloorSubtext: { fontSize: 14, marginTop: 5 },

  topFloatingLayer: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 },
  topRowContainer: { flexDirection: 'row', alignItems: 'center' },
  
  searchBarContainer: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.card, 
    borderRadius: 50,
    paddingHorizontal: 15, 
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, 
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  menuButton: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary },

  floorTriggerBtn: {
    width: 50, height: 50,
    backgroundColor: colors.card,
    borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.3 : 0.1,
    elevation: 5,
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'transparent',
  },
  floorTriggerBtnActive: { backgroundColor: colors.primary },
  floorTriggerText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  floorTriggerTextActive: { color: 'white' },
  onlineDot: { position: 'absolute', bottom: 12, right: 14, width: 6, height: 6, borderRadius: 3 },

  floorDropdown: {
      position: 'absolute', top: 60, right: 0, width: 140,
      backgroundColor: colors.card,
      borderRadius: 16, padding: 5,
      shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
      borderWidth: isDark ? 1 : 0, borderColor: colors.border,
  },
  floorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12 },
  floorItemActive: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' },
  floorItemText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  floorItemTextActive: { color: colors.primary, fontWeight: '700' },

  searchResultsList: { 
    marginTop: 10, 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    maxHeight: 300, 
    elevation: 5,
    borderWidth: isDark ? 1 : 0, borderColor: colors.border,
    overflow: 'hidden'
  },
  searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchItemIcon: { marginRight: 15, backgroundColor: isDark ? colors.background : '#f1f5f9', padding: 8, borderRadius: 20 },
  searchItemTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  searchItemSubtitle: { fontSize: 12, color: colors.textSecondary },

  absoluteBottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  blurContainer: { 
    borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', 
    backgroundColor: isDark ? 'rgba(20, 20, 20, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1, borderColor: colors.border 
  },
  bottomCardContent: { padding: 24, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  roomTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  closeBtnCircle: { backgroundColor: isDark ? colors.border : '#f1f5f9', borderRadius: 20, width: 32, height: 32, alignItems:'center', justifyContent:'center' },
  roomDesc: { color: colors.textSecondary, fontSize: 16, marginBottom: 25, lineHeight: 24 },
  actionBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 4 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  navigatingContainer: { alignItems: 'center', paddingVertical: 16 },
  navigatingText: { color: colors.primary, fontWeight: '700', fontSize: 16 }
});

export default MapScreen;