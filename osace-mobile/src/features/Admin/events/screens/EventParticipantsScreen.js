import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function EventParticipantsScreen() {
  const route = useRoute();
  const { eventId, eventTitle } = route.params;
  const { colors, isDark } = useThemeColor();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchParticipants();
  }, [eventId]);

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
      statusText = "Prezent (Așteaptă Checkout)";
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
        ? `A sosit la: ${format(new Date(item.check_in_time), 'HH:mm')}`
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
          <Text style={styles.participantName}>{item.last_name} {item.first_name}</Text>
          <Text style={styles.participantEmail}>@{item.display_name}</Text>
          
          {status !== 'pending' && (
            <Text style={[styles.confirmedTime, { color: textColor }]}>
              {timeText}
            </Text>
          )}
        </View>
        <View style={[styles.statusTag, tagStyle]}>
          <Text style={[styles.statusTagText, { color: textColor }]}>
            {statusText}
          </Text>
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
            <Text style={styles.headerTitle}>{eventTitle}</Text>
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
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { backgroundColor: colors.card, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  listContent: { paddingBottom: 40 },
  participantItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginVertical: 6, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  icon: { marginRight: 12 },
  participantDetails: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  participantEmail: { fontSize: 13, color: colors.textSecondary },
  confirmedTime: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#e8f8f5' },
  statusCheckedIn: { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#EBF5FB' },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.15)' : '#fef9e7' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: colors.textSecondary, fontSize: 16 },
});
