import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
// ▼▼▼ NOU: Importăm hook-ul de temă ▼▼▼
import { useThemeColor } from '../constants/useThemeColor';

export default function SkeletonItem({ width, height, borderRadius = 4, style }) {
  const { isDark } = useThemeColor();
  const opacity = useRef(new Animated.Value(isDark ? 0.2 : 0.3)).current;

  useEffect(() => {
    // Creăm o animație în buclă (Pulse)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: isDark ? 0.4 : 0.7, // Pulsație mai discretă pe Dark Mode
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: isDark ? 0.2 : 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [isDark]);

  // ▼▼▼ DETERMINĂM CULOAREA ÎN FUNCȚIE DE TEMĂ ▼▼▼
  const skeletonColor = isDark 
    ? 'rgba(255, 255, 255, 0.12)' // Un alb translucid care devine gri pe fundal negru
    : '#E1E9EE'; // Griul clasic pentru Light Mode

  return (
    <Animated.View
      style={[
        {
          backgroundColor: skeletonColor,
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}