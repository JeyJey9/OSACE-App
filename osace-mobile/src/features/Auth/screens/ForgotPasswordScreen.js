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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // ▼▼▼ NOU: Preluăm culorile și insets ▼▼▼
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  
  // Generăm stilurile dinamic
  const styles = createStyles(colors, isDark, insets);

  const handleRequestReset = async () => {
    if (!email || email.trim() === '') {
      Alert.alert('Eroare', 'Te rugăm să introduci o adresă de email.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/api/auth/request-reset', { email: email.trim() });
      
      setIsSent(true); 
      Toast.show({
        type: 'success',
        text1: 'Verifică Email-ul',
        text2: response.data.message
      });

      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error) {
      console.error("Eroare la cererea de resetare:", error.response?.data);
      Alert.alert('Eroare', 'A apărut o problemă. Te rugăm să încerci mai târziu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Înlocuim SafeAreaView cu un View controlat de insets
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Ionicons name="lock-closed-outline" size={60} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>Ți-ai uitat parola?</Text>
        <Text style={styles.subtitle}>
          Nicio problemă. Introdu adresa ta de email și îți vom trimite un cod de 6 cifre pentru a o reseta.
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemplu.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          placeholderTextColor={colors.textSecondary} // Culoare adaptivă pentru placeholder
          editable={!loading && !isSent}
        />

        <TouchableOpacity 
          style={[styles.button, (loading || isSent) && styles.buttonDisabled]} 
          onPress={handleRequestReset}
          disabled={loading || isSent}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isSent ? 'Cod Trimis!' : 'Trimite Codul'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Înapoi la Autentificare</Text>
        </TouchableOpacity>
        
      </KeyboardAvoidingView>
    </View>
  );
}

// Transformăm styles într-o funcție pentru a primi `colors`, `isDark` și `insets`
const createStyles = (colors, isDark, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Fundal adaptiv
    paddingTop: insets.top,
    paddingBottom: insets.bottom, // Protejăm butoanele de jos
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
    color: colors.textPrimary, // Text adaptiv
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary, // Text adaptiv
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  input: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f2f5', // Fundal adaptiv pentru input
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary, // Culoarea textului scris de utilizator
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary, // Culoarea ta principală
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: isDark ? '#444' : '#bdc3c7', // Gri diferit în funcție de temă
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 25,
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: colors.primary, // Folosim culoarea primară pentru textul de link
    fontSize: 14,
    fontWeight: '600',
  },
});