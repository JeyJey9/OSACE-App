import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Switch, 
  Alert,
  ScrollView 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import { useThemeColor } from '../../../../constants/useThemeColor';

const AVAILABLE_PERMISSIONS = [
  { key: 'CAN_CREATE_EVENTS', label: 'Creare Evenimente', description: 'Permite crearea de evenimente noi în sistem.' },
  { key: 'CAN_EDIT_EVENTS', label: 'Editare Evenimente', description: 'Poate modifica detaliile oricărui eveniment.' },
  { key: 'CAN_DELETE_EVENTS', label: 'Ștergere Evenimente', description: 'PERICOL: Poate șterge definitiv orice eveniment.' },
  { key: 'CAN_SCAN_QR_ANYWHERE', label: 'Scanare QR Globală', description: 'Acces la QR la toate evenimentele.' },
  { key: 'CAN_MANAGE_PARTICIPANTS', label: 'Gestiune Participanți', description: 'Poate adăuga/elimina manual oameni din liste.' },
  { key: 'CAN_MANAGE_EVENT_TEAMS', label: 'Gestiune Echipe', description: 'Poate desemna alți coordonatori.' },
];

export default function UserPermissionsModal({ isVisible, onClose, userId, userName }) {
  const [activePermissions, setActivePermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { colors, isDark } = useThemeColor();

  useEffect(() => {
    if (isVisible && userId) {
      fetchPermissions();
    }
  }, [isVisible, userId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/users/${userId}/permissions`);
      setActivePermissions(response.data); 
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca permisiunile.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (permissionKey, currentValue) => {
    const newValue = !currentValue;
    setActivePermissions(prev => 
      newValue ? [...prev, permissionKey] : prev.filter(p => p !== permissionKey)
    );

    try {
      await api.post(`/api/admin/users/${userId}/permissions/toggle`, {
        permissionKey: permissionKey,
        isGranted: newValue,
      });
    } catch (error) {
      Alert.alert("Eroare", "Nu s-a putut salva permisiunea.");
      fetchPermissions(); 
    }
  };

  const styles = createStyles(colors, isDark);

  return (
    <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Permisiuni Speciale</Text>
              <Text style={styles.subtitle}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.permissionsList}>
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isGranted = activePermissions.includes(perm.key);
                return (
                  <View key={perm.key} style={styles.permissionRow}>
                    <View style={styles.permissionInfo}>
                      <Text style={styles.permissionLabel}>{perm.label}</Text>
                      <Text style={styles.permissionDesc}>{perm.description}</Text>
                    </View>
                    <Switch
                      trackColor={{ false: isDark ? "#333" : "#d3d3d3", true: colors.primary }}
                      thumbColor={"#f4f3f4"}
                      ios_backgroundColor={isDark ? "#333" : "#d3d3d3"}
                      onValueChange={() => togglePermission(perm.key, isGranted)}
                      value={isGranted}
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.card, borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%', borderWidth: isDark ? 1 : 0, borderColor: colors.border, elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12, marginBottom: 5 },
  closeBtn: { padding: 2 },
  permissionsList: { marginTop: 10 },
  permissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  permissionInfo: { flex: 1, paddingRight: 15 },
  permissionLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  permissionDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
});
