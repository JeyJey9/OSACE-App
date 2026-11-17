import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import LeaderboardSkeleton from '../components/LeaderboardSkeleton';

import ScreenContainer from '../../../components/layout/ScreenContainer';
import DropdownPicker from '../../../components/DropdownPicker';
import { useThemeColor } from '../../../constants/useThemeColor';
import {
  ACADEMIC_MONTH_OPTIONS,
  getDefaultAcademicYear,
  buildPeriodQuery,
} from '../../../constants/periodFilters';

const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

const CATEGORY_CONFIG = {
  general:     { hoursKey: 'total_hours',       countKey: 'total_activities',  label: 'General' },
  social:      { hoursKey: 'social_hours',      countKey: 'social_count',      label: 'Social' },
  proiect:     { hoursKey: 'proiect_hours',     countKey: 'proiect_count',     label: 'Proiecte' },
  sedinta:     { hoursKey: 'sedinta_hours',     countKey: 'sedinta_count',     label: 'Ședințe' },
  contributie: { hoursKey: 'contributie_hours', countKey: 'contributie_count', label: 'Contribuții' },
};

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [spotlights, setSpotlights] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getDefaultAcademicYear);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();
  const { user, reloadUser } = useAuth();

  const fetchLeaderboard = async (yearParam, monthParam) => {
    try {
      const query = buildPeriodQuery(yearParam, monthParam);
      const response = await api.get(`/api/leaderboard${query}`);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error("Eroare la preluarea clasamentului:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSpotlights = async (yearParam) => {
    try {
      const yearQuery = yearParam ? `?year=${encodeURIComponent(yearParam)}` : '';
      const response = await api.get(`/api/leaderboard/spotlights${yearQuery}`);
      setSpotlights(response.data);
    } catch (error) {
      console.error("Eroare la preluarea highlights clasament:", error);
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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAvailableYears();
      fetchLeaderboard(selectedYear, selectedMonth);
      fetchSpotlights(selectedYear);
    }, [selectedYear, selectedMonth])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLeaderboard(selectedYear, selectedMonth),
      fetchSpotlights(selectedYear),
      fetchAvailableYears(),
      reloadUser()
    ]);
  }, [reloadUser, selectedYear, selectedMonth]);

  const handleYearChange = (yearStartYear) => {
    setSelectedYear(yearStartYear);
    if (yearStartYear === 'all') {
      setSelectedMonth('all');
    }
  };

  const openPublicProfile = useCallback((userId) => {
    navigation.navigate('HomeTabs', {
      screen: 'PublicProfile',
      params: { userId },
    });
  }, [navigation]);

  const activeCatConfig = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.general;

  const rankedData = useMemo(() => {
    const { hoursKey, countKey } = activeCatConfig;
    return [...leaderboardData]
      .filter((u) => parseFloat(u[hoursKey]) > 0)
      .sort((a, b) => {
        const diff = parseFloat(b[hoursKey]) - parseFloat(a[hoursKey]);
        if (diff !== 0) return diff;
        return (parseInt(b[countKey], 10) || 0) - (parseInt(a[countKey], 10) || 0);
      })
      .map((u, idx) => ({ ...u, _rank: idx + 1 }));
  }, [leaderboardData, activeCatConfig]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const displayedList = useMemo(() => {
    if (isSearching) {
      return rankedData.filter((u) => (u.display_name || '').toLowerCase().includes(trimmedQuery));
    }
    return rankedData.slice(3);
  }, [rankedData, isSearching, trimmedQuery]);

  const top3 = useMemo(() => (isSearching ? [] : rankedData.slice(0, 3)), [rankedData, isSearching]);

  // ── Self-position tracking ──
  const myRankInfo = useMemo(() => {
    if (!user) return null;
    const entry = rankedData.find((u) => u.id === user.id);
    if (!entry) return null;
    return { rank: entry._rank, entry };
  }, [rankedData, user]);

  const isInTop3 = myRankInfo && myRankInfo.rank <= 3;

  const getDisplayHours = (u) => parseFloat(u[activeCatConfig.hoursKey] || 0);
  const getDisplayActivities = (u) => parseInt(u[activeCatConfig.countKey] || 0, 10);

  const styles = createStyles(colors, isDark);

  const isOverallYearView =
    !isSearching &&
    selectedYear !== 'all' &&
    selectedMonth === 'all' &&
    selectedCategory === 'general';
  const prevMonthWinner =
    isOverallYearView && Number(selectedYear) === getDefaultAcademicYear()
      ? spotlights?.previousMonth?.winner
      : null;
  const yearWinner = isOverallYearView ? spotlights?.academicYear?.winner : null;
  const showSpotlightBanner = Boolean(prevMonthWinner || yearWinner);

  const PodiumItem = ({ user: podiumUser, rank }) => {
    const rankColor = RANK_COLORS[rank];
    const isMe = user && podiumUser.id === user.id;
    const actCount = getDisplayActivities(podiumUser);

    return (
      <View style={[
        styles.podiumItem,
        rank === 1 && styles.firstPlace,
        isMe && styles.podiumItemMe,
      ]}>
        <Ionicons
          name={rank === 1 ? 'ribbon' : 'trophy'}
          size={24}
          color={rankColor}
          style={styles.podiumIcon}
        />
        <TouchableOpacity onPress={() => openPublicProfile(podiumUser.id)}>
          {podiumUser.avatar_url ? (
            <Image
              source={{ uri: `${api.defaults.baseURL}${podiumUser.avatar_url}` }}
              style={[styles.podiumAvatar, { borderColor: rankColor }]}
            />
          ) : (
            <View style={[styles.podiumAvatar, styles.avatarPlaceholder, { borderColor: rankColor }]}>
              <Ionicons name="person" size={30} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
        {isMe && (
          <View style={[styles.youBadgePodium, { backgroundColor: colors.primary }]}>
            <Text style={styles.youBadgeText}>Tu</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => openPublicProfile(podiumUser.id)}>
          <Text style={styles.podiumName} numberOfLines={1}>{podiumUser.display_name}</Text>
        </TouchableOpacity>
        {(podiumUser.year_champion_label || podiumUser.month_champion_label) && (
          <View style={styles.podiumChampRow}>
            {!!podiumUser.year_champion_label && (
              <View style={[styles.podiumChampChip, { backgroundColor: isDark ? 'rgba(142, 68, 173, 0.22)' : '#f3e8ff' }]}>
                <Text style={[styles.podiumChampText, { color: isDark ? '#c084fc' : '#7e22ce' }]} numberOfLines={1}>
                  👑 An
                </Text>
              </View>
            )}
            {!!podiumUser.month_champion_label && (
              <View style={styles.podiumChampChip}>
                <Text style={styles.podiumChampText} numberOfLines={1}>
                  🏆 Lună
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.podiumHoursContainer}>
          <Text style={[styles.podiumHours, { color: rankColor }]}>
            {getDisplayHours(podiumUser).toFixed(1)}
            <Text style={styles.podiumHoursLabel}> ore</Text>
          </Text>
          <Text style={styles.podiumActivities}>{actCount} act.</Text>
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }) => {
    const isMe = user && item.id === user.id;
    const actCount = getDisplayActivities(item);
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isMe && styles.itemContainerMe,
        ]}
        onPress={() => openPublicProfile(item.id)}
      >
        <Text style={[styles.rank, isMe && { color: colors.primary, fontWeight: '900' }]}>
          #{item._rank}
        </Text>
        {item.avatar_url ? (
          <Image
            source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }}
            style={[styles.avatar, isMe && { borderColor: colors.primary, borderWidth: 2 }]}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, isMe && { borderColor: colors.primary, borderWidth: 2 }]}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.name, isMe && { color: colors.primary, fontWeight: '800' }]} numberOfLines={1}>
              {item.display_name}
            </Text>
            {!!item.year_champion_label && (
              <View style={[styles.rowChampPill, { backgroundColor: 'rgba(142, 68, 173, 0.16)' }]}>
                <Text style={[styles.rowChampText, { color: '#9b59b6' }]} numberOfLines={1}>👑 Vol. Anului</Text>
              </View>
            )}
            {!!item.month_champion_label && (
              <View style={[styles.rowChampPill, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
                <Text style={[styles.rowChampText, { color: '#d97706' }]} numberOfLines={1}>🏆 Vol. Lunii</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemMeta} numberOfLines={1}>
            {actCount} {actCount === 1 ? 'activitate' : 'activități'}{isMe ? ' · Tu' : ''}
          </Text>
        </View>
        <View style={styles.hoursContainer}>
          <Text style={[styles.hours, isMe && { color: colors.primary }]}>
            {getDisplayHours(item).toFixed(1)}
            <Text style={styles.hoursLabel}> ore</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LeaderboardSkeleton />;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable={false}>
        <FlatList
          data={displayedList}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            !isInTop3 && myRankInfo && { paddingBottom: 100 }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              {/* Period Filters: Academic Year + Month */}
              <View style={styles.dropdownRow}>
                <DropdownPicker
                  style={{ flex: 1 }}
                  options={[
                    ...availableYears.map((y) => ({ label: `Anul ${y.label}`, value: y.startYear })),
                    { label: 'Din Toate Timpurile', value: 'all' },
                  ]}
                  selectedValue={selectedYear}
                  onValueChange={handleYearChange}
                  placeholder="Selectează anul"
                />
                {selectedYear !== 'all' && (
                  <DropdownPicker
                    style={{ flex: 1 }}
                    options={ACADEMIC_MONTH_OPTIONS}
                    selectedValue={selectedMonth}
                    onValueChange={setSelectedMonth}
                    placeholder="Luna"
                  />
                )}
              </View>

              {/* Category Filter + Compact Search Toggle */}
              <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity
                    style={[
                      styles.searchToggleBtn,
                      searchOpen && { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                    ]}
                    onPress={() => {
                      if (searchOpen) {
                        setSearchOpen(false);
                        setSearchQuery('');
                      } else {
                        setSearchOpen(true);
                      }
                    }}
                  >
                    <Ionicons
                      name={searchOpen ? 'close' : 'search'}
                      size={16}
                      color={searchOpen ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {[
                    { key: 'general', label: 'General', color: colors.primary },
                    { key: 'social', label: 'Social', color: '#27ae60' },
                    { key: 'proiect', label: 'Proiecte', color: '#f39c12' },
                    { key: 'sedinta', label: 'Ședințe', color: '#3498db' },
                    { key: 'contributie', label: 'Contribuții', color: '#8e44ad' },
                  ].map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.filterButton, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => setSelectedCategory(cat.key)}
                      >
                        <Text style={isActive ? styles.filterTextActive : styles.filterText}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {searchOpen && (
                  <View style={styles.searchBarBox}>
                    <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Caută voluntar după nume..."
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Compact Spotlight Pills: Volunteer of Month & Volunteer of Year */}
              {showSpotlightBanner && (
                <View style={{ gap: 6, marginTop: 8, marginBottom: 4 }}>
                  {prevMonthWinner && (
                    <TouchableOpacity
                      style={styles.spotlightPill}
                      activeOpacity={0.75}
                      onPress={() => openPublicProfile(prevMonthWinner.id)}
                    >
                      <Ionicons name="trophy" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
                      {prevMonthWinner.avatar_url ? (
                        <Image
                          source={{ uri: `${api.defaults.baseURL}${prevMonthWinner.avatar_url}` }}
                          style={styles.spotlightAvatar}
                        />
                      ) : null}
                      <Text style={styles.spotlightText} numberOfLines={1}>
                        <Text style={styles.spotlightLabel}>Voluntarul lunii {spotlights.previousMonth.label}: </Text>
                        <Text style={styles.spotlightWinner}>{prevMonthWinner.display_name}</Text>
                        <Text style={styles.spotlightHours}> · {parseFloat(prevMonthWinner.total_hours).toFixed(1)}h</Text>
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}

                  {yearWinner && (
                    <TouchableOpacity
                      style={styles.spotlightPillYear}
                      activeOpacity={0.75}
                      onPress={() => openPublicProfile(yearWinner.id)}
                    >
                      <Ionicons name="ribbon" size={16} color="#8e44ad" style={{ marginRight: 8 }} />
                      {yearWinner.avatar_url ? (
                        <Image
                          source={{ uri: `${api.defaults.baseURL}${yearWinner.avatar_url}` }}
                          style={styles.spotlightAvatar}
                        />
                      ) : null}
                      <Text style={styles.spotlightText} numberOfLines={1}>
                        <Text style={styles.spotlightLabelYear}>Voluntarul anului {spotlights.academicYear.label}: </Text>
                        <Text style={styles.spotlightWinner}>{yearWinner.display_name}</Text>
                        <Text style={styles.spotlightHoursYear}> · {parseFloat(yearWinner.total_hours).toFixed(1)}h</Text>
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Podium (hidden during active text search) */}
              {!isSearching && (
                <View style={styles.podiumContainer}>
                  {top3[1] && <PodiumItem user={top3[1]} rank={2} />}
                  {top3[0] && <PodiumItem user={top3[0]} rank={1} />}
                  {top3[2] && <PodiumItem user={top3[2]} rank={3} />}
                </View>
              )}

              {displayedList.length > 0 && (
                <Text style={styles.listTitle}>
                  {isSearching ? `Rezultate căutare (${displayedList.length})` : 'Clasament'}
                </Text>
              )}
              {displayedList.length === 0 && top3.length === 0 && (
                <Text style={[styles.listTitle, { textAlign: 'center', marginTop: 40, color: colors.textSecondary, fontWeight: 'normal' }]}>
                  {isSearching
                    ? 'Niciun voluntar găsit pentru căutarea introdusă.'
                    : 'Nu există voluntari cu ore în această perioadă/categorie.'}
                </Text>
              )}
            </>
          }
        />
      </ScreenContainer>

      {/* ── Sticky "Your Position" card (only when not in top 3 and not searching) ── */}
      {myRankInfo && !isInTop3 && !isSearching && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openPublicProfile(myRankInfo.entry.id)}
          style={[styles.stickyCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
        >
          <View style={styles.stickyLeft}>
            <Text style={[styles.stickyRank, { color: colors.primary }]}>#{myRankInfo.rank}</Text>
            {myRankInfo.entry.avatar_url ? (
              <Image
                source={{ uri: `${api.defaults.baseURL}${myRankInfo.entry.avatar_url}` }}
                style={[styles.stickyAvatar, { borderColor: colors.primary }]}
              />
            ) : (
              <View style={[styles.stickyAvatar, styles.avatarPlaceholder, { borderColor: colors.primary }]}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.stickyName, { color: colors.primary }]} numberOfLines={1}>
                {myRankInfo.entry.display_name}
              </Text>
              <Text style={styles.stickySubtitle}>
                Poziția ta · {getDisplayActivities(myRankInfo.entry)} act.
              </Text>
            </View>
          </View>
          <Text style={[styles.stickyHours, { color: colors.primary }]}>
            {getDisplayHours(myRankInfo.entry).toFixed(1)}
            <Text style={styles.stickyHoursLabel}> ore</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  dropdownRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    backgroundColor: colors.card,
  },
  filterWrapper: { backgroundColor: colors.card, paddingTop: 10, paddingBottom: 4 },
  filterScroll: { paddingHorizontal: 15, paddingBottom: 10, alignItems: 'center' },
  searchToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginHorizontal: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' },
  filterText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },

  // Compact 1-line Spotlight Pills
  spotlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
  },
  spotlightPillYear: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(142, 68, 173, 0.14)' : '#f5f3ff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(142, 68, 173, 0.35)' : '#ddd6fe',
  },
  spotlightAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  spotlightText: { flex: 1, fontSize: 12.5, marginRight: 4 },
  spotlightLabel: { color: isDark ? '#fbbf24' : '#b45309', fontWeight: '600' },
  spotlightLabelYear: { color: isDark ? '#c084fc' : '#7e22ce', fontWeight: '600' },
  spotlightWinner: { color: colors.textPrimary, fontWeight: '800' },
  spotlightHours: { color: isDark ? '#fbbf24' : '#d97706', fontWeight: '800' },
  spotlightHoursYear: { color: isDark ? '#c084fc' : '#7e22ce', fontWeight: '800' },
  podiumChampRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: 3,
  },
  podiumChampChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
  },
  podiumChampText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: isDark ? '#fbbf24' : '#b45309',
  },
  rowChampPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  rowChampText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Podium
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', padding: 20, paddingBottom: 15, backgroundColor: colors.card, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, marginBottom: 10, borderBottomWidth: isDark ? 1 : 0, borderLeftWidth: isDark ? 1 : 0, borderRightWidth: isDark ? 1 : 0, borderColor: colors.border },
  podiumItem: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2 },
  podiumItemMe: { backgroundColor: colors.primary + '08', borderRadius: 16 },
  firstPlace: { paddingBottom: 35 },
  podiumIcon: { marginBottom: 5 },
  podiumAvatar: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 3 },
  avatarPlaceholder: { backgroundColor: isDark ? colors.background : '#eee', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  podiumName: { fontWeight: 'bold', fontSize: 14, color: colors.textPrimary, marginTop: 8, textAlign: 'center', maxWidth: 90 },
  podiumHoursContainer: { marginTop: 2, alignItems: 'center', flexShrink: 0 },
  podiumHours: { fontSize: 14, fontWeight: 'bold' },
  podiumHoursLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: 'normal' },
  podiumActivities: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 1 },
  youBadgePodium: { position: 'absolute', top: 30, right: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  youBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // List
  listTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  list: { paddingBottom: 25 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6, padding: 15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  itemContainerMe: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  rank: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, width: 42 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  itemMeta: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },
  hoursContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minWidth: 70, flexShrink: 0 },
  hours: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  hoursLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' },

  // Sticky self card
  stickyCard: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  stickyRank: { fontSize: 16, fontWeight: '900', width: 38 },
  stickyAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  stickyName: { fontSize: 15, fontWeight: '800', maxWidth: 160 },
  stickySubtitle: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600', marginTop: 1 },
  stickyHours: { fontSize: 16, fontWeight: '900' },
  stickyHoursLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' },
});