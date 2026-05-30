import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function UserBadgesModal({ isVisible, onClose, userId, userName }) {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isVisible && userId) {
      fetchData();
      setShowPicker(false);
    }
  }, [isVisible, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uBadgesRes, allBadgesRes] = await Promise.all([
        api.get(`/api/admin/users/${userId}/badges`),
        api.get('/api/admin/badges')
      ]);
      setUserBadges(uBadgesRes.data);
      setAllBadges(allBadgesRes.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca badge-urile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAwardBadge = async (badgeId) => {
    try {
      await api.post(`/api/admin/users/${userId}/badges`, { badge_id: badgeId });
      setShowPicker(false);
      fetchData();
    } catch (error) {
      Alert.alert('Eroare', 'Acordarea badge-ului a eșuat.');
    }
  };

  const handleRevokeBadge = (badgeId, badgeName) => {
    Alert.alert(
      "Confirmare Revocare",
      `Ești sigur că vrei să retragi badge-ul "${badgeName}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Retrage",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/admin/users/${userId}/badges/${badgeId}`);
              fetchData();
            } catch (error) {
              Alert.alert('Eroare', 'Revocarea a eșuat.');
            }
          }
        }
      ]
    );
  };

  // Badge-urile pe care userul NU le are încă
  const availableBadges = allBadges.filter(b => !userBadges.some(ub => ub.id === b.id));

  const renderUserBadge = ({ item }) => (
    <View style={styles.badgeItem}>
      <Ionicons name={item.icon_name} size={24} color={colors.primary} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.badgeName}>{item.name}</Text>
        <Text style={styles.badgeDate}>
          Acordat la: {new Date(item.earned_at.replace(' ', 'T')).toLocaleDateString('ro-RO')}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRevokeBadge(item.id, item.name)} style={styles.revokeBtn}>
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  const renderAvailableBadge = ({ item }) => (
    <TouchableOpacity style={styles.availableItem} onPress={() => handleAwardBadge(item.id)}>
      <Ionicons name={item.icon_name} size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.availableName}>{item.name}</Text>
        <Text style={styles.availableDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Badge-uri {userName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ margin: 20 }} />
          ) : (
            <>
              {!showPicker ? (
                <>
                  <FlatList
                    data={userBadges}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderUserBadge}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Utilizatorul nu are niciun badge.</Text>}
                  />
                  <View style={styles.footer}>
                    <TouchableOpacity style={styles.awardButton} onPress={() => setShowPicker(true)}>
                      <Ionicons name="medal-outline" size={20} color="#fff" />
                      <Text style={styles.awardButtonText}>Acordă Badge Manual</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Alege un Badge</Text>
                  </View>
                  <FlatList
                    data={availableBadges}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderAvailableBadge}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nu mai există badge-uri disponibile.</Text>}
                  />
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  closeButton: { padding: 5 },
  
  badgeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  icon: { marginRight: 15 },
  badgeName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  badgeDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  revokeBtn: { padding: 5 },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  awardButton: { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10 },
  awardButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },

  pickerHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginLeft: 15 },
  availableItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  availableName: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  availableDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }
});
