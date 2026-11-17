import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Alert, View, TouchableOpacity, Text, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';

// Componente UI
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import BadgeList from '../components/BadgeList';
import ContributionList from '../components/ContributionList';
import ActivityHistoryList from '../components/ActivityHistoryList';
import ProfileActions from '../components/ProfileActions';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Toast from 'react-native-toast-message';
import ProfileSkeleton from '../components/ProfileSkeleton';
import DropdownPicker from '../../../components/DropdownPicker';
import ThemeSelector from '../../../components/ThemeSelector';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

// Hook pentru temă
import { useThemeColor } from '../../../constants/useThemeColor';
import {
  ACADEMIC_MONTH_OPTIONS,
  getDefaultAcademicYear,
  buildPeriodQuery,
} from '../../../constants/periodFilters';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const [loading, setLoading] = useState(true);
  const [pastEvents, setPastEvents] = useState([]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [profileSummary, setProfileSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(getDefaultAcademicYear);
  const [selectedMonth, setSelectedMonth] = useState('all');

  // --- Logica de preluare a datelor ---
  const fetchHistory = async (yearParam, monthParam) => {
    try {
      const query = buildPeriodQuery(yearParam, monthParam);
      const response = await api.get(`/api/profile/my-past-events${query}`);
      setPastEvents(response.data);
    } catch (error) {
      console.error("Eroare la preluarea istoricului (Profil):", error);
      throw error; 
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await api.get('/api/profile/my-badges');
      setBadges(response.data);
    } catch (error) {
      console.error("Eroare la preluarea badge-urilor:", error);
      throw error;
    }
  };

  const fetchContributions = async (yearParam, monthParam) => {
    try {
      const query = buildPeriodQuery(yearParam, monthParam);
      const response = await api.get(`/api/profile/${user.userId || user.id}/contributions${query}`);
      setContributions(response.data);
    } catch (error) {
      console.error("Eroare la preluarea contribuțiilor:", error);
      throw error;
    }
  };

  const fetchProfileSummary = async (yearParam, monthParam) => {
    try {
      const query = buildPeriodQuery(yearParam, monthParam);
      const response = await api.get(`/api/profile/me${query}`);
      setProfileSummary(response.data);
    } catch (error) {
      console.error("Eroare la preluarea rezumatului profilului:", error);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await api.get('/api/profile/my-available-years');
      setAvailableYears(response.data || []);
    } catch (error) {
      console.error("Eroare la preluarea anilor disponibili:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchAvailableYears(),
            fetchProfileSummary(selectedYear, selectedMonth),
            fetchHistory(selectedYear, selectedMonth),
            fetchBadges(),
            fetchContributions(selectedYear, selectedMonth)
          ]);
        } catch (error) {
          Alert.alert("Eroare", "Nu am putut încărca profilul complet.");
        } finally {
          setLoading(false);
        }
      };
      loadProfileData();
    }, [selectedYear, selectedMonth])
  );

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year === 'all') {
      setSelectedMonth('all');
    }
  };

  // --- Calcule și Formatare ---
  const totalHours = useMemo(() => {
    const eventHours = pastEvents.reduce((sum, event) => {
      if (event.confirmation_status === 'attended') {
        return sum + (parseFloat(event.awarded_hours) || 0);
      }
      return sum;
    }, 0);
    
    const contribHours = contributions.reduce((sum, contrib) => {
      return sum + (parseFloat(contrib.awarded_hours) || 0);
    }, 0);
    
    return eventHours + contribHours;
  }, [pastEvents, contributions]);

  const attendedEvents = useMemo(() => {
    return pastEvents.filter(e => e.confirmation_status === 'attended');
  }, [pastEvents]);

  const displayRole = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'coordonator': return 'Coordonator';
      case 'user': return 'Voluntar';
      default: return 'Utilizator';
    }
  };

  const memberSince = user?.created_at 
    ? format(new Date(user.created_at.replace(' ', 'T')), 'dd MMMM yyyy', { locale: ro }) 
    : '-';

  // --- Acțiuni Cont ---
  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirmă Ștergerea Contului",
      "Ești absolut sigur că vrei să ștergi contul? Această acțiune este ireversibilă.",
      [
        { text: "Anulează", style: "cancel" },
        { text: "Șterge Contul", style: "destructive", onPress: () => performAccountDeletion() }
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      await api.delete('/api/profile/me');
      Alert.alert("Cont Șters", "Contul tău a fost șters cu succes.");
      logout();
    } catch (err) {
      console.error("Eroare la ștergerea contului:", err.response?.data || err);
      Alert.alert("Eroare", "Nu am putut șterge contul.");
    }
  };

  // --- Management Avatar ---
  const handlePickAvatar = async () => {
    setAvatarLoading(true);
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (pickerResult.canceled === true || !pickerResult.assets?.length) {
        setAvatarLoading(false);
        return;
      }

      const asset = pickerResult.assets[0];
      const localUri = asset.uri;
      const formData = new FormData();
      const uriParts = localUri.split('.');
      const rawExt = (uriParts[uriParts.length - 1] || 'jpg').toLowerCase();
      const normalizedExt = rawExt === 'jpg' ? 'jpeg' : rawExt;
      const mimeType = asset.mimeType || `image/${normalizedExt}`;
      const fileName = `avatar-${user.id}.${rawExt}`;

      formData.append('avatar', {
        uri: localUri,
        name: fileName,
        type: mimeType,
      });

      const response = await api.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { avatar_url } = response.data;
      updateUser({ avatar_url });
      
      Toast.show({
        type: 'success',
        text1: 'Succes!',
        text2: 'Avatarul tău a fost actualizat.'
      });
    } catch (err) {
      console.error("Eroare la încărcarea avatarului:", err.response?.data || err);
      Alert.alert("Eroare", "Nu am putut încărca imaginea.");
    } finally {
      setAvatarLoading(false);
    }
  };

  if (loading && (!pastEvents.length && !contributions.length)) {
    return <ProfileSkeleton />;
  }

  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer scrollable={true}>
      <ProfileHeader 
        user={user}
        roleText={displayRole(user.role)}
        avatarLoading={avatarLoading}
        onAvatarPress={handlePickAvatar}
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
        totalHours={profileSummary?.total_hours ?? totalHours}
        infoTitle="Voluntar din"
        infoValue={memberSince}
        rank={profileSummary?.rank ?? null}
        eventsCount={profileSummary?.events_count ?? attendedEvents.length}
        hoursByCategory={profileSummary?.hours_by_category ?? null}
      />
      
      <ThemeSelector />
      
      <BadgeList 
        badges={badges}
      />
      
      <ContributionList contributions={contributions} />
      
      <ProfileActions 
        onEdit={() => navigation.navigate('EditProfile')}
        onLogout={handleLogout}
        onDelete={handleDeleteAccount}
        onExport={() => navigation.navigate('DataExport')}
        onNotifPrefs={() => navigation.navigate('NotificationPreferences')}
        onBlockedUsers={() => navigation.navigate('BlockedUsers')}
      />

      <ActivityHistoryList events={attendedEvents} />
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