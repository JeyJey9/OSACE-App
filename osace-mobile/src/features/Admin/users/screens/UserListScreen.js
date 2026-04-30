import React, { useState, useCallback, useMemo } from 'react';
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

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

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

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
    (user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const styles = createStyles(colors, isDark);

  const renderUserItem = ({ item }) => {
    const isSelf = item.id === loggedInAdmin.userId;
    const roleColor = item.role === 'admin' ? '#e74c3c' : item.role === 'coordonator' ? '#f39c12' : colors.primary;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigation.navigate('UserDetails', {
          userId: item.id,
          userName: item.first_name || item.email,
        })}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>{item.last_name} {item.first_name}</Text>
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

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <Text style={styles.listHeader}>Lista Utilizatorilor ({filteredUsers.length})</Text>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              illustration="no_users"
              title={searchQuery.length > 0 ? 'Niciun rezultat' : 'Niciun utilizator'}
              subtitle={searchQuery.length > 0 ? `Nu am găsit utilizatori pentru "${searchQuery}".` : 'Nu există utilizatori înregistraţi.'}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginHorizontal: 20, marginTop: 15, marginBottom: 5, paddingHorizontal: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.textPrimary },
  listHeader: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 15, marginBottom: 10, color: colors.textPrimary },
  listContent: { paddingBottom: 110, paddingTop: 5 },
  userItem: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 15, marginHorizontal: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  infoContainer: { flex: 1, paddingRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 2 },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  hoursContainer: { alignItems: 'center', minWidth: 40 },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
  hoursLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
});