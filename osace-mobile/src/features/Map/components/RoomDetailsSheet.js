import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
import { getRoomCategory } from '../data/buildingData';

const RoomDetailsSheet = ({
  room,
  onClose,
  onNavigateHere,
  onSetStartPoint,
  isNavigating = false,
}) => {
  const { colors, isDark } = useThemeColor();
  const bottomSheetRef = useRef(null);

  const snapPoints = useMemo(() => ['25%', '42%'], []);

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

  const categoryInfo = getRoomCategory(room);
  const styles = createStyles(colors, isDark);

  const isEntrance = room.type === 'entrance' || room.code === 'GD04';
  const badgeBg = categoryInfo.color || colors.primary;
  const badgeLabel = categoryInfo.badge;

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

        {/* Tag-uri Sală (Categorii, Servicii & Facilități) */}
        <View style={styles.tagsContainer}>
          {categoryInfo.tagsList.map((tagItem, idx) => (
            <View
              key={`tag-${idx}`}
              style={[
                styles.tagChip,
                tagItem.isPrimary && {
                  backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.1)',
                  borderColor: isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(14, 165, 233, 0.3)',
                },
              ]}
            >
              <Ionicons
                name={tagItem.icon}
                size={13}
                color={tagItem.isPrimary ? colors.primary : isDark ? '#94a3b8' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.tagChipText,
                  tagItem.isPrimary && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {tagItem.label}
              </Text>
            </View>
          ))}
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
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    codeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      marginRight: 12,
      minWidth: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeBadgeText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },
    titleContainer: {
      flex: 1,
    },
    roomName: {
      fontSize: 17,
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
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    },
    tagChipText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    actionBtn: {
      flexDirection: 'row',
      borderRadius: 14,
      paddingVertical: 12,
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
