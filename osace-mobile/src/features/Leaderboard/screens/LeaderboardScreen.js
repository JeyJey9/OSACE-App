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
import { useAuth } from '../../../features/Auth/AuthContext'; // <-- NOU: Aducem Contextul
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import LeaderboardSkeleton from '../components/LeaderboardSkeleton';

import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();
  const { reloadUser } = useAuth(); // <-- NOU: extragem reloadUser

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/api/leaderboard');
      setLeaderboardData(response.data);
    } catch (error) {
      console.error("Eroare la preluarea clasamentului:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLeaderboard();
    }, [])
  );

  // ▼▼▼ MODIFICAT: Reîncărcăm și utilizatorul la refresh ▼▼▼
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLeaderboard(),
      reloadUser()
    ]);
  }, [reloadUser]);

  const sortedData = useMemo(() => {
    let sortKey = 'total_hours';
    if (selectedCategory === 'social') sortKey = 'social_hours';
    if (selectedCategory === 'proiect') sortKey = 'proiect_hours';
    if (selectedCategory === 'sedinta') sortKey = 'sedinta_hours';

    return [...leaderboardData]
      .filter(user => parseFloat(user[sortKey]) > 0)
      .sort((a, b) => parseFloat(b[sortKey]) - parseFloat(a[sortKey]));
  }, [leaderboardData, selectedCategory]);

  const { top3, others } = useMemo(() => ({
    top3: sortedData.slice(0, 3),
    others: sortedData.slice(3)
  }), [sortedData]);

  const getDisplayHours = (user) => {
    if (selectedCategory === 'social') return parseFloat(user.social_hours || 0);
    if (selectedCategory === 'proiect') return parseFloat(user.proiect_hours || 0);
    if (selectedCategory === 'sedinta') return parseFloat(user.sedinta_hours || 0);
    return parseFloat(user.total_hours || 0);
  };

  const styles = createStyles(colors, isDark);

  const PodiumItem = ({ user, rank }) => {
    let podiumStyles = styles.podiumItem;
    let iconName = 'trophy';
    let iconColor = '#CD7F32'; 

    if (rank === 1) {
      podiumStyles = [styles.podiumItem, styles.firstPlace];
      iconName = 'ribbon';
      iconColor = '#FFD700'; 
    } else if (rank === 2) {
      podiumStyles = [styles.podiumItem, styles.secondPlace];
      iconColor = '#C0C0C0'; 
    }

    const goToProfile = () => {
      navigation.navigate('HomeTabs', { 
        screen: 'PublicProfile',
        params: { userId: user.id },
      });
    };

    return (
      <View style={podiumStyles}>
        <Ionicons name={iconName} size={24} color={iconColor} style={styles.podiumIcon} />
        <TouchableOpacity onPress={goToProfile}>
          {user.avatar_url ? (
            <Image source={{ uri: `${api.defaults.baseURL}${user.avatar_url}` }} style={styles.podiumAvatar} />
          ) : (
            <View style={[styles.podiumAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={30} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goToProfile}>
          <Text style={styles.podiumName} numberOfLines={1}>{user.display_name}</Text>
        </TouchableOpacity>
        <View style={styles.podiumHoursContainer}>
          <Text style={styles.podiumHours}>{getDisplayHours(user).toFixed(1)}<Text style={styles.podiumHoursLabel}> ore</Text></Text>
        </View>
      </View>
    );
  };

  const renderListItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('HomeTabs', { screen: 'PublicProfile', params: { userId: item.id } })}
    >
      <Text style={styles.rank}>#{index + 4}</Text>
      {item.avatar_url ? (
        <Image source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={20} color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{item.display_name}</Text>
      <View style={styles.hoursContainer}>
        <Text style={styles.hours}>{getDisplayHours(item).toFixed(1)}<Text style={styles.hoursLabel}> ore</Text></Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LeaderboardSkeleton />;

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={others}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.filterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity style={[styles.filterButton, selectedCategory === 'general' && styles.filterActive]} onPress={() => setSelectedCategory('general')}>
                  <Text style={selectedCategory === 'general' ? styles.filterTextActive : styles.filterText}>General</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedCategory === 'social' && { backgroundColor: '#27ae60', borderColor: '#27ae60' }]} onPress={() => setSelectedCategory('social')}>
                  <Text style={selectedCategory === 'social' ? styles.filterTextActive : styles.filterText}>Social</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedCategory === 'proiect' && { backgroundColor: '#f39c12', borderColor: '#f39c12' }]} onPress={() => setSelectedCategory('proiect')}>
                  <Text style={selectedCategory === 'proiect' ? styles.filterTextActive : styles.filterText}>Proiecte</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, selectedCategory === 'sedinta' && { backgroundColor: '#3498db', borderColor: '#3498db' }]} onPress={() => setSelectedCategory('sedinta')}>
                  <Text style={selectedCategory === 'sedinta' ? styles.filterTextActive : styles.filterText}>Ședințe</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

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
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  filterWrapper: { backgroundColor: colors.card, paddingTop: 15 },
  filterScroll: { paddingHorizontal: 15, paddingBottom: 15 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginHorizontal: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', padding: 20, paddingBottom: 15, backgroundColor: colors.card, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 4, marginBottom: 10, borderBottomWidth: isDark ? 1 : 0, borderLeftWidth: isDark ? 1 : 0, borderRightWidth: isDark ? 1 : 0, borderColor: colors.border },
  podiumItem: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2 },
  firstPlace: { paddingBottom: 35 },
  podiumIcon: { marginBottom: 5 },
  podiumAvatar: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 3, borderColor: colors.primary },
  avatarPlaceholder: { backgroundColor: isDark ? colors.background : '#eee', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  podiumName: { fontWeight: 'bold', fontSize: 14, color: colors.textPrimary, marginTop: 8, textAlign: 'center', maxWidth: 90 },
  podiumHoursContainer: { marginTop: 2, alignItems: 'center', flexShrink: 0 },
  podiumHours: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  podiumHoursLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: 'normal' },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  list: { paddingBottom: 25 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6, padding: 15, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  rank: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary, width: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginRight: 10 },
  hoursContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minWidth: 70, flexShrink: 0 },
  hours: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  hoursLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' }
});