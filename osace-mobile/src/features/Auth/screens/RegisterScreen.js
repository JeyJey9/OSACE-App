import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';


export default function RegisterScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async () => {
    setError(null);
    if (displayName.trim().length < 3) { setError('Display name trebuie să aibă cel puțin 3 caractere.'); return; }
    if (lastName.trim().length < 2) { setError('Numele de familie trebuie să aibă cel puțin 2 caractere.'); return; }
    if (firstName.trim().length < 2) { setError('Prenumele trebuie să aibă cel puțin 2 caractere.'); return; }
    if (!validateEmail(email)) { setError('Te rog introdu o adresă de email validă.'); return; }
    if (password.length < 6) { setError('Parola trebuie să aibă cel puțin 6 caractere.'); return; }

    setLoading(true);
    try {
      const response = await api.post(`/api/auth/register`, {
        display_name: displayName.trim(),
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        email: email.trim(),
        password,
      });

      Toast.show({
        type: 'success',
        text1: 'Cont Creat!',
        text2: `Contul pentru ${response.data.user?.email || email} a fost creat.`,
      });

      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (err) {
      console.error('Eroare la înregistrare:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'A apărut o eroare la înregistrare.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors, isDark, insets, STANDARD_BLUE);

  const inputStyle = (field) => [
    styles.inputContainer,
    focusedField === field && { borderColor: STANDARD_BLUE, borderWidth: 1.5 },
  ];

  const Field = ({ label, icon, field, ...props }) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={inputStyle(field)}>
        <Ionicons
          name={icon}
          size={18}
          color={focusedField === field ? STANDARD_BLUE : colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary + '80'}
          editable={!loading}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          {...props}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.heroSection}>
            <View style={[styles.heroIconBox, { backgroundColor: STANDARD_BLUE + '15', borderColor: STANDARD_BLUE + '30' }]}>
              <Ionicons name="person-add" size={36} color={STANDARD_BLUE} />
            </View>
            <Text style={styles.heroTitle}>Creează Cont</Text>
            <Text style={styles.heroSubtitle}>Alătură-te echipei OSACE</Text>
          </View>

          {/* Glass Card */}
          <View style={styles.card}>
            <Field
              label="PRENUME"
              icon="person-outline"
              field="firstName"
              placeholder="Prenumele tău"
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setError(null); }}
              autoCapitalize="words"
            />
            <Field
              label="NUME"
              icon="person-outline"
              field="lastName"
              placeholder="Numele de familie"
              value={lastName}
              onChangeText={(t) => { setLastName(t); setError(null); }}
              autoCapitalize="words"
            />
            <Field
              label="PORECLĂ (VIZIBILĂ ÎN APP)"
              icon="at-outline"
              field="displayName"
              placeholder="Cum vrei să fii cunoscut?"
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setError(null); }}
              autoCapitalize="words"
            />
            <Field
              label="EMAIL"
              icon="mail-outline"
              field="email"
              placeholder="adresa@email.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password field — manual, needs eye toggle */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>PAROLĂ</Text>
              <View style={inputStyle('password')}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedField === 'password' ? STANDARD_BLUE : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Minim 6 caractere"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#E74C3C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Register Button */}
            {loading ? (
              <View style={[styles.primaryBtn, { backgroundColor: STANDARD_BLUE + 'AA', shadowOpacity: 0 }]}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: STANDARD_BLUE, shadowColor: STANDARD_BLUE }]}
                onPress={handleRegister}
              >
                <Text style={styles.primaryBtnText}>Creează Cont</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="white" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}

            {/* Back to Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginLabel}>Ai deja cont? </Text>
              <TouchableOpacity onPress={() => !loading && navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: STANDARD_BLUE }]}>Autentifică-te</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors, isDark, insets, STANDARD_BLUE) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: STANDARD_BLUE + (isDark ? '18' : '12'),
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: STANDARD_BLUE + (isDark ? '10' : '08'),
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 7,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8ECF0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(231,76,60,0.15)' : '#FFF0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#E74C3C',
    fontWeight: '600',
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 22,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});