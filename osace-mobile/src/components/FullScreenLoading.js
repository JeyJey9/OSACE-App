import React from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColor } from '../constants/useThemeColor';

export default function FullScreenLoading() {
  const { colors } = useThemeColor();
  return (
    <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F7F7F7' // Potrivește fundalul aplicației
  },
});