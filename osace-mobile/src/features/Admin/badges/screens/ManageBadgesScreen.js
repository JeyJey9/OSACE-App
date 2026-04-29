import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import ScreenContainer from '../../../../components/layout/ScreenContainer'; 
import { useThemeColor } from '../../../../constants/useThemeColor';
import EmptyState from '../../../../components/EmptyState';

export default function ManageBadgesScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/badges'); 
      setBadges(response.data);
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut încărca lista de badge-uri.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBadges();
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('BadgeForm', { onGoBack: fetchBadges })}>
          <Ionicons name="add" size={28} color={colors.primary} style={{ marginRight: 15 }} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.primary]);

  const styles = createStyles(colors, isDark);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Ionicons name={item.icon_name} size={28} color={colors.primary} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name} <Text style={styles.keyText}>({item.key})</Text></Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('BadgeForm', { badge: item, onGoBack: fetchBadges })}>
          <Ionicons name="pencil" size={22} color="#E67E22" style={styles.actionIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* Logică ștergere */}}>
          <Ionicons name="trash" size={22} color="#C0392B" style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <EmptyState
            illustration="no_badges"
            title="Niciun badge creat"
            subtitle="Creează primul badge folosind butonul + din colţul dreapta-sus."
          />
          }
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { padding: 15, paddingBottom: 30 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.card, borderRadius: 12, marginBottom: 10, borderWidth: isDark ? 1 : 0, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
  keyText: { fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginLeft: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: colors.textSecondary, fontSize: 16 },
});
