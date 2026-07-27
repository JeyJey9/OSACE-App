import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  SectionList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  useWindowDimensions,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useAuth } from '../../../Auth/AuthContext';

import { usePermissions } from '../../../Auth/PermissionContext';
import { PERMISSIONS } from '../../../../constants/permissions';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';

import EventItem from '../components/EventItem';
import DynamicQrModal from '../components/DynamicQrModal';
import ManageTeamModal from '../components/ManageTeamModal';
import EmptyState from '../../../../components/EmptyState';

const CATEGORIES = [
  { key: 'sedinta', label: 'Ședințe', color: '#3498db', icon: 'briefcase-outline' },
  { key: 'social', label: 'Social', color: '#27ae60', icon: 'people-outline' },
  { key: 'proiect', label: 'Proiecte', color: '#f39c12', icon: 'bulb-outline' },
];

const SECTION_TITLES = {
  sedinta: 'Ședințe',
  social: 'Activități Sociale',
  proiect: 'Proiecte',
};

const groupEvents = (events) => {
  const grouped = { sedinta: [], social: [], proiect: [] };
  events.forEach(event => {
    const category = event.category || 'social'; 
    if (grouped[category]) grouped[category].push(event);
    else {
      if (!grouped.other) grouped.other = [];
      grouped.other.push(event);
    }
  });
  const sectionData = [];
  if (grouped.sedinta.length > 0) sectionData.push({ title: SECTION_TITLES.sedinta, data: grouped.sedinta });
  if (grouped.social.length > 0) sectionData.push({ title: SECTION_TITLES.social, data: grouped.social });
  if (grouped.proiect.length > 0) sectionData.push({ title: SECTION_TITLES.proiect, data: grouped.proiect });
  if (grouped.other && grouped.other.length > 0) sectionData.push({ title: 'Altele', data: grouped.other });
  return sectionData;
};

export default function ManageEventsScreen({ navigation }) {
  const { can } = usePermissions();
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);

  // Multi-select categories array: [] means NO filter active (show ALL)
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0); 
  const [routes] = useState([
    { key: 'future', title: 'Viitoare' },
    { key: 'past', title: 'Trecute' },
  ]);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/api/admin/events/all');
      setEvents(response.data);
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca evenimentele.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]) 
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents(true);
    setRefreshing(false);
  }, [fetchEvents]);

  const toggleCategoryFilter = (catKey) => {
    setSelectedCategories(prev => 
      prev.includes(catKey) ? prev.filter(c => c !== catKey) : [...prev, catKey]
    );
  };

  const processedData = useMemo(() => {
    const now = new Date();
    const futureEvents = [];
    const pastEvents = [];

    // If selectedCategories is empty -> show all. Else -> filter by selected
    const filteredEvents = events.filter(event => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(event.category || 'social');
    });

    filteredEvents.forEach(event => {
      if (new Date(event.end_time.replace(' ', 'T')) >= now) futureEvents.push(event);
      else pastEvents.push(event);
    });
    futureEvents.sort((a, b) => new Date(a.start_time.replace(' ', 'T')) - new Date(b.start_time.replace(' ', 'T')));
    return {
      futureSections: groupEvents(futureEvents),
      pastSections: groupEvents(pastEvents),
    };
  }, [events, selectedCategories]);

  const openQrModal = useCallback((item) => {
    setSelectedEventId(item.id);
    setSelectedEventTitle(item.title);
    setQrModalVisible(true);
  }, []);

  const openTeamModal = useCallback((item) => {
    setSelectedEventId(item.id);
    setSelectedEventTitle(item.title);
    setTeamModalVisible(true);
  }, []);

  const handleDelete = useCallback(async (eventId) => {
    Alert.alert("Confirmă Ștergerea", "Ești sigur?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/api/events/${eventId}`);
            setEvents(prev => prev.filter(e => e.id !== eventId));
          } catch (e) { Alert.alert("Eroare", "Ștergerea a eșuat."); }
      }}
    ]);
  }, []);

  const renderEventItem = useCallback(({ item }) => (
    <EventItem 
      item={item} 
      can={can} 
      navigation={navigation} 
      colors={colors} 
      styles={styles}
      isDark={isDark}
      openQrModal={openQrModal}
      openTeamModal={openTeamModal}
      handleDelete={handleDelete}
    />
  ), [can, navigation, colors, styles, isDark, openQrModal, openTeamModal, handleDelete]);

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  ), [styles]);

  const listOptimizationProps = {
    initialNumToRender: 5,
    maxToRenderPerBatch: 10,
    windowSize: 5,
    removeClippedSubviews: true,
    keyExtractor: (item) => item.id.toString(),
  };

  const FutureEventsTab = useCallback(() => (
    <SectionList
      sections={processedData.futureSections}
      renderItem={renderEventItem}
      renderSectionHeader={renderSectionHeader}
      ListEmptyComponent={
        <EmptyState
          illustration="no_events"
          title="Nicio activitate viitoare"
          subtitle="Creează o activitate sau resetează filtrele."
        />
      }
      contentContainerStyle={styles.listContent}
      {...listOptimizationProps}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    />
  ), [processedData.futureSections, renderEventItem, renderSectionHeader, styles, refreshing, onRefresh, colors.primary]);

  const PastEventsTab = useCallback(() => (
    <SectionList
      sections={processedData.pastSections}
      renderItem={renderEventItem}
      renderSectionHeader={renderSectionHeader}
      ListEmptyComponent={
        <EmptyState
          illustration="no_history"
          title="Niciun eveniment trecut"
          subtitle="Evenimentele finalizate vor apărea aici."
        />
      }
      contentContainerStyle={styles.listContent}
      {...listOptimizationProps}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    />
  ), [processedData.pastSections, renderEventItem, renderSectionHeader, styles, refreshing, onRefresh, colors.primary]);

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <View style={styles.container}>
      {/* ACTION & CHIP TOGGLE FILTER BAR */}
      <View style={styles.topContainer}>
        {(user?.role === 'admin' || user?.role === 'coordonator' || can(PERMISSIONS.CREATE_EVENTS)) && (
          <TouchableOpacity 
            style={[styles.createBtn, { backgroundColor: colors.primary }]} 
            onPress={() => navigation.navigate('EventForm')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.createBtnText}>Creează Activitate</Text>
          </TouchableOpacity>
        )}

        {/* INLINE MULTI-SELECT CHIP TOGGLES */}
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.key);
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => toggleCategoryFilter(cat.key)}
                style={[
                  styles.chip,
                  isSelected 
                    ? { backgroundColor: cat.color + '20', borderColor: cat.color }
                    : { backgroundColor: colors.card, borderColor: colors.border }
                ]}
              >
                <Ionicons 
                  name={isSelected ? cat.icon.replace('-outline', '') : cat.icon} 
                  size={15} 
                  color={isSelected ? cat.color : colors.textSecondary} 
                />
                <Text style={[
                  styles.chipText,
                  { color: isSelected ? cat.color : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={SceneMap({ future: FutureEventsTab, past: PastEventsTab })}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        lazy 
        renderTabBar={props => (
          <TabBar
            {...props}
            style={{ backgroundColor: colors.card, elevation: 0 }}
            labelStyle={{ fontWeight: 'bold', fontSize: 13 }} 
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
            indicatorStyle={{ backgroundColor: colors.primary, height: 3 }}
          />
        )}
      />

      <DynamicQrModal isVisible={qrModalVisible} onClose={() => setQrModalVisible(false)} eventId={selectedEventId} title={selectedEventTitle} />
      <ManageTeamModal isVisible={teamModalVisible} onClose={() => setTeamModalVisible(false)} eventId={selectedEventId} eventTitle={selectedEventTitle} />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topContainer: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border, 
    backgroundColor: colors.card, 
    gap: 10 
  },
  createBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnText: { color: 'white', fontWeight: '800', fontSize: 15, marginLeft: 8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 1.5 
  },
  chipText: { fontSize: 12 },
  listContent: { padding: 10, paddingBottom: 110 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', paddingHorizontal: 10, marginTop: 16, marginBottom: 8, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
});
