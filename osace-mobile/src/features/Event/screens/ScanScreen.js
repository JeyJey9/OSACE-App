import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export default function ScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params; 

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true); 

    try {
      const response = await api.post(`/api/events/${eventId}/confirm-presence`, {
        code: data,
      });

      const serverMessage = response.data.message;
      const status = response.data.status; // Luăm statusul de la backend

      // Personalizăm titlul și mesajul
      let title = 'Succes! ✅';
      let finalMessage = serverMessage;

      if (status === 'checked_in') {
        title = 'Check-in Reușit! 📍';
        finalMessage = 'Ești prezent! ⚠️ NU UITA să scanezi din nou când pleci!';
      } else if (status === 'attended') {
        title = 'Check-out Reușit! 🏆';
      }

      // ▼▼▼ Haptic feedback on success ▼▼▼
      if (status === 'checked_in') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (status === 'attended') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Toast.show({
        type: 'success',
        text1: title,
        text2: finalMessage,
        visibilityTime: 3000, // Stă afișat 3 secunde
        onHide: () => navigation.goBack() // Se întoarce automat după ce dispare Toast-ul
      });

    } catch (error) {
      console.error("Eroare la confirmarea QR:", error.response?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.response?.data?.error || 'Cod QR invalid sau expirat.';
      
      // Păstrăm Alert aici pentru ca utilizatorul să deblocheze camera manual
      Alert.alert(
        'Eroare', 
        errorMessage,
        [{ text: 'Încearcă din nou', onPress: () => setScanned(false) }] 
      );
    }
  };

  if (!permission) {
    return <View />; 
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Avem nevoie de permisiunea ta pentru a folosi camera.</Text>
        <Button title={"Acordă Permisiunea"} onPress={requestPermission} />
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
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  }
});