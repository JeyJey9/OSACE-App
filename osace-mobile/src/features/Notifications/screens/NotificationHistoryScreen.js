import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';

// ▼▼▼ NOU: Importuri pentru Temă și Layout ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import EmptyState from '../../../components/EmptyState';

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Acum';
  if (diffMins < 60) return `Acum ${diffMins} min`;
  if (diffHours < 24) return `Acum ${diffHours}h`;
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `Acum ${diffDays} zile`;

  return date.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function NotificationHistoryScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [allNotifications, setAllNotifications] = useState([]);

  const { colors, isDark } = useThemeColor();

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      setAllNotifications(response.data);
    } catch (error) {
      console.error("Eroare la preluarea notificărilor:", error);
      Alert.alert("Eroare", "Nu am putut încărca istoricul.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setAllNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Eroare la marcarea notificărilor:", error);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={markAllAsRead} style={{ marginRight: 15 }}>
          <Ionicons 
            name="checkmark-done-circle-outline" 
            size={26} 
            color={colors.textPrimary} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, markAllAsRead, colors.textPrimary]);

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter(n => !n.is_read);
  }, [allNotifications]);

  const displayedData = activeTab === 'All' ? allNotifications : unreadNotifications;

  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const renderItem = ({ item, index }) => {
    const isUnread = !item.is_read;
    return (
      <View style={[
        styles.notificationItem,
        isUnread && styles.notificationItemUnread,
        { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }
      ]}>
        {isUnread && <View style={styles.unreadAccent} />}

        <View style={[styles.iconWrapper, isUnread && { backgroundColor: STANDARD_BLUE + '18', borderColor: STANDARD_BLUE + '35' }]}>
          <Image 
            source={require('../../../assets/osace.png')}
            style={styles.osaceLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, isUnread && { color: colors.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody} numberOfLines={3}>{item.body}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <Text style={styles.notificationTime}>{formatTimestamp(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <ScreenContainer scrollable={false}>
      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'All' && styles.activeTab]}
          onPress={() => setActiveTab('All')}
        >
          <Text style={[styles.tabText, activeTab === 'All' && styles.activeTabText]}>Toate</Text>
          <View style={[styles.tabCountBadge, activeTab === 'All' && styles.activeTabCountBadge]}>
            <Text style={[styles.tabCountText, activeTab === 'All' && styles.activeTabCountText]}>{allNotifications.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'Unread' && styles.activeTab]}
          onPress={() => setActiveTab('Unread')}
        >
          <Text style={[styles.tabText, activeTab === 'Unread' && styles.activeTabText]}>Necitite</Text>
          {unreadNotifications.length > 0 && (
            <View style={[styles.tabCountBadge, styles.unreadCountBadge, activeTab === 'Unread' && styles.activeTabCountBadge]}>
              <Text style={[styles.tabCountText, styles.unreadCountText, activeTab === 'Unread' && styles.activeTabCountText]}>{unreadNotifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedData}
        renderItem={renderItem}
        keyExtractor={item => item.user_notification_id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            illustration="no_notifications"
            title="Nicio notificare"
            subtitle={activeTab === 'Unread' ? 'Toate notificările au fost citite.' : 'Nu ai primit nicio notificare încă.'}
          />
        }
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  separator: {
    height: 10,
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : colors.border,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: STANDARD_BLUE,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: STANDARD_BLUE,
  },
  tabCountBadge: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    borderRadius: 10,
    minWidth: 22,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 7,
    paddingHorizontal: 5,
  },
  activeTabCountBadge: {
    backgroundColor: STANDARD_BLUE + '20',
  },
  tabCountText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeTabCountText: {
    color: STANDARD_BLUE,
  },
  unreadCountBadge: {
    backgroundColor: '#C0392B20',
  },
  unreadCountText: {
    color: '#C0392B',
  },

  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.12 : 0.04, shadowRadius: 6, elevation: 2,
  },
  notificationItemUnread: {
    backgroundColor: isDark ? 'rgba(74, 144, 226, 0.07)' : 'rgba(21, 102, 185, 0.04)',
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: STANDARD_BLUE,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: STANDARD_BLUE,
    marginLeft: 6,
    alignSelf: 'center',
    flexShrink: 0,
  },

  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: isDark ? colors.background : '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  osaceLogo: {
    width: 30,
    height: 30,
  },
  contentWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  notificationBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 7,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontSize: 16,
    color: colors.textSecondary,
  },
});