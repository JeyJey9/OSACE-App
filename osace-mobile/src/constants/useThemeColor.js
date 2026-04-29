import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './theme';

// 1. Creăm un Context Global pentru Temă
const ThemeContext = createContext();

// 2. Creăm un Provider care va înveli aplicația
export const ThemeProvider = ({ children }) => {
  const systemTheme = useSystemColorScheme();
  const [theme, setTheme] = useState(systemTheme || 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  // La pornirea aplicației, verificăm dacă utilizatorul a salvat o preferință
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        if (savedTheme) {
          setTheme(savedTheme);
          Appearance.setColorScheme(savedTheme); // Sincronizăm și componentele native
        } else {
          setTheme(systemTheme || 'light');
        }
      } catch (error) {
        console.error("Eroare la încărcarea temei:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedTheme();
  }, [systemTheme]);

  // Funcția pe care o vom apela din butonul (Toggle) din Meniul Lateral
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Appearance.setColorScheme(newTheme); // Forțează update la status bar etc.
    await AsyncStorage.setItem('@app_theme', newTheme);
  };

  // Nu randăm copiii până nu știm sigur ce temă avem (evităm flash-ul de culori)
  if (!isLoaded) return null; 

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors: Colors[theme], 
      isDark: theme === 'dark', 
      toggleTheme // O expunem ca să o putem folosi pe butoane
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Hook-ul tău clasic (rămâne la fel ca mod de utilizare, dar trage date din Context)
export function useThemeColor() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeColor trebuie folosit în interiorul unui ThemeProvider');
  }
  return context;
}