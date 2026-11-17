// src/features/Profile/screens/PublicProfileScreen.js
import React, { useState, useCallback, useLayoutEffect } from 'react';
import { StyleSheet, Alert, View, TouchableOpacity, Text } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

// --- Importuri Componente Refactorizate ---
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import BadgeList from '../components/BadgeList'; 
import ContributionList from '../components/ContributionList';
import ActivityHistoryList from '../components/ActivityHistoryList';
import ProfileSkeleton from '../components/ProfileSkeleton';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import DropdownPicker from '../../../components/DropdownPicker';

// Hook pentru temă
import { useThemeColor } from '../../../constants/useThemeColor';
import {
  ACADEMIC_MONTH_OPTIONS,
  getDefaultAcademicYear,
  buildPeriodQuery,
} from '../../../constants/periodFilters';

export default function PublicProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;
  const { colors, isDark } = useThemeColor();

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

  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getDefaultAcademicYear);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const fetchProfileData = async (yearParam, monthParam) => {
    try {
      setLoading(true);
      const query = buildPeriodQuery(yearParam, monthParam);
      
      const [profileResponse, badgesResponse, contributionsResponse, pastEventsResponse] = await Promise.all([
        api.get(`/api/profile/${userId}${query}`),
        api.get(`/api/profile/${userId}/badges`),
        api.get(`/api/profile/${userId}/contributions${query}`),
        api.get(`/api/profile/${userId}/past-events${query}`)
      ]);
      
      setProfile(profileResponse.data);
      setBadges(badgesResponse.data);
      setContributions(contributionsResponse.data);
      setPastEvents(pastEventsResponse.data || []);
    } catch (error) {
      console.error("Eroare la preluarea profilului public:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca datele acestui voluntar.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await api.get(`/api/profile/${userId}/available-years`);
      setAvailableYears(response.data || []);
    } catch (error) {
      console.error("Eroare la preluarea anilor disponibili:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAvailableYears();
      fetchProfileData(selectedYear, selectedMonth);
    }, [userId, selectedYear, selectedMonth])
  );

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year === 'all') {
      setSelectedMonth('all');
    }
  };

  if (loading || !profile) {
    return <ProfileSkeleton />;
  }

  const displayRole = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'coordonator': return 'Coordonator';
      case 'user': return 'Voluntar';
      default: return 'Utilizator';
    }
  };

  const memberSince = format(new Date(profile.created_at.replace(' ', 'T')), 'dd MMMM yyyy', { locale: ro });

  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer scrollable={true}>
      <ProfileHeader 
        user={profile}
        roleText={displayRole(profile.role)} 
      />

      {/* Period Filters: Academic Year + Month */}
      {availableYears.length > 0 && (
        <View style={styles.dropdownContainer}>
          <DropdownPicker
            style={{ flex: 1 }}
            options={[
              ...availableYears.map(y => ({ label: `Anul ${y.label}`, value: y.startYear })),
              ...(availableYears.length > 1 ? [{ label: 'Toate Orele', value: 'all' }] : [])
            ]}
            selectedValue={selectedYear}
            onValueChange={handleYearChange}
            placeholder="Selectează perioada"
          />
          {selectedYear !== 'all' && (
            <DropdownPicker
              style={{ flex: 1 }}
              options={ACADEMIC_MONTH_OPTIONS}
              selectedValue={selectedMonth}
              onValueChange={setSelectedMonth}
              placeholder="Luna"
            />
          )}
        </View>
      )}
      
      <ProfileStats 
        totalHours={parseFloat(profile.total_hours) || 0}
        infoTitle="Voluntar din"
        infoValue={memberSince}
        rank={profile.rank ?? null}
        eventsCount={profile.events_count ?? pastEvents.length}
        hoursByCategory={profile.hours_by_category ?? null}
      />
      
      <BadgeList 
        badges={badges}
      />
      
      <ContributionList contributions={contributions} />
      
      <ActivityHistoryList events={pastEvents} />
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  dropdownContainer: { 
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20, 
    marginTop: 15, 
  },
});