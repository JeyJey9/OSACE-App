// src/features/Profile/components/ProfileActions.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ProfileActions({ onEdit, onLogout, onDelete }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>ACȚIUNI CONT</Text>
      <View style={styles.actionsContainer}>
        {/* Buton Setări */}
        <TouchableOpacity style={styles.button} onPress={onEdit}>
          <View style={[styles.iconContainer, { backgroundColor: STANDARD_BLUE + '15' }]}>
            <Ionicons name="settings" size={20} color={STANDARD_BLUE} />
          </View>
          <Text style={styles.buttonText}>Setări Cont</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Buton Deconectare */}
        <TouchableOpacity style={styles.button} onPress={onLogout}>
          <View style={[styles.iconContainer, { backgroundColor: STANDARD_BLUE + '15' }]}>
            <Ionicons name="log-out" size={20} color={STANDARD_BLUE} />
          </View>
          <Text style={styles.buttonText}>Deconectare</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>

        {/* Buton Ștergere (Atenție: Culoare de eroare/danger) */}
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
  chevron: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#E74C3C',
  },
});