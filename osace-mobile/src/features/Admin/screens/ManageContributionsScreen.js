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
import EmptyState from '../../../components/EmptyState';

const STATUS_CHIPS = [
  { key: 'pending', label: 'În așteptare', color: '#f59e0b', icon: 'time-outline' },
  { key: 'approved', label: 'Aprobate', color: '#10b981', icon: 'checkmark-circle-outline' },
  { key: 'rejected', label: 'Respinse', color: '#ef4444', icon: 'close-circle-outline' },
];

export default function ManageContributionsScreen() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-select status array: [] means NO filter active (show ALL)
  const [selectedStatuses, setSelectedStatuses] = useState([]);

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

  const toggleStatusFilter = (statusKey) => {
    setSelectedStatuses(prev => 
      prev.includes(statusKey) ? prev.filter(s => s !== statusKey) : [...prev, statusKey]
    );
  };

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

    // Multi-select status filter: dacă [] -> arată toți
    if (selectedStatuses.length > 0) {
      data = data.filter(c => selectedStatuses.includes(c.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data.filter(c => 
        c.title?.toLowerCase().includes(q) ||
        c.target_name?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [contributions, searchQuery, selectedStatuses]);

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
        <View style={styles.topContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Caută după titlu sau voluntar..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Multi-Select Status Chips */}
          <View style={styles.chipRow}>
            {STATUS_CHIPS.map(st => {
              const isSelected = selectedStatuses.includes(st.key);
              return (
                <TouchableOpacity
                  key={st.key}
                  activeOpacity={0.7}
                  onPress={() => toggleStatusFilter(st.key)}
                  style={[
                    styles.chip,
                    isSelected 
                      ? { backgroundColor: st.color + '20', borderColor: st.color }
                      : { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                >
                  <Ionicons 
                    name={isSelected ? st.icon.replace('-outline', '') : st.icon} 
                    size={14} 
                    color={isSelected ? st.color : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? st.color : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }
                  ]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              <EmptyState
                illustration="no_contributions"
                title="Nicio contribuție găsită"
                subtitle="Nu există contribuții care să corespundă căutării sau filtrelor."
              />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1 },
  topContainer: { padding: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 1.5 
  },
  chipText: { fontSize: 12 },
  listContent: {
    padding: 12,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
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
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
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
    marginTop: 10,
    paddingTop: 10,
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
    fontSize: 13,
  },
});
