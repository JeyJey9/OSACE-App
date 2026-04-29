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
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api'; 
import Ionicons from '@expo/vector-icons/Ionicons';
import BadgeSkeleton from '../components/BadgeSkeleton';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';

export default function BadgeCatalogScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  
  // ▼▼▼ NOU: Preluăm culorile ▼▼▼
  const { colors, isDark } = useThemeColor();

  const fetchData = async () => {
    try {
      const [allBadgesResponse, myBadgesResponse] = await Promise.all([
        api.get('/api/badges'),
        api.get('/api/profile/my-badges')
      ]);
      setAllBadges(allBadgesResponse.data);
      setMyBadges(myBadgesResponse.data);
    } catch (error) {
      console.error("Eroare la preluarea badge-urilor:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca realizările.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const processedBadges = useMemo(() => {
    const earnedBadgeIds = new Set(myBadges.map(b => b.id));
    return allBadges.map(badge => ({
      ...badge,
      earned_at: earnedBadgeIds.has(badge.id),
    }));
  }, [allBadges, myBadges]);

  // Generăm stilurile dinamic
  const styles = createStyles(colors, isDark);

  // ▼▼▼ MUTAT ÎN INTERIOR: Pentru a avea acces la styles și colors ▼▼▼
  const BadgeGridItem = ({ item }) => {
    const isEarned = item.earned_at; 
    return (
      <View style={[
        styles.badgeItem, 
        isEarned && styles.badgeItemEarned
      ]}>
        <View style={[
          styles.badgeIconContainer, 
          isEarned && styles.badgeIconContainerEarned
        ]}>
          <Ionicons 
            name={item.icon_name} 
            size={36} 
            // Iconița e albastră OSACE dacă e blocat, verde/text dacă e deblocat
            color={isEarned ? (isDark ? '#2ecc71' : '#0E3035') : colors.primary} 
          />
        </View>
        <Text style={styles.badgeName}>{item.name}</Text>
        <Text style={styles.badgeDescription}>{item.description}</Text>
        
        {isEarned && (
          <View style={styles.earnedTag}>
            <Ionicons name="checkmark-done" size={12} color="white" />
            <Text style={styles.earnedTagText}>DEBLOCAT</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <BadgeSkeleton />;

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={processedBadges}
        renderItem={({ item }) => <BadgeGridItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <Text style={styles.headerText}>Realizările Tale</Text>
        }
        ListEmptyComponent={
          <EmptyState
            illustration="no_badges"
            title="Niciun badge încă"
            subtitle="Participă la activităţi pentru a debloca primele tale realizări."
          />
        }
      />
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  listContainer: {
    padding: 10,
    paddingBottom: 30,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 15,
    margin: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeItemEarned: {
    // Pe Dark Mode folosim un verde foarte închis/opac pentru fundal
    backgroundColor: isDark ? 'rgba(46, 204, 113, 0.1)' : '#eafaf1',
    borderColor: isDark ? '#27ae60' : '#27ae60',
  },
  badgeIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: isDark ? colors.background : '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconContainerEarned: {
    backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : '#d4f3e2',
  },
  badgeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },
  badgeDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  earnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 10,
  },
  earnedTagText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  }
});