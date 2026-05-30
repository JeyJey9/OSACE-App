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
  BADGE_AWARD_MANUAL:             { label: 'Acordare Badge',       color: '#e67e22', icon: 'medal-outline' },
  BADGE_REVOKE_MANUAL:            { label: 'Revocare Badge',       color: '#c0392b', icon: 'medal-outline' },
};

const getActionMeta = (action) =>
  ACTION_META[action] || { label: action, color: '#95a5a6', icon: 'ellipse-outline' };

const getHumanReadableTarget = (item) => {
  const d = item.details || {};
  const userNameStr = item.resolved_target_name ? `(${item.resolved_target_name})` : '';
  
  switch (item.action) {
    case 'CONTRIBUTION_APPROVE':
    case 'CONTRIBUTION_REJECT':
      return d.title ? `Contribuția: "${d.title}" ${userNameStr}` : `Contribuție Specială ${userNameStr}`;
    case 'HOUR_REQUEST_ADMIN_APPROVE':
    case 'HOUR_REQUEST_COORDINATOR_APPROVE':
      return d.approved_hours ? `Cerere: ${d.approved_hours} ore ${userNameStr}` : `Cerere Ore ${userNameStr}`;
    case 'USER_ROLE_CHANGE':
      return d.target_name ? `${d.target_name} -> ${d.new_role}` : `Utilizator #${item.target_id} ${userNameStr}`;
    case 'USER_DELETE':
      return d.deleted_name ? `Cont șters: ${d.deleted_name}` : `Utilizator #${item.target_id} ${userNameStr}`;
    case 'NOTIFICATION_SEND':
      return d.title ? `Subiect: "${d.title}"` : 'Notificare Push';
    case 'EVENT_CREATE':
    case 'EVENT_UPDATE':
    case 'EVENT_DELETE':
      return d.event_title ? `Evenimentul: "${d.event_title}"` : `Eveniment #${item.target_id}`;
    case 'BADGE_AWARD_MANUAL':
    case 'BADGE_REVOKE_MANUAL':
      return `Badge ID #${d.badge_id || '?'} pt. ${item.resolved_target_name || 'Utilizator #' + item.target_id}`;
    default:
      if (item.target_type) {
        const type = item.target_type.replace(/_/g, ' ');
        return `${type.charAt(0).toUpperCase() + type.slice(1)} #${item.target_id} ${userNameStr}`;
      }
      return null;
  }
};

const formatDetails = (details) => {
  if (!details || Object.keys(details).length === 0) return null;
  
  const keyMap = {
    approved_hours: 'Ore aprobate',
    target_user_id: 'ID Utilizator',
    event_id: 'ID Eveniment',
    title: 'Titlu',
    awarded_hours: 'Ore acordate',
    new_role: 'Rol nou',
    target_name: 'Nume utilizator',
    deleted_email: 'Email',
    deleted_name: 'Nume',
    roles: 'Grupuri',
    recipient_count: 'Dispozitive',
    badge_id: 'ID Badge'
  };

  return Object.entries(details)
    .filter(([k, v]) => v !== null && v !== undefined && k !== 'title' && k !== 'target_name' && k !== 'deleted_name') // ascundem ce e deja in target
    .map(([k, v]) => {
      const niceKey = keyMap[k] || k.replace(/_/g, ' ');
      // Daca valoarea este un array (cum e la 'roles') il facem string
      const niceValue = Array.isArray(v) ? v.join(', ') : v;
      return `${niceKey}: ${niceValue}`;
    })
    .join(' · ');
};

// ─── Component ──────────────────────────────────────────────────────────────

const LOG_CATEGORIES = [
  { id: 'all', label: 'Toate Acțiunile', actions: null },
  { id: 'events', label: 'Evenimente', actions: 'EVENT_CREATE,EVENT_UPDATE,EVENT_DELETE' },
  { id: 'hours', label: 'Cereri Ore', actions: 'HOUR_REQUEST_COORDINATOR_APPROVE,HOUR_REQUEST_ADMIN_APPROVE,HOUR_REQUEST_REJECT' },
  { id: 'contributions', label: 'Contribuții', actions: 'CONTRIBUTION_APPROVE,CONTRIBUTION_REJECT' },
  { id: 'users', label: 'Utilizatori', actions: 'USER_ROLE_CHANGE,USER_DELETE' },
  { id: 'badges', label: 'Badge-uri', actions: 'BADGE_AWARD_MANUAL,BADGE_REVOKE_MANUAL' },
  { id: 'posts', label: 'Postări', actions: 'POST_CREATE,POST_DELETE' },
  { id: 'notifications', label: 'Notificări', actions: 'NOTIFICATION_SEND' }
];

export default function AuditLogScreen() {
  const { colors, isDark } = useThemeColor();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedCategory, setSelectedCategory] = useState(LOG_CATEGORIES[0]);

  const fetchLogs = useCallback(async (pageNum = 1, append = false, category = selectedCategory) => {
    try {
      let url = `/api/admin/audit-logs?page=${pageNum}`;
      if (category && category.actions) {
        url += `&action=${category.actions}`;
      }

      const res = await api.get(url);
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
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLogs(1, false, selectedCategory);
    }, [fetchLogs, selectedCategory])
  );

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchLogs(page + 1, true, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    if (selectedCategory.id === category.id) return;
    setSelectedCategory(category);
    setLoading(true);
    // fetchLogs will be called by the effect dependency change
  };

  const styles = createStyles(colors, isDark);

  const renderItem = ({ item }) => {
    const meta = getActionMeta(item.action);
    const details = formatDetails(item.details);
    const timeAgo = formatDistanceToNowStrict(new Date(item.created_at.replace(' ', 'T')), { addSuffix: true, locale: ro });
    const friendlyTarget = getHumanReadableTarget(item);

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
          {friendlyTarget && (
            <Text style={styles.targetText}>
              <Ionicons name="arrow-forward-outline" size={12} color={colors.textSecondary} /> {friendlyTarget}
            </Text>
          )}

          {/* Details */}
          {details && details.length > 0 && <Text style={styles.detailsText}>{details}</Text>}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={LOG_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCategory.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => handleCategorySelect(item)}
              >
                <Text style={[styles.filterChipText, isSelected && { color: '#fff', fontWeight: 'bold' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        />
      </View>

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
  filterContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F3F4',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E8E8',
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
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
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 0,
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
