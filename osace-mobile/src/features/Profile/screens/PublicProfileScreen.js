// src/features/Profile/screens/PublicProfileScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
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

// Hook pentru temă
import { useThemeColor } from '../../../constants/useThemeColor';

export default function PublicProfileScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const { colors } = useThemeColor();

  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Apeluri paralele pentru datele profilului și badge-uri
      const [profileResponse, badgesResponse, contributionsResponse] = await Promise.all([
        api.get(`/api/profile/${userId}`),
        api.get(`/api/profile/${userId}/badges`),
        api.get(`/api/profile/${userId}/contributions`)
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

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [userId])
  );

  if (loading || !profile) {
    return <ProfileSkeleton />;
  }

  // Formatăm data de înscriere
  const memberSince = format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: ro });

  return (
    <ScreenContainer scrollable={true}>
      <ProfileHeader 
        user={profile}
        roleText="Membru Voluntar" 
      />
      
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

const styles = StyleSheet.create({
  // Stilurile sunt acum gestionate de ScreenContainer și componentele interne
});