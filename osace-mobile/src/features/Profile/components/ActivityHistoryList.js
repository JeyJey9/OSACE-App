import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const CATEGORY_CONFIG = {
  sedinta: { label: 'Ședință', color: '#3498db', icon: 'briefcase' },
  social: { label: 'Social', color: '#27ae60', icon: 'people' },
  proiect: { label: 'Proiect', color: '#f59e0b', icon: 'bulb' },
  default: { label: 'Activitate', color: '#6366f1', icon: 'calendar' }
};

export default function ActivityHistoryList({ events = [], title = "Istoric Activități" }) {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  if (!events || events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={28} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nicio activitate înregistrată în această perioadă.</Text>
        </View>
      </View>
    );
  }

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title} ({events.length})</Text>

      {events.map((event, index) => {
        const catConfig = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.default;
        const hoursNum = parseFloat(event.awarded_hours || event.duration_hours || 0);
        const hoursFormatted = Number.isInteger(hoursNum) ? `${hoursNum}h` : `${hoursNum.toFixed(1)}h`;
        const locationText = event.location?.trim() || 'Sediul OSACE';

        return (
          <View key={event.id || index} style={styles.card}>
            {index < events.length - 1 && <View style={styles.timelineLine} />}

            <View style={[styles.iconContainer, { backgroundColor: catConfig.color }]}>
              <Ionicons name={catConfig.icon} size={16} color="#fff" />
            </View>

            <View style={styles.content}>
              {/* Header: Titlu + Ore Acordate */}
              <View style={styles.headerRow}>
                <Text style={styles.title} numberOfLines={2}>
                  {event.title}
                </Text>
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursText}>+{hoursFormatted}</Text>
                </View>
              </View>

              {/* Tag Categorie */}
              <View style={styles.categoryRow}>
                <View style={[styles.categoryChip, { backgroundColor: `${catConfig.color}20` }]}>
                  <Text style={[styles.categoryText, { color: catConfig.color }]}>
                    {catConfig.label}
                  </Text>
                </View>
              </View>

              {/* Informații Metadate: Dată + Locație vizibilă */}
              <View style={styles.metaBlock}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaDateText} maxFontSizeMultiplier={1}>
                    {formatEventDate(event.start_time)}
                  </Text>
                </View>

                <View style={styles.locationRow}>
                  <View style={styles.locationIconWrap}>
                    <Ionicons name="location-sharp" size={14} color="#e74c3c" />
                  </View>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {locationText}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    marginBottom: 14,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    bottom: -14,
    width: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  hoursBadge: {
    backgroundColor: isDark ? 'rgba(39, 174, 96, 0.25)' : 'rgba(39, 174, 96, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(39, 174, 96, 0.4)' : 'rgba(39, 174, 96, 0.25)',
  },
  hoursText: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 13,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaBlock: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationIconWrap: {
    width: 16,
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: isDark ? '#e2e8f0' : '#334155',
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
