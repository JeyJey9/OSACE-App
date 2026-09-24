import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const FLOOR_LABELS = {
  B: 'Demisol',
  P: 'Parter',
  E1: 'Etaj 1',
  E2: 'Etaj 2',
  E3: 'Etaj 3',
};

const NavigationBanner = ({
  route,
  currentFloor,
  onSwitchFloor,
  onStopNavigation,
  onSwapEndpoints,
  style,
}) => {
  const { colors, isDark } = useThemeColor();

  const navState = useMemo(() => {
    if (!route || !route.nodes || route.nodes.length === 0) return null;

    const allNodes = route.nodes;
    const targetRoom = route.targetRoom;
    const startPoint = route.startPoint || {
      code: 'GD04',
      name: 'Intrarea Principală',
      floor: 'B',
    };
    const floors = route.floors || [];

    const nodesOnCurrentFloor = allNodes.filter((n) => n.floor === currentFloor);
    const floorOrder = ['B', 'P', 'E1', 'E2', 'E3'];

    let isDestinationFloor = false;
    let nextFloor = null;
    let isClimbing = false;

    if (nodesOnCurrentFloor.length === 0) {
      // Dacă utilizatorul se uită la un etaj care nu este pe traseu, îl ghidăm spre primul etaj al traseului
      nextFloor = allNodes[0]?.floor || floors[0];
      if (nextFloor) {
        isClimbing = floorOrder.indexOf(nextFloor) > floorOrder.indexOf(currentFloor);
      }
    } else {
      // Determinăm dacă segmentul traseului de pe etajul curent părăsește acest etaj spre alt etaj
      const firstIdx = allNodes.findIndex((n) => n.floor === currentFloor);
      let exitIdx = firstIdx;
      while (exitIdx < allNodes.length && allNodes[exitIdx].floor === currentFloor) {
        exitIdx++;
      }

      if (exitIdx < allNodes.length) {
        // Traseul părăsește etajul curent spre următorul etaj din succesiunea traseului
        nextFloor = allNodes[exitIdx].floor;
        isClimbing = floorOrder.indexOf(nextFloor) > floorOrder.indexOf(currentFloor);
        isDestinationFloor = false;
      } else {
        // Traseul nu mai părăsește acest etaj și ajunge la destinație
        isDestinationFloor = targetRoom && targetRoom.floor === currentFloor;
      }
    }

    return {
      hasNodesOnFloor: nodesOnCurrentFloor.length > 0,
      isDestinationFloor,
      nextFloor,
      isClimbing,
      targetRoom,
      startPoint,
      totalDistanceMeters: route.totalDistanceMeters || 0,
    };
  }, [route, currentFloor]);

  if (!navState) return null;

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, style]}>
      {/* Rând superior: Traseu (Plecare ➔ Destinație) & Buton Închidere */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="navigate" size={13} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>Navigație</Text>
        </View>

        <View style={styles.targetInfo}>
          <View style={styles.routePointsRow}>
            <Text style={styles.routeStartPoint} numberOfLines={1}>
              {navState.startPoint?.code || 'Intrare'}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ marginHorizontal: 4 }} />
            <Text style={styles.targetTitle} numberOfLines={1}>
              {navState.targetRoom?.code || 'Destinație'}
            </Text>
          </View>
          <Text style={styles.targetSub} numberOfLines={1}>
            {navState.startPoint?.name ? `De la: ${navState.startPoint.name} • ` : ''}{navState.totalDistanceMeters}m distanță
          </Text>
        </View>

        {onSwapEndpoints && (
          <TouchableOpacity
            onPress={onSwapEndpoints}
            style={styles.swapButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Inversează sensul de mers"
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onStopNavigation}
          style={styles.stopButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={24} color={isDark ? '#ef4444' : '#dc2626'} />
        </TouchableOpacity>
      </View>

      {/* Rând instrucțiuni etaj */}
      <View style={styles.instructionBox}>
        {navState.isDestinationFloor ? (
          <View style={styles.instructionContent}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Ești la etajul destinației ({FLOOR_LABELS[currentFloor]}). Urmează linia albastră până la sală.
            </Text>
          </View>
        ) : navState.nextFloor ? (
          <View style={styles.instructionWithAction}>
            <View style={styles.instructionContent}>
              <Ionicons
                name={navState.isClimbing ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={18}
                color="#0284c7"
                style={styles.instructionIcon}
              />
              <Text style={styles.instructionText}>
                Mergi la scări și {navState.isClimbing ? 'urcă' : 'coboară'} la{' '}
                <Text style={{ fontWeight: '800' }}>{FLOOR_LABELS[navState.nextFloor]}</Text>.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.switchFloorBtn}
              activeOpacity={0.7}
              onPress={() => onSwitchFloor && onSwitchFloor(navState.nextFloor)}
            >
              <Text style={styles.switchFloorBtnText}>
                Comută la {navState.nextFloor}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.instructionContent}>
            <Ionicons name="information-circle" size={18} color="#f59e0b" style={styles.instructionIcon} />
            <Text style={styles.instructionText}>
              Traseul trece prin alte etaje. Comută la {FLOOR_LABELS[route.floors[0]]} pentru plecare.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 10,
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    targetInfo: {
      flex: 1,
    },
    routePointsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    routeStartPoint: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    targetTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    targetSub: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    swapButton: {
      padding: 6,
      marginRight: 4,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 8,
    },
    stopButton: {
      padding: 2,
    },
    instructionBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    },
    instructionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    instructionIcon: {
      marginRight: 8,
    },
    instructionText: {
      fontSize: 12,
      color: colors.textPrimary,
      flex: 1,
      lineHeight: 16,
    },
    instructionWithAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    switchFloorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    switchFloorBtnText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '700',
      marginRight: 4,
    },
  });

export default NavigationBanner;
