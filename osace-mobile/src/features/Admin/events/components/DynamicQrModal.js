import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function DynamicQrModal({ isVisible, onClose, eventId, title }) {
  const [qrValue, setQrValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const { colors, isDark } = useThemeColor();

  const fetchQrCode = async (currentEventId) => {
    if (!currentEventId) {
      setLoading(false);
      return; 
    }
    
    try {
      const response = await api.get(`/api/events/${currentEventId}/current-code`);
      setQrValue(response.data.code);
    } catch (error) {
      console.error("Eroare QR:", error.response?.data);
      if (intervalRef.current) clearInterval(intervalRef.current);
      Alert.alert("Eroare QR", "Nu s-a putut genera codul.");
      onClose(); 
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isVisible && eventId) {
      setLoading(true);
      setQrValue(null);
      fetchQrCode(eventId);
      
      intervalRef.current = setInterval(() => {
        fetchQrCode(eventId);
      }, 20000); 

    } else {
      cleanup();
    }

    return cleanup;
  }, [isVisible, eventId]); 

  const styles = createStyles(colors, isDark);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={32} color={isDark ? colors.textSecondary : "#ccc"} />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>Scanare Prezență (Cod Dinamic)</Text>

          <View style={styles.qrContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : qrValue ? (
              <View style={styles.whiteQrWrapper}>
                <QRCode
                  value={qrValue}
                  size={220}
                  color="black"
                  backgroundColor="white"
                />
              </View>
            ) : (
              <Text style={styles.errorText}>Codul QR nu este disponibil.</Text>
            )}
          </View>
          
          <Text style={styles.footerText}>
            Acest cod se actualizează automat pentru a preveni fraudele.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  modalView: { width: '85%', backgroundColor: colors.card, borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: isDark ? 1 : 0, borderColor: colors.border, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  closeButton: { position: 'absolute', top: 15, right: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 25 },
  qrContainer: { width: 260, height: 260, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  whiteQrWrapper: { padding: 15, backgroundColor: 'white', borderRadius: 12 },
  footerText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 10 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
