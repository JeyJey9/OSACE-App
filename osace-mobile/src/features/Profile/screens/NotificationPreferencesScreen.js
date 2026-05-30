import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';

export default function NotificationPreferencesScreen() {
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const BLUE = isDark ? '#4A90E2' : '#1566B9';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    event_announcements: true,
    verification_updates: true,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
          style={{ 
            paddingHorizontal: 8,
            paddingVertical: 4,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary]);

  const fetchPrefs = async () => {
    try {
      const res = await api.get('/api/profile/notification-preferences');
      setPrefs(res.data);
    } catch (err) {
      console.error('[NotifPrefs] Eroare la preluare:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPrefs(); }, []));

  const toggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      await api.put('/api/profile/notification-preferences', newPrefs);
      Toast.show({ type: 'success', text1: 'Preferințe salvate', visibilityTime: 1500 });
    } catch (err) {
      // Revert on failure
      setPrefs(prefs);
      Alert.alert('Eroare', 'Nu am putut salva preferința. Încearcă din nou.');
    } finally {
      setSaving(false);
    }
  };

  const s = createStyles(colors, isDark, insets, BLUE);

  const PrefRow = ({ icon, title, subtitle, prefKey, color = BLUE }) => (
    <View style={s.prefRow}>
      <View style={[s.prefIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={s.prefText}>
        <Text style={s.prefTitle}>{title}</Text>
        <Text style={s.prefSub}>{subtitle}</Text>
      </View>
      <Switch
        value={prefs[prefKey]}
        onValueChange={() => toggle(prefKey)}
        trackColor={{ false: isDark ? '#444' : '#D1D5DB', true: BLUE + '60' }}
        thumbColor={prefs[prefKey] ? BLUE : (isDark ? '#666' : '#9CA3AF')}
        disabled={saving}
      />
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {loading ? (
        <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Info banner */}
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={BLUE} />
            <Text style={s.infoBannerText}>
              Modificările sunt salvate automat. Dezactivarea notificărilor nu afectează funcționalitatea aplicației.
            </Text>
          </View>

          {/* Preferences card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Tipuri de notificări</Text>

            <PrefRow
              icon="calendar-outline"
              title="Activități noi"
              subtitle="Notificări când administratorii publică activități noi"
              prefKey="event_announcements"
            />

            <View style={s.divider} />

            <PrefRow
              icon="shield-checkmark-outline"
              title="Status verificare student"
              subtitle="Notificări la aprobarea sau respingerea cererii de verificare"
              prefKey="verification_updates"
              color="#27ae60"
            />
          </View>

          {/* System note */}
          <View style={s.systemNote}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
            <Text style={s.systemNoteText}>
              Poți dezactiva complet notificările OSACE din Setările sistemului {' → '}
              <Text style={{ fontWeight: '700' }}>Notificări → OSACE</Text>.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (colors, isDark, insets, BLUE) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: insets.bottom + 40 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: BLUE + (isDark ? '18' : '10'),
    borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: BLUE + '30',
  },
  infoBannerText: { flex: 1, fontSize: 13, color: isDark ? '#a0c4f8' : '#1a4a7a', lineHeight: 20 },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    marginBottom: 16,
    borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prefIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  prefText: { flex: 1 },
  prefTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  prefSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F5', marginVertical: 16 },
  systemNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FB',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF0',
  },
  systemNoteText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, lineHeight: 20 },
});
