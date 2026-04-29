import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  SectionList,
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  useWindowDimensions,
  RefreshControl,
  Switch 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useAuth } from '../../../Auth/AuthContext';

import FilterModal from '../../../../components/FilterModal';
import { usePermissions } from '../../../Auth/PermissionContext';
import { PERMISSIONS } from '../../../../constants/permissions';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';

import EventItem from '../components/EventItem';
import DynamicQrModal from '../components/DynamicQrModal';
import ManageTeamModal from '../components/ManageTeamModal';
import EmptyState from '../../../../components/EmptyState';

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
  
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ sedinta: true, social: true, proiect: true });
  const [refreshing, setRefreshing] = useState(false);

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0); 
  const [routes] = useState([
    { key: 'future', title: 'Viitoare' },
    { key: 'past', title: 'Trecute' },
  ]);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      async function fetchEvents() {
        setLoading(true);
        try {
          const response = await api.get('/api/admin/events/all');
          if (isMounted) setEvents(response.data);
        } catch (error) {
          Alert.alert("Eroare", "Nu s-au putut încărca evenimentele.");
        } finally {
          if (isMounted) setLoading(false);
        }
      }
      fetchEvents();
      return () => { isMounted = false; };
    }, []) 
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/api/admin/events/all');
      setEvents(response.data);
    } catch (error) {
      console.error("Eroare refresh events:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const processedData = useMemo(() => {
    const now = new Date();
    const futureEvents = [];
    const pastEvents = [];
    const filteredEvents = events.filter(event => activeFilters[event.category || 'social']);

    filteredEvents.forEach(event => {
      if (new Date(event.end_time) >= now) futureEvents.push(event);
      else pastEvents.push(event);
    });
    futureEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return {
      futureSections: groupEvents(futureEvents),
      pastSections: groupEvents(pastEvents),
    };
  }, [events, activeFilters]);

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
          subtitle="Creează prima activitate folosind butonul de mai sus."
        />
      }
      contentContainerStyle={styles.listContent}
      {...listOptimizationProps}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    />
  ), [processedData.futureSections, renderEventItem, renderSectionHeader, styles]);

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
  ), [processedData.pastSections, renderEventItem, renderSectionHeader, styles]);

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <View style={styles.container}>
      <View style={styles.headerButtonContainer}>
        {(user?.role === 'admin' || user?.role === 'coordonator' || can(PERMISSIONS.CREATE_EVENTS)) && (
          <TouchableOpacity style={[styles.topActionBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('EventForm')}>
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.topActionText}>Creează</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.topActionBtn, { backgroundColor: isDark ? colors.border : '#6c757d' }]} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={20} color="white" />
          <Text style={styles.topActionText}>Filtre</Text>
        </TouchableOpacity>
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
      
      <FilterModal visible={isFilterVisible} onClose={() => setFilterVisible(false)}>
        <View style={{ padding: 10 }}>
          {Object.keys(SECTION_TITLES).map(key => (
            <View key={key} style={styles.filterRow}>
              <Text style={[styles.filterText, { color: colors.textPrimary }]}>{SECTION_TITLES[key]}</Text>
              <Switch
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor="#f4f3f4"
                onValueChange={() => setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                value={activeFilters[key]}
              />
            </View>
          ))}
        </View>
      </FilterModal>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerButtonContainer: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card, gap: 10 },
  topActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  topActionText: { color: 'white', fontWeight: 'bold', marginLeft: 6 },
  listContent: { padding: 10, paddingBottom: 110 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', paddingHorizontal: 10, marginTop: 20, marginBottom: 8, color: colors.primary, textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 14, color: colors.textSecondary },
  eventItem: { backgroundColor: colors.card, padding: 15, marginVertical: 6, marginHorizontal: 4, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eventTitle: { flex: 1, fontSize: 17, fontWeight: 'bold', color: colors.textPrimary, marginRight: 10 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryTagText: { fontSize: 9, fontWeight: 'bold' },
  eventDetails: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 11, marginLeft: 4 },
  participantsButton: { backgroundColor: '#8e44ad' },
  qrButton: { backgroundColor: '#27ae60' },
  editButton: { backgroundColor: '#3498db' },
  deleteButton: { backgroundColor: '#e74c3c' },
  buttonDisabled: { backgroundColor: colors.border },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterText: { fontSize: 16 },
});
