import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

// Dimensiunile switch-ului
const SWITCH_WIDTH = 70;
const SWITCH_HEIGHT = 34;
const KNOB_SIZE = 28;
const PADDING = (SWITCH_HEIGHT - KNOB_SIZE) / 2; // Spațiul dintre cerc și margine

export default function ThemeToggleSwitch({ isDark, onToggle, colors }) {
  // Valoare partajată pentru animație (0 = light, 1 = dark)
  const progress = useSharedValue(isDark ? 1 : 0);

  // Când se schimbă tema, declanșăm animația "spring" (elastică)
  useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, {
      damping: 15, // Cât de repede se oprește "bălăbăneala"
      stiffness: 120, // Cât de rigid e arcul
    });
  }, [isDark]);

  // Stilul animat pentru fundalul pilulei (track)
  const animatedTrackStyle = useAnimatedStyle(() => {
    // Interpolăm culoarea de fundal între un bleu de zi și un indigo de noapte
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#87CEEB', '#2c3e50'] // Sky Blue -> Midnight Blue
    );
    return { backgroundColor };
  });

  // Stilul animat pentru cercul care glisează (knob)
  const animatedKnobStyle = useAnimatedStyle(() => {
    // Calculăm poziția orizontală
    const translateX = progress.value * (SWITCH_WIDTH - KNOB_SIZE - PADDING * 2);
    
    // Schimbăm culoarea cercului: Galben (Soare) -> Albastru deschis (Lună)
    const backgroundColor = interpolateColor(
        progress.value,
        [0, 1],
        ['#FDB813', '#ecf0f1'] 
      );

    return {
      transform: [{ translateX }],
      backgroundColor
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
      <Animated.View style={[styles.track, animatedTrackStyle]}>
        {/* Iconițele statice din fundal */}
        <View style={styles.iconContainer}>
           {/* Soare mic în stânga */}
          <Ionicons name="sunny" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "white"} />
           {/* Lună mică în dreapta */}
          <Ionicons name="moon" size={16} color={isDark ? "white" : "rgba(0,0,0,0.2)"} style={{marginLeft: 'auto'}}/>
        </View>

        {/* Cercul care glisează deasupra */}
        <Animated.View style={[styles.knob, animatedKnobStyle]}>
            {/* Opțional: Putem pune o iconiță și în cerc, dar e mai "clean" fără */}
            {/* <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={isDark ? "#2c3e50" : "#fff"} /> */}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    justifyContent: 'center',
    padding: PADDING,
  },
  iconContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    // Iconițele sunt în spate, deci nu blochează atingerea
    zIndex: 0, 
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    // Umbră subtilă pentru efect 3D
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 4,
    zIndex: 1, // Cercul e deasupra iconițelor de fundal
    alignItems: 'center',
    justifyContent: 'center'
  },
});