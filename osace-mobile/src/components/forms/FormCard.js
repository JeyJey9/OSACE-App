import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../../constants/useThemeColor';

export default function FormCard({ title, children }) {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
});