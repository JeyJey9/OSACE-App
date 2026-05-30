import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function StudentVerificationRequestsScreen() {
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const BLUE = isDark ? '#4A90E2' : '#1566B9';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/verification/pending');
      setRequests(res.data);
    } catch (err) {
      Alert.alert('Eroare', 'Nu s-au putut prelua cererile de verificare.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRequests(); }, []));

  const handleApprove = async (id, name) => {
    Alert.alert('Aprobare', `Ești sigur că vrei să verifici contul lui ${name}?`, [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Aprobă', onPress: async () => {
          setActionLoading(true);
          try {
            await api.post(`/api/verification/${id}/approve`);
            Toast.show({ type: 'success', text1: 'Cont verificat!', text2: `${name} poate acum participa la activități.` });
            fetchRequests();
          } catch (err) {
            Alert.alert('Eroare', err.response?.data?.error || 'Eroare la aprobare.');
          } finally {
            setActionLoading(false);
          }
        }
      }
    ]);
  };

  const openRejectModal = (id) => {
    setRejectReason('');
    setRejectModal({ visible: true, id });
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      Alert.alert('Motiv necesar', 'Te rugăm să specifici un motiv de respingere.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/api/verification/${rejectModal.id}/reject`, { reason: rejectReason.trim() });
      setRejectModal({ visible: false, id: null });
      Toast.show({ type: 'info', text1: 'Cerere respinsă', text2: 'Utilizatorul a fost notificat și poate re-trimite.' });
      fetchRequests();
    } catch (err) {
      Alert.alert('Eroare', err.response?.data?.error || 'Eroare la respingere.');
    } finally {
      setActionLoading(false);
    }
  };

  const s = createStyles(colors, isDark, insets, BLUE);

  const renderItem = ({ item }) => {
    const submittedAt = format(new Date(item.created_at.replace(' ', 'T')), 'dd MMM yyyy, HH:mm', { locale: ro });
    const imageUri = `${api.defaults.baseURL}${item.image_url}`;
    const fullName = `${item.first_name} ${item.last_name}`;

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          {item.avatar_url ? (
            <Image source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarPlaceholder]}>
              <Text style={{ color: BLUE, fontWeight: '800', fontSize: 18 }}>{item.display_name?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.cardName}>{fullName}</Text>
            <Text style={s.cardAlias}>@{item.display_name}</Text>
            <Text style={s.cardEmail}>{item.email}</Text>
          </View>
          <View style={[s.pendingBadge, { backgroundColor: '#f39c1222' }]}>
            <Text style={[s.pendingBadgeText, { color: '#f39c12' }]}>În așteptare</Text>
          </View>
        </View>

        <Text style={s.submittedLabel}>Trimis la {submittedAt}</Text>

        {/* ID photo */}
        <Image source={{ uri: imageUri }} style={s.idImage} resizeMode="contain" />

        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.rejectBtn, { borderColor: '#e74c3c' }]}
            onPress={() => openRejectModal(item.id)}
            disabled={actionLoading}
          >
            <Ionicons name="close-circle-outline" size={18} color="#e74c3c" />
            <Text style={[s.rejectBtnText, { color: '#e74c3c' }]}>Respinge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.approveBtn, { backgroundColor: '#27ae60' }]}
            onPress={() => handleApprove(item.id, fullName)}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
            <Text style={s.approveBtnText}>Aprobă</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {loading ? (
        <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 60 }} />
      ) : requests.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={64} color={BLUE + '60'} />
          <Text style={s.emptyTitle}>Nicio cerere în așteptare</Text>
          <Text style={s.emptySub}>Toate verificările au fost procesate.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reject reason modal */}
      <Modal visible={rejectModal.visible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Motiv respingere</Text>
            <Text style={s.modalSub}>Explică utilizatorului ce trebuie corectat pentru a putea re-trimite:</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ex: Fotografia este neclară, CNP-ul nu este vizibil..."
              placeholderTextColor={colors.textSecondary + '80'}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setRejectModal({ visible: false, id: null })}>
                <Text style={[s.modalCancelText, { color: colors.textSecondary }]}>Anulează</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalRejectBtn, { backgroundColor: '#e74c3c' }]} onPress={handleReject} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="white" /> : <Text style={s.modalRejectText}>Respinge</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors, isDark, insets, BLUE) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: insets.bottom + 20 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.07, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: BLUE + '18', justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  cardAlias: { fontSize: 13, color: BLUE, fontWeight: '600', marginTop: 1 },
  cardEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingBadgeText: { fontSize: 11, fontWeight: '800' },
  submittedLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  idImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colors.background, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  rejectBtnText: { fontWeight: '700', fontSize: 14 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  approveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', flexShrink: 1, alignSelf: 'stretch' },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', flexShrink: 1, alignSelf: 'stretch' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  modalInput: { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F6F8', borderRadius: 12, padding: 14, fontSize: 14, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F6F8' },
  modalCancelText: { fontWeight: '700', fontSize: 15 },
  modalRejectBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
  modalRejectText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
