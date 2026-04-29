import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';
import CustomHeader from '../../../components/layout/CustomHeader';

import { useAuth } from '../../Auth/AuthContext';

export default function MyEventsScreen() {
  const navigation = useNavigation();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useThemeColor();

  const { reloadUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const CATEGORY_TAGS = {
    sedinta: { label: 'Ședință', color: '#3498db' },
    social: { label: 'Social', color: '#27ae60' },
    proiect: { label: 'Proiect', color: '#f39c12' },
    default: { label: 'Activitate', color: colors.textSecondary }
  };

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const fetchMyEvents = async () => {
    try {
      const response = await api.get('/api/profile/my-events');
      setMyEvents(response.data);
    } catch (error) {
      console.error("Eroare la preluarea evenimentelor mele:", error);
      Alert.alert("Eroare", "Nu am putut prelua evenimentele.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await Promise.all([
      fetchMyEvents(),
      reloadUser()
    ]);

    setRefreshing(false);
  }, [reloadUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyEvents();
    }, [])
  );

  const styles = createStyles(colors, isDark);

  const renderMyEventItem = ({ item }) => {
    const isAttended = item.confirmation_status === 'attended';
    const isCheckedIn = item.confirmation_status === 'checked_in';

    const startTime = new Date(item.start_time);
    const isOngoing = new Date() >= startTime;
    const tag = CATEGORY_TAGS[item.category] || CATEGORY_TAGS.default;

    return (
      <TouchableOpacity
        style={[styles.eventItem, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
        onPress={() => navigation.navigate('EventDetail', {
          eventId: item.id,
          eventTitle: item.title
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}>
            <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            </View>
            {isOngoing ? (
              <Text style={styles.ongoingText}>În desfășurare</Text>
            ) : (
              <Text style={styles.eventDetails}>
                {startTime.toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            </View>
            <Text style={styles.eventDetails} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isAttended ? (
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#E8F8F5', borderColor: isDark ? 'rgba(46, 204, 113, 0.3)' : 'rgba(46, 204, 113, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={[styles.statusText, { color: '#27ae60' }]}>Prezență Confirmată</Text>
            </View>
          ) : isCheckedIn ? (
            <View style={{ width: '100%' }}>
              <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#EBF5FB', borderColor: isDark ? 'rgba(52, 152, 219, 0.3)' : 'rgba(52, 152, 219, 0.2)', marginBottom: 12, alignSelf: 'flex-start' }]}>
                <Ionicons name="time" size={16} color="#3498db" />
                <Text style={[styles.statusText, { color: '#3498db' }]}>Check-in realizat</Text>
              </View>

              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: STANDARD_BLUE + '15', borderColor: STANDARD_BLUE + '40', borderWidth: 1 }]}
                onPress={() => navigation.navigate('ScanScreen', { eventId: item.id })}
              >
                <Ionicons name="walk-outline" size={18} color={STANDARD_BLUE} />
                <Text style={[styles.scanButtonText, { color: STANDARD_BLUE }]}>Scanează la plecare</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: STANDARD_BLUE + '15', borderColor: STANDARD_BLUE + '40', borderWidth: 1 }]}
              onPress={() => navigation.navigate('ScanScreen', { eventId: item.id })}
            >
              <Ionicons name="qr-code-outline" size={18} color={STANDARD_BLUE} />
              <Text style={[styles.scanButtonText, { color: STANDARD_BLUE }]}>Scanează la sosire</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <CustomHeader />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
        data={myEvents}
        renderItem={renderMyEventItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }

        ListHeaderComponent={() => (
          <Text style={styles.listHeader}>Activitățile Mele</Text>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            illustration="no_registered"
            title="Nicio activitate înregistrată"
            subtitle="Nu eşti înscris la nicio activitate. Exporează evenimentele din tab-ul Activităţi!"
          />
        )}
      />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  listHeader: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 110, // Floating tab bar clearance
  },
  
  eventItem: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIconWrapper: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  ongoingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    paddingTop: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  scanButton: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});