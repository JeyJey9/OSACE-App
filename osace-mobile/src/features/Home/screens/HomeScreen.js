import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext';
import api from '../../../services/api';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';
import CustomHeader from '../../../components/layout/CustomHeader';
import Ionicons from '@expo/vector-icons/Ionicons';

const SECTION_TITLES = {
  sedinta: 'Ședințe',
  social: 'Activități Sociale',
  proiect: 'Proiecte',
};

export default function HomeScreen({ navigation }) {
  const { user, reloadUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { colors, isDark } = useThemeColor();

  const CATEGORY_TAGS = {
    sedinta: { label: 'Ședință', color: '#3498db' },
    social: { label: 'Social', color: '#27ae60' },
    proiect: { label: 'Proiect', color: '#f39c12' },
    default: { label: 'Activitate', color: colors.textSecondary }
  };

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error("Eroare la preluarea activităților:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca activitățile.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchEvents(),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEvents();
    }, [])
  );

  const sections = useMemo(() => {
    const grouped = {
      sedinta: [],
      social: [],
      proiect: [],
    };

    events.forEach(event => {
      if (grouped[event.category]) {
        grouped[event.category].push(event);
      }
    });

    const sectionData = [];

    if (grouped.sedinta.length > 0) {
      sectionData.push({ title: SECTION_TITLES.sedinta, data: grouped.sedinta });
    }
    if (grouped.social.length > 0) {
      sectionData.push({ title: SECTION_TITLES.social, data: grouped.social });
    }
    if (grouped.proiect.length > 0) {
      sectionData.push({ title: SECTION_TITLES.proiect, data: grouped.proiect });
    }

    return sectionData;
  }, [events]);

  const styles = createStyles(colors, isDark);

  const renderEventItem = ({ item }) => {
    const tag = CATEGORY_TAGS[item.category] || CATEGORY_TAGS.default;
    const participants = item.top_participants || [];

    return (
      <TouchableOpacity
        style={[styles.eventItem, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id, eventTitle: item.title })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}>
            <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            </View>
            <Text style={styles.eventDetails}>
              {new Date(item.start_time).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            </View>
            <Text style={styles.eventDetails} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.avatarStackContainer}>
            {participants.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {participants.map((p, idx) => (
                  <View key={idx} style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: 4 - idx }}>
                    {p.avatar_url ? (
                      <Image source={{ uri: `${api.defaults.baseURL}${p.avatar_url}` }} style={styles.stackedAvatar} />
                    ) : (
                      <View style={[styles.stackedAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={12} color={colors.textSecondary} />
                      </View>
                    )}
                  </View>
                ))}
                {item.participant_count > participants.length && (
                  <View style={[styles.stackedAvatar, styles.moreAvatar]}>
                    <Text style={styles.moreAvatarText}>+{item.participant_count - participants.length}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noAttendeesText}>Fii primul!</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.detailsButton, { backgroundColor: STANDARD_BLUE + '15', borderColor: STANDARD_BLUE + '40', borderWidth: 1 }]}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id, eventTitle: item.title })}
          >
            <Text style={[styles.detailsButtonText, { color: STANDARD_BLUE }]}>Detalii</Text>
            <Ionicons name="chevron-forward" size={16} color={STANDARD_BLUE} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          style={styles.listBackground}
          sections={sections}
          renderItem={renderEventItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }

          ListEmptyComponent={() => (
            <EmptyState
              illustration="no_events"
              title="Nicio activitate planificată"
              subtitle="Momentan nu există activităţi viitoare. Revino curând!"
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listBackground: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 110, // Floating tab bar clearance
  },

  eventItem: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIconWrapper: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    paddingTop: 12,
  },
  avatarStackContainer: {
    flex: 1,
  },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.card,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatar: {
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreAvatarText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  noAttendeesText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 12,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});