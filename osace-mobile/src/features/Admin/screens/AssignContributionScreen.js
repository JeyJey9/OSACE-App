import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView
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
  const [volunteerModalVisible, setVolunteerModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hoursToGrant, setHoursToGrant] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();
  const { width, height, fontScale } = useWindowDimensions();

  const isCompact = height < 720;

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Folosim /users/managed pentru ca și coordonatorii să aibă acces
      const [usersRes, eventsRes] = await Promise.all([
        api.get('/api/admin/users/managed'),
        api.get('/api/admin/events/all')
      ]);
      setUsers(usersRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error("Eroare la preluare date contributie:", error);
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
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user =>
      (user.first_name?.toLowerCase().includes(query) ||
       user.last_name?.toLowerCase().includes(query) ||
       user.display_name?.toLowerCase().includes(query) ||
       user.email?.toLowerCase().includes(query))
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

  const selectedUsersData = useMemo(() => {
    return users.filter(u => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  const styles = createStyles(colors, isDark, isCompact, fontScale);

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUserIds.includes(item.id);
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.display_name || item.email;

    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isSelected ? "checkbox" : "square-outline"}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
          style={{ marginRight: 12 }}
        />
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.userName} maxFontSizeMultiplier={1.3}>{fullName}</Text>
            {item.role && item.role !== 'user' && (
              <View style={[styles.miniRoleBadge, { backgroundColor: item.role === 'admin' ? '#fdf2f1' : '#eafaf1' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: item.role === 'admin' ? '#c0392b' : '#27ae60' }}>
                  {item.role === 'admin' ? 'Admin' : 'Coordonator'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} maxFontSizeMultiplier={1.2} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={true} loading={loading}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
              Cerere Contribuție Specială
            </Text>
            <Text style={styles.headerSubtitle} maxFontSizeMultiplier={1.3}>
              Alege voluntarii și detaliile activității deosebite (ex: Design Poster, Logistică, IT etc.).
            </Text>
          </View>

          {/* SECȚIUNE SELECTARE VOLUNTARI */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Voluntari Vizați
              </Text>
              <View style={[styles.badgeCount, { backgroundColor: selectedUserIds.length > 0 ? colors.primary + '20' : colors.border }]}>
                <Text style={[styles.badgeCountText, { color: selectedUserIds.length > 0 ? colors.primary : colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  {selectedUserIds.length} selectați
                </Text>
              </View>
            </View>

            {/* BUTON DE DESCHIDERE MODAL VOLUNTARI */}
            <TouchableOpacity
              style={styles.volunteerPickerButton}
              onPress={() => setVolunteerModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="people-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.pickerButtonText} maxFontSizeMultiplier={1.3}>
                  {selectedUserIds.length === 0 ? "Apasă pentru a căuta și alege voluntari..." : "Modifică selecția voluntarilor"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* CHIPS CU VOLUNTARII SELECTAȚI */}
            {selectedUserIds.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                {selectedUsersData.slice(0, 5).map(u => (
                  <View key={u.id} style={styles.userChip}>
                    <Text style={styles.chipText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                      {u.first_name || u.display_name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleUserSelection(u.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 4 }}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedUserIds.length > 5 && (
                  <TouchableOpacity onPress={() => setVolunteerModalVisible(true)} style={styles.moreChip}>
                    <Text style={styles.moreChipText}>+{selectedUserIds.length - 5} alții</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* SECȚIUNE FORMULAR CONTRIBUȚIE */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Detalii Contribuție
            </Text>

            {/* ASOCIERE EVENIMENT (OPȚIONAL) */}
            <TouchableOpacity
              style={styles.eventSelector}
              onPress={() => setEventModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>Eveniment Asociat (Opțional)</Text>
                <Text style={{ color: selectedEvent ? colors.textPrimary : colors.textSecondary, fontSize: 15 }} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {selectedEvent ? selectedEvent.title : "Fără eveniment asociat"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* TITLU */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>Titlu Contribuție *</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: Design Grafic Poster"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                maxFontSizeMultiplier={1.3}
              />
            </View>

            {/* DESCRIERE */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>Descriere Activitate *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explică ce sarcini a îndeplinit voluntarul..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                maxFontSizeMultiplier={1.3}
              />
            </View>

            {/* ORE ACORDATE */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel} maxFontSizeMultiplier={1.2}>Număr Ore Acordate *</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 4.5"
                placeholderTextColor={colors.textSecondary}
                value={hoursToGrant}
                onChangeText={setHoursToGrant}
                keyboardType="numeric"
                maxFontSizeMultiplier={1.3}
              />
            </View>

            {/* BUTON DE TRIMITERE */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (selectedUserIds.length === 0 || !title.trim() || !description.trim() || !hoursToGrant.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={selectedUserIds.length === 0 || submitLoading}
              activeOpacity={0.8}
            >
              {submitLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitButtonText} maxFontSizeMultiplier={1.3}>
                    Trimite Cererea ({selectedUserIds.length} voluntari)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ========================================================================= */}
      {/* MODAL DEDICAT SELECTARE VOLUNTARI (FULL-SCREEN, RESPONSIV, SEARCH COMPLET) */}
      {/* ========================================================================= */}
      <Modal 
        visible={volunteerModalVisible} 
        animationType="slide" 
        transparent={true} 
        onRequestClose={() => setVolunteerModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>Selectează Voluntari</Text>
                <Text style={styles.modalSubtitle} maxFontSizeMultiplier={1.3}>
                  Caută și bifează persoanele vizate de contribuție.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVolunteerModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* BARA DE CĂUTARE PE TOATĂ LĂȚIMEA */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Caută după nume, prenume sau email..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                maxFontSizeMultiplier={1.3}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* RÂND BUTOANE ACȚIUNE RAPIDĂ */}
            <View style={styles.quickActionsRow}>
              <Text style={styles.quickStatsText} maxFontSizeMultiplier={1.2}>
                {filteredUsers.length} găsiți • {selectedUserIds.length} selectați
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={selectAllFiltered} style={styles.actionPill}>
                  <Text style={styles.actionPillTextPrimary} maxFontSizeMultiplier={1.2}>Select Toți</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAllFiltered} style={styles.actionPill}>
                  <Text style={styles.actionPillTextSecondary} maxFontSizeMultiplier={1.2}>Deselect</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LISTA VOLUNTARILOR - SPAȚIU COMPLET, DERULABIL LIN */}
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Ionicons name="search" size={40} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 10 }} />
                  <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                    {searchQuery ? "Niciun voluntar găsit pentru căutare." : "Nu există voluntari disponibili."}
                  </Text>
                </View>
              }
            />

            {/* BUTON STICKY DE CONFIRMARE */}
            <TouchableOpacity 
              style={styles.confirmSelectionButton} 
              onPress={() => setVolunteerModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmSelectionButtonText} maxFontSizeMultiplier={1.3}>
                Confirmă Selecția ({selectedUserIds.length} voluntari)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL SELECTARE EVENIMENT ASOCIAT */}
      {/* ========================================================================= */}
      <Modal visible={eventModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEventModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>Selectează Evenimentul</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setSelectedEvent(null); setEventModalVisible(false); }}
            >
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 15 }} maxFontSizeMultiplier={1.3}>
                Fără eveniment asociat (Contribuție generală)
              </Text>
            </TouchableOpacity>
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setSelectedEvent(item); setEventModalVisible(false); }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }} maxFontSizeMultiplier={1.3}>
                    {item.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }} maxFontSizeMultiplier={1.2}>
                    {new Date(item.start_time.replace(' ', 'T')).toLocaleDateString('ro-RO', { dateStyle: 'long' })}
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

const createStyles = (colors, isDark, isCompact, fontScale) => StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  headerInfo: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: Math.min(22, 20 * (1 / (fontScale > 1.2 ? 1.1 : 1))),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badgeCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  volunteerPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  pickerButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    color: colors.textPrimary,
    maxWidth: 100,
  },
  moreChip: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moreChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  eventSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '92%',
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickStatsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  actionPillTextPrimary: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionPillTextSecondary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userCardSelected: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  confirmSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  confirmSelectionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
