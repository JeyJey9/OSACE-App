import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // Obținem spațiul protejat (sus și jos)
  
  // ▼▼▼ Preluăm culorile temei ▼▼▼
  const { colors, isDark } = useThemeColor();

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      navigation.replace('Main');
    } catch (e) {
      console.error('Eroare la salvarea statusului onboarding:', e);
    }
  };

  // Generăm stilurile dinamice bazate pe culori
  const styles = createStyles(colors, isDark);

  // Componente Custom pentru Butoane (le definim aici ca să aibă acces la 'styles' și 'colors')
  const DoneButton = ({ ...props }) => (
    <TouchableOpacity style={styles.doneButton} {...props}>
      <Text style={styles.doneButtonText}>Să Începem!</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }) => (
    <TouchableOpacity style={styles.navButton} {...props}>
      <Text style={styles.navButtonText}>Mai departe</Text>
    </TouchableOpacity>
  );

  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={styles.navButton} {...props}>
      <Text style={styles.navButtonText}>Sari peste</Text>
    </TouchableOpacity>
  );

  return (
    // Folosim un View ca wrapper pentru a aplica padding-ul la baza ecranului
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom }}>
      <Onboarding
        onSkip={handleDone}
        onDone={handleDone}
        DoneButtonComponent={DoneButton}
        NextButtonComponent={NextButton}
        SkipButtonComponent={SkipButton}
        bottomBarHighlight={false}
        // Container-ul principal de jos unde sunt butoanele și bulinele
        bottomBarContainerStyle={{ 
          backgroundColor: colors.background,
          paddingVertical: 10 
        }}
        pages={[
          {
            backgroundColor: colors.background,
            image: <Ionicons name="calendar" size={120} color={colors.primary} />,
            title: 'Evenimente & Voluntariat',
            subtitle: 'Descoperă activitățile OSACE, de la ședințe la proiecte sociale. Înscrie-te simplu din meniul "Activități" și ține evidența orelor tale.',
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
          {
            backgroundColor: colors.background,
            image: <Ionicons name="qr-code" size={120} color={colors.primary} />,
            title: 'Scanare Prezență',
            subtitle: 'Când pleci de la activitate, scanează codul QR pentru a confirma prezența instantaneu.',
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
          {
            backgroundColor: colors.background,
            image: <Ionicons name="medal" size={120} color={colors.primary} />,
            title: 'Realizări & Badge-uri',
            subtitle: 'Fiecare oră contează! Deblochează badge-uri unice și urcă în clasamentul voluntarilor.',
            titleStyles: styles.title,
            subTitleStyles: styles.subtitle,
          },
        ]}
      />
    </View>
  );
}

// Funcție pentru crearea stilurilor folosind tema
const createStyles = (colors, isDark) => StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary, // Culoare adaptivă
    marginBottom: 10,
    marginTop: -20, 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary, // Culoare adaptivă
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 24,
  },
  doneButton: {
    marginRight: 20,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navButton: {
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  }
});