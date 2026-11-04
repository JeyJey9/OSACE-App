import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  TextInput
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function ManageTeamModal({ isVisible, onClose, eventId, eventTitle }) {
  const [team, setTeam] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { colors, isDark } = useThemeColor();

  useEffect(() => {
    if (isVisible && eventId) {
      setSearchQuery('');
      fetchData();
    }
  }, [isVisible, eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamRes, usersRes] = await Promise.all([
        api.get(`api/events/${eventId}/team`),
        api.get(`api/events/available-coordinators`)
      ]);
      
      setTeam(teamRes.data);
      const teamIds = teamRes.data.map(member => member.id);
      setAvailableUsers(usersRes.data.filter(user => !teamIds.includes(user.id)));
    } catch (error) {
      console.error("Eroare la preluarea datelor pentru echipă:", error);
      Alert.alert("Eroare", "Nu am putut încărca datele echipei.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await api.post(`api/events/${eventId}/team`, { targetUserId: userId });
      fetchData();
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut adăuga membrul.");
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/api/events/${eventId}/team/${userId}`);
      fetchData();
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut șterge membrul.");
    }
  };

  const filteredAvailableUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const q = searchQuery.toLowerCase().trim();
    return availableUsers.filter(user => {
      const name = (user.full_name || `${user.first_name || ''} ${user.last_name || ''}`).toLowerCase();
      const disp = (user.display_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(q) || disp.includes(q) || email.includes(q);
    });
  }, [availableUsers, searchQuery]);

  const styles = createStyles(colors, isDark);

  const renderRoleBadge = (role) => {
    let label = 'Voluntar';
    let badgeBg = isDark ? 'rgba(52, 152, 219, 0.15)' : '#ebf5fb';
    let textColor = '#2980b9';

    if (role === 'admin') {
      label = 'Admin';
      badgeBg = isDark ? 'rgba(231, 76, 60, 0.15)' : '#fdf2f1';
      textColor = '#c0392b';
    } else if (role === 'coordonator') {
      label = 'Coordonator';
      badgeBg = isDark ? 'rgba(46, 204, 113, 0.15)' : '#eafaf1';
      textColor = '#27ae60';
    }

    return (
      <View style={[styles.roleBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.roleBadgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const getUserName = (item) => {
    const combined = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    return item.full_name?.trim() || combined || item.display_name || item.email;
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.title}>Echipa Evenimentului</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{eventTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ flex: 1 }}>
              {/* MEMBRI ACTUALE */}
              <Text style={styles.sectionTitle}>Membri actuali ({team.length})</Text>
              <FlatList
                data={team}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={styles.userName}>{getUserName(item)}</Text>
                        {renderRoleBadge(item.role)}
                      </View>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMember(item.id)} style={styles.removeBtn}>
                      <Ionicons name="person-remove" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Doar creatorul are acces momentan.</Text>}
                style={{ maxHeight: '35%' }}
                contentContainerStyle={{ paddingBottom: 10 }}
              />

              {/* ADAUGARE MEMBRI NOI */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Adaugă Membri în Echipă</Text>
              
              {/* SEARCH BAR PENTRU MEMBRI */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Caută voluntar sau membru..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredAvailableUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={styles.userName}>{getUserName(item)}</Text>
                        {renderRoleBadge(item.role)}
                      </View>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAddMember(item.id)} style={styles.addBtn}>
                      <Ionicons name="person-add" size={18} color="#27ae60" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {searchQuery ? "Niciun membru găsit pentru căutare." : "Toate persoanele sunt deja în echipă!"}
                  </Text>
                }
                contentContainerStyle={{ paddingBottom: 25 }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: colors.card, 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 20, 
    height: '88%', 
    borderWidth: isDark ? 1 : 0, 
    borderColor: colors.border 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.textPrimary 
  },
  subtitle: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    marginTop: 2 
  },
  closeBtn: { 
    padding: 4 
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: colors.primary, 
    marginBottom: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border, 
    paddingBottom: 6 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  userRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  userName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: colors.textPrimary 
  },
  userEmail: { 
    fontSize: 12, 
    color: colors.textSecondary, 
    marginTop: 2 
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: { 
    padding: 8, 
    backgroundColor: isDark ? 'rgba(231, 76, 60, 0.15)' : '#fdf2f1', 
    borderRadius: 8 
  },
  addBtn: { 
    padding: 8, 
    backgroundColor: isDark ? 'rgba(39, 174, 96, 0.15)' : '#e9f7ef', 
    borderRadius: 8 
  },
  emptyText: { 
    fontStyle: 'italic', 
    color: colors.textSecondary, 
    marginTop: 10, 
    textAlign: 'center',
    fontSize: 13,
  },
});
