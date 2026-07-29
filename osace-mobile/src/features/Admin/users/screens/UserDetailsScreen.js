import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Alert, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import { useAuth } from '../../../Auth/AuthContext';
import UserPermissionsModal from '../components/UserPermissionsModal'; 
import UserBadgesModal from '../components/UserBadgesModal'; // NOU
import ProfileHeader from '../../../Profile/components/ProfileHeader';

const screenWidth = Dimensions.get("window").width;

const CATEGORY_COLORS = {
  sedinta: '#1C748C',
  social: '#27ae60',
  proiect: '#f39c12',
  default: '#777',
};

const StatCard = ({ icon, title, value, color, colors, isDark }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderWidth: isDark ? 1 : 0, borderColor: colors.border }]}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
  </View>
);

const displayRole = (role) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'coordonator': return 'Coordonator';
    case 'user': return 'Membru';
    default: return 'Utilizator';
  }
};

export default function UserDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, userName } = route.params;
  const { colors, isDark } = useThemeColor();
  const { user: loggedInAdmin } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pieChartData, setPieChartData] = useState([]);

  // State pentru Modal Permisiuni & Badge-uri
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [badgesModalVisible, setBadgesModalVisible] = useState(false);

  // State pentru #3 - Leaderboard rank
  const [myRank, setMyRank] = useState(null);
  const [totalRanked, setTotalRanked] = useState(null);

  // State pentru #2 - Adaugă Ore modal
  const [addHoursVisible, setAddHoursVisible] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoursInput, setHoursInput] = useState('');
  const [submittingHours, setSubmittingHours] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState('');

  const fetchDetails = async () => {
    if (!details) setLoading(true);
    try {
      const response = await api.get(`/api/admin/users/${userId}/details`);

      if (response.data && response.data.user_info) {
        setDetails(response.data);
        if (response.data.hours_by_category && response.data.hours_by_category.length > 0) {
          const chartData = response.data.hours_by_category.map(item => ({
            name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
            hours: parseFloat(item.hours) || 0,
            color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
            legendFontColor: colors.textSecondary,
            legendFontSize: 14,
          }));
          setPieChartData(chartData);
        } else {
          setPieChartData([{ name: "N/A", hours: 1, color: colors.border, legendFontColor: colors.textSecondary, legendFontSize: 14 }]);
        }
      }
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca detaliile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRank = async () => {
    try {
      const res = await api.get('/api/leaderboard');
      const sorted = [...res.data].sort((a, b) => parseFloat(b.total_hours) - parseFloat(a.total_hours));
      const idx = sorted.findIndex(u => u.id === parseInt(userId));
      if (idx !== -1) {
        setMyRank(idx + 1);
        setTotalRanked(sorted.length);
      }
    } catch (_) {}
  };

  const openAddHoursModal = async () => {
    setAddHoursVisible(true);
    setEventsLoading(true);
    setSelectedEvent(null);
    setHoursInput('');
    setEventSearch('');
    try {
      const res = await api.get('/api/admin/events/all');
      setEventsList(res.data);
    } catch (_) {
      Alert.alert('Eroare', 'Nu s-au putut încărca evenimentele.');
    } finally {
      setEventsLoading(false);
    }
  };

  const submitHours = async () => {
    if (!selectedEvent) { Alert.alert('Eroare', 'Selectează un eveniment.'); return; }
    const h = parseFloat(hoursInput);
    if (!hoursInput || isNaN(h) || h <= 0) { Alert.alert('Eroare', 'Introduceți un număr valid de ore.'); return; }
    setSubmittingHours(true);
    try {
      await api.post('/api/admin/bulk-request-hours', {
        userIds: [parseInt(userId)],
        eventId: selectedEvent.id,
        hours: h,
      });
      Alert.alert('Succes', `Cerere de ${h} ore trimisă spre aprobare pentru ${userName}!`);
      setAddHoursVisible(false);
      fetchDetails();
    } catch (error) {
      Alert.alert('Eroare', error.response?.data?.error || 'A apărut o eroare.');
    } finally {
      setSubmittingHours(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDetails(); fetchRank(); }, [userId, colors]));

  // --- ACȚIUNI ADMIN ---
  const updateRoleOnServer = async (newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { newRole });
      Alert.alert("Succes", "Rolul a fost actualizat.");
      fetchDetails(); 
    } catch (error) {
      Alert.alert("Eroare", 'Actualizarea a eșuat.');
    }
  };

  const openRoleSelector = () => {
    Alert.alert(
      "Schimbă Rolul",
      `Selectează noul rol pentru ${userName}`,
      [
        { text: "Voluntar", onPress: () => updateRoleOnServer('user') },
        { text: "Coordonator", onPress: () => updateRoleOnServer('coordonator') },
        { text: "Admin", onPress: () => updateRoleOnServer('admin') },
        { text: "Anulează", style: "cancel" }
      ],
      { cancelable: true }
    );
  };

  const handleDeleteUser = () => {
    Alert.alert(
      "Confirmă Ștergerea",
      `Ești sigur că vrei să ștergi acest utilizator permanent?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/admin/users/${userId}`);
              Alert.alert("Succes", "Utilizatorul a fost șters.");
              navigation.goBack(); 
            } catch (error) {
              Alert.alert("Eroare", "Ștergerea a eșuat.");
            }
          }
        },
      ]
    );
  };

  const localStyles = createStyles(colors, isDark);

  if (loading || !details?.user_info) return <ScreenContainer loading={true} />;

  const { user_info, total_hours, total_attended_events, recent_events } = details;
  const isSelf = user_info.id === loggedInAdmin.userId;

  const CATEGORY_META = {
    sedinta:     { label: 'Ședință',     color: '#1C748C' },
    social:      { label: 'Social',      color: '#27ae60' },
    proiect:     { label: 'Proiect',     color: '#f39c12' },
    contributie: { label: 'Contribuție', color: '#9b59b6' },
    default:     { label: 'Activitate', color: colors.textSecondary },
  };

  const renderRecentEvent = ({ item }) => {
    const isAttended = item.confirmation_status === 'attended';
    const meta = CATEGORY_META[item.category] || CATEGORY_META.default;
    const hours = parseFloat(item.awarded_hours || 0);
    const dateStr = item.start_time
      ? new Date(item.start_time).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

    return (
      <View style={localStyles.eventItem}>
        {/* Left accent bar */}
        <View style={[localStyles.eventAccentBar, { backgroundColor: meta.color }]} />

        {/* Main content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <View style={[localStyles.categoryChip, { backgroundColor: meta.color + '20' }]}>
              <Text style={[localStyles.categoryChipText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {isAttended ? (
              <View style={localStyles.statusAttended}>
                <Ionicons name="checkmark-circle" size={11} color="#27ae60" />
                <Text style={[localStyles.statusText, { color: '#27ae60' }]}>PREZENT</Text>
              </View>
            ) : (
              <View style={localStyles.statusPending}>
                <Ionicons name="time-outline" size={11} color="#f39c12" />
                <Text style={[localStyles.statusText, { color: '#f39c12' }]}>ÎNSCRIS</Text>
              </View>
            )}
          </View>

          <Text style={[localStyles.eventTitle, { color: colors.textPrimary }]}>
            {item.title}
          </Text>

          {dateStr && (
            <Text style={localStyles.eventDate}>{dateStr}</Text>
          )}
        </View>

        {/* Hours badge — only show when attended and hours > 0 */}
        {isAttended && hours > 0 && (
          <View style={[localStyles.hoursBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Text style={[localStyles.hoursBadgeValue, { color: colors.primary }]}>{hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}</Text>
            <Text style={[localStyles.hoursBadgeLabel, { color: colors.primary }]}>ore</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={recent_events}
        renderItem={renderRecentEvent}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <ProfileHeader 
              user={user_info}
              roleText={displayRole(user_info.role)}
              email={user_info.email}
            />

            <View style={localStyles.statCardRow}>
              <StatCard icon="hourglass-outline" title="Ore Totale" value={parseFloat(total_hours || 0).toFixed(1)} color={colors.primary} colors={colors} isDark={isDark} />
              <StatCard icon="checkmark-done-outline" title="Participări" value={parseInt(total_attended_events || 0)} color={colors.primary} colors={colors} isDark={isDark} />
            </View>

            {/* ── #3: Leaderboard Rank + #4: Last Active ── */}
            <View style={localStyles.infoStrip}>
              {myRank !== null && (
                <View style={[localStyles.infoChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Ionicons name="trophy-outline" size={13} color={colors.primary} />
                  <Text style={[localStyles.infoChipText, { color: colors.primary }]}>#{myRank} din {totalRanked}</Text>
                </View>
              )}
              {user_info.last_seen_at && (
                <View style={[localStyles.infoChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', borderColor: colors.border }]}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={[localStyles.infoChipText, { color: colors.textSecondary }]}>
                    Activ: {new Date(user_info.last_seen_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
              {!user_info.last_seen_at && (
                <View style={[localStyles.infoChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', borderColor: colors.border }]}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={[localStyles.infoChipText, { color: colors.textSecondary }]}>Niciodătă logat</Text>
                </View>
              )}
            </View>

            {/* --- ADMIN CONTROLS --- */}
            {!isSelf && (
              <View style={localStyles.adminControlsContainer}>
                <Text style={[localStyles.sectionTitle, { color: colors.textPrimary }]}>Acțiuni Admin</Text>

                <View style={localStyles.adminButtonsRow}>
                  <TouchableOpacity style={[localStyles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={openRoleSelector}>
                    <Ionicons name="swap-vertical" size={20} color={colors.primary} />
                    <Text style={[localStyles.adminBtnText, { color: colors.textPrimary }]}>Schimbă Rol</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[localStyles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setPermModalVisible(true)}>
                    <Ionicons name="shield-checkmark" size={20} color="#f39c12" />
                    <Text style={[localStyles.adminBtnText, { color: colors.textPrimary }]}>Permisiuni</Text>
                  </TouchableOpacity>
                </View>

                <View style={localStyles.adminButtonsRow}>
                  <TouchableOpacity style={[localStyles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setBadgesModalVisible(true)}>
                    <Ionicons name="medal-outline" size={20} color="#9b59b6" />
                    <Text style={[localStyles.adminBtnText, { color: colors.textPrimary }]}>Badge-uri</Text>
                  </TouchableOpacity>

                  {/* #2: Quick Add Hours button */}
                  <TouchableOpacity style={[localStyles.adminBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]} onPress={openAddHoursModal}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[localStyles.adminBtnText, { color: colors.primary }]}>Adaugă Ore</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={localStyles.deleteBtn} onPress={handleDeleteUser}>
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  <Text style={localStyles.deleteBtnText}>Șterge Utilizator</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={localStyles.chartContainer}>
              <Text style={[localStyles.sectionTitle, { color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: 15 }]}>Ore pe Categorie</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 60}
                height={180}
                chartConfig={{ color: () => colors.primary, labelColor: () => colors.textPrimary }}
                accessor={"hours"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>

            <Text style={[localStyles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: 20, marginTop: 10, marginBottom: 10 }]}>Ultimele Activități ({recent_events?.length || 0})</Text>
          </>
        }
        ListEmptyComponent={<Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>Nicio activitate recentă.</Text>}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <UserPermissionsModal
        isVisible={permModalVisible}
        onClose={() => setPermModalVisible(false)}
        userId={userId}
        userName={userName}
      />
      
      <UserBadgesModal
        isVisible={badgesModalVisible}
        onClose={() => setBadgesModalVisible(false)}
        userId={userId}
        userName={userName}
      />

      {/* ── #2: Add Hours Modal ── */}
      <Modal visible={addHoursVisible} animationType="slide" transparent onRequestClose={() => setAddHoursVisible(false)}>
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modalBox, { backgroundColor: colors.card }]}>
            <View style={localStyles.modalHeader}>
              <Text style={[localStyles.modalTitle, { color: colors.textPrimary }]}>Adaugă Ore pentru {userName}</Text>
              <TouchableOpacity onPress={() => setAddHoursVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[localStyles.searchInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Caută eveniment..."
              placeholderTextColor={colors.textSecondary}
              value={eventSearch}
              onChangeText={setEventSearch}
            />

            {eventsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {eventsList
                  .filter(e => e.title.toLowerCase().includes(eventSearch.toLowerCase()))
                  .map(e => (
                    <TouchableOpacity
                      key={e.id}
                      style={[localStyles.eventOption, selectedEvent?.id === e.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={() => setSelectedEvent(e)}
                    >
                      <Ionicons name={selectedEvent?.id === e.id ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selectedEvent?.id === e.id ? colors.primary : colors.textSecondary} />
                      <Text style={[localStyles.eventOptionText, { color: colors.textPrimary }]} numberOfLines={1}>{e.title}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}

            <TextInput
              style={[localStyles.hoursInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: colors.textPrimary, borderColor: selectedEvent ? colors.primary : colors.border }]}
              placeholder="Număr de ore (ex: 2.5)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={hoursInput}
              onChangeText={setHoursInput}
            />

            <TouchableOpacity
              style={[localStyles.submitBtn, { backgroundColor: colors.primary, opacity: submittingHours ? 0.7 : 1 }]}
              onPress={submitHours}
              disabled={submittingHours}
            >
              {submittingHours ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.submitBtnText}>Trimite Cerere de Ore</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 12, padding: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, marginHorizontal: 5 },
  statValue: { fontSize: 26, fontWeight: 'bold', marginTop: 5 },
  statTitle: { fontSize: 12, marginTop: 2, fontWeight: '600' },
});

const createStyles = (colors, isDark) => StyleSheet.create({
  userHeader: { backgroundColor: colors.card, padding: 25, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10 },
  userEmail: { fontSize: 16, color: colors.textSecondary, marginBottom: 10 },
  rolePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  rolePillText: { fontSize: 12, fontWeight: 'bold' },
  statCardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 20 },

  adminControlsContainer: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  adminButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  adminBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  adminBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.3)' },
  deleteBtnText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#e74c3c' },

  chartContainer: { backgroundColor: colors.card, borderRadius: 12, margin: 20, padding: 20, alignItems: 'center', borderWidth: isDark ? 1 : 0, borderColor: colors.border },

  // Activity card
  eventItem: {
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.06,
    shadowRadius: 3,
    paddingVertical: 12,
    paddingRight: 12,
  },
  eventAccentBar: { width: 4, alignSelf: 'stretch', marginRight: 12, borderRadius: 2 },
  categoryChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  categoryChipText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusAttended: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(46,204,113,0.12)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusPending: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(243,156,18,0.12)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  eventTitle: { fontSize: 14, fontWeight: '700' },
  eventDate: { fontSize: 11, color: colors.textSecondary, marginTop: 3, fontWeight: '500' },
  hoursBadge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginLeft: 8, minWidth: 46 },
  hoursBadgeValue: { fontSize: 16, fontWeight: '900', lineHeight: 18 },
  hoursBadgeLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyText: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },

  // Info strip (rank, last active, verification)
  infoStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 14, marginBottom: 4 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  infoChipText: { fontSize: 12, fontWeight: '700' },

  // Add Hours modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginRight: 12 },
  searchInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  eventOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
  eventOptionText: { fontSize: 14, fontWeight: '600', flex: 1 },
  hoursInput: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 16, textAlign: 'center' },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});