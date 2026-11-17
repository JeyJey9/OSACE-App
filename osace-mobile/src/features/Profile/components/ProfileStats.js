// src/features/Profile/components/ProfileStats.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const CATEGORY_SEGMENTS = [
  { key: 'social',      label: 'Social',      color: '#27ae60' },
  { key: 'proiect',     label: 'Proiecte',    color: '#f39c12' },
  { key: 'sedinta',     label: 'Ședințe',     color: '#1C748C' },
  { key: 'contributie', label: 'Contribuții', color: '#8e44ad' },
];

export default function ProfileStats({
  totalHours = 0,
  infoTitle,
  infoValue,
  rank = null,
  eventsCount = null,
  hoursByCategory = null,
}) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = colors.primary;
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const safeTotal = Number(totalHours) || 0;
  const segments = hoursByCategory
    ? CATEGORY_SEGMENTS.map((seg) => ({
        ...seg,
        hours: parseFloat(hoursByCategory[seg.key]) || 0,
      })).filter((seg) => seg.hours > 0)
    : [];
  const segSum = segments.reduce((acc, s) => acc + s.hours, 0);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.row}>
        {/* Total Hours Card */}
        <View style={styles.hoursCard}>
          <Text style={styles.hoursValue}>{safeTotal.toFixed(1)}</Text>
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

      {/* Secondary Mini-Row: Rank & Activities Count */}
      {(rank !== undefined || eventsCount !== undefined) && (
        <View style={[styles.row, { marginTop: 10 }]}>
          <View style={[styles.miniCard, { marginRight: 10 }]}>
            <Ionicons name="trophy-outline" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.miniValue}>{rank ? `#${rank}` : '—'}</Text>
              <Text style={styles.miniLabel}>Loc Clasament</Text>
            </View>
          </View>

          <View style={styles.miniCard}>
            <Ionicons name="checkmark-done-circle-outline" size={16} color={STANDARD_BLUE} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.miniValue}>{eventsCount ?? 0}</Text>
              <Text style={styles.miniLabel}>Activități</Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Distribution Bar */}
      {segSum > 0 && (
        <View style={styles.breakdownCard}>
          <View style={styles.barTrack}>
            {segments.map((seg) => (
              <View
                key={seg.key}
                style={{
                  flex: seg.hours,
                  height: '100%',
                  backgroundColor: seg.color,
                }}
              />
            ))}
          </View>
          <View style={styles.legendRow}>
            {segments.map((seg) => (
              <View key={seg.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                <Text style={styles.legendText}>
                  {seg.label}: <Text style={styles.legendHours}>{seg.hours.toFixed(1)}h</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  miniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    elevation: 1,
  },
  miniValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  breakdownCard: {
    marginTop: 10,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  },
  barTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  legendHours: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
});