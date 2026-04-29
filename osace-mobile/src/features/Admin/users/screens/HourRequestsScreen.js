import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import * as Haptics from 'expo-haptics';
import EmptyState from '../../../../components/EmptyState';

export default function HourRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [actionLoading, setActionLoading] = useState(null); 
  const [inputValues, setInputValues] = useState({}); 

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/admin/hour-requests');
      setRequests(response.data);
      
      const initialInputs = {};
      response.data.forEach(req => {
        initialInputs[req.id] = req.requested_hours.toString();
      });
      setInputValues(initialInputs);
    } catch (error) {
      console.error('Eroare la preluarea cererilor:', error);
      Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-au putut încărca cererile.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, []);

  const handleApprove = async (id) => {
    const rawValue = inputValues[id];
    const numericValue = parseFloat(rawValue.replace(',', '.'));

    if (isNaN(numericValue) || numericValue < 0) {
      Alert.alert('Eroare', 'Te rugăm să introduci un număr valid de ore.');
      return;
    }

    try {
      setActionLoading(id);
      const response = await api.post(`/api/admin/hour-requests/${id}/approve`, {
        approved_hours: numericValue,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Cerere Aprobată! ✅', text2: response.data.message });
      fetchRequests(); 
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Eroare', text2: error.response?.data?.error || 'Nu s-a putut aproba.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id) => {
    Alert.alert(
      "Respingere Cerere",
      "Ești sigur că vrei să respingi aceste ore? Voluntarul nu va primi nimic din această cerere.",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Respinge", 
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await api.post(`/api/admin/hour-requests/${id}/reject`);
              Toast.show({ type: 'info', text1: 'Cerere Respinsă ❌', text2: 'Cererea a fost ștearsă din sistem.' });
              fetchRequests();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Eroare', text2: 'Nu s-a putut respinge.' });
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleInputChange = (id, text) => {
    setInputValues(prev => ({ ...prev, [id]: text }));
  };

  const styles = createStyles(colors, isDark);

  const renderRequestItem = ({ item }) => {
    const isOvertime = item.request_type === 'overtime';
    const isManual = item.request_type === 'manual';
    
    let tagColor = '#e67e22';
    let tagLabel = 'Check-out Ratat';
    if (isOvertime) { tagColor = '#9b59b6'; tagLabel = 'Cerere Overtime'; }
    if (isManual) { tagColor = '#3498db'; tagLabel = 'Cerere Manuală'; }

    const formatSafe = (dateString) => {
      if (!dateString) return 'Necunoscut';
      return format(new Date(dateString), 'dd MMM, HH:mm', { locale: ro });
    };
    const formatTimeOnly = (dateString) => {
      if (!dateString) return '--:--';
      return format(new Date(dateString), 'HH:mm', { locale: ro });
    };

    const eventStart = formatTimeOnly(item.start_time);
    const eventEnd = formatTimeOnly(item.end_time);
    const eventDate = formatSafe(item.start_time).split(',')[0]; 

    const checkIn = formatTimeOnly(item.check_in_time);
    const checkOutFull = item.check_out_time ? formatSafe(item.check_out_time) : 'N/A';

    let isAnomaly = false;
    let anomalyMessage = "";
    let mathExplanation = "";

    if (isManual) {
      mathExplanation = "Cerere introdusă manual din sistem de către un coordonator/admin.";
    } else if (isOvertime && item.check_out_time) {
      const diffHours = (new Date(item.check_out_time) - new Date(item.end_time)) / (1000 * 60 * 60);
      if (diffHours > 4) {
        isAnomaly = true;
        anomalyMessage = `⚠️ Atenție: Scanat la ${diffHours.toFixed(1)} ore după eveniment!`;
      }
      mathExplanation = `Timp real a depășit programul. Diferența de timp a generat cererea de ${item.requested_hours}h.`;
    } else {
      mathExplanation = "Voluntarul a uitat să scaneze la plecare. Cererea este pentru durata fixă a evenimentului.";
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.tag, { backgroundColor: tagColor + '20' }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{tagLabel}</Text>
          </View>
          <Text style={styles.dateText}>Cerută pe: {format(new Date(item.created_at), 'dd MMM', { locale: ro })}</Text>
        </View>

        <View style={styles.userInfo}>
          <Ionicons name="person-circle-outline" size={40} color={colors.textSecondary} />
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{item.last_name} {item.first_name}</Text>
            <Text style={styles.userEmail}>@{item.display_name}</Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{item.event_title} ({eventDate})</Text>

        <View style={styles.timelineBox}>
          <View style={styles.timelineSection}>
            <Ionicons name="calendar" size={18} color={colors.textSecondary} style={{marginTop: 2}}/>
            <View style={styles.timelineDetails}>
              <Text style={styles.timelineLabel}>Program Oficial:</Text>
              <Text style={styles.timelineValue}>{eventStart} - {eventEnd}</Text>
            </View>
          </View>

          {!isManual && (
            <View style={[styles.timelineSection, { marginTop: 12 }]}>
              <Ionicons name="scan" size={18} color={isAnomaly ? '#e74c3c' : colors.primary} style={{marginTop: 2}}/>
              <View style={styles.timelineDetails}>
                <Text style={[styles.timelineLabel, isAnomaly && {color: '#e74c3c'}]}>Pontaj Real (Scanat):</Text>
                <Text style={[styles.timelineValue, isAnomaly && {color: '#e74c3c'}]}>Check-in: {checkIn}</Text>
                <Text style={[styles.timelineValue, isAnomaly && {color: '#e74c3c'}]}>Check-out: {checkOutFull}</Text>
              </View>
            </View>
          )}

          {isAnomaly && <Text style={styles.anomalyWarning}>{anomalyMessage}</Text>}
        </View>

        <View style={styles.explanationBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.explanationText}>{mathExplanation}</Text>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ore aprobate:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inputValues[item.id]}
              onChangeText={(text) => handleInputChange(item.id, text)}
              placeholder="0.0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.btn, styles.rejectBtn]} 
              onPress={() => handleReject(item.id)}
              disabled={actionLoading !== null}
            >
              <Ionicons name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.approveBtn]} 
              onPress={() => handleApprove(item.id)}
              disabled={actionLoading !== null}
            >
              {actionLoading === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="white" />
                  <Text style={styles.approveBtnText}>Aprobă</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Revizuire Ore</Text>
          <Text style={styles.subtitle}>
            Aprobă cererile automate sau adaugă manual.
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addManualBtn}
          onPress={() => navigation.navigate('AssignHours')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              illustration="no_requests"
              title="Totul e la zi!"
              subtitle="Nu există cereri de ore în aşteptare."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 5, lineHeight: 18, paddingRight: 10 },
  addManualBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  listContent: { padding: 15, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  dateText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  userTextContainer: { marginLeft: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 10 },
  timelineBox: { backgroundColor: isDark ? '#1a252f' : '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  timelineSection: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineDetails: { marginLeft: 10 },
  timelineLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  timelineValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  anomalyWarning: { color: '#e74c3c', fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  explanationBox: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, paddingHorizontal: 5 },
  explanationText: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', marginLeft: 6, flex: 1, lineHeight: 16 },
  actionArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderColor: colors.border, paddingTop: 15 },
  inputContainer: { flex: 0.35 },
  inputLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 5, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, backgroundColor: isDark ? '#2c3e50' : '#EBF5FB', textAlign: 'center' },
  buttonsContainer: { flex: 0.6, flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e74c3c', width: 45, marginRight: 10 },
  approveBtn: { backgroundColor: '#27ae60', flex: 1, flexDirection: 'row' },
  approveBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 5, fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 15 },
});
