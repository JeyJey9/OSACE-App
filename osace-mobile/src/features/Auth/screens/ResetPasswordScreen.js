import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

// ▼▼▼ NOU: Importăm insets și temă ▼▼▼
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params; 
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ▼▼▼ NOU: Preluăm culorile și insets ▼▼▼
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  
  // Generăm stilurile dinamic
  const styles = createStyles(colors, isDark, insets);

  const handlePerformReset = async () => {
    if (!token || !newPassword) {
      Alert.alert('Eroare', 'Te rugăm să completezi codul și noua parolă.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Eroare', 'Parola nouă trebuie să aibă cel puțin 8 caractere.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/perform-reset', { 
        email: email,
        token: token.trim(), 
        newPassword: newPassword 
      });

      Toast.show({
        type: 'success',
        text1: 'Succes!',
        text2: response.data.message,
        onHide: () => navigation.navigate('Login')
      });
      
    } catch (error) {
      console.error("Eroare la efectuarea resetării:", error.response?.data);
      Alert.alert('Eroare', error.response?.data?.error || 'A apărut o problemă.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Folosim View în loc de SafeAreaView
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Ionicons name="key-outline" size={60} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>Setează Parola Nouă</Text>
        <Text style={styles.subtitle}>
          Am trimis un cod de 6 cifre la <Text style={styles.emailHighlight}>{email}</Text>. Introdu-l mai jos.
        </Text>

        <Text style={styles.label}>Codul din Email</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          editable={!loading}
        />

        <Text style={styles.label}>Parola Nouă</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minim 8 caractere"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          textContentType="newPassword"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handlePerformReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Resetează Parola</Text>
          )}
        </TouchableOpacity>
        
      </KeyboardAvoidingView>
    </View>
  );
}

// Transformăm styles într-o funcție
const createStyles = (colors, isDark, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Fundal adaptiv
    paddingTop: insets.top,
    paddingBottom: insets.bottom, // Evităm butoanele de navigare
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  icon: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary, // Culoare adaptivă
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary, // Culoare adaptivă
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: colors.textPrimary, // Scoatere în evidență a email-ului
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 5,
    marginTop: 10,
    paddingLeft: 5,
  },
  input: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f2f5',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 15,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: isDark ? '#444' : '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});