import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable
} from 'react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api'; 
import Ionicons from '@expo/vector-icons/Ionicons';
import BadgeSkeleton from '../components/BadgeSkeleton';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';

// Helper pentru identificarea badge-urilor secrete / Easter Eggs
const isSecretBadge = (badge) =>
  badge.rule_type === 'easter_egg' ||
  badge.key === 'FOUND_EASTER_EGG' ||
  badge.key?.startsWith('SECRET_') ||
  badge.key?.startsWith('EASTER_EGG_');

export default function BadgeCatalogScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
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
    return allBadges
      .map(badge => ({
        ...badge,
        earned_at: earnedBadgeIds.has(badge.id),
      }))
      .filter(badge => {
        // Dacă e realizare secretă / Easter Egg și NU este deblocată, o ascundem din catalog
        if (isSecretBadge(badge) && !badge.earned_at) {
          return false;
        }
        return true;
      });
  }, [allBadges, myBadges]);

  const styles = createStyles(colors, isDark);

  const BadgeGridItem = ({ item }) => {
    const isEarned = item.earned_at; 
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => setSelectedBadge(item)}
        style={[
          styles.badgeItem, 
          isEarned && styles.badgeItemEarned
        ]}
      >
        <View style={styles.badgeTopContent}>
          <View style={[
            styles.badgeIconContainer, 
            isEarned && styles.badgeIconContainerEarned
          ]}>
            <Ionicons 
              name={item.icon_name} 
              size={32} 
              color={isEarned ? colors.primary : (isDark ? '#94A3B8' : '#64748B')} 
            />
          </View>
          <Text style={styles.badgeName} numberOfLines={2}>{item.name}</Text>
        </View>
        
        <View style={styles.badgeBottomContent}>
          {isEarned ? (
            <View style={styles.earnedTag}>
              <Ionicons name="checkmark-done" size={12} color="white" />
              <Text style={styles.earnedTagText}>DEBLOCAT</Text>
            </View>
          ) : (
            <View style={styles.lockedTag}>
              <Ionicons name="lock-closed-outline" size={10} color={colors.textSecondary} />
              <Text style={styles.lockedTagText}>BLOCAT</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerText}>
            Descoperă realizările pe care le-ai deblocat și ce te mai așteaptă. Atinge oricare realizare pentru detalii complete.
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            illustration="no_badges"
            title="Niciun badge încă"
            subtitle="Participă la activităţi pentru a debloca primele tale realizări."
          />
        }
      />

      {/* Modal Inspecție Realizare */}
      <Modal
        visible={selectedBadge !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedBadge && (
              <>
                <View style={[
                  styles.modalIconBox,
                  selectedBadge.earned_at && styles.modalIconBoxEarned
                ]}>
                  <Ionicons 
                    name={selectedBadge.icon_name} 
                    size={52} 
                    color={selectedBadge.earned_at ? colors.primary : (isDark ? '#94A3B8' : '#64748B')} 
                  />
                </View>

                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                
                <Text style={styles.modalDescription}>
                  {selectedBadge.description}
                </Text>

                {selectedBadge.earned_at ? (
                  <View style={styles.modalEarnedTag}>
                    <Ionicons name="checkmark-done" size={14} color="white" />
                    <Text style={styles.modalEarnedTagText}>DEBLOCAT</Text>
                  </View>
                ) : (
                  <View style={styles.modalLockedTag}>
                    <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.modalLockedTagText}>ÎNCĂ NEDEBLOCAT</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setSelectedBadge(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Închide</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  listContainer: {
    padding: 8,
    paddingBottom: 30,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingHorizontal: 8,
    marginBottom: 12,
    marginTop: 8,
    lineHeight: 19,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 12,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 152,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  },
  badgeItemEarned: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOpacity: isDark ? 0.35 : 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeTopContent: {
    alignItems: 'center',
    width: '100%',
  },
  badgeBottomContent: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    minHeight: 22,
    justifyContent: 'center',
  },
  badgeIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: isDark ? colors.background : '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeIconContainerEarned: {
    backgroundColor: colors.primary + '20',
  },
  badgeName: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
    includeFontPadding: false,
    width: '100%',
  },
  badgeDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    includeFontPadding: false,
    width: '100%',
  },
  earnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  earnedTagText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  lockedTagText: {
    color: colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
  },
  modalIconBoxEarned: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary + '40',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    includeFontPadding: false,
  },
  modalDescription: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
    includeFontPadding: false,
  },
  modalEarnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 20,
    gap: 6,
  },
  modalEarnedTagText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalLockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 20,
    gap: 5,
  },
  modalLockedTagText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});