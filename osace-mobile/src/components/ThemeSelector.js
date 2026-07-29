import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../constants/useThemeColor';

export default function ThemeSelector() {
  const { colors, isDark, accentPresetId, setAccentPreset, ACCENT_PRESETS } = useThemeColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tema Aplicației</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {ACCENT_PRESETS.map((preset) => {
          const isSelected = accentPresetId === preset.id;
          const displayColor = isDark ? preset.darkPrimary : preset.lightPrimary;

          return (
            <TouchableOpacity
              key={preset.id}
              activeOpacity={0.8}
              onPress={() => setAccentPreset(preset.id)}
              style={[
                styles.colorCircleWrapper,
                { borderColor: isSelected ? displayColor : 'transparent' },
              ]}
            >
              <View style={[styles.colorDot, { backgroundColor: displayColor }]}>
                {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scrollContent: {
    gap: 12,
    alignItems: 'center',
  },
  colorCircleWrapper: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
