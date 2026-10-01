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
  const iconName = isLogin ? 'sparkles' : 'megaphone';
  const accentColor = isLogin ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#f59e0b' : '#d97706');
  const defaultTitle = isLogin ? 'INFO VOLUNTARI NOI' : 'ANUNȚ IMPORTANT';
  const displayTitle = (announcement.title && announcement.title.trim()) || defaultTitle;

  const styles = createStyles(colors, isDark, accentColor, isLogin);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconName} size={15} color="#ffffff" />
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
          ? 'rgba(14, 165, 233, 0.12)'
          : 'rgba(245, 158, 11, 0.12)'
        : isLogin
        ? 'rgba(240, 249, 255, 0.95)'
        : 'rgba(254, 243, 199, 0.9)',
      borderWidth: 1.5,
      borderColor: isDark
        ? isLogin
          ? 'rgba(56, 189, 248, 0.3)'
          : 'rgba(245, 158, 11, 0.3)'
        : isLogin
        ? 'rgba(186, 230, 253, 0.9)'
        : 'rgba(253, 230, 138, 0.9)',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 12,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.15 : 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    iconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    titleText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: accentColor,
    },
    bodyText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '500',
    },
  });
