import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDistanceToNowStrict } from 'date-fns';
import { ro } from 'date-fns/locale';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import CustomHeader from '../../../components/layout/CustomHeader';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ACTION_META = {
  EVENT_CREATE:                   { label: 'Creare Eveniment',     color: '#27ae60', icon: 'calendar-outline' },
  EVENT_UPDATE:                   { label: 'Editare Eveniment',    color: '#f39c12', icon: 'create-outline' },
  EVENT_DELETE:                   { label: 'Ștergere Eveniment',   color: '#e74c3c', icon: 'trash-outline' },
  POST_CREATE:                    { label: 'Postare Nouă',         color: '#27ae60', icon: 'image-outline' },
  POST_DELETE:                    { label: 'Ștergere Postare',     color: '#e74c3c', icon: 'trash-outline' },
  HOUR_REQUEST_COORDINATOR_APPROVE:{ label: 'Aprobare Ore (Coord)', color: '#f39c12', icon: 'checkmark-circle-outline' },
  HOUR_REQUEST_ADMIN_APPROVE:     { label: 'Aprobare Ore (Admin)', color: '#27ae60', icon: 'checkmark-done-circle-outline' },
  HOUR_REQUEST_REJECT:            { label: 'Respingere Ore',       color: '#e74c3c', icon: 'close-circle-outline' },
  CONTRIBUTION_APPROVE:           { label: 'Aprobare Contribuție', color: '#27ae60', icon: 'ribbon-outline' },
  CONTRIBUTION_REJECT:            { label: 'Respingere Contribuție', color: '#e74c3c', icon: 'ribbon-outline' },
  NOTIFICATION_SEND:              { label: 'Notificare Trimisă',   color: '#3498db', icon: 'notifications-outline' },
  USER_ROLE_CHANGE:               { label: 'Schimbare Rol',        color: '#9b59b6', icon: 'shield-outline' },
  USER_DELETE:                    { label: 'Ștergere Utilizator',  color: '#e74c3c', icon: 'person-remove-outline' },
};

const getActionMeta = (action) =>
  ACTION_META[action] || { label: action, color: '#95a5a6', icon: 'ellipse-outline' };

const formatDetails = (details) => {
  if (!details || Object.keys(details).length === 0) return null;
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join(' · ');
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AuditLogScreen() {
  const { colors, isDark } = useThemeColor();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await api.get(`/api/admin/audit-logs?page=${pageNum}`);
      const { logs: newLogs, totalPages: tp } = res.data;
      setLogs((prev) => append ? [...prev, ...newLogs] : newLogs);
      setTotalPages(tp);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Eroare', 'Nu s-au putut încărca jurnalele.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLogs(1);
    }, [fetchLogs])
  );

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchLogs(page + 1, true);
  };

  const styles = createStyles(colors, isDark);

  const renderItem = ({ item }) => {
    const meta = getActionMeta(item.action);
    const details = formatDetails(item.details);
    const timeAgo = formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true, locale: ro });

    return (
      <View style={styles.logCard}>
        {/* Left color bar */}
        <View style={[styles.colorBar, { backgroundColor: meta.color }]} />

        <View style={styles.logBody}>
          {/* Action badge */}
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
              <Ionicons name={meta.icon} size={14} color={meta.color} style={{ marginRight: 5 }} />
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>

          {/* Actor */}
          <Text style={styles.actorText}>
            <Text style={styles.actorName}>{item.actor_name || 'Unknown'}</Text>
            <Text style={styles.actorRole}> ({item.actor_role})</Text>
          </Text>

          {/* Target */}
          {item.target_type && (
            <Text style={styles.targetText}>
              Target: <Text style={styles.targetValue}>{item.target_type} #{item.target_id}</Text>
            </Text>
          )}

          {/* Details */}
          {details && <Text style={styles.detailsText}>{details}</Text>}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <CustomHeader />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> : null}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nu există înregistrări în jurnal.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors, isDark) => StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 120,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'transparent',
  },
  colorBar: {
    width: 5,
  },
  logBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actorText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  actorName: {
    fontWeight: '700',
  },
  actorRole: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  targetText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  targetValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 60,
    fontSize: 15,
  },
});
