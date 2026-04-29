import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useThemeColor } from '../../constants/useThemeColor';

export default function FormInput({ label, multiline = false, style, ...props }) {
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const inputStyle = [
    styles.input,
    multiline && styles.multilineInput,
    style 
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={inputStyle}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardAppearance={colors.isDark ? 'dark' : 'light'}
        selectionColor={STANDARD_BLUE}
        {...props} 
      />
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    minHeight: 52, 
  },
  multilineInput: {
    height: 120, 
    paddingTop: 16, 
    textAlignVertical: 'top',
  }
});