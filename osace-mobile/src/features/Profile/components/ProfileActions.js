// src/features/Profile/components/ProfileActions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ProfileActions({ onEdit, onLogout, onDelete, onExport, onNotifPrefs, onBlockedUsers }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>ACȚIUNI CONT</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.button} onPress={onEdit}>
          <View style={[styles.iconContainer, { backgroundColor: STANDARD_BLUE + '15' }]}>
            <Ionicons name="settings" size={20} color={STANDARD_BLUE} />
          </View>
          <Text style={styles.buttonText}>Setări Cont</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={onNotifPrefs}>
          <View style={[styles.iconContainer, { backgroundColor: '#f39c1215' }]}>
            <Ionicons name="notifications-outline" size={20} color="#f39c12" />
          </View>
          <Text style={styles.buttonText}>Preferințe Notificări</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={onExport}>
          <View style={[styles.iconContainer, { backgroundColor: '#27ae6015' }]}>
            <Ionicons name="document-text-outline" size={20} color="#27ae60" />
          </View>
          <Text style={styles.buttonText}>Export Date (RGPD)</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={onBlockedUsers}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(192, 57, 43, 0.1)' }]}>
            <Ionicons name="ban-outline" size={20} color="#C0392B" />
          </View>
          <Text style={styles.buttonText}>Utilizatori Blocați</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={onLogout}>
          <View style={[styles.iconContainer, { backgroundColor: STANDARD_BLUE + '15' }]}>
            <Ionicons name="log-out" size={20} color={STANDARD_BLUE} />
          </View>
          <Text style={styles.buttonText}>Deconectare</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.button} onPress={onDelete}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
            <Ionicons name="trash" size={20} color="#E74C3C" />
          </View>
          <Text style={[styles.buttonText, styles.deleteButtonText]}>Șterge Contul</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  actionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  chevron: { opacity: 0.5 },
  divider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F5',
    marginHorizontal: 16,
  },
  deleteButtonText: { color: '#E74C3C' },
});