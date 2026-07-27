import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../../Auth/AuthContext';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import EmptyState from '../../../../components/EmptyState';

const ROLE_CHIPS = [
  { key: 'user', label: 'Voluntari', color: '#3498db', icon: 'person-outline' },
  { key: 'coordonator', label: 'Coordonatori', color: '#f39c12', icon: 'people-circle-outline' },
  { key: 'admin', label: 'Admini', color: '#e74c3c', icon: 'shield-outline' },
];

export default function UserListScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: loggedInAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-select roles array: [] means NO filter active (show ALL)
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'hours_desc', 'hours_asc'

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Eroare la preluarea utilizatorilor:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUsers(); }, []));

  const toggleRoleFilter = (roleKey) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) ? prev.filter(r => r !== roleKey) : [...prev, roleKey]
    );
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = users;

    // 1. Filtrare după căutare
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(user =>
        (user.first_name?.toLowerCase().includes(query) ||
         user.last_name?.toLowerCase().includes(query) ||
         user.display_name?.toLowerCase().includes(query) ||
         user.email?.toLowerCase().includes(query))
      );
    }

    // 2. Filtrare după roluri (multi-select chip: dacă [] -> arată toți)
    if (selectedRoles.length > 0) {
      result = result.filter(user => selectedRoles.includes(user.role));
    }

    // 3. Sortare
    return [...result].sort((a, b) => {
      if (sortBy === 'hours_desc') {
        return (parseFloat(b.total_hours) || 0) - (parseFloat(a.total_hours) || 0);
      }
      if (sortBy === 'hours_asc') {
        return (parseFloat(a.total_hours) || 0) - (parseFloat(b.total_hours) || 0);
      }
      const nameA = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase();
      const nameB = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, searchQuery, selectedRoles, sortBy]);

  const getSortIconAndLabel = () => {
    switch (sortBy) {
      case 'hours_desc':
        return { icon: 'trending-down-outline', label: 'Ore: Max → Min' };
      case 'hours_asc':
        return { icon: 'trending-up-outline', label: 'Ore: Min → Max' };
      default:
        return { icon: 'swap-vertical-outline', label: 'Nume: A-Z' };
    }
  };

  const cycleSort = () => {
    if (sortBy === 'name') setSortBy('hours_desc');
    else if (sortBy === 'hours_desc') setSortBy('hours_asc');
    else setSortBy('name');
  };

  const styles = createStyles(colors, isDark);

  const renderHeader = () => (
    <View style={styles.headerBox}>
      {/* Search Input & Sort Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Caută utilizator..."
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

        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={cycleSort}
          activeOpacity={0.7}
        >
          <Ionicons name={getSortIconAndLabel().icon} size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Multi-Select Role Chips */}
      <View style={styles.chipRow}>
        {ROLE_CHIPS.map(r => {
          const isSelected = selectedRoles.includes(r.key);
          return (
            <TouchableOpacity
              key={r.key}
              activeOpacity={0.7}
              onPress={() => toggleRoleFilter(r.key)}
              style={[
                styles.chip,
                isSelected 
                  ? { backgroundColor: r.color + '20', borderColor: r.color }
                  : { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Ionicons 
                name={isSelected ? r.icon.replace('-outline', '') : r.icon} 
                size={14} 
                color={isSelected ? r.color : colors.textSecondary} 
              />
              <Text style={[
                styles.chipText,
                { color: isSelected ? r.color : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }
              ]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderUserItem = ({ item }) => {
    const isSelf = item.id === loggedInAdmin.userId;
    const roleColor = item.role === 'admin' ? '#e74c3c' : item.role === 'coordonator' ? '#f39c12' : '#3498db';

    const displayName = item.display_name ? item.display_name.trim() : '';
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    const hasBoth = displayName && fullName && (displayName.toLowerCase() !== fullName.toLowerCase());

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate('UserDetails', {
          userId: item.id,
          userName: item.first_name || item.email,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {displayName || fullName || item.email}
            </Text>
            {item.student_verification_status === 'verified' && (
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={colors.primary} 
                style={styles.verifiedIcon} 
              />
            )}
          </View>

          {hasBoth && (
            <Text style={styles.userFullName}>
              {fullName}
            </Text>
          )}

          <Text style={styles.userEmail}>{item.email}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={[styles.roleTag, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.roleTagText, { color: roleColor }]}>
                {item.role.toUpperCase()} {isSelf ? '(TU)' : ''}
              </Text>
            </View>

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
          </View>
        </View>

        <View style={styles.rightContainer}>
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursValue}>{item.total_hours}</Text>
            <Text style={styles.hoursLabel}>ore</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 5 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      {renderHeader()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredAndSortedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              illustration="no_users"
              title="Niciun utilizator găsit"
              subtitle="Încearcă să schimbi termenul de căutare sau filtrele."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  headerBox: { padding: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchInputWrapper: {
    flex: 1,
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
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  listContent: { padding: 12, paddingBottom: 110 },
  userItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 4,
  },
  infoContainer: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  verifiedIcon: { marginLeft: 6 },
  userFullName: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  userEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  roleTagText: { fontSize: 9, fontWeight: 'bold' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  hoursContainer: { alignItems: 'flex-end' },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  hoursLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
});