import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../AuthContext';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const navigation = useNavigation();
  const { login } = useAuth();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Te rog completează ambele câmpuri.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token } = response.data;
      await login(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Email sau parolă incorectă.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.inputContainer,
    focusedField === field && { borderColor: STANDARD_BLUE, borderWidth: 1.5 },
  ];

  const styles = createStyles(colors, isDark, insets, STANDARD_BLUE);

  return (
    <View style={styles.container}>
      {/* Decorative background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + Title section */}
          <View style={styles.heroSection}>
            <Image
              source={require('../../../assets/osace.png')}
              style={styles.logo}
            />
            <Text style={styles.appName}>OSACE</Text>
            <Text style={styles.appTagline}>Platforma Voluntarilor</Text>
          </View>

          {/* Glass Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bun venit înapoi</Text>
            <Text style={styles.cardSubtitle}>Autentifică-te pentru a continua</Text>

            {/* Email */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={inputStyle('email')}>
                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? STANDARD_BLUE : colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="adresa@email.com"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>PAROLĂ</Text>
              <View style={inputStyle('password')}>
                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? STANDARD_BLUE : colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
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

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => !loading && navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: STANDARD_BLUE }]}>Mi-am uitat parola</Text>
            </TouchableOpacity>

            {/* Login Button */}
            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: STANDARD_BLUE, shadowColor: STANDARD_BLUE }]} onPress={handleLogin}>
                <Text style={styles.primaryBtnText}>Autentificare</Text>
                <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerLabel}>Nu ai cont? </Text>
              <TouchableOpacity onPress={() => !loading && navigation.navigate('Register')}>
                <Text style={[styles.registerLink, { color: STANDARD_BLUE }]}>Creează unul acum</Text>
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
  // Background decorative circles
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 6,
  },
  appTagline: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 28,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  loadingBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STANDARD_BLUE + 'AA',
    marginBottom: 24,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});