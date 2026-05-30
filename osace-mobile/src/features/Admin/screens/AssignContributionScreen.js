import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput, Modal, SafeAreaView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function AssignContributionScreen() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hoursToGrant, setHoursToGrant] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/events/all')
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

  const handleSubmit = async () => {
    const numericHours = parseFloat(hoursToGrant.replace(',', '.'));
    if (selectedUserIds.length === 0) {
      Alert.alert('Eroare', 'Selectează cel puțin un voluntar.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      Alert.alert('Eroare', 'Introdu titlul și descrierea contribuției.');
      return;
    }
    if (isNaN(numericHours) || numericHours <= 0) {
      Alert.alert('Eroare', 'Introdu un număr valid de ore.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/api/admin/contributions', {
        userIds: selectedUserIds,
        title: title.trim(),
        description: description.trim(),
        awarded_hours: numericHours,
        event_id: selectedEvent ? selectedEvent.id : null
      });
      Toast.show({ type: 'success', text1: 'Cereri trimise!', text2: 'Așteaptă aprobarea unui admin.' });
      navigation.goBack();
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert('Eroare', error.response?.data?.error || 'Nu am putut trimite cererile.');
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

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const newSelected = [...selectedUserIds];
    let changed = false;
    filteredUsers.forEach(u => {
      if (!newSelected.includes(u.id)) {
        newSelected.push(u.id);
        changed = true;
      }
    });
    if (changed) setSelectedUserIds(newSelected);
  };

  const deselectAllFiltered = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const styles = createStyles(colors, isDark);

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUserIds.includes(item.id);

    return (
      <TouchableOpacity 
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <Ionicons 
          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isSelected ? colors.primary : colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Acordare Contribuție Specială</Text>
          <Text style={styles.headerSubtitle}>
            Alege voluntarii și completează detaliile realizării (ex: Grafică Poster, Ajutor Logistică).
          </Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Caută voluntari..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={selectAllFiltered} style={styles.selectBtn}>
            <Text style={{color: colors.primary, fontWeight: 'bold'}}>Select Toți</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAllFiltered} style={styles.selectBtn}>
            <Text style={{color: colors.textSecondary}}>Deselect</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            <Text style={{color: colors.textSecondary, marginBottom: 8, fontSize: 12}}>
              {selectedUserIds.length} voluntari selectați
            </Text>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>Niciun utilizator găsit.</Text>}
            />
          </View>
        )}

        <View style={styles.formContainer}>
          <TouchableOpacity 
            style={styles.eventSelector} 
            onPress={() => setEventModalVisible(true)}
          >
            <Text style={{ color: selectedEvent ? colors.textPrimary : colors.textSecondary }}>
              {selectedEvent ? selectedEvent.title : "Asociază unui eveniment (Opțional)"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Titlu (ex: Design Poster)"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Descriere detaliată..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Ore acordate (ex: 5.5)"
            placeholderTextColor={colors.textSecondary}
            value={hoursToGrant}
            onChangeText={setHoursToGrant}
            keyboardType="numeric"
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, (selectedUserIds.length === 0 || !title || !description || !hoursToGrant) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={selectedUserIds.length === 0 || submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Trimite spre Aprobare</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal pentru selecție eveniment */}
      <Modal visible={eventModalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selectează Evenimentul</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => { setSelectedEvent(null); setEventModalVisible(false); }}
            >
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>Fără eveniment asociat</Text>
            </TouchableOpacity>
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => { setSelectedEvent(item); setEventModalVisible(false); }}
                >
                  <Text style={{ color: colors.textPrimary }}>{item.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(item.start_time.replace(' ', 'T')).toLocaleDateString('ro-RO')}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 110,
  },
  headerInfo: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectBtn: {
    padding: 10,
    marginLeft: 5,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  eventSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 8,
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userCardSelected: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
  },
  formContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: colors.background,
    margin: 20,
    marginTop: 100,
    borderRadius: 16,
    flex: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }
});
