import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../../Auth/AuthContext';
import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import EmptyState from '../../../../components/EmptyState';

export default function UserListScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: loggedInAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
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

  const filteredAndSortedUsers = useMemo(() => {
    let result = users;

    // 1. Filtrare după căutare
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        (user.first_name?.toLowerCase().includes(query) ||
         user.last_name?.toLowerCase().includes(query) ||
         user.display_name?.toLowerCase().includes(query) ||
         user.email?.toLowerCase().includes(query))
      );
    }

    // 2. Filtrare după rol
    if (selectedRole !== 'all') {
      result = result.filter(user => user.role === selectedRole);
    }

    // 3. Sortare
    return [...result].sort((a, b) => {
      if (sortBy === 'hours_desc') {
        return b.total_hours - a.total_hours;
      }
      if (sortBy === 'hours_asc') {
        return a.total_hours - b.total_hours;
      }
      // Implicit: A-Z după nume complet
      const nameA = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase();
      const nameB = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, searchQuery, selectedRole, sortBy]);

  const roles = [
    { key: 'all', label: 'Toți' },
    { key: 'user', label: 'Voluntari' },
    { key: 'coordonator', label: 'Coordonatori' },
    { key: 'admin', label: 'Admini' },
  ];

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

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {roles.map(r => {
        const isActive = selectedRole === r.key;
        return (
          <TouchableOpacity
            key={r.key}
            activeOpacity={0.7}
            onPress={() => setSelectedRole(r.key)}
            style={[
              styles.filterTab,
              isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
          >
            <Text style={[styles.filterTabText, isActive && { color: '#ffffff', fontWeight: 'bold' }]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderUserItem = ({ item }) => {
    const isSelf = item.id === loggedInAdmin.userId;
    const roleColor = item.role === 'admin' ? '#e74c3c' : item.role === 'coordonator' ? '#f39c12' : colors.primary;

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
          <View style={[styles.roleTag, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleTagText, { color: roleColor }]}>
              {item.role} {isSelf ? '(Tu)' : ''}
            </Text>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută (nume, poreclă, email)..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          keyboardAppearance={isDark ? 'dark' : 'light'}
        />
      </View>

      {renderFilterTabs()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredAndSortedUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => {
            const { icon, label } = getSortIconAndLabel();
            return (
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeader}>Utilizatori ({filteredAndSortedUsers.length})</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={cycleSort}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.sortButtonText}>{label}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <EmptyState
              illustration="no_users"
              title={searchQuery.length > 0 || selectedRole !== 'all' ? 'Niciun rezultat' : 'Niciun utilizator'}
              subtitle={searchQuery.length > 0 || selectedRole !== 'all' ? 'Nu am găsit utilizatori cu criteriile selectate.' : 'Nu există utilizatori înregistraţi.'}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.card, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: colors.border, 
    marginHorizontal: 20, 
    marginTop: 15, 
    marginBottom: 5, 
    paddingHorizontal: 10 
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.textPrimary },
  
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterTabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  listHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.textPrimary 
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#eaf4fc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  listContent: { paddingBottom: 110, paddingTop: 5 },
  userItem: { 
    backgroundColor: colors.card, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderRadius: 12, 
    padding: 15, 
    marginHorizontal: 20, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    borderWidth: isDark ? 1 : 0, 
    borderColor: colors.border 
  },
  infoContainer: { flex: 1, paddingRight: 10 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  verifiedIcon: {
    marginLeft: 6,
    alignSelf: 'center',
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  userFullName: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, fontWeight: '500' },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  hoursContainer: { alignItems: 'center', minWidth: 40 },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
  hoursLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
});