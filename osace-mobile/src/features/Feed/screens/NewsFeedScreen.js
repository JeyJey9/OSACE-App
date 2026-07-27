import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import screenCache from '../../../services/screenCache';
import Ionicons from '@expo/vector-icons/Ionicons';
import PostCard from '../components/PostCard';
import FeedSkeleton from '../components/FeedSkeleton';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';

export default function NewsFeedScreen() {
  const navigation = useNavigation();
  const { user, reloadUser } = useAuth();
  const managementTabName = user?.role === 'admin' ? 'Admin' : 'Coordonare';

  // ─── Cache: poștele afișate instant la swipe, fără skeleton ───
  const CACHE_KEY = 'news_feed';
  const cached = screenCache.get(CACHE_KEY);

  const [posts, setPosts] = useState(cached ?? []);
  const [loading, setLoading] = useState(cached === null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingIg, setSyncingIg] = useState(false);
  const hasLoadedOnce = useRef(cached !== null);

  const handleSyncInstagram = async () => {
    setSyncingIg(true);
    try {
      const res = await api.post('/api/posts/sync-instagram');
      Alert.alert('Sincronizare Reușită 📸', res.data.message);
      fetchPosts({ silent: false });
    } catch (err) {
      Alert.alert('Sincronizare Instagram', err.response?.data?.error || 'Nu s-a putut conecta la API-ul Instagram.');
    } finally {
      setSyncingIg(false);
    }
  };

  // ─── iOS only: PanResponder pentru zona dreaptă 75% → navigate('Activități') ───
  // Pe iOS pager-ul e dezactivat pe Noutăți (ca Drawer-ul să nu conflictuieze),
  // deci PanResponder poate prinde gestul fără competiție nativă.
  // Pe Android pager-ul e activ și el gestionează nativ swipe-ul → ignorăm.
  const { width } = Dimensions.get('window');

  const rightZonePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (Platform.OS !== 'ios') return false;
        const startX = evt.nativeEvent.pageX - gestureState.dx;
        const fromRightZone = startX >= width * 0.25;
        const swipingLeft = gestureState.dx < -12;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) + 5;
        return fromRightZone && swipingLeft && isHorizontal;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          navigation.navigate('Activități');
        }
      },
    })
  ).current;

  // Pulse animation for the verification banner
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const { colors } = useThemeColor();

  const fetchPosts = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/api/posts');
      screenCache.set(CACHE_KEY, response.data);
      setPosts(response.data);
    } catch (error) {
      console.error("Eroare la preluarea postărilor:", error);
      if (!silent) Alert.alert("Eroare", "Nu s-au putut încărca noutățile.");
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    screenCache.invalidate(CACHE_KEY);
    await Promise.all([
      fetchPosts({ silent: true }),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser]);

  useFocusEffect(
    useCallback(() => {
      // Dacă avem poște în cache → fetch silentios (zero skeleton la swipe)
      // Dacă nu avem cache → arată FeedSkeleton și așteaptă
      const hasCached = screenCache.get(CACHE_KEY) !== null;
      fetchPosts({ silent: hasCached });

      // Activează Drawer-ul nativ NUMAI pe tab-ul Noutăți (fluid tracking).
      const drawerNav = navigation.getParent('MainDrawer');
      if (drawerNav) {
        drawerNav.setOptions({ swipeEnabled: true });
      }

      return () => {
        if (drawerNav) {
          drawerNav.setOptions({ swipeEnabled: false });
        }
      };
    }, [navigation])
  );

  const onPostUpdate = (updatedPost) => {
    setPosts(currentPosts =>
      currentPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
    );
  };

  const onPostDelete = (deletedPostId) => {
    setPosts(currentPosts =>
      currentPosts.filter(p => p.id !== deletedPostId)
    );
  };

  const [viewableItemIds, setViewableItemIds] = useState([]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems) {
      setViewableItemIds(viewableItems.map(v => v.item.id));
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const isUnverified = user?.role === 'user' && user?.student_verification_status !== 'verified';
  const styles = createStyles(colors);

  return (
    <View style={{ flex: 1 }} {...rightZonePanResponder.panHandlers}>
      <ScreenContainer scrollable={false}>
        {loading ? (
          <FeedSkeleton />
        ) : (
          <FlatList
            data={posts}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <PostCard
                item={item}
                isVisible={viewableItemIds.includes(item.id)}
                onPostUpdate={onPostUpdate}
                onPostDelete={onPostDelete}
                currentUserRole={user?.role}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={() => (
              <EmptyState
                illustration="no_feed"
                title="Nicio noutate încă"
                subtitle="Nu există postări în momentul de față. Revino mai târziu!"
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Verification banner — for unverified volunteers only */}
        {isUnverified && (
          <Animated.View style={[styles.verifyBanner, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={styles.verifyBannerInner}
              onPress={() => navigation.navigate('StudentVerification')}
              activeOpacity={0.85}
            >
              <View style={styles.verifyBannerIconWrap}>
                <Ionicons name="shield-half-outline" size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.verifyBannerTitle}>Verifică-ți contul de student</Text>
                <Text style={styles.verifyBannerSub}>
                  {user?.student_verification_status === 'pending'
                    ? 'Cererea ta este în așteptare — vei fi notificat.'
                    : 'Necesar pentru a te înscrie la activități.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {(user?.role === 'admin' || user?.role === 'coordonator') && (
          <TouchableOpacity
            style={styles.fabIg}
            onPress={handleSyncInstagram}
            disabled={syncingIg}
            activeOpacity={0.8}
          >
            {syncingIg ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="logo-instagram" size={26} color="white" />
            )}
          </TouchableOpacity>
        )}
      </ScreenContainer>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  listContent: { paddingBottom: 130, paddingTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  fabIg: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#E1306C',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  verifyBanner: {
    position: 'absolute', left: 16, right: 16, bottom: 100,
    borderRadius: 18,
    shadowColor: '#E67E22', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  verifyBannerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E67E22', borderRadius: 18, padding: 14,
  },
  verifyBannerIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  verifyBannerTitle: { color: 'white', fontWeight: '800', fontSize: 14 },
  verifyBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});