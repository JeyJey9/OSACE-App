import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  AppState,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const IS_IOS = Platform.OS === 'ios';
const IS_MAC_HOSTED_IOS = IS_IOS && Platform.constants?.interfaceIdiom === 'mac';

// Pe iOS zoom-ul nativ e exponențial (pow(maxZoomFactor, zoom)), pe Android e liniar cu maxZoomRatio
const ZOOM_PRESETS = IS_IOS
  ? { 1: 0, 2: 0.09, 3: 0.20 }
  : { 1: 0, 2: 0.12, 3: 0.26 };

const MAX_ZOOM = IS_IOS ? 0.35 : 0.45;
const PINCH_UPDATE_THRESHOLD = 0.005;
const ZOOM_ACTIVE_THRESHOLDS = IS_IOS
  ? { twoX: 0.045, threeX: 0.145 }
  : { twoX: 0.06, threeX: 0.19 };

function isZoomPresetActive(level, currentZoom) {
  if (level === 1) return currentZoom < ZOOM_ACTIVE_THRESHOLDS.twoX;
  if (level === 2) {
    return currentZoom >= ZOOM_ACTIVE_THRESHOLDS.twoX && currentZoom < ZOOM_ACTIVE_THRESHOLDS.threeX;
  }
  return currentZoom >= ZOOM_ACTIVE_THRESHOLDS.threeX;
}

export default function ScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const initialEventId = route.params?.eventId || null;

  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scannedRef = useRef(false);

  // Cameră și selecție față/spate (fallback automat pe față pe Mac sau dispozitive fără cameră spate)
  const [facing, setFacing] = useState(() => (IS_MAC_HOSTED_IOS ? 'front' : 'back'));
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const triedFrontFallbackRef = useRef(IS_MAC_HOSTED_IOS);

  // Control lanternă și zoom
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const startZoomRef = useRef(0);
  const cameraRef = useRef(null);
  const didExitRef = useRef(false);
  const goBackTimeoutRef = useRef(null);

  useEffect(() => {
    scannedRef.current = scanned;
  }, [scanned]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (goBackTimeoutRef.current) {
        clearTimeout(goBackTimeoutRef.current);
      }
    };
  }, []);

  const safeGoBack = useCallback(() => {
    if (didExitRef.current) return;
    didExitRef.current = true;
    if (goBackTimeoutRef.current) {
      clearTimeout(goBackTimeoutRef.current);
      goBackTimeoutRef.current = null;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

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
          onPress={safeGoBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
          accessibilityLabel="Înapoi"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, safeGoBack]);

  // Verificare permisiuni la montare
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Re-verifică silențios permisiunea când utilizatorul revine din Settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && !permission?.granted) {
        try {
          await getPermission();
        } catch {}
      }
    });

    return () => {
      subscription.remove();
    };
  }, [permission?.granted, getPermission]);

  // Oprește lanterna dacă ecranul pierde focusul
  useEffect(() => {
    if (!isFocused && torch) {
      setTorch(false);
    }
  }, [isFocused, torch]);

  const switchToFrontFallback = useCallback(() => {
    if (triedFrontFallbackRef.current) return;
    triedFrontFallbackRef.current = true;
    setTorch(false);
    zoomRef.current = 0;
    setZoom(0);
    setCameraReady(false);
    setFacing('front');
  }, []);

  // Pe iOS/Mac, expo-camera nu emite onMountError când lipsește camera spate; verificăm lentilele disponibile
  useEffect(() => {
    if (!IS_IOS || !permission?.granted || !isFocused || facing !== 'back' || cameraReady) {
      return;
    }
    if (triedFrontFallbackRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const lenses = await cameraRef.current?.getAvailableLensesAsync?.();
        if (Array.isArray(lenses) && lenses.length === 0) {
          switchToFrontFallback();
        }
      } catch {}
    }, 1000);

    return () => clearTimeout(timer);
  }, [permission?.granted, isFocused, facing, cameraReady, switchToFrontFallback]);

  const handleRequestPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      const res = await requestPermission();
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

  // Gestiune gest Pinch-to-zoom (Android & iOS) cu throttling pentru a evita blocările la 60 FPS
  const onPinchGestureEvent = useCallback((event) => {
    const scale = event.nativeEvent.scale;
    const delta = (scale - 1) * (IS_IOS ? 0.16 : 0.22);
    const nextZoom = Math.min(Math.max(startZoomRef.current + delta, 0), MAX_ZOOM);

    const deltaFromCurrent = Math.abs(nextZoom - zoomRef.current);
    const hitBoundary = (nextZoom === 0 || nextZoom === MAX_ZOOM) && nextZoom !== zoomRef.current;

    if (deltaFromCurrent >= PINCH_UPDATE_THRESHOLD || hitBoundary) {
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    }
  }, []);

  const onPinchHandlerStateChange = useCallback((event) => {
    if (event.nativeEvent.state === State.BEGAN) {
      startZoomRef.current = zoomRef.current;
    }
  }, []);

  // Preset-uri rapide de zoom: 1x, 2x, 3x
  const handleZoomPreset = (level) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const nextZoom = ZOOM_PRESETS[level] ?? 0;
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  };

  // Toggle lanternă (activă doar pe camera spate)
  const handleToggleTorch = () => {
    if (facing === 'front') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setTorch((prev) => !prev);
  };

  // Toggle cameră (față / spate) cu resetare lanternă și zoom
  const handleToggleFacing = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setTorch(false);
    zoomRef.current = 0;
    setZoom(0);
    setCameraReady(false);
    setCameraError(false);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Fallback automat pe Android/iOS dacă montarea camerei spate eșuează
  const handleMountError = useCallback((event) => {
    console.warn('[ScanScreen] Eroare montare cameră:', event);
    if (facing === 'back' && !triedFrontFallbackRef.current) {
      console.log('[ScanScreen] Comutare automată pe camera frontală...');
      switchToFrontFallback();
      return;
    }
    setCameraError(true);
  }, [facing, switchToFrontFallback]);

  const showScanRetryAlert = useCallback((title, message) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Anulează',
          style: 'cancel',
          onPress: safeGoBack,
        },
        {
          text: 'Încearcă din nou',
          onPress: () => {
            setScanned(false);
            scannedRef.current = false;
          },
        },
      ],
      { cancelable: false }
    );
  }, [safeGoBack]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scannedRef.current) return;
    setScanned(true);
    scannedRef.current = true;

    try {
      let targetEventId = initialEventId;
      let targetCode = data ? data.toString().trim() : '';

      console.log('[QR SCAN] Date brute scanate:', data);

      // Extragem eventId și code dacă codul QR este structurat
      if (typeof targetCode === 'string') {
        if (targetCode.includes('/scan?') || targetCode.includes('eventId=') || targetCode.includes('code=')) {
          const eventIdMatch = targetCode.match(/[?&]eventId=([^&#]+)/);
          const codeMatch = targetCode.match(/[?&]code=([^&#]+)/);
          if (eventIdMatch) targetEventId = decodeURIComponent(eventIdMatch[1]);
          if (codeMatch) targetCode = decodeURIComponent(codeMatch[1]);

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
        showScanRetryAlert('Cod QR Neidentificat', 'Codul scanat nu conține un eveniment valid OSACE.');
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
        visibilityTime: 2500,
      });

      // O singură navigare automată înapoi (cu curățare la unmount)
      goBackTimeoutRef.current = setTimeout(() => {
        safeGoBack();
      }, 700);

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

      showScanRetryAlert('Eroare', errorMessage);
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

  if (cameraError) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="videocam-off-outline" size={40} color="#38bdf8" />
          </View>

          <Text style={styles.permissionTitle}>Cameră indisponibilă</Text>
          <Text style={styles.permissionSubtitle}>
            Nu am putut inițializa camera pe acest dispozitiv. Poți încerca din nou sau comuta camera.
          </Text>

          <TouchableOpacity
            style={styles.primaryPermissionBtn}
            onPress={() => {
              triedFrontFallbackRef.current = false;
              setCameraError(false);
              setCameraReady(false);
              setFacing('back');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={19} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryPermissionBtnText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isFrontCamera = facing === 'front';

  return (
    <View style={styles.container}>
      {/* Container principal cu suport Pinch-to-zoom pe tot ecranul */}
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
      >
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView
            ref={cameraRef}
            facing={facing}
            active={isFocused}
            enableTorch={!isFrontCamera && torch}
            zoom={zoom}
            autofocus="off"
            {...(IS_IOS ? { pictureSize: 'High' } : {})}
            onCameraReady={() => {
              setCameraReady(true);
              setCameraError(false);
            }}
            onMountError={handleMountError}
            onBarcodeScanned={scanned || !isFocused ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </PinchGestureHandler>

      {/* Bara superioară de control: Lanternă & Comutare cameră față/spate */}
      <View style={styles.topControlsRow} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.topControlBtn,
            torch && !isFrontCamera && styles.topControlBtnActive,
            isFrontCamera && styles.topControlBtnDisabled,
          ]}
          onPress={handleToggleTorch}
          disabled={isFrontCamera}
          activeOpacity={0.7}
        >
          <Ionicons
            name={torch && !isFrontCamera ? 'flash' : 'flash-outline'}
            size={18}
            color={torch && !isFrontCamera ? '#fbbf24' : '#ffffff'}
          />
          <Text style={[styles.topControlText, torch && !isFrontCamera && { color: '#fbbf24' }]}>
            {torch && !isFrontCamera ? 'Lanternă activă' : 'Lanternă'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topControlBtn}
          onPress={handleToggleFacing}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-reverse-outline" size={19} color="#ffffff" />
          <Text style={styles.topControlText}>
            {isFrontCamera ? 'Față' : 'Spate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chenarul de scanare centrat, cu pointerEvents="none" ca să nu blocheze pinch-to-zoom */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanBox} pointerEvents="none">
          <Text style={styles.scanText}>Țintește codul QR al evenimentului</Text>
        </View>
      </View>

      {/* Controale rapide de Zoom ancorate jos, cu Safe Area pentru iOS & Android edge-to-edge */}
      <View
        style={[
          styles.zoomContainer,
          { bottom: Math.max(insets.bottom, 16) + 20 },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.zoomPillsRow}>
          {[1, 2, 3].map((level) => {
            const active = isZoomPresetActive(level, zoom);
            return (
              <TouchableOpacity
                key={level}
                style={[styles.zoomPill, active && styles.zoomPillActive]}
                onPress={() => handleZoomPreset(level)}
                activeOpacity={0.7}
              >
                <Text style={[styles.zoomPillText, active && styles.zoomPillTextActive]}>
                  {level}x
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.zoomHintText} pointerEvents="none">
          Apropie sau depărtează 2 degete pentru zoom
        </Text>
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
  topControlsRow: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  topControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 24, 33, 0.75)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topControlBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: '#fbbf24',
  },
  topControlBtnDisabled: {
    opacity: 0.38,
  },
  topControlText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
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
    ...StyleSheet.absoluteFillObject,
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
  zoomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  zoomPillsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 24, 33, 0.75)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  zoomPill: {
    width: 44,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomPillActive: {
    backgroundColor: '#0284c7',
  },
  zoomPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '800',
  },
  zoomPillTextActive: {
    color: '#ffffff',
  },
  zoomHintText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },
});
