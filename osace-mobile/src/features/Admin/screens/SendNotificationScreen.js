// src/features/Admin/screens/SendNotificationScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';

// --- Importăm noile componente ---
import FormContainer from '../../../components/layout/ScreenContainer';
import FormCard from '../../../components/forms/FormCard';
import FormInput from '../../../components/forms/FormInput';
import FormButton from '../../../components/forms/FormButton';
import { useThemeColor } from '../../../constants/useThemeColor';

const ALL_ROLES = ['admin', 'coordonator', 'user'];



export default function SendNotificationScreen({ navigation }) {
  const { colors, isDark } = useThemeColor();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([...ALL_ROLES]);

  const styles = createStyles(colors, isDark);

  // Componenta Checkbox rămâne locală, e specifică acestui ecran
const Checkbox = ({ label, isChecked, onToggle }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle}>
      <Ionicons 
        name={isChecked ? 'checkbox' : 'checkbox-outline'} 
        size={24} 
        color={isChecked ? colors.primary : colors.textSecondary} 
      />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // ... (logica ta toggleRole, isAllSelected, toggleSelectAll rămâne neschimbată) ...
  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(prevRoles => prevRoles.filter(r => r !== role));
    } else {
      setSelectedRoles(prevRoles => [...prevRoles, role]);
    }
  };
  const isAllSelected = selectedRoles.length === ALL_ROLES.length;
  const toggleSelectAll = () => {
    if (isAllSelected) { setSelectedRoles([]); } else { setSelectedRoles([...ALL_ROLES]); }
  };

  const handleSendNotification = async () => {
    // ... (logica ta handleSendNotification rămâne neschimbată) ...
    if (!title || !message) {
      Alert.alert("Eroare", "Titlul și mesajul sunt obligatorii.");
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert("Eroare", "Trebuie selectat cel puțin un rol țintă.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/admin/notifications/send-all', {
        title: title,
        message: message,
        roles: selectedRoles
      });
      Alert.alert("Succes", response.data.message || "Notificare trimisă!");
      setTitle('');
      setMessage('');
      navigation.goBack(); 
    } catch (error) {
      console.error("Eroare la trimiterea notificării:", error.response?.data);
      Alert.alert("Eroare", error.response?.data?.error || "A apărut o eroare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormCard title="Trimite Notificare Push">
        <Text style={styles.roleLabel}>Trimite către:</Text>
        <View style={styles.roleSelectorContainer}>
          <Checkbox 
            label="Selectează Toți"
            isChecked={isAllSelected}
            onToggle={toggleSelectAll}
          />
          <View style={styles.separator} />
          <Checkbox 
            label="Admini"
            isChecked={selectedRoles.includes('admin')}
            onToggle={() => toggleRole('admin')}
          />
          <Checkbox 
            label="Coordonatori"
            isChecked={selectedRoles.includes('coordonator')}
            onToggle={() => toggleRole('coordonator')}
          />
          <Checkbox 
            label="Voluntari"
            isChecked={selectedRoles.includes('user')}
            onToggle={() => toggleRole('user')}
          />
        </View>
        
        <FormInput
          label="Titlu"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Eveniment Nou!"
        />
        
        <FormInput
          label="Mesaj"
          value={message}
          onChangeText={setMessage}
          placeholder="Mesajul notificării..."
          multiline={true}
        />
        
        <FormButton
          title="Trimite Notificarea"
          iconName="send-outline"
          onPress={handleSendNotification}
          loading={loading}
          variant="danger" 
        />
      </FormCard>
    </FormContainer>
  );
}

// createStyles rămâne jos, în afara funcției
const createStyles = (colors, isDark) => StyleSheet.create({
  roleLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, marginTop: 10, fontWeight: 'bold' },
  roleSelectorContainer: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F7',
    borderRadius: 8, padding: 10, marginBottom: 15,
    borderColor: colors.border, borderWidth: 1,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkboxLabel: { fontSize: 16, color: colors.textPrimary, marginLeft: 10 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 5 },
});