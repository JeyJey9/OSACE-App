import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../constants/useThemeColor';

export default function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestoredMsg, setShowRestoredMsg] = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const restoredTimer = useRef(null);
  const { colors, isDark } = useThemeColor();

  const showBanner = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const hideBanner = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 80, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      
      setIsOffline(prev => {
        if (prev && !offline) {
          // Was offline, now restored
          setShowRestoredMsg(true);
          showBanner();
          
          restoredTimer.current = setTimeout(() => {
            hideBanner();
            setTimeout(() => setShowRestoredMsg(false), 350);
          }, 2500);
        } else if (!prev && offline) {
          // Was online, now offline
          setShowRestoredMsg(false);
          if (restoredTimer.current) clearTimeout(restoredTimer.current);
          showBanner();
        } else if (!offline) {
          hideBanner();
        }
        return offline;
      });
    });

    return () => {
      unsubscribe();
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
    };
  }, []);

  const bgColor = showRestoredMsg ? '#27ae60' : '#e74c3c';
  const iconName = showRestoredMsg ? 'wifi' : 'wifi-outline';
  const message = showRestoredMsg ? 'Conexiune restaurată' : 'Fără conexiune la internet';

  if (!isOffline && !showRestoredMsg) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { 
          backgroundColor: bgColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <Ionicons name={iconName} size={16} color="white" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 99,
    paddingBottom: 4,
  },
  text: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
    letterSpacing: 0.2,
  },
});
