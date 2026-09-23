import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '../../../constants/useThemeColor';

const FLOORS = [
  { id: 'E3', label: 'E3', title: 'Etaj 3' },
  { id: 'E2', label: 'E2', title: 'Etaj 2' },
  { id: 'E1', label: 'E1', title: 'Etaj 1' },
  { id: 'P', label: 'P', title: 'Parter' },
  { id: 'B', label: 'B', title: 'Demisol' },
];

const FloorSelector = ({ activeFloor, onFloorChange, style }) => {
  const { colors, isDark } = useThemeColor();

  const handlePress = (floorId) => {
    if (floorId !== activeFloor) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onFloorChange(floorId);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        },
        style,
      ]}
    >
      {FLOORS.map((floor) => {
        const isActive = floor.id === activeFloor;
        return (
          <TouchableOpacity
            key={floor.id}
            accessibilityRole="button"
            accessibilityLabel={floor.title}
            accessibilityState={{ selected: isActive }}
            activeOpacity={0.7}
            onPress={() => handlePress(floor.id)}
            style={[
              styles.floorButton,
              isActive && {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.floorText,
                {
                  color: isActive
                    ? '#ffffff'
                    : isDark
                    ? '#94a3b8'
                    : '#475569',
                },
                isActive && styles.activeFloorText,
              ]}
            >
              {floor.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    gap: 4,
  },
  floorButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeFloorText: {
    fontWeight: '800',
  },
});

export default FloorSelector;
