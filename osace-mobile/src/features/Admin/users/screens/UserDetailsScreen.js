import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Alert, FlatList, TouchableOpacity } from 'react-native';
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
  const [badgesModalVisible, setBadgesModalVisible] = useState(false); // NOU

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

  useFocusEffect(useCallback(() => { fetchDetails(); }, [userId, colors]));

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

  const renderRecentEvent = ({ item }) => {
    const isAttended = item.confirmation_status === 'attended';
    return (
      <View style={localStyles.eventItem}>
        <Ionicons name={isAttended ? "checkmark-circle" : "time-outline"} size={20} color={isAttended ? "#27ae60" : colors.textSecondary} />
        <Text style={[localStyles.eventTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <View style={[localStyles.statusTag, isAttended ? localStyles.statusAttended : localStyles.statusPending]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: isAttended ? "#27ae60" : "#f39c12" }}>
            {isAttended ? 'PREZENT' : 'ÎNSCRIS'}
          </Text>
        </View>
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
              <StatCard icon="checkmark-done-outline" title="Participări" value={parseInt(total_attended_events || 0)} color="#27ae60" colors={colors} isDark={isDark} />
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
                
                <TouchableOpacity style={[localStyles.adminBtn, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 10 }]} onPress={() => setBadgesModalVisible(true)}>
                  <Ionicons name="medal-outline" size={20} color="#9b59b6" />
                  <Text style={[localStyles.adminBtnText, { color: colors.textPrimary }]}>Gestionează Badge-uri</Text>
                </TouchableOpacity>

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

            <Text style={[localStyles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: 20, marginTop: 10, marginBottom: 10 }]}>Activități Recente</Text>
          </>
        }
        ListEmptyComponent={<Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>Nicio activitate recentă.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
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
  eventItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 20, marginBottom: 8, borderRadius: 10, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  statusTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#E8F8F5' },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.15)' : '#FEF9E7' },
  emptyText: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});