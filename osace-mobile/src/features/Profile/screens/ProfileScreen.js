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
import ProfileActions from '../components/ProfileActions';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Toast from 'react-native-toast-message';
import ProfileSkeleton from '../components/ProfileSkeleton';
import DropdownPicker from '../../../components/DropdownPicker';

// Hook pentru temă
import { useThemeColor } from '../../../constants/useThemeColor';

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
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYearDate = new Date().getFullYear();
  const defaultYear = currentMonth >= 9 ? currentYearDate : currentYearDate - 1;
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // --- Logica de preluare a datelor ---
  const fetchHistory = async (yearParam) => {
    try {
      const yearQuery = yearParam === 'all' ? '?year=all' : (yearParam ? `?year=${yearParam}` : '');
      const response = await api.get(`/api/profile/my-past-events${yearQuery}`);
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

  const fetchContributions = async (yearParam) => {
    try {
      const yearQuery = yearParam === 'all' ? '?year=all' : (yearParam ? `?year=${yearParam}` : '');
      const response = await api.get(`/api/profile/${user.userId || user.id}/contributions${yearQuery}`);
      setContributions(response.data);
    } catch (error) {
      console.error("Eroare la preluarea contribuțiilor:", error);
      throw error;
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
      const loadProfileData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchAvailableYears(),
            fetchHistory(selectedYear),
            fetchBadges(),
            fetchContributions(selectedYear)
          ]);
        } catch (error) {
          Alert.alert("Eroare", "Nu am putut încărca profilul complet.");
        } finally {
          setLoading(false);
        }
      };
      loadProfileData();
    }, [selectedYear])
  );

  const handleYearChange = (year) => {
    setSelectedYear(year);
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

  const displayRole = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'coordonator': return 'Coordonator';
      case 'user': return 'Membru';
      default: return 'Utilizator';
    }
  };

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
      if (Platform.OS === 'ios') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permisiune necesară", "Avem nevoie de permisiunea ta pentru a accesa galeria foto.");
          setAvatarLoading(false);
          return;
        }
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (pickerResult.canceled === true) {
        setAvatarLoading(false);
        return;
      }

      const localUri = pickerResult.assets[0].uri;
      const formData = new FormData();
      const uriParts = localUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = `avatar-${user.id}.${fileType}`;

      formData.append('avatar', {
        uri: localUri,
        name: fileName,
        type: `image/${fileType}`,
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
        totalHours={totalHours}
        infoTitle="Email"
        infoValue={user.email}
      />
      
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
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  dropdownContainer: { 
    marginHorizontal: 20, 
    marginTop: 15, 
  },
});