// src/features/Profile/components/BadgeList.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function BadgeList({ badges }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const [selectedBadge, setSelectedBadge] = useState(null);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>REALIZĂRI ({badges?.length || 0})</Text>
      <View style={styles.badgesContainer}>
        <FlatList
          horizontal
          data={badges}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.badgeItem}
              onPress={() => setSelectedBadge(item)}
            >
              <View style={styles.badgeIconContainer}>
                <Ionicons name={item.icon_name} size={32} color={colors.primary} />
              </View>
              <Text style={styles.badgeName} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={32} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={styles.emptyBadgesText}>Nu ai câștigat niciun badge încă.</Text>
            </View>
          }
          contentContainerStyle={styles.badgeListContent}
        />
      </View>

      {/* Custom Glass Modal pentru Badge-uri */}
      <Modal
        visible={selectedBadge !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedBadge && (
              <>
                <View style={styles.modalIconBox}>
                  <Ionicons name={selectedBadge.icon_name} size={60} color={STANDARD_BLUE} />
                </View>
                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={() => setSelectedBadge(null)}
                >
                  <Text style={styles.modalButtonText}>Ok</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  badgesContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeListContent: {
    padding: 16,
    paddingVertical: 20,
  },
  badgeItem: {
    alignItems: 'center',
    width: 85, 
    marginRight: 10,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e1e5eb',
  },
  badgeName: {
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  emptyBadgesText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
  },
  modalIconBox: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: STANDARD_BLUE + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: STANDARD_BLUE + '30',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: STANDARD_BLUE,
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: STANDARD_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});