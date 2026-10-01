import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import api from '../../../services/api';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import AnnouncementBanner from '../../../components/AnnouncementBanner';

const TARGETS = [
  { id: 'news_feed', label: 'Noutăți (Feed)', icon: 'newspaper-outline', variant: 'news' },
  { id: 'login', label: 'Autentificare (Login)', icon: 'log-in-outline', variant: 'login' },
];

export default function ManageBannersScreen() {
  const { colors, isDark } = useThemeColor();
  const [selectedTarget, setSelectedTarget] = useState('news_feed');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stare locală pentru cele două bannere
  const [banners, setBanners] = useState({
    news_feed: { id: 'news_feed', title: 'Anunț', text: '', is_active: false },
    login: { id: 'login', title: 'Info Voluntari Noi', text: '', is_active: false },
  });

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/announcements');
      if (res && res.data && Array.isArray(res.data)) {
        const mapped = {};
        res.data.forEach((item) => {
          mapped[item.id] = {
            id: item.id,
            title: item.title || '',
            text: item.text || '',
            is_active: !!item.is_active,
            updated_at: item.updated_at,
          };
        });
        setBanners((prev) => ({ ...prev, ...mapped }));
      }
    } catch (err) {
      console.error('Eroare la preluarea bannerelor:', err);
      Alert.alert('Eroare', 'Nu s-au putut încărca setările pentru bannere.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const currentBanner = banners[selectedTarget] || {
    id: selectedTarget,
    title: '',
    text: '',
    is_active: false,
  };

  const handleToggleActive = (val) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setBanners((prev) => ({
      ...prev,
      [selectedTarget]: {
        ...prev[selectedTarget],
        is_active: val,
      },
    }));
  };

  const handleTextChange = (text) => {
    setBanners((prev) => ({
      ...prev,
      [selectedTarget]: {
        ...prev[selectedTarget],
        text,
      },
    }));
  };

  const handleTitleChange = (title) => {
    setBanners((prev) => ({
      ...prev,
      [selectedTarget]: {
        ...prev[selectedTarget],
        title,
      },
    }));
  };

  const handleSave = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setSaving(true);
    try {
      const payload = {
        title: currentBanner.title,
        text: currentBanner.text,
        isActive: currentBanner.is_active,
      };

      const res = await api.put(`/api/admin/announcements/${selectedTarget}`, payload);

      Toast.show({
        type: 'success',
        text1: 'Banner Salvat! 🎉',
        text2: `Bannerul pentru ${selectedTarget === 'news_feed' ? 'Noutăți' : 'Login'} a fost actualizat.`,
        visibilityTime: 3000,
      });

      if (res.data?.announcement) {
        setBanners((prev) => ({
          ...prev,
          [selectedTarget]: {
            ...prev[selectedTarget],
            ...res.data.announcement,
          },
        }));
      }
    } catch (err) {
      console.error('Eroare la salvarea bannerului:', err);
      const errMsg = err.response?.data?.error || 'A apărut o problemă la salvare.';
      Alert.alert('Eroare Salvare', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors, isDark);

  if (loading) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Se încarcă configurația bannerelor...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Selector Tab Țintă */}
          <Text style={styles.sectionHeader}>ALEGE HEADER-UL DE MODIFICAT</Text>
          <View style={styles.tabsRow}>
            {TARGETS.map((t) => {
              const isSelected = selectedTarget === t.id;
              const hasActiveNotice = banners[t.id]?.is_active && banners[t.id]?.text?.trim()?.length > 0;

              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedTarget(t.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={isSelected ? '#ffffff' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                  {hasActiveNotice && (
                    <View style={styles.activeDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Card Comutator ON/OFF */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Stare Afișare Banner</Text>
                <Text style={styles.cardSubtitle}>
                  {currentBanner.is_active
                    ? 'Bannerul este vizibil utilizatorilor pe această pagină.'
                    : 'Bannerul este ascuns (nu apare deloc pe ecran).'}
                </Text>
              </View>
              <Switch
                value={currentBanner.is_active}
                onValueChange={handleToggleActive}
                trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  currentBanner.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive,
                ]}
              >
                <Ionicons
                  name={currentBanner.is_active ? 'checkmark-circle' : 'eye-off'}
                  size={14}
                  color={currentBanner.is_active ? '#10b981' : isDark ? '#94a3b8' : '#64748b'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: currentBanner.is_active ? '#10b981' : isDark ? '#94a3b8' : '#64748b' },
                  ]}
                >
                  {currentBanner.is_active ? 'ACTIV (VIZIBIL)' : 'INACTIV (ASCUNS)'}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Previzualizare Live */}
          <Text style={styles.sectionHeader}>PREVIZUALIZARE LIVE</Text>
          <View style={styles.previewContainer}>
            {currentBanner.is_active && currentBanner.text?.trim()?.length > 0 ? (
              <AnnouncementBanner
                announcement={{
                  title: currentBanner.title,
                  text: currentBanner.text,
                  isActive: true,
                }}
                variant={selectedTarget === 'login' ? 'login' : 'news'}
              />
            ) : (
              <View style={styles.emptyPreviewBox}>
                <Ionicons name="eye-off-outline" size={28} color={colors.textSecondary} />
                <Text style={styles.emptyPreviewText}>
                  {!currentBanner.is_active
                    ? 'Bannerul este setat pe INACTIV. Nu se va afișa nimic pe ecran.'
                    : 'Scrie un text mai jos pentru a vedea cum va arăta bannerul.'}
                </Text>
              </View>
            )}
          </View>

          {/* 4. Formular Editare Conținut */}
          <Text style={styles.sectionHeader}>CONȚINUT BANNER</Text>
          <View style={styles.card}>
            {/* Titlu opțional */}
            <Text style={styles.inputLabel}>TITLU / ETICHETĂ (OPȚIONAL)</Text>
            <TextInput
              style={styles.singleInput}
              value={currentBanner.title}
              onChangeText={handleTitleChange}
              placeholder={selectedTarget === 'login' ? 'Ex: BINE AI VENIT, VOLUNTAR' : 'Ex: ANUNȚ IMPORTANT'}
              placeholderTextColor={colors.textSecondary + '70'}
              maxLength={40}
            />

            {/* Mesaj text */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <Text style={styles.inputLabel}>MESAJ INFORMATIV</Text>
              <Text style={styles.charCounter}>{currentBanner.text.length} / 300</Text>
            </View>
            <TextInput
              style={styles.multilineInput}
              value={currentBanner.text}
              onChangeText={handleTextChange}
              placeholder="Introdu textul pe care dorești să îl afișezi utilizatorilor..."
              placeholderTextColor={colors.textSecondary + '70'}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>

          {/* 5. Buton Salvare */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Salvează Modificările</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 8,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surface : '#e2e8f0',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    tabBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#ffffff',
    },
    activeDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#10b981',
      marginLeft: 6,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      paddingRight: 10,
    },
    statusBadgeRow: {
      marginTop: 12,
      flexDirection: 'row',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusBadgeActive: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10b981',
    },
    statusBadgeInactive: {
      backgroundColor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.08)',
      borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)',
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    previewContainer: {
      marginBottom: 16,
    },
    emptyPreviewBox: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyPreviewText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 17,
      maxWidth: 260,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    charCounter: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    singleInput: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    multilineInput: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      minHeight: 90,
      lineHeight: 20,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
