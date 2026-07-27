import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PERMISSIONS } from '../../../../constants/permissions';

const EventItem = memo(({ item, can, navigation, openQrModal, openTeamModal, handleDelete, colors, styles, isDark }) => {
  const eventEndTime = new Date(item.end_time.replace(' ', 'T'));
  const deadline = new Date(eventEndTime.getTime() + 48 * 60 * 60 * 1000);
  const isEventOver = new Date() > deadline;

  const canScanQR = can(PERMISSIONS.SCAN_QR, item);
  const canManageTeam = can(PERMISSIONS.MANAGE_TEAMS, item);
  const canManageParticipants = can(PERMISSIONS.MANAGE_PARTICIPANTS, item);
  const canEdit = can(PERMISSIONS.EDIT_EVENTS, item);
  const canDelete = can(PERMISSIONS.DELETE_EVENTS, item);

  return (
    <View style={styles.eventItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>
              #ID: {item.id}
            </Text>
          </View>
          <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.categoryTagText, { color: colors.primary }]}>
              {(item.category || 'social').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.dateIntervalContainer}>
        <View style={styles.dateRow}>
          <View style={[styles.dateDot, { backgroundColor: '#2ecc71' }]} />
          <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>
            {new Date(item.start_time.replace(' ', 'T')).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateRow}>
          <View style={[styles.dateDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={[styles.eventDetails, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>
            {item.end_time ? new Date(item.end_time.replace(' ', 'T')).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        {canScanQR && (
          <TouchableOpacity
            style={[styles.button, styles.qrButton, isEventOver && styles.buttonDisabled]}
            onPress={() => openQrModal(item)}
            disabled={isEventOver}
          >
            <Ionicons name="qr-code" size={16} color="white" />
            <Text style={styles.buttonText}>{isEventOver ? 'Expirat' : 'QR'}</Text>
          </TouchableOpacity>
        )}

        {canManageTeam && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#f39c12' }]}
            onPress={() => openTeamModal(item)}
          >
            <Ionicons name="people-circle" size={16} color="white" />
            <Text style={styles.buttonText}>Echipă</Text>
          </TouchableOpacity>
        )}

        {canManageParticipants && (
          <TouchableOpacity
            style={[styles.button, styles.participantsButton]}
            onPress={() => navigation.navigate('EventParticipants', { eventId: item.id, eventTitle: item.title })}
          >
            <Ionicons name="people" size={16} color="white" />
            <Text style={styles.buttonText}>Membri</Text>
          </TouchableOpacity>
        )}

        {canEdit && (
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => navigation.navigate('EventForm', { eventToEdit: item })}>
            <Ionicons name="pencil" size={16} color="white" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {canDelete && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton, { flex: 0.6 }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default EventItem;
