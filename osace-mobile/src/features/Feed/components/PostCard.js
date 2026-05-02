import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNowStrict, differenceInHours } from 'date-fns';
import { ro } from 'date-fns/locale';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const diffHours = differenceInHours(new Date(), date);

  if (diffHours < 1) return 'Acum câteva minute';
  if (diffHours < 24) {
    return formatDistanceToNowStrict(date, { addSuffix: true, locale: ro });
  }
  if (diffHours < 24 * 7) {
    // Within the past week: "3 zile în urmă"
    return formatDistanceToNowStrict(date, { addSuffix: true, locale: ro });
  }
  // Older: show full date
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const isNewPost = (dateString) => {
  return differenceInHours(new Date(), new Date(dateString)) < 24;
};

const MAX_DESCRIPTION_LENGTH = 120;

// ─── Component ──────────────────────────────────────────────────────────────

export default function PostCard({ item, onPostUpdate, onPostDelete, currentUserRole }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useThemeColor();

  const [isLiked, setIsLiked] = useState(item.is_liked_by_me);
  const [likeCount, setLikeCount] = useState(parseInt(item.likes_count, 10));
  const [commentCount, setCommentCount] = useState(parseInt(item.comment_count, 10) || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ─── Animated values ──────────────────────────────────────────────────────
  const heartScale = useSharedValue(1);
  const floatingHeartOpacity = useSharedValue(0);
  const floatingHeartScale = useSharedValue(0.5);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const floatingHeartStyle = useAnimatedStyle(() => ({
    opacity: floatingHeartOpacity.value,
    transform: [{ scale: floatingHeartScale.value }],
  }));

  // ─── Like logic ───────────────────────────────────────────────────────────
  const triggerLike = useCallback(() => {
    if (isLiked) return; // Don't re-trigger if already liked via double-tap

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Spring animation on heart icon
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    // Floating heart animation
    floatingHeartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 300 })
    );
    floatingHeartScale.value = withSequence(
      withSpring(1.2, { damping: 5 }),
      withTiming(1.6, { duration: 600 })
    );

    setIsLiked(true);
    setLikeCount((c) => c + 1);
    api.post(`/api/posts/${item.id}/like`).catch(() => {
      setIsLiked(false);
      setLikeCount((c) => c - 1);
    });
  }, [isLiked]);

  const handleLikeToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !isLiked;

    heartScale.value = withSequence(
      withSpring(newLiked ? 1.4 : 0.8, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6 })
    );

    setIsLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));

    const call = newLiked
      ? api.post(`/api/posts/${item.id}/like`)
      : api.delete(`/api/posts/${item.id}/like`);

    call.catch(() => {
      setIsLiked(!newLiked);
      setLikeCount((c) => (newLiked ? c - 1 : c + 1));
    });
  }, [isLiked]);

  // ─── Double-tap gesture ───────────────────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(triggerLike)();
    });

  // ─── Other handlers ───────────────────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate('Admin', {
      screen: 'PostForm',
      params: { postToEdit: { id: item.id, description: item.description, created_at: item.created_at, image_urls: item.image_urls } },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Uite ce a postat OSACE: ${item.image_urls?.[0] ?? 'o postare'}` });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirmă Ștergerea', 'Ești sigur că vrei să ștergi această postare?', [
      { text: 'Anulează', style: 'cancel' },
      {
        text: 'Șterge', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/posts/${item.id}`);
            onPostDelete?.(item.id);
          } catch {
            Alert.alert('Eroare', 'Nu s-a putut șterge postarea.');
          }
        },
      },
    ]);
  };

  const handleGoToComments = () => {
    navigation.navigate('Comments', {
      postId: item.id,
      onCommentAdded: () => setCommentCount((c) => c + 1),
    });
  };

  const handleImageScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(index);
  };

  const imageCount = Array.isArray(item.image_urls) ? item.image_urls.length : 0;
  const descriptionExists = item.description?.length > 0;
  const isLongText = descriptionExists && item.description.length > MAX_DESCRIPTION_LENGTH;
  const isNew = isNewPost(item.created_at);

  const styles = createStyles(colors, isDark, width);

  return (
    <View style={styles.card}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          {/* Story ring around avatar if post is new (<24h) */}
          <View style={[styles.avatarWrapper, isNew && styles.avatarRing]}>
            <Image source={require('../../../assets/osace.png')} style={styles.avatar} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.creatorName}>{item.creator_name}</Text>
            <Text style={styles.timestamp}>{formatRelativeDate(item.created_at)}</Text>
          </View>
        </View>

        {/* Admin / Coordinator actions */}
        {(currentUserRole === 'admin' || currentUserRole === 'coordonator') && (
          <View style={styles.adminActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButtonAdmin}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#C0392B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Image carousel with double-tap to like ── */}
      {imageCount > 0 && (
        <View style={styles.imageWrapper}>
          <GestureDetector gesture={doubleTap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScroll}
              scrollEnabled={imageCount > 1}
              style={{ width }}
            >
              {item.image_urls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={{ width, height: width }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </GestureDetector>

          {/* Floating heart for double-tap feedback */}
          <Animated.View style={[styles.floatingHeart, floatingHeartStyle]} pointerEvents="none">
            <Ionicons name="heart" size={80} color="white" />
          </Animated.View>

          {/* Dot indicators — only if multiple images */}
          {imageCount > 1 && (
            <View style={styles.dotsContainer}>
              {item.image_urls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentImageIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Action buttons ── */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLikeToggle} style={styles.actionButton}>
            <Animated.View style={heartAnimStyle}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? '#e74c3c' : colors.textPrimary}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGoToComments} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {/* Image counter badge on the right */}
        {imageCount > 1 && (
          <Text style={styles.imageCounter}>{currentImageIndex + 1}/{imageCount}</Text>
        )}
      </View>

      {/* ── Details: likes, description, comments ── */}
      <View style={styles.detailsContainer}>
        {likeCount > 0 && (
          <Text style={styles.likeCount}>
            {likeCount} {likeCount === 1 ? 'apreciere' : 'aprecieri'}
          </Text>
        )}

        {descriptionExists && (
          <>
            <Text style={styles.description}>
              <Text style={styles.creatorName}>{item.creator_name} </Text>
              {isLongText && !isExpanded
                ? `${item.description.substring(0, MAX_DESCRIPTION_LENGTH)}...`
                : item.description}
            </Text>
            {isLongText && (
              <TouchableOpacity onPress={() => setIsExpanded((v) => !v)}>
                <Text style={styles.showMoreButton}>
                  {isExpanded ? 'Afișează mai puțin' : 'Mai mult'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity onPress={handleGoToComments}>
          <Text style={styles.commentButtonText}>
            {commentCount > 0
              ? `Vezi toate cele ${commentCount} comentarii`
              : 'Adaugă un comentariu...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors, isDark, width) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    // Shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.35 : 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    // Subtle border
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'transparent',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // Default: no ring
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Story-ring effect for posts < 24h old
  avatarRing: {
    borderWidth: 2.5,
    borderColor: '#f39c12',
    // Add a small gap between ring and avatar using padding + background
    padding: 2,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  creatorName: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonAdmin: {
    // just spacing
  },

  // ── Image carousel ──
  imageWrapper: {
    width,
    aspectRatio: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  floatingHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    zIndex: 10,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // ── Actions row ──
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  imageCounter: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // ── Details ──
  detailsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 4,
  },
  likeCount: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  showMoreButton: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  commentButtonText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
    marginTop: 4,
  },
});