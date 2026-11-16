// src/features/Tutorial/components/GestureHint.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GestureHint({ gesture }) {
  const { colors, isDark } = useThemeColor();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    );
    loopAnim.start();

    return () => loopAnim.stop();
  }, [animValue]);

  if (gesture === 'fromLeftEdge') {
    // Gest din marginea stângă spre dreapta (deschidere meniu lateral)
    const translateX = animValue.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 20, 110, 120],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.15, 0.75, 1],
      outputRange: [0, 1, 0.9, 0],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 0.15, 0.8, 1],
      outputRange: [0.85, 1.1, 1, 0.9],
    });

    return (
      <View style={styles.leftEdgeContainer} pointerEvents="none">
        {/* Glow pulsing pe marginea stângă */}
        <Animated.View
          style={[
            styles.leftEdgeGlow,
            {
              backgroundColor: colors.primary,
              opacity: animValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.8, 0.2],
              }),
            },
          ]}
        />

        {/* Mâna care glisează spre dreapta */}
        <Animated.View
          style={[
            styles.handWrapper,
            {
              transform: [{ translateX }, { scale }],
              opacity,
            },
          ]}
        >
          <View style={[styles.handBubble, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Ionicons name="arrow-forward-outline" size={20} color={colors.primary} />
            <Ionicons name="hand-right-outline" size={26} color={colors.primary} />
          </View>
        </Animated.View>
      </View>
    );
  }

  if (gesture === 'horizontal') {
    // Gest orizontal spre stânga (trecere la următorul tab)
    const translateX = animValue.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [60, 40, -60, -70],
    });

    const opacity = animValue.interpolate({
      inputRange: [0, 0.15, 0.75, 1],
      outputRange: [0, 1, 0.9, 0],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 0.15, 0.8, 1],
      outputRange: [0.85, 1.1, 1, 0.9],
    });

    return (
      <View style={styles.horizontalContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.handWrapper,
            {
              transform: [{ translateX }, { scale }],
              opacity,
            },
          ]}
        >
          <View style={[styles.handBubble, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
            <Ionicons name="hand-left-outline" size={26} color={colors.primary} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  leftEdgeContainer: {
    position: 'absolute',
    left: 0,
    top: '38%',
    height: 120,
    width: 200,
    justifyContent: 'center',
    zIndex: 100,
  },
  leftEdgeGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  horizontalContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  handWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  handBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
