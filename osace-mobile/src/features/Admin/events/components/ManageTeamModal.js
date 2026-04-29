import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function ManageTeamModal({ isVisible, onClose, eventId, eventTitle }) {
  const [team, setTeam] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const { colors, isDark } = useThemeColor();

  useEffect(() => {
    if (isVisible && eventId) {
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

  const styles = createStyles(colors, isDark);

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
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
              <Text style={styles.sectionTitle}>Membri actuali ({team.length})</Text>
              <FlatList
                data={team}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMember(item.id)} style={styles.removeBtn}>
                      <Ionicons name="person-remove" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Doar creatorul are acces momentan.</Text>}
                style={{ maxHeight: '40%' }}
                contentContainerStyle={{ paddingBottom: 10 }}
              />

              <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Adaugă Coordonatori</Text>
              <FlatList
                data={availableUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{item.full_name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleAddMember(item.id)} style={styles.addBtn}>
                      <Ionicons name="person-add" size={20} color="#27ae60" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Toți coordonatorii sunt deja în echipă!</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 24, height: '85%', borderWidth: isDark ? 1 : 0, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2, maxWidth: 250 },
  closeBtn: { padding: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  userName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  removeBtn: { padding: 10, backgroundColor: isDark ? 'rgba(231, 76, 60, 0.15)' : '#fdf2f1', borderRadius: 10 },
  addBtn: { padding: 10, backgroundColor: isDark ? 'rgba(39, 174, 96, 0.15)' : '#e9f7ef', borderRadius: 10 },
  emptyText: { fontStyle: 'italic', color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
});
