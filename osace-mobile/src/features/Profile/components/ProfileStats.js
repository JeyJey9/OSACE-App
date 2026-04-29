// src/features/Profile/components/ProfileStats.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ProfileStats({ totalHours, infoTitle, infoValue }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.row}>
        {/* Total Hours Card */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursValue}>{totalHours.toFixed(1)}</Text>
          <Text style={styles.hoursLabel}>Ore Acumulate</Text>
        </View>

        {/* Info Card */}
        {infoTitle && infoValue && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{infoTitle}</Text>
            <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>{infoValue}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hoursCard: {
    flex: 1,
    backgroundColor: STANDARD_BLUE, 
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 10,
    elevation: 4,
    shadowColor: STANDARD_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  hoursValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  hoursLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
});