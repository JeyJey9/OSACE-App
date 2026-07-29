import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image,
  RefreshControl,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import LeaderboardSkeleton from '../components/LeaderboardSkeleton';

import ScreenContainer from '../../../components/layout/ScreenContainer';
import DropdownPicker from '../../../components/DropdownPicker';
import { useThemeColor } from '../../../constants/useThemeColor';

const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [availableYears, setAvailableYears] = useState([]);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYearDate = new Date().getFullYear();
  const defaultYear = currentMonth >= 9 ? currentYearDate : currentYearDate - 1;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();
  const { user, reloadUser } = useAuth();

  const fetchLeaderboard = async (yearParam) => {
    try {
      const yearQuery = yearParam ? `?year=${yearParam}` : '';
      const response = await api.get(`/api/leaderboard${yearQuery}`);
      setLeaderboardData(response.data);
    } catch (error) {
      console.error("Eroare la preluarea clasamentului:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      fetchLeaderboard(selectedYear);
    }, [selectedYear])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLeaderboard(selectedYear),
      fetchAvailableYears(),
      reloadUser()
    ]);
  }, [reloadUser, selectedYear]);

  const handleYearChange = (yearStartYear) => {
    setSelectedYear(yearStartYear);
  };

  const sortedData = useMemo(() => {
    let sortKey = 'total_hours';
    if (selectedCategory === 'social') sortKey = 'social_hours';
    if (selectedCategory === 'proiect') sortKey = 'proiect_hours';
    if (selectedCategory === 'sedinta') sortKey = 'sedinta_hours';

    return [...leaderboardData]
      .filter(u => parseFloat(u[sortKey]) > 0)
      .sort((a, b) => parseFloat(b[sortKey]) - parseFloat(a[sortKey]));
  }, [leaderboardData, selectedCategory]);

  const { top3, others } = useMemo(() => ({
    top3: sortedData.slice(0, 3),
    others: sortedData.slice(3)
  }), [sortedData]);

  // ── Self-position tracking ──
  const myRankInfo = useMemo(() => {
    if (!user) return null;
    const idx = sortedData.findIndex(u => u.id === user.id);
    if (idx === -1) return null;
    return { rank: idx + 1, entry: sortedData[idx] };
  }, [sortedData, user]);

  const isInTop3 = myRankInfo && myRankInfo.rank <= 3;

  const getDisplayHours = (u) => {
    if (selectedCategory === 'social') return parseFloat(u.social_hours || 0);
    if (selectedCategory === 'proiect') return parseFloat(u.proiect_hours || 0);
    if (selectedCategory === 'sedinta') return parseFloat(u.sedinta_hours || 0);
    return parseFloat(u.total_hours || 0);
  };

  const styles = createStyles(colors, isDark);

  const PodiumItem = ({ user: podiumUser, rank }) => {
    const rankColor = RANK_COLORS[rank];

    const goToProfile = () => {
      navigation.navigate('HomeTabs', { 
        screen: 'PublicProfile',
        params: { userId: podiumUser.id },
      });
    };

    const isMe = user && podiumUser.id === user.id;

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
        <TouchableOpacity onPress={goToProfile}>
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
        <TouchableOpacity onPress={goToProfile}>
          <Text style={styles.podiumName} numberOfLines={1}>{podiumUser.display_name}</Text>
        </TouchableOpacity>
        <View style={styles.podiumHoursContainer}>
          <Text style={[styles.podiumHours, { color: rankColor }]}>
            {getDisplayHours(podiumUser).toFixed(1)}
            <Text style={styles.podiumHoursLabel}> ore</Text>
          </Text>
        </View>
      </View>
    );
  };

  const renderListItem = ({ item, index }) => {
    const isMe = user && item.id === user.id;
    return (
      <TouchableOpacity 
        style={[
          styles.itemContainer,
          isMe && styles.itemContainerMe,
        ]}
        onPress={() => navigation.navigate('HomeTabs', { screen: 'PublicProfile', params: { userId: item.id } })}
      >
        <Text style={[styles.rank, isMe && { color: colors.primary, fontWeight: '900' }]}>
          #{index + 4}
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
          <Text style={[styles.name, isMe && { color: colors.primary, fontWeight: '800' }]} numberOfLines={1}>
            {item.display_name}
          </Text>
          {isMe && <Text style={[styles.youLabel, { color: colors.primary }]}>Tu</Text>}
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
          data={others}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            // Extra bottom padding when the sticky card is showing
            !isInTop3 && myRankInfo && { paddingBottom: 100 }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              {/* Year Selector */}
              <View style={styles.dropdownWrapper}>
                <DropdownPicker
                  options={[...availableYears.map(y => ({ label: `Anul ${y.label}`, value: y.startYear })), { label: 'Din Toate Timpurile', value: 'all' }]}
                  selectedValue={selectedYear}
                  onValueChange={handleYearChange}
                  placeholder="Selectează anul"
                />
              </View>

              {/* Category Filter */}
              <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {[
                    { key: 'general', label: 'General', color: colors.primary },
                    { key: 'social', label: 'Social', color: '#27ae60' },
                    { key: 'proiect', label: 'Proiecte', color: '#f39c12' },
                    { key: 'sedinta', label: 'Ședințe', color: '#3498db' },
                  ].map(cat => {
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
              </View>

              {/* Podium */}
              <View style={styles.podiumContainer}>
                {top3[1] && <PodiumItem user={top3[1]} rank={2} />}
                {top3[0] && <PodiumItem user={top3[0]} rank={1} />}
                {top3[2] && <PodiumItem user={top3[2]} rank={3} />}
              </View>
              
              {others.length > 0 && <Text style={styles.listTitle}>Clasament General</Text>}
              {others.length === 0 && top3.length === 0 && (
                 <Text style={[styles.listTitle, { textAlign: 'center', marginTop: 40, color: colors.textSecondary, fontWeight: 'normal' }]}>
                   Nu există voluntari cu ore în această categorie.
                 </Text>
              )}
            </>
          }
        />
      </ScreenContainer>

      {/* ── Sticky "Your Position" card (only when not in top 3) ── */}
      {myRankInfo && !isInTop3 && (
        <View style={[styles.stickyCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
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
            <View>
              <Text style={[styles.stickyName, { color: colors.primary }]} numberOfLines={1}>
                {myRankInfo.entry.display_name}
              </Text>
              <Text style={styles.stickySubtitle}>Poziția ta</Text>
            </View>
          </View>
          <Text style={[styles.stickyHours, { color: colors.primary }]}>
            {getDisplayHours(myRankInfo.entry).toFixed(1)}
            <Text style={styles.stickyHoursLabel}> ore</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  dropdownWrapper: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, backgroundColor: colors.card },
  filterWrapper: { backgroundColor: colors.card, paddingTop: 10 },
  filterScroll: { paddingHorizontal: 15, paddingBottom: 10 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginHorizontal: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' },
  filterText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

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
  youBadgePodium: { position: 'absolute', top: 30, right: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  youBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // List
  listTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  list: { paddingBottom: 25 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6, padding: 15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  itemContainerMe: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  rank: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, width: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  youLabel: { fontSize: 10, fontWeight: '800', marginTop: 1 },
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
  stickyRank: { fontSize: 16, fontWeight: '900', width: 36 },
  stickyAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  stickyName: { fontSize: 15, fontWeight: '800', maxWidth: 160 },
  stickySubtitle: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginTop: 1 },
  stickyHours: { fontSize: 16, fontWeight: '900' },
  stickyHoursLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' },
});