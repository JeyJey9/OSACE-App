import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Alert, FlatList } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';

const screenWidth = Dimensions.get("window").width;

const CATEGORY_COLORS = {
  sedinta: '#1C748C',
  social: '#27ae60',
  proiect: '#f39c12',
  default: '#777',
};

const StatCard = ({ icon, title, value, color, colors, isDark }) => (
  <View style={[
    styles.statCard, 
    { 
      backgroundColor: colors.card,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    }
  ]}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
  </View>
);

export default function UserDetailsScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const { colors, isDark } = useThemeColor();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pieChartData, setPieChartData] = useState([]);

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
          setPieChartData([
            { name: "N/A", hours: 1, color: colors.border, legendFontColor: colors.textSecondary, legendFontSize: 14 }
          ]);
        }
      } else {
        throw new Error("Răspuns invalid");
      }
    } catch (error) {
      console.error("Eroare:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca detaliile.");
      setDetails({});
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDetails(); }, [userId, colors]));

  const localStyles = createStyles(colors, isDark);

  if (loading || !details?.user_info) {
    return <ScreenContainer loading={true} />;
  }

  const { user_info, total_hours, total_attended_events, recent_events } = details;
  const totalHoursNum = parseFloat(total_hours) || 0;
  const totalEventsNum = parseInt(total_attended_events, 10) || 0;

  const chartConfig = {
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textPrimary,
  };

  const renderRecentEvent = ({ item }) => {
    const isAttended = item.confirmation_status === 'attended';
    return (
      <View style={localStyles.eventItem}>
        <Ionicons 
          name={isAttended ? "checkmark-circle" : "time-outline"}
          size={20}
          color={isAttended ? "#27ae60" : colors.textSecondary}
        />
        <Text style={[localStyles.eventTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <View style={[
            localStyles.statusTag, 
            isAttended ? localStyles.statusAttended : localStyles.statusPending
          ]}>
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
            <View style={localStyles.userHeader}>
              <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
              <Text style={localStyles.userName}>{user_info.first_name} {user_info.last_name}</Text>
              <Text style={localStyles.userEmail}>{user_info.email}</Text>
            </View>
            
            <View style={localStyles.statCardRow}>
              <StatCard 
                icon="hourglass-outline" title="Ore Totale" 
                value={totalHoursNum.toFixed(1)} color={colors.primary} 
                colors={colors} isDark={isDark}
              />
              <StatCard 
                icon="checkmark-done-outline" title="Participări" 
                value={totalEventsNum} color="#27ae60" 
                colors={colors} isDark={isDark}
              />
            </View>
            
            <View style={localStyles.chartContainer}>
              <Text style={[localStyles.chartTitle, { color: colors.textPrimary }]}>Orele pe Categorie</Text>
              <PieChart
                data={pieChartData}
                width={screenWidth - 60} 
                height={200}
                chartConfig={chartConfig}
                accessor={"hours"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>

            <Text style={[localStyles.listHeaderTitle, { color: colors.textPrimary }]}>Activități Recente</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={[localStyles.emptyText, { color: colors.textSecondary }]}>Nicio activitate recentă.</Text>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
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
  userHeader: { backgroundColor: colors.card, padding: 30, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10 },
  userEmail: { fontSize: 16, color: colors.textSecondary },
  statCardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 20 },
  chartContainer: { backgroundColor: colors.card, borderRadius: 12, margin: 15, padding: 15, alignItems: 'center', borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  listHeaderTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  eventItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginBottom: 8, borderRadius: 10, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  statusTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : '#E8F8F5' },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.15)' : '#FEF9E7' },
  emptyText: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
