import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Alert, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import CustomHeader from '../../../components/layout/CustomHeader';

const screenWidth = Dimensions.get('window').width;

const CATEGORY_META = {
  sedinta: { label: 'Ședințe', color: '#1C748C' },
  social:  { label: 'Social',  color: '#27ae60' },
  proiect: { label: 'Proiecte', color: '#f39c12' },
};

// ── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, color, colors, isDark }) => (
  <View style={[kpiStyles.card, {
    backgroundColor: colors.card,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  }]}>
    <View style={[kpiStyles.iconCircle, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[kpiStyles.value, { color: colors.textPrimary }]} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
    <Text style={[kpiStyles.label, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 3,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 22, fontWeight: '900', marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.5 },
});

// ── Horizontal Bar Chart ──────────────────────────────────────────────────
const CategoryBars = ({ data, colors, isDark }) => {
  const total = data.reduce((s, d) => s + d.hours, 0);
  if (!total) return null;
  return (
    <View>
      {data.map((item, i) => {
        const pct = total > 0 ? (item.hours / total) * 100 : 0;
        const meta = CATEGORY_META[item.category] || { label: item.category, color: item.color };
        return (
          <View key={i} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{meta.label}</Text>
              <Text style={{ color: meta.color, fontWeight: '800', fontSize: 13 }}>{parseFloat(item.hours).toFixed(1)}h</Text>
            </View>
            <View style={{ height: 10, borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0f0f0', overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: 10, borderRadius: 6, backgroundColor: meta.color }} />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 3 }}>{pct.toFixed(0)}% din total</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Monthly Trend Mini-Bars ───────────────────────────────────────────────
const MonthlyTrend = ({ data, colors, isDark }) => {
  if (!data || data.length === 0) return <Text style={{ color: colors.textSecondary, padding: 10, textAlign: 'center' }}>Nu există date recente.</Text>;
  const maxHours = Math.max(...data.map(d => d.hours || 0), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 90, paddingTop: 10 }}>
      {data.map((item, i) => {
        const barH = Math.max(((item.hours || 0) / maxHours) * 70, 4);
        return (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 9, marginBottom: 3, fontWeight: '600' }}>{item.hours ? parseFloat(item.hours).toFixed(0) + 'h' : ''}</Text>
            <View style={{ width: '60%', height: barH, borderRadius: 5, backgroundColor: colors.primary + 'CC' }} />
            <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 5, fontWeight: '700' }}>{item.month}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Top Volunteer Row ──────────────────────────────────────────────────────
const VolunteerRow = ({ item, rank, colors, isDark }) => {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <View style={[volStyles.row, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
      <Text style={volStyles.rank}>{medals[rank] || `#${rank + 1}`}</Text>
      {item.avatar_url ? (
        <Image source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }} style={volStyles.avatar} />
      ) : (
        <View style={[volStyles.avatar, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={16} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[volStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[volStyles.sub, { color: colors.textSecondary }]}>{item.events_attended} activități</Text>
      </View>
      <View style={[volStyles.hoursBadge, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[volStyles.hoursText, { color: colors.primary }]}>{parseFloat(item.total_hours).toFixed(1)}h</Text>
      </View>
    </View>
  );
};

const volStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  rank: { fontSize: 20, marginRight: 10, width: 30, textAlign: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 12, marginRight: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 11, marginTop: 1 },
  hoursBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  hoursText: { fontWeight: '900', fontSize: 13 },
});

// ── Section Card Wrapper ───────────────────────────────────────────────────
const SectionCard = ({ title, icon, children, colors, isDark }) => (
  <View style={[secStyles.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
    <View style={secStyles.titleRow}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: 8 }} />
      <Text style={[secStyles.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const secStyles = StyleSheet.create({
  card: {
    borderRadius: 20, padding: 18, marginHorizontal: 16, marginBottom: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '800' },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function StatisticsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { colors, isDark } = useThemeColor();

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/statistics');
      if (response.data && typeof response.data === 'object') {
        setStats(response.data);
      } else {
        throw new Error('Răspuns invalid');
      }
    } catch (error) {
      console.error('Eroare la preluarea statisticilor:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca statisticile.');
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); fetchStats(); }, []));

  if (loading || !stats) return <ScreenContainer loading={true} />;

  const totalHours   = parseFloat(stats.total_hours_volunteered) || 0;
  const totalPart    = parseInt(stats.total_participants_attended, 10) || 0;
  const totalEvents  = parseInt(stats.total_events_completed, 10) || 0;
  const uniqueVolunteers = parseInt(stats.total_unique_volunteers, 10) || 0;
  const avgAttendees = parseFloat(stats.avg_attendees_per_event) || 0;
  const categoryData = stats.hours_by_category || [];
  const topVolunteers = stats.top_volunteers || [];
  const monthlyTrend = stats.monthly_trend || [];
  const popular = stats.most_popular_event;

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Page Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}>Statistici</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Bazate pe activitățile finalizate</Text>
        </View>

        {/* KPI Row 1 */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 11, marginBottom: 10 }}>
          <KpiCard icon="time-outline"     label="Ore Totale"  value={totalHours.toFixed(1)}  color="#1566B9" colors={colors} isDark={isDark} />
          <KpiCard icon="calendar-outline" label="Evenimente" value={totalEvents}              color="#8e44ad" colors={colors} isDark={isDark} />
        </View>

        {/* KPI Row 2 */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 11, marginBottom: 18 }}>
          <KpiCard icon="people-outline"   label="Voluntari Unici"      value={uniqueVolunteers} color="#27ae60" colors={colors} isDark={isDark} />
          <KpiCard icon="stats-chart-outline" label="Medie/Activitate" value={avgAttendees + ' pers'} color="#f39c12" colors={colors} isDark={isDark} />
        </View>

        {/* Category Breakdown */}
        <SectionCard title="Ore pe Categorie" icon="pie-chart-outline" colors={colors} isDark={isDark}>
          {categoryData.length > 0
            ? <CategoryBars data={categoryData} colors={colors} isDark={isDark} />
            : <Text style={{ color: colors.textSecondary }}>Nu există date.</Text>
          }
        </SectionCard>

        {/* Monthly Trend */}
        <SectionCard title="Activitate Lunară" icon="bar-chart-outline" colors={colors} isDark={isDark}>
          <MonthlyTrend data={monthlyTrend} colors={colors} isDark={isDark} />
          <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 8, textAlign: 'center' }}>Ultimele 6 luni · ore acumulate</Text>
        </SectionCard>

        {/* Top Volunteers */}
        {topVolunteers.length > 0 && (
          <SectionCard title="Top Voluntari" icon="trophy-outline" colors={colors} isDark={isDark}>
            {topVolunteers.map((v, i) => (
              <VolunteerRow key={v.id} item={v} rank={i} colors={colors} isDark={isDark} />
            ))}
          </SectionCard>
        )}

        {/* Most Popular Event */}
        {popular && (
          <SectionCard title="Activitate Populară" icon="flame-outline" colors={colors} isDark={isDark}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>
                  {popular.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[{ backgroundColor: (CATEGORY_META[popular.category]?.color || '#777') + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: CATEGORY_META[popular.category]?.color || '#777' }}>
                      {CATEGORY_META[popular.category]?.label || popular.category}
                    </Text>
                  </View>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 4, fontWeight: '600' }}>{popular.attendee_count} participanți</Text>
                </View>
              </View>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                <Ionicons name="star" size={24} color={colors.primary} />
              </View>
            </View>
          </SectionCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}