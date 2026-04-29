import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../constants/useThemeColor';

export default function FormButton({ title, iconName, onPress, loading, variant = 'primary' }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const buttonStyle = [
    styles.button,
    variant === 'danger' ? styles.dangerButton : styles.primaryButton,
    loading && styles.buttonDisabled
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {iconName && <Ionicons name={iconName} size={20} color="white" style={styles.icon} />}
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryButton: { 
    backgroundColor: STANDARD_BLUE,
    shadowColor: STANDARD_BLUE,
    shadowOpacity: 0.3,
  },
  dangerButton: { 
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOpacity: 0.3,
  },
  buttonDisabled: { 
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 10,
  }
});