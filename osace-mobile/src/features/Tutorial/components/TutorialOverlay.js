// src/features/Tutorial/components/TutorialOverlay.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect as SvgRect, Circle as SvgCircle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { useThemeColor } from '../../../constants/useThemeColor';
import { useTutorial } from '../TutorialContext';
import GestureHint from './GestureHint';

export default function TutorialOverlay() {
  const {
    isActive,
    stepIndex,
    currentStep,
    totalSteps,
    next,
    skip,
    measureTarget,
    isFirstRun,
  } = useTutorial();

  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const overlayContainerRef = useRef(null);
  const [overlayDimensions, setOverlayDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const [targetLayout, setTargetLayout] = useState(null);
  const [showFallbackButton, setShowFallbackButton] = useState(false);

  // Animație de pulse pentru inelul luminos din jurul țintei
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse ring loop
  useEffect(() => {
    if (!isActive) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, pulseAnim]);

  // Card fade in la schimbarea pasului
  useEffect(() => {
    if (!isActive) return;
    cardFadeAnim.setValue(0);
    Animated.timing(cardFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [stepIndex, isActive, cardFadeAnim]);

  // Măsurarea țintei curente raportată la containerul overlay (precizie milimetrică pe orice telefon)
  useEffect(() => {
    if (!isActive || !currentStep) return;

    let isMounted = true;
    setShowFallbackButton(false);
    setTargetLayout(null);

    if (currentStep.target) {
      const measure = async () => {
        // Pauză inițială pentru ca layout-ul să fie gata
        await new Promise((r) => setTimeout(r, 120));
        let layout = await measureTarget(currentStep.target, overlayContainerRef);
        if (isMounted && layout) {
          setTargetLayout(layout);
        }
        // Re-măsurare după finalizarea completă a tranzițiilor native de navigație (ex: slide închidere drawer)
        await new Promise((r) => setTimeout(r, 220));
        layout = await measureTarget(currentStep.target, overlayContainerRef);
        if (isMounted && layout) {
          setTargetLayout(layout);
        }
      };
      measure();
    }

    // Timer fallback de 4 secunde pentru pașii interactivi
    let timer = null;
    if (currentStep.isInteractive && currentStep.fallbackTimeoutMs) {
      timer = setTimeout(() => {
        if (isMounted) {
          setShowFallbackButton(true);
        }
      }, currentStep.fallbackTimeoutMs);
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [stepIndex, isActive, currentStep, measureTarget]);

  if (!isActive || !currentStep) return null;

  const screenW = overlayDimensions.width;
  const screenH = overlayDimensions.height;
  const isTabletOrLargeScreen = screenW > 480;

  // Calculare spotlight geometry
  let spotlightRadius = 28;
  let spotlightCx = 0;
  let spotlightCy = 0;
  let spotlightRectX = 0;
  let spotlightRectY = 0;
  let spotlightRectWidth = 0;
  let spotlightRectHeight = 0;

  if (targetLayout) {
    if (currentStep.targetShape === 'circle') {
      spotlightRadius = Math.max(targetLayout.width, targetLayout.height) / 2 + 7;
      spotlightCx = targetLayout.x + targetLayout.width / 2;
      spotlightCy = targetLayout.y + targetLayout.height / 2;
    } else {
      // Potrivire exactă pe conturul barei de navigare (fără goluri sau text din feed vizibil)
      spotlightRectX = targetLayout.x;
      spotlightRectY = targetLayout.y;
      spotlightRectWidth = targetLayout.width;
      spotlightRectHeight = targetLayout.height;
    }
  }

  // Poziționare tooltip card adaptivă pentru orice dimensiune de ecran
  const horizontalCardStyle = isTabletOrLargeScreen
    ? { alignSelf: 'center', width: 420 }
    : { left: 16, right: 16 };

  let cardPositionStyle = {};
  if (targetLayout) {
    if (targetLayout.y < screenH * 0.45) {
      // Ținta este în partea de sus (Avatar, QR) -> cardul dedesubt
      cardPositionStyle = {
        ...horizontalCardStyle,
        top: targetLayout.y + targetLayout.height + 16,
      };
    } else {
      // Ținta este în partea de jos (TabBar) -> cardul deasupra
      cardPositionStyle = {
        ...horizontalCardStyle,
        bottom: screenH - targetLayout.y + 14,
      };
    }
  } else if (currentStep.id === 'drawer_overview') {
    // Meniul lateral este deschis -> card compact în partea de jos
    cardPositionStyle = {
      ...horizontalCardStyle,
      bottom: Math.max(insets.bottom + 16, 25),
    };
  } else if (currentStep.gesture) {
    // Pașii cu gesturi (3 și 6) -> card în treimea superioară
    cardPositionStyle = {
      ...horizontalCardStyle,
      top: Math.max(insets.top + 45, 65),
    };
  } else {
    // Pasul 0 sau 7 -> card centrat
    cardPositionStyle = {
      ...horizontalCardStyle,
      alignSelf: 'center',
      top: '30%',
    };
  }

  // Handler atingere țintă Pasul 1 (Avatar)
  const handleAvatarTap = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    next();
  };

  return (
    <View
      ref={overlayContainerRef}
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setOverlayDimensions({ width, height });
        }
      }}
      pointerEvents={
        currentStep.id === 'drawer_swipe' || currentStep.id === 'tab_swipe'
          ? 'box-none'
          : 'auto'
      }
    >
      {/* ── Mască SVG pentru decupare iluminată (Spotlight) ── */}
      {targetLayout ? (
        <Svg
          style={StyleSheet.absoluteFill}
          width={screenW}
          height={screenH}
          pointerEvents="none"
        >
          <Defs>
            <Mask id="spotlightMask">
              {/* Fond alb = acoperire completă */}
              <SvgRect x="0" y="0" width={screenW} height={screenH} fill="#FFFFFF" />
              {/* Formă neagră = gaură transparentă */}
              {currentStep.targetShape === 'circle' ? (
                <SvgCircle
                  cx={spotlightCx}
                  cy={spotlightCy}
                  r={spotlightRadius}
                  fill="#000000"
                />
              ) : (
                <SvgRect
                  x={spotlightRectX}
                  y={spotlightRectY}
                  width={spotlightRectWidth}
                  height={spotlightRectHeight}
                  rx={spotlightRectHeight / 2}
                  ry={spotlightRectHeight / 2}
                  fill="#000000"
                />
              )}
            </Mask>
          </Defs>

          {/* Overlay întunecat cu mască aplicată */}
          <SvgRect
            x="0"
            y="0"
            width={screenW}
            height={screenH}
            fill="rgba(5, 8, 15, 0.82)"
            mask="url(#spotlightMask)"
          />
        </Svg>
      ) : (
        /* Overlay fără decupare pentru pașii generici */
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                currentStep.id === 'drawer_overview'
                  ? 'rgba(0, 0, 0, 0.45)'
                  : 'rgba(5, 8, 15, 0.80)',
            },
          ]}
          pointerEvents={
            currentStep.id === 'drawer_swipe' || currentStep.id === 'tab_swipe'
              ? 'none'
              : 'auto'
          }
        />
      )}

      {/* ── Inel pulsant animat în jurul țintei ── */}
      {targetLayout && currentStep.targetShape === 'circle' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseCircle,
            {
              left: spotlightCx - spotlightRadius - 3,
              top: spotlightCy - spotlightRadius - 3,
              width: (spotlightRadius + 3) * 2,
              height: (spotlightRadius + 3) * 2,
              borderRadius: spotlightRadius + 3,
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {targetLayout && currentStep.targetShape === 'rect' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRect,
            {
              left: spotlightRectX - 2,
              top: spotlightRectY - 2,
              width: spotlightRectWidth + 4,
              height: spotlightRectHeight + 4,
              borderRadius: (spotlightRectHeight + 4) / 2,
              borderColor: colors.primary,
              // Folosim un puls elegant de opacitate/glow în loc de scalare geometrică,
              // evitând deformarea alungită pe orizontală
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.15],
                outputRange: [0.45, 1],
              }),
            },
          ]}
        />
      )}

      {/* ── Hitbox interactiv pentru avatar la Pasul 1 ── */}
      {currentStep.id === 'avatar' && targetLayout && (
        <TouchableOpacity
          onPress={handleAvatarTap}
          activeOpacity={0.7}
          style={[
            styles.targetHitbox,
            {
              left: spotlightCx - spotlightRadius,
              top: spotlightCy - spotlightRadius,
              width: spotlightRadius * 2,
              height: spotlightRadius * 2,
              borderRadius: spotlightRadius,
            },
          ]}
        />
      )}

      {/* ── Animație gest (mână glisantă) ── */}
      {currentStep.gesture && <GestureHint gesture={currentStep.gesture} />}

      {/* ── Card Tooltip ── */}
      <Animated.View
        style={[
          styles.cardContainer,
          cardPositionStyle,
          {
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.3)',
            opacity: cardFadeAnim,
          },
        ]}
        pointerEvents="auto"
      >
        {/* Header card: indicator pași + buton Sari peste */}
        <View style={styles.cardHeader}>
          <View style={styles.stepDotsRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      i === stepIndex
                        ? colors.primary
                        : isDark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.15)',
                    width: i === stepIndex ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {currentStep.showSkip && !isFirstRun && (
            <TouchableOpacity onPress={skip} hitSlop={10} style={styles.skipBtn}>
              <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>
                Sari peste
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conținut card: titlu + text */}
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {currentStep.title}
        </Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          {currentStep.text}
        </Text>

        {/* Buton primar sau indicator interactiv */}
        <View style={styles.cardFooter}>
          {currentStep.isInteractive ? (
            <View style={styles.interactiveRow}>
              <View style={styles.interactiveIndicator}>
                <Ionicons
                  name={
                    currentStep.id === 'avatar'
                      ? 'hand-right-outline'
                      : 'swap-horizontal-outline'
                  }
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.interactiveHintText, { color: colors.primary }]}>
                  {currentStep.id === 'avatar'
                    ? 'Atinge poza ta'
                    : currentStep.id === 'drawer_swipe'
                    ? 'Glisează din stânga'
                    : 'Glisează spre stânga'}
                </Text>
              </View>

              {/* Butonul de trecere de siguranță (apare după 4s) */}
              {showFallbackButton && (
                <TouchableOpacity
                  onPress={next}
                  style={[styles.fallbackBtn, { borderColor: colors.primary + '50' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.fallbackBtnText, { color: colors.primary }]}>
                    Mai departe →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={next}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {currentStep.primaryButtonText || 'Mai departe'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pulseCircle: {
    position: 'absolute',
    borderWidth: 2.5,
    zIndex: 20,
  },
  pulseRect: {
    position: 'absolute',
    borderWidth: 2.5,
    zIndex: 20,
  },
  targetHitbox: {
    position: 'absolute',
    zIndex: 30,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  skipBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  cardFooter: {
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  interactiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  interactiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactiveHintText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  fallbackBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
