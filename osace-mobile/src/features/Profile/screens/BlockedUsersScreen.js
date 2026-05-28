import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import EmptyState from '../../../components/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function BlockedUsersScreen() {
  const { colors, isDark } = useThemeColor();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchBlocked = async () => {
    try {
      const response = await api.get('/api/posts/blocked-users');
      setBlockedUsers(response.data);
    } catch {
      Alert.alert('Eroare', 'Nu s-a putut încărca lista de utilizatori blocați.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchBlocked();
  }, []));

  const handleUnblock = (user) => {
    Alert.alert(
      'Deblochează Utilizator',
      `Ești sigur că vrei să deblochezi pe ${user.display_name}?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Deblochează', onPress: async () => {
            setUnblockingId(user.user_id);
            try {
              await api.delete(`/api/posts/users/${user.user_id}/block`);
              setBlockedUsers(prev => prev.filter(u => u.user_id !== user.user_id));
            } catch {
              Alert.alert('Eroare', 'Nu s-a putut debloca utilizatorul.');
            } finally {
              setUnblockingId(null);
            }
          }
        },
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  const BlockedUserItem = ({ item }) => {
    const isUnblocking = unblockingId === item.user_id;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          {item.avatar_url ? (
            <Image
              source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{item.display_name}</Text>
            <Text style={styles.blockedDate}>
              Blocat {formatDistanceToNow(new Date(item.blocked_at), { addSuffix: true, locale: ro })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unblockBtn}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.unblockBtnText}>Deblochează</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={blockedUsers}
        renderItem={({ item }) => <BlockedUserItem item={item} />}
        keyExtractor={(item) => item.block_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            illustration="no_results"
            title="Niciun utilizator blocat"
            subtitle="Nu ai blocat niciun utilizator."
          />
        }
      />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDark ? colors.card : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  blockedDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unblockBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#eaf4fc',
    minWidth: 100,
    alignItems: 'center',
  },
  unblockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
