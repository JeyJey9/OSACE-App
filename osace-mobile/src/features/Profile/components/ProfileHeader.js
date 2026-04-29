// src/features/Profile/components/ProfileHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ProfileHeader({ user, roleText, avatarLoading = false, onAvatarPress }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);
  
  const canEdit = typeof onAvatarPress === 'function';

  return (
    <View style={styles.profileHeader}>
      <TouchableOpacity 
        onPress={onAvatarPress} 
        disabled={avatarLoading || !canEdit} 
        style={styles.avatarContainer}
      >
        {avatarLoading ? (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator size="large" color={STANDARD_BLUE} />
          </View>
        ) : user.avatar_url ? (
          <Image 
            source={{ 
              uri: `${api.defaults.baseURL}${user.avatar_url.split('?')[0]}?v=${Date.now()}` 
            }} 
            style={styles.avatarImage} 
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={60} color={STANDARD_BLUE} />
          </View>
        )}
        
        {canEdit && !avatarLoading && (
          <View style={styles.editAvatarOverlay}>
            <Ionicons name="camera" size={16} color={isDark ? '#fff' : '#fff'} />
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.profileName} numberOfLines={1}>{user.display_name}</Text>
      
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{roleText.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative',
    shadowColor: STANDARD_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: STANDARD_BLUE + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: STANDARD_BLUE + '30',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.card,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: -5, 
    right: -5, 
    backgroundColor: STANDARD_BLUE,
    width: 36,
    height: 36,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: STANDARD_BLUE + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    color: STANDARD_BLUE,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});