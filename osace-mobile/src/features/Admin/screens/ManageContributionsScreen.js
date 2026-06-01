import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ManageContributionsScreen() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, approved, pending, rejected

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

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

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/contributions/all');
      setContributions(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Eroare la încărcarea contribuțiilor.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchContributions(); }, []));

  const handleDelete = (id) => {
    Alert.alert(
      'Ștergere Contribuție',
      'Ești sigur că vrei să ștergi această contribuție? Orele vor fi retrase din totalul voluntarului.',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/admin/contributions/${id}`);
              Toast.show({ type: 'success', text1: 'Contribuția a fost ștearsă.' });
              fetchContributions();
            } catch (error) {
              Alert.alert('Eroare', 'Ștergerea a eșuat.');
            }
          }
        }
      ]
    );
  };

  const filteredData = useMemo(() => {
    let data = contributions;
    if (statusFilter !== 'all') {
      data = data.filter(c => c.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c => 
        c.title?.toLowerCase().includes(q) ||
        c.target_name?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [contributions, searchQuery, statusFilter]);

  const styles = createStyles(colors, isDark);

  const getStatusColor = (status) => {
    if (status === 'approved') return '#10b981';
    if (status === 'rejected') return '#ef4444';
    return '#f59e0b';
  };

  const getStatusText = (status) => {
    if (status === 'approved') return 'Aprobat';
    if (status === 'rejected') return 'Respins';
    return 'În așteptare';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('ro-RO')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.metaRow}>
        <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.metaText}>Voluntar: <Text style={styles.bold}>{item.target_name || `${item.target_first} ${item.target_last}`}</Text></Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.metaText}>Ore acordate: <Text style={styles.bold}>{item.awarded_hours}</Text></Text>
      </View>

      {item.event_title && (
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>Eveniment: <Text style={styles.bold}>{item.event_title}</Text></Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditContribution', { contribution: item })}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Editează</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Șterge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Caută după titlu sau voluntar..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {['all', 'approved', 'pending', 'rejected'].map(status => (
            <TouchableOpacity 
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status === 'all' ? 'Toate' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nu există contribuții care să corespundă criteriilor.</Text>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 16, paddingBottom: 8 },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyText: {
    marginTop: 40,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
