import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import { useAuth } from '../AuthContext';

export default function ConfirmEmailScreen({ route, navigation }) {
  const email = route.params?.email || '';
  const { login } = useAuth();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef(null);

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  // Numărătoare inversă pentru retrimiterea codului
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleVerify = async () => {
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 6) {
      Alert.alert('Cod incomplet', 'Te rugăm să introduci codul complet de 6 cifre primit pe email.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register-verify', {
        email: email.trim(),
        code: cleanCode,
      });

      const { token, user } = response.data;

      Toast.show({
        type: 'success',
        text1: 'Email Confirmat! 🎉',
        text2: `Bun venit, ${user?.first_name || 'în OSACE'}!`,
        visibilityTime: 4000,
      });

      // Autentificare directă în aplicație
      if (token) {
        await login(token);
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('[ConfirmEmail] Eroare la verificarea codului:', error.response?.data || error.message);
      const errMsg = error.response?.data?.error || 'A apărut o problemă la verificarea codului.';
      Alert.alert('Verificare eșuată', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await api.post('/api/auth/register-resend', {
        email: email.trim(),
      });

      Toast.show({
        type: 'info',
        text1: 'Cod Retrimis!',
        text2: 'Am trimis un nou cod de verificare pe adresa ta de email.',
        visibilityTime: 4000,
      });

      // Restartăm numărătoarea inversă la 60s
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('[ConfirmEmail] Eroare la retrimitere cod:', error.response?.data || error.message);
      const errMsg = error.response?.data?.error || 'Nu am putut retrimite codul. Încearcă din nou.';
      Alert.alert('Eroare', errMsg);
    } finally {
      setResendLoading(false);
    }
  };

  const styles = createStyles(colors, isDark, insets, STANDARD_BLUE);

  return (
    <View style={styles.container}>
      {/* Blobs decorative */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Buton Înapoi */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Card Principal */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-unread-outline" size={48} color={STANDARD_BLUE} />
            </View>

            <Text style={styles.title}>Confirmă Email-ul</Text>

            <Text style={styles.subtitle}>
              Am trimis un cod de verificare de 6 cifre la adresa:
            </Text>
            <Text style={styles.emailHighlight}>{email || 'adresa ta de email'}</Text>

            {/* Input Cod */}
            <View style={styles.codeContainer}>
              <Text style={styles.inputLabel}>COD DE VERIFICARE</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(val) => setCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary + '60'}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                editable={!loading}
                autoFocus={true}
              />
              <Text style={styles.hintText}>Codul este valabil timp de 15 minute.</Text>
            </View>

            {/* Buton Verificare */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                code.length < 6 && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={loading || code.length < 6}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.verifyButtonText}>Confirmă și Intră în Cont</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Secțiune Retrimitere Cod */}
            <View style={styles.resendSection}>
              <Text style={styles.resendQuestion}>Nu ai primit codul? </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || resendLoading}
                activeOpacity={0.7}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color={STANDARD_BLUE} />
                ) : (
                  <Text
                    style={[
                      styles.resendText,
                      countdown > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {countdown > 0 ? `Retrimite codul (${countdown}s)` : 'Retrimite codul'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Schimbă email-ul / Înapoi */}
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.changeEmailText}>Ai greșit email-ul? Modifică datele</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors, isDark, insets, STANDARD_BLUE) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 30,
    },
    backButton: {
      alignSelf: 'flex-start',
      padding: 8,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      marginBottom: 20,
    },
    blobTopRight: {
      position: 'absolute',
      top: -80,
      right: -80,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: STANDARD_BLUE,
      opacity: isDark ? 0.12 : 0.08,
    },
    blobBottomLeft: {
      position: 'absolute',
      bottom: -100,
      left: -100,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: STANDARD_BLUE,
      opacity: isDark ? 0.1 : 0.06,
    },
    card: {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 16,
      elevation: 6,
    },
    iconCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: STANDARD_BLUE + (isDark ? '25' : '15'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: STANDARD_BLUE + '30',
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emailHighlight: {
      fontSize: 15,
      fontWeight: '700',
      color: STANDARD_BLUE,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 26,
    },
    codeContainer: {
      width: '100%',
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 8,
      textAlign: 'center',
    },
    codeInput: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 2,
      borderColor: STANDARD_BLUE + '60',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: 10,
      textAlign: 'center',
      color: colors.textPrimary,
    },
    hintText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    verifyButton: {
      backgroundColor: STANDARD_BLUE,
      borderRadius: 16,
      width: '100%',
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: STANDARD_BLUE,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    verifyButtonDisabled: {
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    resendSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 22,
    },
    resendQuestion: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    resendText: {
      fontSize: 14,
      fontWeight: '700',
      color: STANDARD_BLUE,
    },
    resendTextDisabled: {
      color: colors.textSecondary + '80',
      fontWeight: '500',
    },
    changeEmailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    changeEmailText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
}
