import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';

// Componente UI
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import BadgeList from '../components/BadgeList';
import ProfileActions from '../components/ProfileActions';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Toast from 'react-native-toast-message';
import ProfileSkeleton from '../components/ProfileSkeleton';

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

  // --- Logica de preluare a datelor ---
  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/profile/my-past-events');
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

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchHistory(),
            fetchBadges()
          ]);
        } catch (error) {
          Alert.alert("Eroare", "Nu am putut încărca profilul complet.");
        } finally {
          setLoading(false);
        }
      };
      loadProfileData();
    }, [])
  );

  // --- Calcule și Formatare ---
  const totalHours = useMemo(() => {
    return pastEvents.reduce((sum, event) => {
      if (event.confirmation_status === 'attended') {
        // Use awarded_hours (actual approved hours) not duration_hours (planned event length)
        return sum + (parseFloat(event.awarded_hours) || 0);
      }
      return sum;
    }, 0);
  }, [pastEvents]);

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
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permisiune necesară", "Avem nevoie de permisiunea ta pentru a accesa galeria foto.");
        setAvatarLoading(false);
        return;
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

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <ScreenContainer scrollable={true}>
      <ProfileHeader 
        user={user}
        roleText={displayRole(user.role)}
        avatarLoading={avatarLoading}
        onAvatarPress={handlePickAvatar}
      />
      
      <ProfileStats 
        totalHours={totalHours}
        infoTitle="Email"
        infoValue={user.email}
      />
      
      <BadgeList 
        badges={badges}
      />
      
      <ProfileActions 
        onEdit={() => navigation.navigate('EditProfile')}
        onLogout={handleLogout}
        onDelete={handleDeleteAccount}
      />
    </ScreenContainer>
  );
}

// Stilurile sunt gestionate intern de componentele atomice pentru consistență tematică
const styles = StyleSheet.create({});