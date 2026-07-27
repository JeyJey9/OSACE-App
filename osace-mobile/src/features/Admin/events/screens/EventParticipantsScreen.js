import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import { useAuth } from '../../../Auth/AuthContext';

export default function EventParticipantsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, eventTitle } = route.params;
  const { colors, isDark } = useThemeColor();
  const { user: currentUser } = useAuth();
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Editing Participant
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('registered');
  const [editHours, setEditHours] = useState('0');
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

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

  const fetchParticipants = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}/participants`);
      setParticipants(response.data);
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca datele participanților.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const handleOpenEditModal = (participant) => {
    setSelectedParticipant(participant);
    setEditStatus(participant.confirmation_status || 'registered');
    setEditHours((parseFloat(participant.awarded_hours) || 0).toString());
    setModalVisible(true);
  };

  const handleSaveParticipant = async () => {
    if (!selectedParticipant) return;
    setSaving(true);
    try {
      const payload = {
        status: editStatus,
      };
      if (isAdmin) {
        payload.awarded_hours = parseFloat(editHours) || 0;
      }

      await api.put(`/api/events/${eventId}/participants/${selectedParticipant.id}`, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Actualizat! ✅',
        text2: `Prezența lui ${selectedParticipant.first_name || selectedParticipant.display_name} a fost actualizată.`,
      });

      setModalVisible(false);
      fetchParticipants();
    } catch (error) {
      console.error("Eroare la salvare participant:", error.response?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Eroare", error.response?.data?.error || "Nu s-au putut salva modificările.");
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors, isDark);

  const renderParticipantItem = ({ item }) => {
    const status = item.confirmation_status;
    
    let iconName = "time-outline";
    let iconColor = colors.textSecondary;
    let statusText = "Înscris";
    let tagStyle = styles.statusPending;
    let textColor = "#f39c12";

    if (status === 'checked_in') {
      iconName = "scan-circle";
      iconColor = "#3498db";
      statusText = "Prezent (In)";
      tagStyle = styles.statusCheckedIn;
      textColor = "#3498db";
    } else if (status === 'attended') {
      iconName = "checkmark-circle";
      iconColor = "#2ecc71";
      statusText = "Finalizat";
      tagStyle = styles.statusAttended;
      textColor = "#2ecc71";
    }

    const timeText = status === 'attended' && item.awarded_hours 
      ? `${parseFloat(item.awarded_hours).toFixed(1)} ore primite`
      : status === 'checked_in' && item.check_in_time 
        ? `Sosit: ${format(new Date(item.check_in_time.replace(' ', 'T')), 'HH:mm')}`
        : 'Nu a sosit încă';

    return (
      <View style={styles.participantItem}>
        <Ionicons 
          name={iconName}
          size={24} 
          color={iconColor}
          style={styles.icon}
        />
        <View style={styles.participantDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.participantName}>{item.last_name} {item.first_name}</Text>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>#ID: {item.id}</Text>
            </View>
          </View>
          <Text style={styles.participantEmail}>@{item.display_name}</Text>
          
          {status !== 'pending' && (
            <Text style={[styles.confirmedTime, { color: textColor }]}>
              {timeText}
            </Text>
          )}
        </View>

        <View style={styles.rightActions}>
          <View style={[styles.statusTag, tagStyle]}>
            <Text style={[styles.statusTagText, { color: textColor }]}>
              {statusText}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => handleOpenEditModal(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{eventTitle}</Text>
              <View style={styles.eventIdBadge}>
                <Text style={styles.eventIdBadgeText}>Event ID #{eventId}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Total participanți înscriși: {participants.length}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>Niciun participant înscris la acest eveniment.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        overScrollMode="never"
      />

      {/* MODAL EDITARE PREZENȚĂ ȘI ORE */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Editează Prezența
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedParticipant && (
                  <Text style={[styles.modalUserSub, { color: colors.textSecondary }]}>
                    {selectedParticipant.first_name} {selectedParticipant.last_name} (@{selectedParticipant.display_name})
                  </Text>
                )}

                {/* Status Selector */}
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Status Prezență:</Text>
                <View style={styles.statusPillsRow}>
                  {[
                    { key: 'registered', label: 'Înscris' },
                    { key: 'checked_in', label: 'Prezent' },
                    { key: 'attended', label: 'Finalizat' },
                  ].map((st) => {
                    const isSelected = editStatus === st.key;
                    return (
                      <TouchableOpacity
                        key={st.key}
                        style={[
                          styles.statusPill,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: colors.primary + '20' }
                        ]}
                        onPress={() => setEditStatus(st.key)}
                      >
                        <Text style={[
                          styles.statusPillText,
                          { color: isSelected ? colors.primary : colors.textSecondary }
                        ]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Hours Input (Admin only) */}
                <View style={styles.fieldBlock}>
                  <View style={styles.labelWithBadge}>
                    <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Ore Acordate:</Text>
                    {!isAdmin && (
                      <View style={styles.adminOnlyTag}>
                        <Text style={styles.adminOnlyTagText}>Doar Admin</Text>
                      </View>
                    )}
                  </View>

                  <TextInput
                    style={[
                      styles.hoursInput,
                      { 
                        color: colors.textPrimary, 
                        borderColor: colors.border,
                        backgroundColor: isAdmin ? colors.background : (isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5')
                      }
                    ]}
                    keyboardType="numeric"
                    value={editHours}
                    onChangeText={setEditHours}
                    editable={isAdmin}
                    placeholder="0.0"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {!isAdmin && (
                    <Text style={styles.hintText}>
                      * Doar utilizatorii cu rol de Admin pot modifica direct numărul de ore.
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Anulează</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSaveParticipant}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Salvează</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { backgroundColor: colors.card, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 10 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, flex: 1 },
  eventIdBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : '#ebf5fb', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary + '40'
  },
  eventIdBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  listContent: { paddingBottom: 40 },
  participantItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  icon: { marginRight: 12 },
  participantDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  participantName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  idChip: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  idChipText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  participantEmail: { fontSize: 13, color: colors.textSecondary },
  confirmedTime: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  rightActions: { alignItems: 'flex-end', gap: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  editBtn: { padding: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f4f8', borderRadius: 6 },
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#e8f8f5' },
  statusCheckedIn: { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#EBF5FB' },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.15)' : '#fef9e7' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: colors.textSecondary, fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalUserSub: { fontSize: 13, marginTop: 4, marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  statusPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusPill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusPillText: { fontSize: 12, fontWeight: 'bold' },
  fieldBlock: { marginBottom: 20 },
  labelWithBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminOnlyTag: { backgroundColor: 'rgba(231, 76, 60, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminOnlyTagText: { color: '#e74c3c', fontSize: 10, fontWeight: 'bold' },
  hoursInput: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginTop: 4 },
  hintText: { fontSize: 11, color: '#e74c3c', marginTop: 4, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontWeight: 'bold' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});
