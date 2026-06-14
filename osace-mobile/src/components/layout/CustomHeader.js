import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../../features/Auth/AuthContext';
import { useThemeColor } from '../../constants/useThemeColor';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';

// Returns a time-appropriate Romanian greeting, cached so it doesn't flicker on tab changes
let cachedGreeting = null;
let lastHour = null;

const getGreeting = () => {
  const date = new Date();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;

  if (cachedGreeting && lastHour === hour) return cachedGreeting;

  lastHour = hour;
  let msgs = [];

  if (month === 1 && day === 1) {
    msgs = ['Un an nou fericit!', 'La mulți ani!', 'This is your year,', 'Time to lock in.'];
  } else if (month === 3 && day === 8) {
    msgs = ['La mulți ani de 8 Martie!', 'O primăvară frumoasă!'];
  } else if (month === 4 && day === 1) {
    msgs = ['Ziua păcălelilor...'];
  } else if (month === 12 && day === 25) {
    msgs = ['Crăciun Fericit!'];
  } else if (month === 12 && day === 31) {
    msgs = ['Ultima zi din an!', 'Pregătit de Revelion?'];
  } else {
    if (hour >= 0 && hour < 5) {
      msgs = ['Noapte Albă?', 'E târziu...', 'Încă o cafea?', 'Doomscrolling?'];
    } else if (hour >= 5 && hour < 9) {
      msgs = ['Bună dimineața,', 'O zi frumoasă,', 'Spor la cafeluță,'];
    } else if (hour >= 9 && hour < 12) {
      msgs = ['Spor la cafeluță,', 'Salut,', 'Hei,', 'Bine ai venit,'];
    } else if (hour >= 12 && hour < 14) {
      msgs = ['Pauza de masă?', 'Salut,', 'Capul sus, cade coroana,'];
    } else if (hour >= 14 && hour < 18) {
      msgs = ['Salut,', 'Bună,', 'Hei,', 'Bine ai venit,'];
    } else if (hour >= 18 && hour < 21) {
      msgs = ['Bună seara,', 'Seară bună,', 'Seară faină,'];
    } else {
      msgs = ['Seară faină,', 'Noapte bună,'];
    }
  }

  cachedGreeting = msgs[Math.floor(Math.random() * msgs.length)];
  return cachedGreeting;
};

const getTimeIcon = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'sunny-outline';
  if (hour >= 12 && hour < 18) return 'sunny-outline';
  if (hour >= 18 && hour < 21) return 'partly-sunny-outline';
  return 'moon-outline';
};

export default function CustomHeader({ title, showRole = true, isHidden = false }) {
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin';
  const isCoordonator = user?.role === 'coordonator';

  let roleText = 'Voluntar';
  let roleColor = STANDARD_BLUE;
  if (isAdmin) { roleText = 'Admin'; roleColor = '#E74C3C'; }
  else if (isCoordonator) { roleText = 'Coordonator'; roleColor = '#F39C12'; }

  // Track network connectivity
  const [isConnected, setIsConnected] = useState(true);

  // Subtle entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-6)).current;

  // Slide up and fade transitions when transitioning to sub-screens
  const slideUpAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const duration = isHidden ? 150 : 220;
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: isHidden ? 0 : 1,
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: isHidden ? -160 : 0,
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isHidden]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Connects if isConnected is true and internetReachable is not false
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsConnected(online);
    });
    return () => unsubscribe();
  }, []);

  const avatarUri = user?.avatar_url
    ? `${api.defaults.baseURL}${user.avatar_url.split('?')[0]}`
    : null;

  const paddingTop = Platform.OS === 'android'
    ? (insets?.top || 25) + 12
    : Math.max(insets?.top || 0, 12);

  const combinedOpacity = Animated.multiply(fadeAnim, opacityAnim);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { 
          opacity: combinedOpacity, 
          transform: [
            { translateY: slideAnim },
            { translateY: slideUpAnim }
          ]
        }
      ]}
    >
      {/* ── Blurred frosted glass base ── */}
      <BlurView
        intensity={isDark ? 55 : 70}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.blurContainer, { paddingTop }]}
      >
        {/* Tinted overlay on top of blur for depth */}
        <View style={[
          styles.tintOverlay,
          {
            backgroundColor: isDark
              ? 'rgba(18,18,22,0.55)'
              : 'rgba(255,255,255,0.55)',
          }
        ]} />

        {/* Content row */}
        <View style={styles.contentRow}>
            {/* Left: greeting + name + role */}
            <View style={styles.headerLeft}>
              {title ? (
                <Text style={[styles.headerTitleBig, { color: colors.textPrimary }]}>{title}</Text>
              ) : (
                <>
                  <View style={styles.greetingRow}>
                    <Ionicons name={getTimeIcon()} size={12} color={roleColor} style={{ marginRight: 5 }} />
                    <Text style={[styles.greetingText, { color: roleColor }]}>
                      {getGreeting().toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.headerTitleBig, { color: colors.textPrimary }]} numberOfLines={1}>
                    {user?.display_name || user?.first_name || 'Utilizator'}
                  </Text>
                  {showRole && (
                    <View style={[styles.roleTag, {
                      backgroundColor: roleColor + '18',
                      borderColor: roleColor + '35',
                    }]}>
                      <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
                      <Text style={[styles.roleText, { color: roleColor }]}>{roleText}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Right: notifications + avatar */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NotificationHistory')}
                style={[styles.iconButton, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                }]}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                style={styles.avatarButton}
                activeOpacity={0.8}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={[styles.avatarImg, { borderColor: roleColor + '60' }]}
                  />
                ) : (
                  <View style={[styles.avatarFallback, {
                    backgroundColor: roleColor + '22',
                    borderColor: roleColor + '45',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }]}>
                    <Text style={[styles.avatarInitial, { color: roleColor }]}>
                      {(user?.display_name || user?.first_name || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View 
                  style={[
                    styles.onlineDot, 
                    { 
                      backgroundColor: isConnected ? '#2ecc71' : '#e74c3c',
                      borderColor: isDark ? '#111' : '#fff' 
                    }
                  ]} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        {/* ── Bottom separator: role-colored accent line only ── */}
        <View style={styles.separatorStack}>
          <View style={[styles.separatorAccent, { backgroundColor: roleColor }]} />
        </View>
      </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // The shadow sits on the wrapper so it appears BELOW the blur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  blurContainer: {
    overflow: 'hidden',
    paddingBottom: 0,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  // Left
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  headerTitleBig: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Right
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
  },

  // Separator stack at the bottom of the header
  separatorStack: {
    height: 1.5,
    overflow: 'hidden',
  },
  separatorAccent: {
    flex: 1,
    opacity: 0.55,
  },
});
