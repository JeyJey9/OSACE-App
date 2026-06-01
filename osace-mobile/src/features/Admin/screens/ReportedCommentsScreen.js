import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import EmptyState from '../../../components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'În așteptare', color: '#f39c12', icon: 'time-outline' },
  reviewed: { label: 'Analizat', color: '#27ae60', icon: 'checkmark-circle-outline' },
  dismissed: { label: 'Respins', color: '#95a5a6', icon: 'close-circle-outline' },
};

export default function ReportedCommentsScreen() {
  const { colors, isDark } = useThemeColor();
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // report_id being acted on

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/posts/reports');
      setReports(response.data);
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-au putut încărca rapoartele.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchReports();
  }, []));

  const handleDeleteComment = (report) => {
    Alert.alert(
      'Șterge Comentariul',
      `Ești sigur că vrei să ștergi comentariul lui ${report.author_name}?\n\n"${report.comment_content}"`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge', style: 'destructive', onPress: async () => {
            setActionLoading(report.report_id);
            try {
              await api.delete(`/api/posts/comments/${report.comment_id}`);
              // Mark report as reviewed and remove the comment-related reports
              setReports(prev => prev.filter(r => r.comment_id !== report.comment_id));
              Alert.alert('Succes', 'Comentariul a fost șters.');
            } catch {
              Alert.alert('Eroare', 'Nu s-a putut șterge comentariul.');
            } finally {
              setActionLoading(null);
            }
          }
        },
      ]
    );
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionLoading(reportId);
    try {
      await api.patch(`/api/posts/reports/${reportId}`, { status: newStatus });
      setReports(prev =>
        prev.map(r => r.report_id === reportId ? { ...r, status: newStatus } : r)
      );
    } catch {
      Alert.alert('Eroare', 'Nu s-a putut actualiza raportul.');
    } finally {
      setActionLoading(null);
    }
  };

  const styles = createStyles(colors, isDark);

  const ReportCard = ({ item }) => {
    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isActing = actionLoading === item.report_id;

    return (
      <View style={styles.card}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConf.color + '18' }]}>
          <Ionicons name={statusConf.icon} size={14} color={statusConf.color} />
          <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
        </View>

        {/* Reported Comment Content */}
        <View style={styles.commentBox}>
          <Text style={styles.commentLabel}>Comentariu raportat:</Text>
          <Text style={styles.commentText}>"{item.comment_content}"</Text>
        </View>

        {/* Author info */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Autor:</Text>
          <Text style={styles.infoValue}>{item.author_name}</Text>
        </View>

        {/* Reporter info */}
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Raportat de:</Text>
          <Text style={styles.infoValue}>{item.reporter_name}</Text>
        </View>

        {/* Date */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Data:</Text>
          <Text style={styles.infoValue}>
            {formatDistanceToNow(new Date(item.reported_at.replace(' ', 'T')), { addSuffix: true, locale: ro })}
          </Text>
        </View>

        {/* Actions — only for pending reports */}
        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            {isActing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDeleteComment(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnTextLight}>Șterge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.dismissBtn]}
                  onPress={() => handleUpdateStatus(item.report_id, 'dismissed')}
                >
                  <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.actionBtnTextDark}>Respinge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.reviewBtn]}
                  onPress={() => handleUpdateStatus(item.report_id, 'reviewed')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#27ae60" />
                  <Text style={[styles.actionBtnTextDark, { color: '#27ae60' }]}>Analizat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={({ item }) => <ReportCard item={item} />}
        keyExtractor={(item) => item.report_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            illustration="no_results"
            title="Niciun raport"
            subtitle="Nu există comentarii raportate momentan."
          />
        }
      />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentBox: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  commentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f5',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 5,
  },
  deleteBtn: {
    backgroundColor: '#E74C3C',
  },
  dismissBtn: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f5',
  },
  reviewBtn: {
    backgroundColor: isDark ? 'rgba(39,174,96,0.1)' : '#e8f8f0',
  },
  actionBtnTextLight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnTextDark: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
