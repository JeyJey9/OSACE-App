import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer'; 
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import HistorySkeleton from '../components/HistorySkeleton';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';
import CustomHeader from '../../../components/layout/CustomHeader';

import { useAuth } from '../../Auth/AuthContext'; 

export default function HistoryScreen() {
  const navigation = useNavigation(); 
  const { reloadUser } = useAuth(); 
  
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [viewMode, setViewMode] = useState('mine'); // 'mine' | 'all'
  const { colors, isDark } = useThemeColor();

  const CATEGORY_TAGS = {
    sedinta: { label: 'Ședință', color: '#3498db' },
    social: { label: 'Social', color: '#27ae60' },
    proiect: { label: 'Proiect', color: '#f39c12' },
    default: { label: 'Activitate', color: colors.textSecondary }
  };

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const formatData = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const fetchPastEvents = async (mode = viewMode) => {
    try {
      const endpoint = mode === 'mine' ? '/api/profile/my-past-events' : '/api/profile/all-past-events';
      const response = await api.get(endpoint);
      setPastEvents(response.data);
    } catch (error) {
      console.error("Eroare la preluarea istoricului:", error);
      Alert.alert("Eroare", "Nu am putut prelua istoricul activităților.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPastEvents(viewMode),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser, viewMode]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      fetchPastEvents(viewMode);
    }, [viewMode])
  );

  const stats = useMemo(() => {
    let total = 0, social = 0, proiect = 0, sedinta = 0;
    
    pastEvents.forEach(event => {
      if (event.confirmation_status === 'attended') {
        const hours = parseFloat(event.awarded_hours || event.duration_hours) || 0; 
        total += hours;
        
        if (event.category === 'social') social += hours;
        else if (event.category === 'proiect') proiect += hours;
        else if (event.category === 'sedinta') sedinta += hours;
      }
    });
    
    return { total, social, proiect, sedinta };
  }, [pastEvents]);

  const styles = createStyles(colors, isDark);

  const renderHistoryItem = ({ item }) => {
    const isAttended = item.confirmation_status === 'attended';
    const isCheckedIn = item.confirmation_status === 'checked_in';
    const isAbsent = item.confirmation_status === 'absent'; // set by auto-checkout worker
    
    const endTime = new Date(item.end_time || item.start_time);
    const now = new Date();
    const hoursSinceEnd = (now - endTime) / (1000 * 60 * 60);
    const canStillCheckout = isCheckedIn && (hoursSinceEnd <= 24); // 24h grace period

    const tag = CATEGORY_TAGS[item.category] || CATEGORY_TAGS.default;

    let iconName = 'close-circle';
    let iconColor = '#e74c3c';
    let statusText = 'Absent';
    let statusBg = isDark ? 'rgba(231, 76, 60, 0.15)' : '#FDEDEC';

    if (isAttended) {
      iconName = 'checkmark-circle';
      iconColor = '#27ae60';
      statusText = 'Prezent';
      statusBg = isDark ? 'rgba(46, 204, 113, 0.15)' : '#E8F8F5';
    } else if (isCheckedIn && canStillCheckout) {
      // Still within the 24h grace period — waiting for checkout
      iconName = 'time';
      iconColor = '#f39c12';
      statusText = 'Așteaptă Checkout';
      statusBg = isDark ? 'rgba(243, 156, 18, 0.15)' : '#FEF9E7';
    } else if (isAbsent) {
      // Explicitly marked absent by the auto-checkout worker after 24h
      iconName = 'close-circle';
      iconColor = '#e74c3c';
      statusText = 'Absent (Auto)';
      statusBg = isDark ? 'rgba(231, 76, 60, 0.15)' : '#FDEDEC';
    }
    // isCheckedIn + grace expired → falls to default red 'Absent'
    
    return (
      <TouchableOpacity 
        style={[styles.eventItem, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.event_id || item.id, eventTitle: item.title })}
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
            <Text style={styles.eventDetails}>{formatData(item.start_time)}</Text>
          </View>
          
          {isAttended && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="star" size={14} color="#f1c40f" />
              </View>
              <Text style={styles.eventHours}>+{parseFloat(item.awarded_hours || item.duration_hours).toFixed(1)} ore acumulate</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: isDark ? iconColor + '30' : iconColor + '20' }]}>
            <Ionicons name={iconName} size={14} color={iconColor} />
            <Text style={[styles.statusText, { color: iconColor }]}>{statusText}</Text>
          </View>
        </View>

        {canStillCheckout && (
          <TouchableOpacity 
            style={[styles.checkoutButton, { backgroundColor: STANDARD_BLUE + '15', borderColor: STANDARD_BLUE + '40', borderWidth: 1 }]} 
            onPress={() => navigation.navigate('ScanScreen', { eventId: item.event_id || item.id })}
          >
            <Ionicons name="walk-outline" size={18} color={STANDARD_BLUE} />
            <Text style={[styles.checkoutButtonText, { color: STANDARD_BLUE }]}>Scanează la plecare</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {viewMode === 'mine' && (
        <>
          <View style={styles.totalHoursCard}>
            <Ionicons name="time-outline" size={140} color="rgba(255,255,255,0.15)" style={styles.bgIcon} />
            <Text style={styles.totalHoursLabel}>Total Ore Voluntariat</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.totalHoursValue}>{stats.total.toFixed(1)}</Text>
              <Text style={styles.totalHoursUnit}> ore</Text>
            </View>
          </View>

          <View style={styles.miniCardRow}>
            <View style={[styles.miniCard, { backgroundColor: 'rgba(39, 174, 96, 0.12)' }]}>
              <Text style={[styles.miniCardValue, { color: '#27ae60' }]}>{stats.social.toFixed(1)}</Text>
              <Text style={styles.miniCardLabel}>SOCIAL</Text>
            </View>

            <View style={[styles.miniCard, { backgroundColor: 'rgba(243, 156, 18, 0.12)' }]}>
              <Text style={[styles.miniCardValue, { color: '#f39c12' }]}>{stats.proiect.toFixed(1)}</Text>
              <Text style={styles.miniCardLabel}>PROIECT</Text>
            </View>

            <View style={[styles.miniCard, { backgroundColor: 'rgba(52, 152, 219, 0.12)' }]}>
              <Text style={[styles.miniCardValue, { color: '#3498db' }]}>{stats.sedinta.toFixed(1)}</Text>
              <Text style={styles.miniCardLabel}>ȘEDINȚE</Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.listHeader}>
        {viewMode === 'mine' ? 'Istoric Activități' : 'Toate Evenimentele Trecute'}
      </Text>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      <CustomHeader />
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, viewMode === 'mine' && styles.toggleBtnActive]}
          onPress={() => { setViewMode('mine'); setLoading(true); }}
        >
          <Text style={[styles.toggleText, viewMode === 'mine' && styles.toggleTextActive]}>Evenimentele mele</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, viewMode === 'all' && styles.toggleBtnActive]}
          onPress={() => { setViewMode('all'); setLoading(true); }}
        >
          <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>Toate din OSACE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <HistorySkeleton />
      ) : (
        <FlatList
        data={pastEvents}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
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

        ListHeaderComponent={ListHeader} 
        ListEmptyComponent={() => (
          <EmptyState
            illustration="no_history"
            title="Niciun istoric încă"
            subtitle="Participă la o activitate şi scanează prezenţa pentru a începe să-ţi construieşti istoricul."
          />
        )}
      />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 110, // Floating tab bar clearance
  },
  
  totalHoursCard: {
    backgroundColor: colors.primary, 
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    transform: [{ rotate: '-15deg' }]
  },
  totalHoursLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  totalHoursValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 5,
  },
  totalHoursUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginLeft: 4,
  },
  
  miniCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  miniCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: isDark ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniCardValue: {
    fontWeight: '900',
    fontSize: 20,
  },
  miniCardLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
    letterSpacing: 1,
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
    marginBottom: 12,
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
  },
  eventHours: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1c40f',
  },
  
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    paddingTop: 12,
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
  
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});