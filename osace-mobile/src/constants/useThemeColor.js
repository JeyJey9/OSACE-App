import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ACCENT_PRESETS } from './theme';

// 1. Creăm un Context Global pentru Temă
const ThemeContext = createContext();

// 2. Creăm un Provider care va înveli aplicația
export const ThemeProvider = ({ children }) => {
  const systemTheme = useSystemColorScheme();
  const [theme, setTheme] = useState(systemTheme || 'light');
  const [accentPresetId, setAccentPresetIdState] = useState('royal_blue');
  const [isLoaded, setIsLoaded] = useState(false);

  // La pornirea aplicației, verificăm preferințele salvate
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const [savedTheme, savedPreset] = await Promise.all([
          AsyncStorage.getItem('@app_theme'),
          AsyncStorage.getItem('@app_accent_preset'),
        ]);

        if (savedTheme) {
          setTheme(savedTheme);
          Appearance.setColorScheme(savedTheme);
        } else {
          setTheme(systemTheme || 'light');
        }

        if (savedPreset && ACCENT_PRESETS.some(p => p.id === savedPreset)) {
          setAccentPresetIdState(savedPreset);
        }
      } catch (error) {
        console.error("Eroare la încărcarea setărilor de temă:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedSettings();
  }, [systemTheme]);

  // Funcția pentru schimbarea modului Light/Dark
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Appearance.setColorScheme(newTheme);
    await AsyncStorage.setItem('@app_theme', newTheme);
  };

  // Funcția pentru schimbarea paletei de accent
  const setAccentPreset = async (presetId) => {
    if (!ACCENT_PRESETS.some(p => p.id === presetId)) return;
    setAccentPresetIdState(presetId);
    await AsyncStorage.setItem('@app_accent_preset', presetId);
  };

  // Calculăm culorile active cu paleta de accent aplicată
  const activeColors = useMemo(() => {
    const baseColors = { ...Colors[theme] };
    const preset = ACCENT_PRESETS.find(p => p.id === accentPresetId) || ACCENT_PRESETS[0];
    baseColors.primary = theme === 'dark' ? preset.darkPrimary : preset.lightPrimary;
    return baseColors;
  }, [theme, accentPresetId]);

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors: activeColors, 
      isDark: theme === 'dark', 
      toggleTheme,
      accentPresetId,
      setAccentPreset,
      ACCENT_PRESETS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook-ul clasic
export function useThemeColor() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeColor trebuie folosit în interiorul unui ThemeProvider');
  }
  return context;
}