import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ImageBackground, ScrollView, Modal, Pressable, Linking, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../features/Auth/AuthContext';
import api from '../../services/api';

import { useThemeColor } from '../../constants/useThemeColor';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';
import { APP_VERSION, PATCH_NOTES, LEGACY_PATCH_NOTES } from '../../constants/Version';

export default function CustomDrawerContent(props) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useThemeColor();

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  const ROLE_MAP = {
    admin: { label: 'Admin', color: '#E74C3C' },
    coordonator: { label: 'Coordonator', color: '#F39C12' },
    voluntar: { label: 'Voluntar', color: STANDARD_BLUE },
    user: { label: 'Voluntar', color: STANDARD_BLUE }, // "user" is the raw DB value for regular members
  };
  const roleInfo = ROLE_MAP[user?.role] || { label: 'Voluntar', color: STANDARD_BLUE };

  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const [tapCount, setTapCount] = React.useState(0);
  const tapTimeoutRef = React.useRef(null);

  const [showDevNotes, setShowDevNotes] = React.useState(false);
  const [showLegacyNotes, setShowLegacyNotes] = React.useState(false);

  const claimEasterEggBadge = async () => {
    try {
      await api.post('/api/badges/claim-easter-egg');
    } catch (error) {
      console.error('Eroare la deblocarea badge-ului de Easter Egg:', error);
    }
  };

  const handleVersionTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      if (newCount >= 7) {
        setShowDevNotes(true);
        claimEasterEggBadge();
        return 0; // Reset after showing
      }

      // Reset tap count if they stop tapping for 2 seconds
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);

      return newCount;
    });
  };

  const handleOpenInstagram = async () => {
    const appUrl = 'instagram://user?username=george_1613';
    const webUrl = 'https://www.instagram.com/george_1613/';
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Eroare', 'Nu s-a putut deschide profilul de Instagram.');
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Deconectare",
      "Ești sigur că vrei să te deconectezi?",
      [
        { text: "Anulează", style: "cancel" },
        { text: "Deconectare", onPress: () => logout(), style: "destructive" }
      ]
    );
  };

  const handleFeedback = (type) => {
    const isAndroid = Platform.OS === 'android';
    const osInfo = `${Platform.OS} ${Platform.Version}`;
    const email = 'developers@osace.ro';

    let subject, body;

    if (type === 'bug') {
      subject = `[BUG V${APP_VERSION}] - Descriere scurtă a problemei`;
      body = [
        '--- Informații Tehnice (te rugăm să nu ștergi) ---',
        `Versiune Aplicație: ${APP_VERSION}`,
        `Sistem de operare: ${osInfo}`,
        `Utilizator: @${user?.display_name || 'necunoscut'}`,
        '---------------------------------------------------',
        '',
        'Ce s-a întâmplat:',
        '[Scrie aici problema întâmpinată...]',
        '',
        'Pași pentru reproducere:',
        '1. Am deschis ecranul...',
        '2. Am apăsat pe...',
        '',
        '(Opțional: Poți atașa capturi de ecran la acest email)',
      ].join('\n');
    } else {
      subject = `[SUGESTIE V${APP_VERSION}] - Ideea mea pentru OSACE App`;
      body = [
        'Descrierea ideii / funcționalității dorite:',
        '[Ce ți-ar plăcea să adăugăm în aplicație?]',
        '',
        'De ce crezi că ar fi utilă:',
        '[Cum ar ajuta voluntarii sau asociația?]',
      ].join('\n');
    }

    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.canOpenURL(mailto).then((supported) => {
      if (supported) {
        Linking.openURL(mailto);
      } else {
        Alert.alert(
          'Nicio aplicație de email',
          `Trimite manual un email la ${email}`,
          [{ text: 'OK' }]
        );
      }
    });
  };

  const [showFeedbackMenu, setShowFeedbackMenu] = React.useState(false);

  const currentRouteName = props.state.routeNames[props.state.index];

  const CustomDrawerItem = ({ label, icon, navigateTo, activeIconColor = colors.primary }) => {
    const isFocused = currentRouteName === navigateTo;

    return (
      <TouchableOpacity
        style={[
          styles.drawerItem,
          isFocused && styles.drawerItemFocused
        ]}
        onPress={() => props.navigation.navigate(navigateTo)}
      >
        <View style={[
          styles.iconContainer,
          isFocused ? { backgroundColor: activeIconColor + '20' } : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }
        ]}>
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? activeIconColor : colors.textSecondary}
          />
        </View>
        <Text style={[
          styles.drawerItemLabel,
          isFocused && { color: activeIconColor, fontWeight: '800' }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>

      {/* 1. Premium Header Profile Card */}
      <View style={styles.header}>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: `${api.defaults.baseURL}${user.avatar_url}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarImage, { backgroundColor: STANDARD_BLUE + '20', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={32} color={STANDARD_BLUE} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.headerName} numberOfLines={1}>{user?.display_name || 'Utilizator'}</Text>
              <Text style={styles.headerEmail} numberOfLines={1}>{user?.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20', borderColor: roleInfo.color + '40' }]}>
                <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Theme Toggle Strip */}
        <View style={styles.themeRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={colors.textSecondary} />
            <Text style={styles.themeText}>Aspect Aplicație</Text>
          </View>
          <ThemeToggleSwitch isDark={isDark} onToggle={toggleTheme} colors={colors} />
        </View>
      </View>

      {/* 2. Menu Sections */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Navigare */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NAVIGARE</Text>
          <CustomDrawerItem label="Acasă" icon="home" navigateTo="HomeTabs" activeIconColor={colors.primary} />
          <CustomDrawerItem label="Profilul Meu" icon="person" navigateTo="Profile" activeIconColor={colors.primary} />
        </View>

        {/* Comunitate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMUNITATE</Text>
          <CustomDrawerItem label="Clasament" icon="trophy" navigateTo="Leaderboard" activeIconColor="#f39c12" />
          <CustomDrawerItem label="Catalog Realizări" icon="ribbon" navigateTo="BadgeCatalog" activeIconColor="#e74c3c" />
          <CustomDrawerItem label="Harta Facultății" icon="map" navigateTo="Map" activeIconColor="#27ae60" />
        </View>

        {/* Administrare (DOAR PENTRU ADMIN/COORDONATOR) */}
        {(user?.role === 'admin' || user?.role === 'coordonator') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMINISTRARE</Text>
            <CustomDrawerItem label="Dashboard Statistici" icon="stats-chart" navigateTo="Statistics" activeIconColor="#8e44ad" />
          </View>
        )}
        {/* Feedback & Asistență */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEEDBACK</Text>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => setShowFeedbackMenu(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(39, 174, 96, 0.15)' : 'rgba(39, 174, 96, 0.1)' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#27ae60" />
            </View>
            <Text style={styles.drawerItemLabel}>Feedback & Asistență</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FEEDBACK TYPE PICKER MODAL */}
      <Modal
        visible={showFeedbackMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeedbackMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFeedbackMenu(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: '#27ae6020', padding: 6, borderRadius: 10 }}>
                  <Ionicons name="chatbubble-ellipses" size={20} color="#27ae60" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>Feedback & Asistență</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFeedbackMenu(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 16 }}>
              Alege tipul de mesaj. Se va deschide aplicația ta de email cu un template pregătit.
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: isDark ? 'rgba(231, 76, 60, 0.08)' : 'rgba(231, 76, 60, 0.06)',
                borderWidth: 1, borderColor: isDark ? 'rgba(231, 76, 60, 0.2)' : 'rgba(231, 76, 60, 0.15)',
                borderRadius: 14, padding: 14, marginBottom: 10,
              }}
              onPress={() => { setShowFeedbackMenu(false); handleFeedback('bug'); }}
              activeOpacity={0.7}
            >
              <View style={{ backgroundColor: '#E74C3C20', padding: 8, borderRadius: 10 }}>
                <Ionicons name="bug-outline" size={22} color="#E74C3C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Raportează o problemă</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Erori, crash-uri sau probleme tehnice</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                backgroundColor: isDark ? 'rgba(21, 102, 185, 0.08)' : 'rgba(21, 102, 185, 0.06)',
                borderWidth: 1, borderColor: isDark ? 'rgba(21, 102, 185, 0.2)' : 'rgba(21, 102, 185, 0.15)',
                borderRadius: 14, padding: 14,
              }}
              onPress={() => { setShowFeedbackMenu(false); handleFeedback('feature'); }}
              activeOpacity={0.7}
            >
              <View style={{ backgroundColor: STANDARD_BLUE + '20', padding: 8, borderRadius: 10 }}>
                <Ionicons name="bulb-outline" size={22} color={STANDARD_BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Sugerează o idee</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Idei noi sau îmbunătățiri pentru aplicație</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(192, 57, 43, 0.1)' }]}>
            <Ionicons name="log-out" size={20} color="#C0392B" />
          </View>
          <Text style={styles.logoutText}>Deconectare</Text>
        </TouchableOpacity>

        {/* EASTER EGG VERSION NUMBER */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setShowDevNotes(true);
            handleVersionTap();
          }}
          style={{
            marginTop: 10,
            paddingVertical: 6,
            paddingHorizontal: 12,
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderRadius: 12,
            alignSelf: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{
              color: colors.textPrimary,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.5
            }}>
              Versiune: V{APP_VERSION}
            </Text>
            <View style={{ backgroundColor: STANDARD_BLUE + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: STANDARD_BLUE, fontSize: 10, fontWeight: '700' }}>PATCH NOTES</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* PATCH NOTES & DEV NOTES MODAL */}
      <Modal
        visible={showDevNotes}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDevNotes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: STANDARD_BLUE + '20', padding: 6, borderRadius: 10 }}>
                  <Ionicons name="rocket-outline" size={20} color={STANDARD_BLUE} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Ce este nou în V{APP_VERSION}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>Patch Notes & Schimbări Recente</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDevNotes(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 0 }}
            >
              <View style={styles.notesSection}>
                {PATCH_NOTES && PATCH_NOTES.length > 0 && (
                  PATCH_NOTES.map((patch, pIdx) => (
                    <View key={pIdx} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: STANDARD_BLUE }}>Versiunea {patch.version}</Text>
                          {pIdx === 0 && (
                            <View style={{ backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '800' }}>CURENTĂ</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{patch.date}</Text>
                      </View>

                      {patch.items.map((item, iIdx) => (
                        <Text key={iIdx} style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 }}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  ))
                )}
              </View>

              {/* Dev easter egg credits */}
              <View style={styles.creditsSection}>
                <TouchableOpacity
                  style={styles.instagramBadge}
                  onPress={handleOpenInstagram}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="logo-instagram"
                    size={14}
                    color={isDark ? '#E2E8F0' : '#475569'}
                  />
                  <Text style={styles.instagramBadgeText}>george_1613</Text>
                </TouchableOpacity>

                <Image
                  source={require('../../assets/nerd_meme.png')}
                  style={styles.memeImage}
                  resizeMode="contain"
                />
                <Text style={styles.creditsText}>
                  Dezvoltat pentru membrii și voluntarii O.S.A.C.E.{'\n'}
                  <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>@george_1613</Text> • Build V{APP_VERSION}
                </Text>

                {/* Minecraft Dig Down Toggle Button */}
                <TouchableOpacity
                  style={styles.digDownButton}
                  onPress={() => setShowLegacyNotes(!showLegacyNotes)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}></Text>
                  <Text style={styles.digDownButtonText}>
                    {showLegacyNotes ? 'Older Patch Notes' : 'Older Patch Notes'}
                  </Text>
                  <Ionicons
                    name={showLegacyNotes ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* MINECRAFT DIRT BASEMENT (EDGE-TO-EDGE across full popup width!) */}
              {showLegacyNotes && (
                <ImageBackground
                  source={require('../../assets/minecraft_dirt.png')}
                  resizeMode="repeat"
                  style={styles.minecraftDirtBasement}
                >
                  <View style={styles.minecraftOverlay}>
                    {/* Header inside dirt */}
                    <View style={styles.minecraftHeader}>
                      <Text style={styles.minecraftTitle}>🧍‍♂️</Text>
                      <Text style={styles.minecraftSubtitle}>Patch notes mai vechi de V2.1</Text>
                    </View>

                    {/* Legacy list */}
                    <View style={{ gap: 10 }}>
                      {LEGACY_PATCH_NOTES.map((patch, pIdx) => (
                        <View key={pIdx} style={styles.minecraftCard}>
                          <View style={styles.minecraftCardHeader}>
                            <Text style={styles.minecraftVersionText}>
                              Versiunea {patch.version}
                            </Text>
                            <Text style={styles.minecraftDateText}>{patch.date}</Text>
                          </View>

                          <View style={{ gap: 4, marginTop: 6 }}>
                            {patch.items.map((item, iIdx) => (
                              <Text key={iIdx} style={styles.minecraftItemText}>
                                • {item}
                              </Text>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.minecraftFooter}>
                      <Text style={styles.bedrockText}></Text>
                    </View>
                  </View>
                </ImageBackground>
              )}
            </ScrollView>

            <View style={{ paddingHorizontal: 18, width: '100%' }}>
              <TouchableOpacity
                style={styles.jojoCloseButton}
                onPress={() => setShowDevNotes(false)}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../assets/to_be_continued.png')}
                  style={styles.jojoImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  },
  profileCard: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  themeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemFocused: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  logoutText: {
    marginLeft: 14,
    fontSize: 16,
    color: '#C0392B',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  modalScrollView: {
    maxHeight: Math.min(Dimensions.get('window').height * 0.65, 500),
    width: '100%',
  },
  notesSection: {
    paddingHorizontal: 18,
    gap: 12,
  },
  instagramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    marginBottom: 12,
  },
  instagramBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: isDark ? '#A1A1AA' : '#52525B',
    letterSpacing: 0.2,
  },
  memeImage: {
    width: 140,
    height: 140,
    marginBottom: 12,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  creditsSection: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    width: '100%',
  },
  creditsText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  digDownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#4E4E4E',
    borderRadius: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 4,
    borderTopColor: '#7A7A7A',
    borderLeftColor: '#7A7A7A',
    borderRightColor: '#2B2B2B',
    borderBottomColor: '#1F1F1F',
  },
  digDownButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  minecraftDirtBasement: {
    width: '100%',
    marginTop: 16,
  },
  minecraftOverlay: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  minecraftHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  minecraftTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFF55',
    letterSpacing: 0.5,
    textShadowColor: '#3F3F00',
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
  minecraftSubtitle: {
    fontSize: 11,
    color: '#CCCCCC',
    marginTop: 3,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  minecraftCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderTopColor: '#4A3525',
    borderLeftColor: '#4A3525',
    borderRightColor: '#1A120B',
    borderBottomColor: '#1A120B',
  },
  minecraftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  minecraftVersionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  minecraftDateText: {
    fontSize: 10,
    color: '#AAAAAA',
  },
  minecraftItemText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#E0E0E0',
  },
  minecraftFooter: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 8,
  },
  bedrockText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E9E9E',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  jojoCloseButton: {
    width: '100%',
    height: 52,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  jojoImage: {
    width: '94%',
    height: 40,
  },
});