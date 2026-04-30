import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ContributionRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useThemeColor();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/contributions/pending');
      setRequests(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Eroare la încărcarea cererilor.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRequests(); }, []));

  const handleAction = (id, action) => {
    Alert.alert(
      action === 'approve' ? 'Aprobare' : 'Respingere',
      `Sigur dorești să ${action === 'approve' ? 'aprobi' : 'respingi'} această contribuție?`,
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Da', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/admin/contributions/${id}/${action}`);
              Toast.show({ type: 'success', text1: `Contribuție ${action === 'approve' ? 'aprobată' : 'respinsă'}.` });
              fetchRequests();
            } catch (error) {
              Alert.alert('Eroare', 'Acțiunea a eșuat.');
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString('ro-RO')}</Text>
        </View>
        <View style={styles.hoursBadge}>
          <Text style={styles.hoursText}>+{item.awarded_hours}h</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.metaRow}>
        <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.metaText}>
          Către: <Text style={styles.bold}>{item.target_first} {item.target_last}</Text>
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.metaText}>
          Cerut de: {item.coord_first} {item.coord_last}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleAction(item.id, 'reject')}
        >
          <Ionicons name="close-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Respinge</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleAction(item.id, 'approve')}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Aprobă</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Nu există cereri în așteptare.</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hoursBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hoursText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
  },
  approveButton: {
    backgroundColor: '#10b981', // green
  },
  rejectButton: {
    backgroundColor: '#ef4444', // red
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
