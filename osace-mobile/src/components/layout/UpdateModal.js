import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking, BackHandler, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../constants/useThemeColor';

export default function UpdateModal({ visible, isRequired, updateUrl, latestVersion, onClose }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = colors.primary;
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  // Blochează acțiunea de back hardware pe Android dacă update-ul este obligatoriu
  useEffect(() => {
    if (visible && isRequired) {
      const backAction = () => {
        // Returnează true pentru a opri închiderea aplicației sau navigarea înapoi
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [visible, isRequired]);

  const handleUpdatePress = async () => {
    try {
      const defaultStoreUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/us/app/osace-voluntariat/id6774091102'
        : 'https://play.google.com/store/apps/details?id=ro.osace.app&hl=en';

      const targetUrl = (updateUrl && updateUrl !== 'https://osace.ro/app')
        ? updateUrl
        : defaultStoreUrl;

      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        await Linking.openURL(targetUrl);
      }
    } catch (error) {
      console.error("Eroare la deschiderea magazinului de aplicații:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      // Dacă update-ul este obligatoriu, nu permitem închiderea prin swipe sau back pe Android
      onRequestClose={() => {
        if (!isRequired && onClose) {
          onClose();
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          {/* Logo/Iconiță strălucitoare cu efect de sticlă */}
          <View style={[
            styles.iconWrapper,
            {
              backgroundColor: isRequired ? 'rgba(231, 76, 60, 0.15)' : 'rgba(74, 144, 226, 0.15)',
              borderColor: isRequired ? 'rgba(231, 76, 60, 0.3)' : 'rgba(74, 144, 226, 0.3)'
            }
          ]}>
            <Ionicons
              name={isRequired ? "alert-circle" : "rocket"}
              size={48}
              color={isRequired ? "#E74C3C" : STANDARD_BLUE}
            />
          </View>

          {/* Titluri premium */}
          <Text style={styles.modalTitle}>
            {isRequired ? "Actualizare Obligatorie" : "Versiune Nouă Disponibilă!"}
          </Text>

          {latestVersion && (
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>Versiunea {latestVersion}</Text>
            </View>
          )}

          <Text style={styles.modalDescription}>
            {isRequired
              ? "Pentru a continua să folosești aplicația OSACE și să înregistrezi orele de voluntariat, este necesar să descarci ultima versiune din store."
              : "Am adăugat un nou Selector de Teme în profil și optimizări de performanță! Actualizează acum."}
          </Text>

          {/* Secțiune Butoane */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: isRequired ? '#E74C3C' : STANDARD_BLUE }]}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-download-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Actualizează Acum</Text>
            </TouchableOpacity>

            {!isRequired && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Mai târziu</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  },
  iconWrapper: {
    width: 86,
    height: 86,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  versionBadge: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F3F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
