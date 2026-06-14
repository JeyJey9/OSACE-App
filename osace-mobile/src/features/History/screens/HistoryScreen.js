import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ScrollView
} from 'react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import screenCache from '../../../services/screenCache';
import Ionicons from '@expo/vector-icons/Ionicons';
import HistorySkeleton from '../components/HistorySkeleton';
import EmptyState from '../../../components/EmptyState';
import { useThemeColor } from '../../../constants/useThemeColor';
import DropdownPicker from '../../../components/DropdownPicker';

import { useAuth } from '../../Auth/AuthContext';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { reloadUser } = useAuth();

  // ─── Cache: folosim cheie compusă din mod + an pentru fiecare combinație de filtre ───
  // La revenirea pe tab: date afișate instant din cache.
  // La schimbarea filtrelor: skeleton intenționat (date noi).
  const getCacheKey = (mode, year) => `history_${mode}_${year ?? 'all'}`;
  const initialCacheKey = getCacheKey('mine', null);
  const initialCached = screenCache.get(initialCacheKey);

  const [pastEvents, setPastEvents] = useState(initialCached ?? []);
  const [loading, setLoading] = useState(initialCached === null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('mine');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const { colors, isDark } = useThemeColor();
  // Skeleton apare doar la prima încărcare; schimbarea filtrelor arată skeleton (intenționat)
  const hasLoadedOnce = useRef(initialCached !== null);

  const CATEGORY_TAGS = {
    sedinta: { label: 'Ședință', color: '#3498db' },
    social: { label: 'Social', color: '#27ae60' },
    proiect: { label: 'Proiect', color: '#f39c12' },
    default: { label: 'Activitate', color: colors.textSecondary }
  };

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const formatData = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString.replace(' ', 'T')).toLocaleString('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const fetchPastEvents = async (mode = viewMode, yearParam = selectedYear, { silent = false } = {}) => {
    const cacheKey = getCacheKey(mode, yearParam);
    if (!silent) setLoading(true);
    try {
      const endpoint = mode === 'mine' ? '/api/profile/my-past-events' : '/api/profile/all-past-events';
      const yearQuery = yearParam ? `?year=${yearParam}` : '';
      const response = await api.get(`${endpoint}${yearQuery}`);
      screenCache.set(cacheKey, response.data);
      setPastEvents(response.data);
    } catch (error) {
      console.error("Eroare la preluarea istoricului:", error);
      if (!silent) Alert.alert("Eroare", "Nu am putut prelua istoricul activităților.");
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await api.get('/api/leaderboard/available-years');
      setAvailableYears(response.data);
    } catch (error) {
      console.error("Eroare la preluarea anilor disponibili:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Invalideză cache-ul pentru combinația curentă de filtre
    screenCache.invalidate(getCacheKey(viewMode, selectedYear));
    await Promise.all([
      fetchPastEvents(viewMode, selectedYear, { silent: true }),
      fetchAvailableYears(),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser, viewMode, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      // La revenirea pe tab: dacă avem cache pentru filtrele curente → fetch silentios
      // La schimbarea filtrelor (viewMode/selectedYear): loading=true e setat de butoanele UI
      const cacheKey = getCacheKey(viewMode, selectedYear);
      const hasCached = screenCache.get(cacheKey) !== null;
      // La primul focus, actualizăm cu cache-ul deja încărcat în state init
      if (hasCached && hasLoadedOnce.current) {
        const cachedData = screenCache.get(cacheKey);
        if (cachedData) setPastEvents(cachedData);
      }
      fetchAvailableYears();
      fetchPastEvents(viewMode, selectedYear, { silent: hasCached });
    }, [viewMode, selectedYear])
  );

  const handleYearChange = (yearStartYear) => {
    setSelectedYear(yearStartYear);
  };

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

    const timeStr = item.end_time || item.start_time;
    const endTime = new Date(timeStr ? timeStr.replace(' ', 'T') : new Date());
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
          <View style={styles.dateIntervalContainer}>
            <View style={styles.dateRow}>
              <View style={[styles.dateDot, { backgroundColor: '#2ecc71' }]} />
              <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1} maxFontSizeMultiplier={1}>{formatData(item.start_time)}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateRow}>
              <View style={[styles.dateDot, { backgroundColor: '#e74c3c' }]} />
              <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1} maxFontSizeMultiplier={1}>{formatData(item.end_time)}</Text>
            </View>
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

  const ListHeader = () => {
    const dropdownOptions = availableYears.map(y => ({ label: `Anul ${y.label}`, value: y.startYear }));
    dropdownOptions.push({ label: 'Toate Orele', value: 'all' });

    return (
      <View>
        <View style={styles.dropdownWrapper}>
          <DropdownPicker
            options={dropdownOptions}
            selectedValue={selectedYear || (availableYears[0] ? availableYears[0].startYear : null)}
            onValueChange={handleYearChange}
            placeholder="Selectează perioada"
          />
        </View>

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
  };

  return (
    <ScreenContainer scrollable={false}>

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
    dropdownWrapper: { paddingHorizontal: 20, paddingTop: 10 },
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
    dateIntervalContainer: {
      marginBottom: 6,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 10,
      marginLeft: 6,
    },
    dateDivider: {
      borderLeftWidth: 2,
      borderStyle: 'dotted',
      borderColor: colors.textSecondary,
      height: 12,
      marginLeft: 9,
      marginTop: 2,
      marginBottom: 2,
      opacity: 0.5,
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