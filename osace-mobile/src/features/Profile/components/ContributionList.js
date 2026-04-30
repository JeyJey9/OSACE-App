import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ContributionList({ contributions }) {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  if (!contributions || contributions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Contribuții Speciale</Text>
      
      {contributions.map((item, index) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.timelineLine} />
          
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={16} color="#fff" />
          </View>
          
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.hoursBadge}>
                <Text style={styles.hoursText}>+{item.awarded_hours}h</Text>
              </View>
            </View>
            
            <Text style={styles.description}>{item.description}</Text>
            
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('ro-RO')}
              </Text>
            </View>
          </View>
        </View>
      ))}
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
    marginBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -16,
    width: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b', // amber
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingRight: 8,
  },
  hoursBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // light green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hoursText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
