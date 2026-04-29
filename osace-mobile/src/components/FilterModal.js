import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../constants/useThemeColor';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.5;

const FilterModal = ({ visible, onClose, children }) => {
  // ▼▼▼ NOU: Preluăm culorile ▼▼▼
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.modalContentContainer}>
          <View style={styles.modalContent}>
            {/* "Mânerul" se adaptează acum culorii de border */}
            <View style={styles.handleBar} />

            <View style={styles.header}>
              <Text style={styles.title}>Filtre</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Închide</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contentBody}>
              {children ? (
                children
              ) : (
                <Text style={{ color: colors.textSecondary }}>
                  Adaugă componentele de filtru aici...
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fundalul întunecat de sub modal
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  modalContentContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: colors.card, // Fundal adaptiv (alb sau gri închis)
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    zIndex: 2,
    // Adăugăm bordură fină pe Dark Mode
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: colors.border, // Mânerul e vizibil discret
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: isDark ? colors.border : '#f0f0f0',
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contentBody: {
    flex: 1,
    paddingTop: 15,
  },
});

export default FilterModal;