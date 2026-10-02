import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../constants/useThemeColor';

/**
 * AnnouncementBanner component renders an admin-controlled notice banner.
 * Used on NewsFeedScreen (under header) and LoginScreen.
 * Persistent and clean design with dark/light mode theme support.
 */
export default function AnnouncementBanner({
  announcement,
  variant = 'news', // 'news' | 'login'
  style,
}) {
  const { colors, isDark } = useThemeColor();

  if (!announcement || !announcement.isActive || !announcement.text || !announcement.text.trim()) {
    return null;
  }

  const isLogin = variant === 'login';
  // User requested: ambele bannere (login și news) folosesc aceeași iconiță/emote
  const iconName = 'megaphone';
  const accentColor = isLogin ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#fbbf24' : '#d97706');
  const defaultTitle = isLogin ? 'INFO VOLUNTARI NOI' : 'ANUNȚ IMPORTANT';
  const displayTitle = (announcement.title && announcement.title.trim()) || defaultTitle;

  const styles = createStyles(colors, isDark, accentColor, isLogin);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={iconName}
            size={14}
            color={isDark ? accentColor : '#ffffff'}
          />
        </View>
        <Text style={styles.titleText}>{displayTitle.toUpperCase()}</Text>
      </View>
      <Text style={styles.bodyText}>{announcement.text.trim()}</Text>
    </View>
  );
}

const createStyles = (colors, isDark, accentColor, isLogin) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark
        ? isLogin
          ? '#0c2238'
          : '#241a0d'
        : isLogin
        ? 'rgba(240, 249, 255, 0.95)'
        : 'rgba(254, 243, 199, 0.9)',
      borderWidth: 1.5,
      borderColor: isDark
        ? isLogin
          ? 'rgba(56, 189, 248, 0.42)'
          : 'rgba(251, 191, 36, 0.42)'
        : isLogin
        ? 'rgba(186, 230, 253, 0.9)'
        : 'rgba(253, 230, 138, 0.9)',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 6,
      elevation: isDark ? 3 : 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    iconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark
        ? isLogin
          ? 'rgba(56, 189, 248, 0.18)'
          : 'rgba(251, 191, 36, 0.18)'
        : accentColor,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark
        ? isLogin
          ? 'rgba(56, 189, 248, 0.35)'
          : 'rgba(251, 191, 36, 0.35)'
        : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 9,
    },
    titleText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: accentColor,
    },
    bodyText: {
      fontSize: 13,
      lineHeight: 19,
      color: isDark ? '#f1f5f9' : colors.textPrimary,
      fontWeight: '500',
    },
  });
