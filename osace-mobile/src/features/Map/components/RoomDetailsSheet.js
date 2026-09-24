import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';

const RoomDetailsSheet = ({
  room,
  onClose,
  onNavigateHere,
  onSetStartPoint,
  isNavigating = false,
}) => {
  const { colors, isDark } = useThemeColor();
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['26%', '45%'], []);

  useEffect(() => {
    if (room) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [room]);

  if (!room) return null;

  const floorLabel =
    room.floor === 'B'
      ? 'Demisol'
      : room.floor === 'P'
      ? 'Parter'
      : `Etaj ${room.floor.replace('E', '')}`;

  const styles = createStyles(colors, isDark);

  const isEntrance = room.type === 'entrance' || room.code === 'GD04';
  const isSpecialVenue =
    room.type === 'amphitheatre' ||
    room.code === 'ACB' ||
    room.code === 'AK1' ||
    room.code?.toLowerCase().includes('aula') ||
    room.code?.toLowerCase().includes('belea') ||
    room.id?.includes('amfiteatru');

  const badgeBg = isEntrance ? '#10b981' : isSpecialVenue ? '#8b5cf6' : colors.primary;
  const badgeLabel = isEntrance ? 'INTRARE' : room.code || (isSpecialVenue ? 'AMFITEATRU' : 'SALĂ');

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
        {/* Antet Sală */}
        <View style={styles.header}>
          <View style={[styles.codeBadge, { backgroundColor: badgeBg }]}>
            <Text style={styles.codeBadgeText}>{badgeLabel}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.name || 'Sală'}
            </Text>
            <Text style={styles.roomSub}>
              {isEntrance
                ? 'Corp Central • Demisol (4 uși acces exterior)'
                : `${room.wing} • ${floorLabel}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
          </TouchableOpacity>
        </View>

        {/* Metadate Sală */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="layers-outline" size={16} color={badgeBg} />
            <Text style={styles.statLabel}>Nivel</Text>
            <Text style={styles.statValue}>{room.level || floorLabel}</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="expand-outline" size={16} color={badgeBg} />
            <Text style={styles.statLabel}>Suprafață</Text>
            <Text style={styles.statValue}>
              {room.area_plan_m2 > 0 ? `${room.area_plan_m2} mp` : 'N/A'}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="pricetag-outline" size={16} color={badgeBg} />
            <Text style={styles.statLabel}>Destinație</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {isEntrance ? 'Intrare Facultate' : room.type}
            </Text>
          </View>
        </View>

        {/* Butoane de Navigare: Punct de Plecare + Destinație */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.startBtn]}
            activeOpacity={0.8}
            onPress={() => onSetStartPoint && onSetStartPoint(room)}
          >
            <Ionicons
              name="flag-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              Plecare
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.destBtn,
              isNavigating && { backgroundColor: '#ef4444' },
            ]}
            activeOpacity={0.8}
            onPress={() => onNavigateHere && onNavigateHere(room)}
          >
            <Ionicons
              name={isNavigating ? 'stop-circle-outline' : 'navigate-outline'}
              size={18}
              color="#ffffff"
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>
              {isNavigating ? 'Oprește' : 'Navighează Aici'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    codeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginRight: 12,
    },
    codeBadgeText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
    titleContainer: {
      flex: 1,
    },
    roomName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    roomSub: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    closeBtn: {
      padding: 4,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 2,
    },
    statValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    actionBtn: {
      flexDirection: 'row',
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startBtn: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    destBtn: {
      flex: 1.4,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default RoomDetailsSheet;
