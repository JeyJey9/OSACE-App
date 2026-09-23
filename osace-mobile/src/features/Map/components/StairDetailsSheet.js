import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const StairDetailsSheet = ({
  stair,
  currentFloor,
  onClose,
  onSwitchFloor,
}) => {
  const { colors, isDark } = useThemeColor();
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['34%', '52%'], []);

  useEffect(() => {
    if (stair) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [stair]);

  if (!stair) return null;

  const currentFloorLabel =
    currentFloor === 'B'
      ? 'Demisol'
      : currentFloor === 'P'
      ? 'Parter'
      : `Etaj ${currentFloor.replace('E', '')}`;

  const isUp = stair.direction === 'up';
  const isDown = stair.direction === 'down';
  const isBoth = stair.direction === 'both';

  const badgeIconName = isUp
    ? 'arrow-up-circle'
    : isDown
    ? 'arrow-down-circle'
    : 'swap-vertical-circle';

  const badgeColor = isUp ? '#10b981' : isDown ? '#f59e0b' : '#3b82f6';

  const styles = createStyles(colors, isDark, badgeColor);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? '#475569' : '#cbd5e1',
        width: 40,
      }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Antet Scară */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Ionicons name={badgeIconName} size={28} color={badgeColor} />
            <View style={styles.badgeTextWrapper}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{stair.name}</Text>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>{stair.id}</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Aflat la {currentFloorLabel} • {stair.direction === 'up' ? 'Urcare' : stair.direction === 'down' ? 'Coborâre' : 'Legătură etaje'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
          </TouchableOpacity>
        </View>

        {/* Descriere */}
        {stair.fullDescription ? (
          <View style={styles.descriptionBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.descriptionText}>{stair.fullDescription}</Text>
          </View>
        ) : null}

        {/* Secțiune Etaje Destinație */}
        <Text style={styles.sectionTitle}>SCHIMBĂ ETAJUL (VEZI DESTINAȚIA)</Text>

        <ScrollView
          style={styles.destinationsScroll}
          contentContainerStyle={styles.destinationsContainer}
          showsVerticalScrollIndicator={false}
        >
          {stair.targetFloors &&
            stair.targetFloors.map((targetFloor, index) => {
              const targetName =
                stair.targetFloorNames && stair.targetFloorNames[index]
                  ? stair.targetFloorNames[index]
                  : targetFloor === 'B'
                  ? 'Demisol'
                  : targetFloor === 'P'
                  ? 'Parter'
                  : `Etaj ${targetFloor.replace('E', '')}`;

              return (
                <TouchableOpacity
                  key={`target-${targetFloor}-${index}`}
                  style={styles.destinationButton}
                  onPress={() => onSwitchFloor && onSwitchFloor(stair, targetFloor)}
                  activeOpacity={0.7}
                >
                  <View style={styles.destLeft}>
                    <View style={styles.destFloorBadge}>
                      <Text style={styles.destFloorBadgeText}>{targetFloor}</Text>
                    </View>
                    <View>
                      <Text style={styles.destFloorName}>{targetName}</Text>
                      <Text style={styles.destFloorSub}>Apasă pentru a merge la acest etaj</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const createStyles = (colors, isDark, badgeColor) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    badgeTextWrapper: {
      marginLeft: 12,
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    idBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    },
    idBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: 'monospace',
      color: colors.primary,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 2,
    },
    closeButton: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      marginLeft: 8,
    },
    descriptionBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
      padding: 10,
      borderRadius: 12,
      marginBottom: 14,
    },
    descriptionText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? '#bae6fd' : '#0369a1',
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#64748b' : '#94a3b8',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    destinationsScroll: {
      flex: 1,
    },
    destinationsContainer: {
      paddingBottom: 12,
    },
    destinationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#e2e8f0',
    },
    destLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    destFloorBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    destFloorBadgeText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },
    destFloorName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    destFloorSub: {
      fontSize: 12,
      fontWeight: '400',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: 1,
    },
  });

export default StairDetailsSheet;
