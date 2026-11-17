import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import { useThemeColor } from '../../../../constants/useThemeColor';

const PERIOD_BADGE_DEFAULTS = {
  VOLUNTEER_OF_THE_MONTH: 'Octombrie 2026',
  VOLUNTEER_OF_THE_YEAR: '2025-2026',
};

const PERIOD_QUICK_OPTIONS = {
  VOLUNTEER_OF_THE_MONTH: ['Septembrie 2026', 'Octombrie 2026', 'Noiembrie 2026'],
  VOLUNTEER_OF_THE_YEAR: ['2024-2025', '2025-2026', '2026-2027'],
};

export default function UserBadgesModal({ isVisible, onClose, userId, userName }) {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  const [userBadges, setUserBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [periodFormState, setPeriodFormState] = useState(null); // { badge, isEdit }
  const [periodInput, setPeriodInput] = useState('');

  useEffect(() => {
    if (isVisible && userId) {
      fetchData();
      setShowPicker(false);
      setPeriodFormState(null);
      setPeriodInput('');
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

  const handleAwardBadge = async (badgeId, periodLabel = null, replacePeriod = false) => {
    try {
      const payload = periodLabel
        ? { badge_id: badgeId, period_label: periodLabel, replace_period: replacePeriod }
        : { badge_id: badgeId };
      await api.post(`/api/admin/users/${userId}/badges`, payload);
      setPeriodFormState(null);
      setPeriodInput('');
      setShowPicker(false);
      fetchData();
    } catch (error) {
      Alert.alert('Eroare', 'Acordarea badge-ului a eșuat.');
    }
  };

  const openPeriodForm = (badge, isEdit = false) => {
    setPeriodFormState({ badge, isEdit });
    setPeriodInput(badge.period_label || PERIOD_BADGE_DEFAULTS[badge.key] || '');
  };

  const handleSelectAvailableBadge = (item) => {
    if (PERIOD_BADGE_DEFAULTS[item.key]) {
      openPeriodForm(item, false);
      return;
    }
    handleAwardBadge(item.id);
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

  // Badge-urile pe care userul NU le are încă + badge-urile de campion (la care se pot adăuga noi luni/ani)
  const availableBadges = allBadges.filter(
    (b) => Boolean(PERIOD_BADGE_DEFAULTS[b.key]) || !userBadges.some((ub) => ub.id === b.id)
  );

  const renderUserBadge = ({ item }) => {
    const isChampion = Boolean(PERIOD_BADGE_DEFAULTS[item.key]);
    return (
      <View style={styles.badgeItem}>
        <Ionicons name={item.icon_name} size={24} color={colors.primary} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.badgeName}>{item.name}</Text>
          {!!item.period_label && (
            <Text style={styles.badgePeriod}>Perioada: {item.period_label}</Text>
          )}
          <Text style={styles.badgeDate}>
            Acordat la: {new Date(item.earned_at.replace(' ', 'T')).toLocaleDateString('ro-RO')}
          </Text>
          {isChampion && (
            <TouchableOpacity
              style={styles.editPeriodChip}
              onPress={() => openPeriodForm(item, true)}
            >
              <Ionicons name="create-outline" size={13} color="#d97706" style={{ marginRight: 4 }} />
              <Text style={styles.editPeriodChipText}>
                {item.period_label ? 'Schimbă perioada' : 'Setează perioada'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => handleRevokeBadge(item.id, item.name)} style={styles.revokeBtn}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPeriodForm = () => {
    if (!periodFormState) return null;
    const { badge, isEdit } = periodFormState;
    const quickOptions = PERIOD_QUICK_OPTIONS[badge.key] || [];
    return (
      <View style={styles.periodFormBox}>
        <Text style={styles.periodFormTitle}>{badge.name}</Text>
        <Text style={styles.periodFormHint}>
          Alege rapid sau scrie luna / anul pentru care este acordat acest badge:
        </Text>
        {quickOptions.length > 0 && (
          <View style={styles.quickChipsRow}>
            {quickOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.quickChip,
                  periodInput.trim() === opt && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}
                onPress={() => setPeriodInput(opt)}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    periodInput.trim() === opt && { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TextInput
          style={styles.periodInput}
          value={periodInput}
          onChangeText={setPeriodInput}
          placeholder="Ex: Octombrie 2026 sau 2025-2026"
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />
        <View style={styles.periodActionsRow}>
          <TouchableOpacity
            style={styles.periodCancelBtn}
            onPress={() => setPeriodFormState(null)}
          >
            <Text style={styles.periodCancelText}>Anulează</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodConfirmBtn}
            onPress={() => {
              const trimmed = periodInput.trim();
              if (!trimmed) {
                Alert.alert('Atenție', 'Te rugăm să introduci perioada.');
                return;
              }
              handleAwardBadge(badge.id, trimmed, isEdit);
            }}
          >
            <Text style={styles.periodConfirmText}>{isEdit ? 'Salvează' : 'Acordă'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAvailableBadge = ({ item }) => (
    <TouchableOpacity style={styles.availableItem} onPress={() => handleSelectAvailableBadge(item)}>
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
          ) : periodFormState ? (
            <>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setPeriodFormState(null)}>
                  <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Perioadă Badge</Text>
              </View>
              {renderPeriodForm()}
            </>
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
                    <TouchableOpacity
                      onPress={() => {
                        setPeriodFormState(null);
                        setShowPicker(false);
                      }}
                    >
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
  availableDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badgePeriod: { fontSize: 12, fontWeight: '700', color: '#d97706', marginTop: 2 },
  editPeriodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  editPeriodChipText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  quickChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  periodFormBox: { padding: 20 },
  periodFormTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  periodFormHint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  periodInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  periodActionsRow: { flexDirection: 'row', gap: 10 },
  periodCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodCancelText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  periodConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  periodConfirmText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
