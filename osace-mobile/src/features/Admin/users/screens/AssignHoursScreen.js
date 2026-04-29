import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput, Modal 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function AssignHoursScreen() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [hoursToGrant, setHoursToGrant] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes] = await Promise.all([
        api.get('/api/admin/users/managed'),   // coordinator-accessible
        api.get('/api/admin/events/all'),
      ]);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Eroare la încărcarea datelor.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const toggleUserSelection = (userId) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) newSelection.delete(userId);
    else newSelection.add(userId);
    setSelectedUserIds(newSelection);
  };

  const selectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) setSelectedUserIds(new Set());
    else setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
  };

  const handleBulkSubmit = async () => {
    const numericHours = parseFloat(hoursToGrant.replace(',', '.'));
    if (!selectedEventId || isNaN(numericHours) || numericHours <= 0) {
      Alert.alert('Eroare', 'Selectează un eveniment și introdu un număr valid de ore.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/api/admin/bulk-request-hours', {
        userIds: Array.from(selectedUserIds),
        eventId: selectedEventId,
        hours: numericHours,
      });
      Toast.show({ type: 'success', text1: 'Cereri trimise cu succes!' });
      setModalVisible(false);
      setSelectedUserIds(new Set());
      setHoursToGrant('');
      setSelectedEventId(null);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut trimite cererile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      (user.first_name?.toLowerCase().includes(query) || 
       user.last_name?.toLowerCase().includes(query) || 
       user.display_name?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const styles = createStyles(colors, isDark);

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUserIds.has(item.id);

    return (
      <TouchableOpacity 
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item.id)}
      >
        <Ionicons 
          name={isSelected ? "checkbox" : "square-outline"} 
          size={24} 
          color={isSelected ? colors.primary : colors.textSecondary} 
          style={{ marginRight: 15 }}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>{item.last_name} {item.first_name}</Text>
          <Text style={styles.userEmail}>@{item.display_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.headerRow}>
        <Text style={styles.listHeader}>Selectează Voluntarii</Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAllText}>
            {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? "Deselectează Tot" : "Selectează Tot"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută (nume, poreclă)..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery} 
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers} 
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {selectedUserIds.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarText}>{selectedUserIds.size} selectați</Text>
          <TouchableOpacity style={styles.continueButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.continueButtonText}>Creează Cereri</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Creează Cereri Manuale</Text>
            
            <Text style={styles.inputLabel}>Pentru ce activitate?</Text>
            <View style={styles.eventsListContainer}>
              <FlatList 
                data={events}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[styles.eventSelectBtn, selectedEventId === item.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                    onPress={() => setSelectedEventId(item.id)}
                  >
                    <Text style={{color: selectedEventId === item.id ? colors.primary : colors.textPrimary, fontWeight: selectedEventId === item.id ? 'bold' : 'normal'}}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
                nestedScrollEnabled
              />
            </View>

            <Text style={styles.inputLabel}>Număr de ore cerute:</Text>
            <TextInput
              style={styles.hoursInput}
              keyboardType="numeric"
              value={hoursToGrant}
              onChangeText={setHoursToGrant}
              placeholder="Ex: 2.5"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{color: colors.textPrimary, fontWeight: 'bold'}}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleBulkSubmit}>
                {submitLoading ? <ActivityIndicator color="white" /> : <Text style={{color: 'white', fontWeight: 'bold'}}>Trimite Cererile</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  selectAllText: { color: colors.primary, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginHorizontal: 20, marginTop: 15, marginBottom: 15, paddingHorizontal: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.textPrimary },
  listContent: { paddingBottom: 200 }, // Space for bottomBar + floating tab bar
  userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 15, marginHorizontal: 20, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  userItemSelected: { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '30' : colors.primary + '10' },
  infoContainer: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary },
  bottomBar: { position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: colors.card, padding: 20, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10 },
  bottomBarText: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  continueButton: { flexDirection: 'row', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: 'white', fontWeight: 'bold', marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: colors.background, borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 5, marginTop: 10 },
  eventsListContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 5, marginBottom: 10, backgroundColor: colors.card },
  eventSelectBtn: { padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: 6 },
  hoursInput: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.card, borderRadius: 8, padding: 15, fontSize: 18, color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
});
