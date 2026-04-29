import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'; 
import Toast from 'react-native-toast-message';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Animated,
  Easing
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import RenderHtml from 'react-native-render-html';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const SkeletonAvatar = ({ colors }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={{ 
      width: 44, height: 44, borderRadius: 22, 
      backgroundColor: colors.textSecondary, 
      opacity, marginLeft: -15, borderWidth: 2, borderColor: colors.card
    }} />
  );
};

export default function EventDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params;
  const { width } = useWindowDimensions();
  
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColor();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(true);

  const CATEGORY_TAGS = {
    sedinta: { label: 'Ședință', color: '#3498db' },
    social: { label: 'Social', color: '#27ae60' },
    proiect: { label: 'Proiect', color: '#f39c12' },
    default: { label: 'Activitate', color: colors.textSecondary }
  };

  const memoizedDescription = useMemo(() => ({
    html: eventData?.description || "<p><i>Fără descriere.</i></p>"
  }), [eventData?.description]);

  const handleAttend = async () => {
    try {
      setActionLoading(true);
      const response = await api.post(`/api/events/${eventId}/attend`);
      setEventData(prev => ({
        ...prev,
        is_attending: true,
        participant_count: prev.participant_count + 1,
        confirmation_status: 'pending' 
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Toast.show({
        type: 'success', text1: 'Înscriere Confirmată!',
        text2: 'Te-ai înscris cu succes la această activitate.', visibilityTime: 3000,
      });
      fetchAttendees(); 
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Nu s-a putut realiza înscrierea.";
      Alert.alert("Eroare", errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnattend = async () => {
    Alert.alert(
      "Confirmare", "Ești sigur că vrei să te retragi de la această activitate?",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Retrage-mă", style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.post(`/api/events/${eventId}/unattend`);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEventData(prev => ({
                ...prev, is_attending: false,
                participant_count: Math.max(0, prev.participant_count - 1),
                confirmation_status: null 
              }));
              Toast.show({ type: 'info', text1: 'Retragere', text2: 'Te-ai retras de la activitate cu succes.', visibilityTime: 3000 });
              fetchAttendees();
            } catch (error) {
              const errorMessage = error.response?.data?.message || error.response?.data?.error || "Eroare de la server.";
              Alert.alert("Eroare", errorMessage);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      setEventData(response.data);
    } catch (error) {
      Alert.alert("Eroare", "Nu s-au putut încărca detaliile.");
      navigation.goBack();
    }
  };

  const fetchAttendees = async () => {
    try {
      setLoadingAttendees(true);
      const response = await api.get(`/api/events/${eventId}/attendees`);
      setAttendees(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchEventDetails(), fetchAttendees()]).finally(() => setLoading(false));
    }, [eventId])
  );

  const styles = createStyles(colors, isDark, insets);

  const InfoCardItem = ({ icon, label, value, avatarUrl }) => (
    <View style={styles.infoCardItem}>
      <View style={[styles.infoIconWrapper, avatarUrl && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
        {avatarUrl ? (
          <Image source={{ uri: `${api.defaults.baseURL}${avatarUrl}` }} style={{ width: 36, height: 36, borderRadius: 18 }} />
        ) : (
          <Ionicons name={icon} size={20} color={colors.primary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );

  if (loading || !eventData) return <ScreenContainer loading={true} />;

  const safeEndTime = eventData.end_time.replace(' ', 'T');
  const safeStartTime = eventData.start_time.replace(' ', 'T');

  const { title, location, category, coordinator_name, coordinator_avatar, is_attending, confirmation_status } = eventData;
  const tag = CATEGORY_TAGS[category] || CATEGORY_TAGS.default;
  const isEventOver = new Date(safeEndTime) < new Date();
  const startTimeFmt = format(new Date(safeStartTime), 'dd MMM, HH:mm', { locale: ro });
  const endTimeFmt = format(new Date(safeEndTime), 'HH:mm', { locale: ro });

  let bannerStyle = styles.statusPending;
  let bannerIcon = "time";
  let bannerColor = "#f39c12";
  let bannerText = "Înscris (aștepți scanarea la sosire)";

  if (confirmation_status === 'checked_in') {
    const hoursSinceEnd = (new Date() - new Date(safeEndTime)) / (1000 * 60 * 60);
    const graceExpired = isEventOver && hoursSinceEnd > 24; // 24h grace period

    if (graceExpired) {
      // Grace period over — user forgot to check out, show as Absent
      bannerStyle = styles.statusMissed;
      bannerIcon = "close-circle";
      bannerColor = "#e74c3c";
      bannerText = "ABSENT: Nu ai scanat la plecare. Orele initiale au fost trimise spre aprobare.";
    } else if (isEventOver) {
      // Event ended, still within 24h checkout window
      bannerStyle = styles.statusCheckedIn;
      bannerIcon = "time-outline";
      bannerColor = "#f39c12";
      bannerText = "ACTIVITATE ÎNCHEIATĂ: Scanează pentru a confirma plecarea și a-ți salva orele.";
    } else {
      // Event still ongoing
      bannerStyle = styles.statusCheckedIn;
      bannerIcon = "walk";
      bannerColor = "#3498db";
      bannerText = "EȘTI PREZENT: Pontajul tău a început. Scanează la plecare pentru a confirma orele.";
    }
  } else if (confirmation_status === 'absent') {
    // Set by the auto-checkout worker after the 24h grace period
    bannerStyle = styles.statusMissed;
    bannerIcon = "close-circle";
    bannerColor = "#e74c3c";
    bannerText = "ABSENT: Nu ai confirmat plecarea. O cerere de ore a fost trimisă coordonatorului.";
  } else if (confirmation_status === 'attended') {
    bannerStyle = styles.statusAttended;
    bannerIcon = "checkmark-done-circle";
    bannerColor = "#27ae60";
    bannerText = "ACTIVITATE FINALIZATĂ: Ore confirmate.";
  } else if (isEventOver) {
    bannerStyle = styles.statusMissed;
    bannerIcon = "close-circle";
    bannerColor = "#e74c3c";
    bannerText = "ABSENT: Activitate încheiată.";
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 350 }} // Increased space for floating footer and banners
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Dynamic Hero Header */}
        <View style={[styles.heroHeader, { backgroundColor: isDark ? tag.color + '25' : tag.color + '15' }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.tagContainer, { backgroundColor: tag.color + '20' }]}>
            <Text style={[styles.tagText, { color: tag.color }]}>{tag.label}</Text>
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>

        {/* Floating Info Grid */}
        <View style={styles.infoCard}>
          
          {/* Custom Timeline for "Când" */}
          <View style={styles.timelineContainer}>
            {/* Start Time */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineDot, { backgroundColor: '#27ae60' }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Începe</Text>
                <Text style={styles.timelineValue}>{format(new Date(safeStartTime), 'dd MMM yyyy, HH:mm', { locale: ro })}</Text>
              </View>
            </View>
            
            {/* Dotted Line */}
            <View style={styles.timelineLineContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.timelineDotSmall, { backgroundColor: colors.border }]} />
              ))}
            </View>

            {/* End Time */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineDot, { backgroundColor: '#e74c3c' }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Se termină</Text>
                <Text style={styles.timelineValue}>{format(new Date(safeEndTime), 'dd MMM yyyy, HH:mm', { locale: ro })}</Text>
              </View>
            </View>
          </View>

          <View style={styles.horizontalDivider} />
          
          <View style={styles.infoRow}>
            <InfoCardItem icon="location-outline" label="Unde" value={location} />
            <View style={styles.verticalDivider} />
            <InfoCardItem icon="person-circle-outline" label="Coordonator" value={coordinator_name} avatarUrl={coordinator_avatar} />
          </View>
        </View>

        {/* Overlapping Avatar Stack for Attendees */}
        <View style={styles.attendeesBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cine participă?</Text>
            <Text style={styles.attendeesCount}>{eventData.participant_count} înscriși</Text>
          </View>
          
          <View style={styles.avatarStackContainer}>
            {loadingAttendees ? (
              <View style={{ flexDirection: 'row', marginLeft: 15 }}>
                <SkeletonAvatar colors={colors} />
                <SkeletonAvatar colors={colors} />
                <SkeletonAvatar colors={colors} />
                <SkeletonAvatar colors={colors} />
              </View>
            ) : attendees.length > 0 ? (
              <View style={{ flexDirection: 'row', marginLeft: 15, alignItems: 'center' }}>
                {attendees.slice(0, 7).map((item, index) => (
                  <TouchableOpacity 
                    key={item.id} 
                    onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
                    style={{ marginLeft: -15, zIndex: 7 - index }}
                  >
                    {item.avatar_url ? (
                      <Image source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }} style={styles.stackedAvatar} />
                    ) : (
                      <View style={[styles.stackedAvatar, styles.avatarPlaceholder]}>
                        <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>
                          {item.display_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {attendees.length > 7 && (
                  <View style={[styles.stackedAvatar, styles.moreAvatar]}>
                    <Text style={styles.moreAvatarText}>+{attendees.length - 7}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noAttendeesText}>Fii primul care se înscrie!</Text>
            )}
          </View>
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.sectionTitle}>Despre Activitate</Text>
          <View style={{ width: '100%' }}>
            <RenderHtml
              contentWidth={width - 40}
              source={memoizedDescription}
              baseStyle={{
                color: colors.textPrimary,
                fontSize: 16,
                lineHeight: 26,
              }}
              tagsStyles={{
                p: { color: colors.textPrimary, marginBottom: 12 },
                strong: { color: colors.textPrimary, fontWeight: 'bold' },
                i: { color: colors.textSecondary, fontStyle: 'italic' },
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Glassmorphism Floating Footer */}
      <BlurView 
        intensity={isDark ? 40 : 80} 
        tint={isDark ? 'dark' : 'light'} 
        style={[
          styles.floatingFooter, 
          { 
            paddingBottom: Math.max(insets.bottom, 20),
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.1)' 
          }
        ]}
      >
        {is_attending && (
          <View style={[styles.floatingCard, bannerStyle]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: confirmation_status === 'checked_in' ? 6 : 0 }}>
              <Ionicons name={bannerIcon} size={20} color={bannerColor} />
              <Text style={[styles.statusBannerText, { color: bannerColor }]}>{bannerText}</Text>
            </View>
            
            {confirmation_status === 'checked_in' && (
              <View style={styles.checkoutWarningRow}>
                <Ionicons name="alert-circle" size={14} color="#e74c3c" />
                <Text style={styles.checkoutWarningText}>
                  Dacă nu scanezi la plecare, sistemul aprobă doar orele inițiale.
                </Text>
              </View>
            )}
          </View>
        )}

        {!isEventOver && confirmation_status !== 'attended' && confirmation_status !== 'checked_in' && (
          <TouchableOpacity 
            style={[styles.actionButton, is_attending ? styles.unattendButton : styles.attendButton]} 
            onPress={is_attending ? handleUnattend : handleAttend} 
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={is_attending ? "#e74c3c" : "white"} />
            ) : (
              <>
                <Ionicons name={is_attending ? "close" : "calendar-clear"} size={22} color={is_attending ? "#e74c3c" : "white"} />
                <Text style={[styles.actionButtonText, is_attending && { color: '#e74c3c' }]}>
                  {is_attending ? 'Retrage-te din activitate' : 'Înscrie-te la activitate'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
}

const createStyles = (colors, isDark, insets) => StyleSheet.create({
  container: { flex: 1 },
  heroHeader: {
    paddingTop: Math.max(insets.top, 40) + 10,
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, lineHeight: 34 },
  tagContainer: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 15 },
  tagText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  infoCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 15,
    borderWidth: isDark ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 5,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoCardItem: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  infoIconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  verticalDivider: { width: 1, height: '80%', backgroundColor: colors.border, marginHorizontal: 10 },
  horizontalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  
  attendeesBlock: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  attendeesCount: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  
  avatarStackContainer: { paddingVertical: 10, minHeight: 60 },
  stackedAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: colors.background },
  avatarPlaceholder: { backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  moreAvatar: { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginLeft: -15, zIndex: 0 },
  moreAvatarText: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },
  noAttendeesText: { color: colors.textSecondary, fontStyle: 'italic', marginTop: 10 },
  
  descriptionBlock: { marginTop: 25, paddingHorizontal: 20 },
  
  floatingFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border + '50',
  },
  actionButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 16, borderRadius: 16,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  attendButton: { backgroundColor: colors.primary },
  unattendButton: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: '#e74c3c', shadowOpacity: 0, elevation: 0 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  
  floatingCard: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: isDark ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  statusPending: { backgroundColor: isDark ? 'rgba(243, 156, 18, 0.2)' : '#FEF9E7', borderWidth: 1, borderColor: 'rgba(243, 156, 18, 0.3)' },
  statusCheckedIn: { backgroundColor: isDark ? 'rgba(52, 152, 219, 0.2)' : '#EBF5FB', borderWidth: 1, borderColor: 'rgba(52, 152, 219, 0.3)' }, 
  statusAttended: { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.2)' : '#E8F8F5', borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.3)' },
  statusMissed: { backgroundColor: isDark ? 'rgba(231, 76, 60, 0.2)' : '#FDEDEC', borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.3)' },
  statusBannerText: { marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
  
  checkoutWarningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(231, 76, 60, 0.2)' },
  checkoutWarningText: { color: '#e74c3c', fontSize: 11, fontWeight: '600', marginLeft: 5, flex: 1 },

  // Timeline Styles
  timelineContainer: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  timelineValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineLineContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 4,
  },
  timelineDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginVertical: 2,
  },
});