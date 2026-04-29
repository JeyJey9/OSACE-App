import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';

import ScreenContainer from '../../../components/layout/ScreenContainer';
import FormCard from '../../../components/forms/FormCard';
import FormInput from '../../../components/forms/FormInput';
import FormButton from '../../../components/forms/FormButton';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth(); 

  // --- Stările sparte în 3 ---
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [firstName, setFirstName] = useState(user.first_name || '');
  
  const [nameLoading, setNameLoading] = useState(false);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (displayName.trim().length < 3 || firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Eroare', 'Toate câmpurile numelui trebuie completate corect.');
      return;
    }
    
    // Verificăm dacă s-a schimbat ceva efectiv
    if (
      displayName.trim() === user.display_name && 
      firstName.trim() === user.first_name && 
      lastName.trim() === user.last_name
    ) {
      return; 
    }

    setNameLoading(true);
    try {
      const response = await api.put('/api/profile/me', {
        display_name: displayName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      
      updateUser(response.data.user); 
      
      Toast.show({
        type: 'success',
        text1: 'Succes!',
        text2: 'Profilul a fost actualizat.'
      });
    } catch (error) {
      console.error("Eroare la actualizarea profilului:", error.response?.data);
      Alert.alert('Eroare', error.response?.data?.error || 'Nu s-a putut actualiza profilul.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Eroare', 'Te rugăm să completezi toate câmpurile pentru parolă.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Eroare', 'Parola nouă trebuie să aibă cel puțin 8 caractere.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/api/profile/password', {
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      Toast.show({
        type: 'success',
        text1: 'Succes!',
        text2: 'Parola a fost schimbată cu succes.'
      });
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      console.error("Eroare la schimbarea parolei:", error.response?.data);
      Alert.alert('Eroare', error.response?.data?.error || 'Nu s-a putut schimba parola.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true}>
      
      {/* Card pentru Schimbarea Datelor Publice */}
      <FormCard title="Informații Personale">
        <FormInput
          label="Display Name (Porecla)"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Numele vizibil pentru ceilalți"
          autoCapitalize="words"
        />
        <FormInput
          label="Nume (de familie)"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Ex: Popescu"
          autoCapitalize="words"
        />
        <FormInput
          label="Prenume"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ex: Andrei"
          autoCapitalize="words"
        />
        <FormButton
          title="Salvează Modificările"
          iconName="save-outline"
          onPress={handleUpdateProfile}
          loading={nameLoading}
        />
      </FormCard>

      {/* Card pentru Schimbarea Parolei */}
      <FormCard title="Securitate">
        <FormInput
          label="Parola veche"
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Parola ta actuală"
          secureTextEntry
        />
        <FormInput
          label="Parola nouă"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minim 8 caractere"
          secureTextEntry
        />
        <FormButton
          title="Schimbă Parola"
          iconName="lock-closed-outline"
          onPress={handleChangePassword}
          loading={passwordLoading}
        />
      </FormCard>
        
    </ScreenContainer>
  );
}