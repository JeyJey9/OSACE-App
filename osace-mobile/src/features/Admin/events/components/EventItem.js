import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PERMISSIONS } from '../../../../constants/permissions';

const EventItem = memo(({ item, can, navigation, openQrModal, openTeamModal, handleDelete, colors, isDark }) => {
  const eventEndTime = new Date(item.end_time.replace(' ', 'T'));
  const deadline = new Date(eventEndTime.getTime() + 48 * 60 * 60 * 1000);
  const isEventOver = new Date() > deadline;

  const canScanQR = can(PERMISSIONS.SCAN_QR, item);
  const canManageTeam = can(PERMISSIONS.MANAGE_TEAMS, item);
  const canManageParticipants = can(PERMISSIONS.MANAGE_PARTICIPANTS, item);
  const canEdit = can(PERMISSIONS.EDIT_EVENTS, item);
  const canDelete = can(PERMISSIONS.DELETE_EVENTS, item);

  const categoryColors = {
    sedinta: '#3498db',  // Blue
    social: '#27ae60',   // Green
    proiect: '#f39c12',  // Orange
    default: colors.primary,
  };
  const catColor = categoryColors[item.category] || categoryColors.default;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.eventItem}>
      {/* HEADER ROW */}
      <View style={styles.itemHeader}>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>#ID: {item.id}</Text>
          </View>
          <View style={[styles.categoryTag, { backgroundColor: catColor + '20' }]}>
            <Text style={[styles.categoryTagText, { color: catColor }]}>
              {(item.category || 'social').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* DATE TIMELINE */}
      <View style={styles.dateIntervalContainer}>
        <View style={styles.dateRow}>
          <View style={[styles.dateDot, { backgroundColor: '#2ecc71' }]} />
          <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1}>
            {new Date(item.start_time.replace(' ', 'T')).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateRow}>
          <View style={[styles.dateDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1}>
            {item.end_time ? new Date(item.end_time.replace(' ', 'T')).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* ROW 1: Operations (QR, Membri, Echipă) */}
      <View style={[styles.buttonRow, { marginBottom: 8 }]}>
        {canScanQR && (
          <TouchableOpacity
            style={[styles.button, styles.qrButton, isEventOver && styles.buttonDisabled]}
            onPress={() => openQrModal(item)}
            disabled={isEventOver}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={15} color="white" />
            <Text style={styles.buttonText}>{isEventOver ? 'Expirat' : 'QR'}</Text>
          </TouchableOpacity>
        )}

        {canManageParticipants && (
          <TouchableOpacity
            style={[styles.button, styles.participantsButton]}
            onPress={() => navigation.navigate('EventParticipants', { eventId: item.id, eventTitle: item.title })}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={15} color="white" />
            <Text style={styles.buttonText}>Membri</Text>
          </TouchableOpacity>
        )}

        {canManageTeam && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#f39c12' }]}
            onPress={() => openTeamModal(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="people-circle" size={15} color="white" />
            <Text style={styles.buttonText}>Echipă</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ROW 2: Management & Actions (Edit, Duplică, Șterge) */}
      <View style={styles.buttonRow}>
        {canEdit && (
          <TouchableOpacity 
            style={[styles.button, styles.editButton]} 
            onPress={() => navigation.navigate('EventForm', { eventToEdit: item })}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={15} color="white" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {(canEdit || canScanQR) && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#16a085' }]} 
            onPress={() => navigation.navigate('EventForm', { eventToDuplicate: item })}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={15} color="white" />
            <Text style={styles.buttonText}>Duplică</Text>
          </TouchableOpacity>
        )}

        {canDelete && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={15} color="white" />
            <Text style={styles.buttonText}>Șterge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const createStyles = (colors, isDark) => StyleSheet.create({
  eventItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: 8,
  },
  idBadge: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateIntervalContainer: {
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    marginLeft: 2,
  },
  dateDivider: {
    borderLeftWidth: 2,
    borderStyle: 'dotted',
    borderColor: colors.textSecondary,
    height: 12,
    marginLeft: 5,
    marginTop: 2,
    marginBottom: 2,
    opacity: 0.5,
  },
  eventDetails: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  qrButton: {
    backgroundColor: '#27ae60',
  },
  participantsButton: {
    backgroundColor: '#8e44ad',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
});

export default EventItem;
