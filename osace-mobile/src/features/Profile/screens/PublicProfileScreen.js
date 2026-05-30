// src/features/Profile/screens/PublicProfileScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, Alert, View, TouchableOpacity, Text } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

// --- Importuri Componente Refactorizate ---
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import BadgeList from '../components/BadgeList'; 
import ContributionList from '../components/ContributionList';
import ProfileSkeleton from '../components/ProfileSkeleton';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import DropdownPicker from '../../../components/DropdownPicker';

// Hook pentru temă
import { useThemeColor } from '../../../constants/useThemeColor';

export default function PublicProfileScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const { colors, isDark } = useThemeColor();

  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const fetchProfileData = async (yearParam) => {
    try {
      setLoading(true);
      const yearQuery = yearParam === 'all' ? '?year=all' : (yearParam ? `?year=${yearParam}` : '');
      
      const [profileResponse, badgesResponse, contributionsResponse] = await Promise.all([
        api.get(`/api/profile/${userId}${yearQuery}`),
        api.get(`/api/profile/${userId}/badges`),
        api.get(`/api/profile/${userId}/contributions${yearQuery}`)
      ]);
      
      setProfile(profileResponse.data);
      setBadges(badgesResponse.data);
      setContributions(contributionsResponse.data);
    } catch (error) {
      console.error("Eroare la preluarea profilului public:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca datele acestui voluntar.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await api.get('/api/leaderboard/available-years');
      setAvailableYears(response.data);
    } catch (error) {
      console.error("Eroare la preluarea anilor disponibili:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAvailableYears();
      fetchProfileData(selectedYear);
    }, [userId, selectedYear])
  );

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  if (loading || !profile) {
    return <ProfileSkeleton />;
  }

  const displayRole = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'coordonator': return 'Coordonator';
      case 'user': return 'Membru';
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

      {/* Hours Toggle -> Dropdown */}
      <View style={styles.dropdownContainer}>
        <DropdownPicker
          options={[...availableYears.map(y => ({ label: `Anul ${y.label}`, value: y.startYear })), { label: 'Toate Orele', value: 'all' }]}
          selectedValue={selectedYear}
          onValueChange={handleYearChange}
          placeholder="Selectează perioada"
        />
      </View>
      
      <ProfileStats 
        totalHours={parseFloat(profile.total_hours) || 0}
        infoTitle="Membru din"
        infoValue={memberSince}
      />
      
      <BadgeList 
        badges={badges}
      />
      
      <ContributionList contributions={contributions} />
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  dropdownContainer: { 
    marginHorizontal: 20, 
    marginTop: 15, 
  },
});