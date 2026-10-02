import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export default function ScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialEventId = route.params?.eventId || null; 

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Scanează Prezența',
      headerStyle: {
        backgroundColor: '#000000',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.12)',
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ffffff',
      },
      headerTintColor: '#ffffff',
      headerBackTitleVisible: false,
      headerBackTitle: '',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          accessibilityLabel="Înapoi"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Verificare la montare
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Re-verifică automat permisiunea când utilizatorul revine din iOS Settings în aplicație
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          await requestPermission();
        } catch {}
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleRequestPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      const res = await requestPermission();
      // Pe iOS, dacă permisiunea a fost deja refuzată anterior, res.granted este false
      // și sistemul refuză să mai afișeze dialogul nativ. Singura modalitate este deschiderea setărilor.
      if (!res.granted) {
        Alert.alert(
          'Permisiune Cameră Necesară',
          'Accesul la cameră este necesar pentru scanarea codului QR de prezență. Te rugăm să activezi permisiunea pentru Cameră din Configurări (Settings).',
          [
            { text: 'Anulează', style: 'cancel' },
            {
              text: 'Deschide Configurări',
              onPress: () => {
                Linking.openSettings().catch(() => {});
              },
            },
          ]
        );
      }
    } catch (err) {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true); 

    try {
      let targetEventId = initialEventId;
      let targetCode = data ? data.toString().trim() : '';

      console.log('[QR SCAN] Date brute scanate:', data);

      // Extragem eventId și code dacă codul QR este structurat (URL, OSACE prefix, sau JSON)
      if (typeof targetCode === 'string') {
        if (targetCode.includes('/scan?') || targetCode.includes('eventId=') || targetCode.includes('code=')) {
          const eventIdMatch = targetCode.match(/[?&]eventId=([^&#]+)/);
          const codeMatch = targetCode.match(/[?&]code=([^&#]+)/);
          if (eventIdMatch) targetEventId = decodeURIComponent(eventIdMatch[1]);
          if (codeMatch) targetCode = decodeURIComponent(codeMatch[1]);

          // Fallback cu URLSearchParams dacă regex-ul nu a găsit complet
          if (!targetEventId || targetCode.startsWith('http')) {
            try {
              const queryPart = targetCode.split('?')[1] || targetCode;
              const searchParams = new URLSearchParams(queryPart);
              if (!targetEventId && searchParams.get('eventId')) targetEventId = searchParams.get('eventId');
              if (searchParams.get('code')) targetCode = searchParams.get('code');
            } catch (e) {
              console.warn('[QR SCAN] URLSearchParams fallback error:', e);
            }
          }
        } else if (targetCode.startsWith('OSACE:')) {
          const parts = targetCode.split(':');
          if (parts.length >= 3) {
            targetEventId = parts[1];
            targetCode = parts[2];
          }
        } else if (targetCode.startsWith('{')) {
          try {
            const parsed = JSON.parse(targetCode);
            if (parsed.eventId) targetEventId = parsed.eventId;
            if (parsed.code) targetCode = parsed.code;
          } catch (e) {}
        }
      }

      console.log('[QR SCAN] Payload extras:', { targetEventId, targetCode });

      if (!targetEventId) {
        console.warn('[QR SCAN] targetEventId lipsă pentru codul scanat:', data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Cod QR Neidentificat',
          'Codul scanat nu conține un eveniment valid OSACE.',
          [{ text: 'Încearcă din nou', onPress: () => setScanned(false) }]
        );
        return;
      }

      console.log(`[QR SCAN] Trimitere request la /api/events/${targetEventId}/confirm-presence cu codul ${targetCode}`);
      const response = await api.post(`/api/events/${targetEventId}/confirm-presence`, {
        code: targetCode,
      });

      console.log('[QR SCAN] Răspuns primit cu succes de la server:', response.data);

      const serverMessage = response.data.message;
      const hours = response.data.hours;
      const alreadyRecorded = response.data.alreadyRecorded;

      let title = 'Prezență confirmată';
      if (alreadyRecorded) {
        title = 'Prezență deja înregistrată';
      }

      let finalMessage = serverMessage;
      if (!finalMessage) {
        finalMessage = hours !== undefined && hours !== null 
          ? `Ai primit ${hours} ore pentru această activitate.` 
          : 'Participarea ta a fost înregistrată.';
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Toast.show({
        type: 'success',
        text1: title,
        text2: finalMessage,
        visibilityTime: 3000,
        onHide: () => navigation.goBack()
      });

    } catch (error) {
      console.error("[QR SCAN ERROR]:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = error.response?.data?.error;
      if (!errorMessage) {
        if (error.message?.includes('Network') || error.code === 'ERR_NETWORK') {
          errorMessage = 'Eroare de rețea. Nu s-a putut conecta la serverul OSACE. Verifică conexiunea.';
        } else {
          errorMessage = 'Cod QR invalid sau expirat.';
        }
      }
      
      // Păstrăm Alert aici pentru ca utilizatorul să deblocheze camera manual
      Alert.alert(
        'Eroare', 
        errorMessage,
        [{ text: 'Încearcă din nou', onPress: () => setScanned(false) }] 
      );
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (!permission.granted) {
    const isPermanentlyDenied = !permission.canAskAgain || permission.status === 'denied';

    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera" size={42} color="#38bdf8" />
          </View>

          <Text style={styles.permissionTitle}>Permisiune Cameră Necesară</Text>
          <Text style={styles.permissionSubtitle}>
            Pentru a putea scana codul QR de prezență la activitățile OSACE, aplicația are nevoie de permisiunea ta de a folosi camera foto.
          </Text>

          {isPermanentlyDenied && (
            <View style={styles.deniedNoticeBox}>
              <Ionicons name="warning-outline" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text style={styles.deniedNoticeText}>
                Accesul la cameră este blocat în setările dispozitivului. Apasă mai jos pentru a activa camera în Configurări.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryPermissionBtn}
            onPress={isPermanentlyDenied ? () => Linking.openSettings() : handleRequestPermission}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPermanentlyDenied ? 'settings-outline' : 'shield-checkmark-outline'}
              size={19}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryPermissionBtnText}>
              {isPermanentlyDenied ? 'Deschide Configurări (Settings)' : 'Acordă Permisiunea'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryPermissionBtn}
            onPress={() => {
              if (isPermanentlyDenied) {
                requestPermission();
              } else {
                Linking.openSettings();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryPermissionBtnText}>
              {isPermanentlyDenied ? 'Am activat permisiunea (Reîncearcă)' : 'Deschide Configurări'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], 
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanBox}>
          <Text style={styles.scanText}>Țintește codul QR al evenimentului</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161b22',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  permissionIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deniedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  deniedNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#fbbf24',
    fontWeight: '500',
  },
  primaryPermissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  primaryPermissionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryPermissionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPermissionBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: '100%',
  },
});