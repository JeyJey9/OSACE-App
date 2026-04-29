import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../constants/useThemeColor';

export const CustomAlert = {
  alert: (title, message, buttons) => {
    if (customAlertRef) {
      customAlertRef.show(title, message, buttons);
    } else {
      console.warn("CustomAlert not mounted yet!");
    }
  }
};

let customAlertRef = null;

export const setCustomAlertRef = (ref) => {
  customAlertRef = ref;
};

const GlassAlert = forwardRef((props, ref) => {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    buttons: []
  });

  useImperativeHandle(ref, () => ({
    show: (title, message, buttons) => {
      setConfig({
        title: title || '',
        message: message || '',
        buttons: buttons || []
      });
      setVisible(true);
    },
    hide: () => setVisible(false)
  }));

  const handleClose = () => {
    setVisible(false);
  };

  const renderButtons = () => {
    const buttons = config.buttons && config.buttons.length > 0 
      ? config.buttons 
      : [{ text: "Ok", onPress: () => {} }];

    if (buttons.length === 1) {
      const btn = buttons[0];
      const isDestructive = btn.style === 'destructive';
      const bgColor = isDestructive ? '#E74C3C' : STANDARD_BLUE;

      return (
        <TouchableOpacity 
          style={[styles.modalButton, { backgroundColor: bgColor, shadowColor: bgColor }]} 
          onPress={() => {
            handleClose();
            if (btn.onPress) setTimeout(btn.onPress, 300);
          }}
        >
          <Text style={styles.modalButtonText}>{btn.text}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonRow}>
        {buttons.map((btn, index) => {
          const isDestructive = btn.style === 'destructive';
          const isCancel = btn.style === 'cancel';
          
          let bgColor = STANDARD_BLUE;
          let textColor = 'white';
          
          if (isCancel) {
            bgColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
            textColor = colors.textPrimary;
          } else if (isDestructive) {
            bgColor = '#E74C3C';
          }

          return (
            <TouchableOpacity 
              key={index}
              style={[
                styles.modalButton, 
                styles.flexButton, 
                { backgroundColor: bgColor, shadowColor: isCancel ? 'transparent' : bgColor },
                index > 0 && { marginLeft: 10 }
              ]} 
              onPress={() => {
                handleClose();
                if (btn.onPress) setTimeout(btn.onPress, 300);
              }}
            >
              <Text 
                style={[styles.modalButtonText, { color: textColor }]}
                adjustsFontSizeToFit={true}
                numberOfLines={1}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  let iconName = "information-circle";
  let iconColor = STANDARD_BLUE;
  
  if (config.buttons?.some(b => b.style === 'destructive')) {
    iconName = "warning";
    iconColor = "#E74C3C";
  } else if (config.buttons?.some(b => b.text?.toLowerCase().includes('ok') || b.text?.toLowerCase().includes('succes'))) {
    iconName = "checkmark-circle";
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={[styles.modalIconBox, { backgroundColor: iconColor + '15', borderColor: iconColor + '30' }]}>
            <Ionicons name={iconName} size={44} color={iconColor} />
          </View>
          
          <Text style={styles.modalTitle}>{config.title}</Text>
          {config.message ? (
            <Text style={styles.modalDescription}>{config.message}</Text>
          ) : null}
          
          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
  },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 25,
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
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', // Ensures text stays exactly in the middle vertically
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  flexButton: {
    flex: 1,
    width: 'auto',
  },
  modalButtonText: {
    fontSize: 15, // Slightly reduced to fit longer words better
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center', // Centers text horizontally
  },
});

export default GlassAlert;
