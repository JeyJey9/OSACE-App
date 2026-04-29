// src/components/FullScreenLoading.js
import React from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';

export default function FullScreenLoading() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1C748C" />
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