import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../../Auth/AuthContext';

import ScreenContainer from '../../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../../constants/useThemeColor';
import UserPermissionsModal from '../components/UserPermissionsModal';
import EmptyState from '../../../../components/EmptyState';

export default function UserListScreen() {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const { user: loggedInAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const openPermissions = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setPermModalVisible(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Eroare la preluarea utilizatorilor (Admin):", error);
      Alert.alert("Eroare Admin", "Nu s-a putut accesa lista de utilizatori.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteUser = (userId, userEmail) => {
    Alert.alert(
      "Confirmă Ștergerea",
      `Ești sigur că vrei să ștergi utilizatorul ${userEmail}?`,
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Șterge", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/admin/users/${userId}`); 
              Alert.alert("Succes", `Utilizatorul ${userEmail} a fost șters.`);
              fetchUsers(); 
            } catch (error) {
              Alert.alert("Eroare", "Ștergerea a eșuat.");
            }
          }
        },
      ]
    );
  };

  const updateRoleOnServer = async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { newRole });
      Alert.alert("Succes", "Rolul a fost actualizat.");
      setUsers(currentUsers =>
        currentUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error) {
      Alert.alert("Eroare", 'Actualizarea a eșuat.');
    }
  };

  const openRoleSelector = (user) => {
    Alert.alert(
      "Schimbă Rolul",
      `Selectează noul rol pentru ${user.first_name || user.email}`,
      [
        { text: "User (Voluntar)", onPress: () => updateRoleOnServer(user.id, 'user') },
        { text: "Coordonator", onPress: () => updateRoleOnServer(user.id, 'coordonator') },
        { text: "Admin", onPress: () => updateRoleOnServer(user.id, 'admin') },
        { text: "Anulează", style: "cancel" }
      ],
      { cancelable: true }
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

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

    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => navigation.navigate('UserDetails', { 
          userId: item.id, 
          userName: item.first_name || item.email,
        })}
      >
        <View style={styles.topRow}>
          <View style={styles.infoContainer}>
             <Text style={styles.userName}>{item.last_name} {item.first_name}</Text>
             <Text style={styles.userEmail}>@{item.display_name} • {item.email}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <View style={styles.hoursContainer}>
              <Text style={styles.hoursValue}>{item.total_hours}</Text>
              <Text style={styles.hoursLabel}>ore</Text>
            </View>
            {!isSelf && (
              <>
                <TouchableOpacity 
                  style={[styles.actionButton, { marginRight: 10 }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    openPermissions(item.id, item.first_name || item.email);
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={24} color="#f39c12" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(item.id, item.email);
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="#C0392B" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.roleSection}>
          {isSelf ? (
            <View style={[styles.roleTag, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.roleTagText}>{item.role} (Tu)</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.roleButton}
              onPress={(e) => {
                e.stopPropagation();
                openRoleSelector(item);
              }}
            >
              <Text style={styles.roleButtonText}>
                Rol curent: <Text style={{fontWeight: 'bold'}}>{item.role.toUpperCase()}</Text>
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
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

      <UserPermissionsModal
        isVisible={permModalVisible}
        onClose={() => setPermModalVisible(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginHorizontal: 20, marginTop: 15, marginBottom: 5, paddingHorizontal: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.textPrimary },
  listHeader: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 15, marginBottom: 10, color: colors.textPrimary },
  listContent: { paddingBottom: 110, paddingTop: 5 },
  userItem: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginHorizontal: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 5, borderLeftColor: colors.primary },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoContainer: { flex: 1, paddingRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginBottom: 5 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  hoursContainer: { marginRight: 15, alignItems: 'center', minWidth: 45 },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: '#27ae60' },
  hoursLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
  actionButton: { padding: 5 },
  roleSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  roleTag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  roleTagText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  roleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 15 },
  roleButtonText: { fontSize: 14, color: colors.textPrimary },
  emptyContainer: { padding: 20, alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
});
