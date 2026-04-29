// src/components/layout/ScreenContainer.js
import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
// ▼▼▼ NOU: Importăm hook-ul de culori ▼▼▼
import { useThemeColor } from '../../constants/useThemeColor';

const LoadingState = ({ colors }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export default function ScreenContainer({ 
  children, 
  loading = false, 
  scrollable = true 
}) {
  // ▼▼▼ NOU: Preluăm culorile ▼▼▼
  const { colors } = useThemeColor();

  const containerStyles = [
    styles.container,
    { backgroundColor: colors.background }, // ◄ Aplicăm culoarea de fundal dinamic
    loading && styles.loadingBackground 
  ];
  
  return (
    <SafeAreaView style={containerStyles}>
      {loading ? (
        <LoadingState colors={colors} />
      ) : scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      ) : (
        // Non-scrollable: wrap in a View so FlatList contentContainerStyle can add its own padding
        <View style={styles.nonScrollContent}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Am șters backgroundColor de aici, deoarece îl setăm dinamic mai sus
  },
  scrollContent: {
    paddingBottom: 110, // Floating tab bar (70px) + 15px offset + safe area buffer
  },
  nonScrollContent: {
    flex: 1,
  },
  loadingBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});