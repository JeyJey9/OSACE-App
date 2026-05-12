import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl // <-- NOU: Import RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import PostCard from '../components/PostCard';
import FeedSkeleton from '../components/FeedSkeleton';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';
import CustomHeader from '../../../components/layout/CustomHeader';
import { Animated, Easing } from 'react-native';

export default function NewsFeedScreen() {
  const navigation = useNavigation();
  const { user, reloadUser } = useAuth();
  const managementTabName = user?.role === 'admin' ? 'Admin' : 'Coordonare';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Eroare la preluarea postărilor:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca noutățile.");
    } finally {
      setLoading(false);
    }
  };

  // ▼▼▼ NOU: Funcția de refresh ▼▼▼
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPosts(),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPosts();
    }, [])
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

  const isUnverified = user?.role === 'user' && user?.student_verification_status !== 'verified';
  const styles = createStyles(colors);

  return (
    <ScreenContainer scrollable={false}>
      <CustomHeader />
      {loading ? (
        <FeedSkeleton />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard
              item={item}
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
              subtitle="Nu există postaje în momentul de faţă. Revino mai târziu!"
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
          style={styles.fab}
          onPress={() => navigation.navigate(managementTabName, { screen: 'PostForm' })}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors) => StyleSheet.create({
  listContent: { paddingBottom: 130, paddingTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
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