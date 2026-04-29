import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../features/Auth/AuthContext';
import api from '../../services/api';

import { useThemeColor } from '../../constants/useThemeColor';
import ThemeToggleSwitch from '../../components/ThemeToggleSwitch';

export default function CustomDrawerContent(props) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useThemeColor();

  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';

  // Same role mapping as CustomHeader for consistency
  const ROLE_MAP = {
    admin: { label: 'Admin', color: '#E74C3C' },
    coordonator: { label: 'Coordonator', color: '#F39C12' },
    voluntar: { label: 'Voluntar', color: '#27ae60' },
    user: { label: 'Voluntar', color: '#27ae60' }, // "user" is the raw DB value for regular members
  };
  const roleInfo = ROLE_MAP[user?.role] || { label: 'Voluntar', color: '#27ae60' };

  const styles = createStyles(colors, isDark, STANDARD_BLUE);

  const [tapCount, setTapCount] = React.useState(0);
  const tapTimeoutRef = React.useRef(null);

  const [showDevNotes, setShowDevNotes] = React.useState(false);

  const handleVersionTap = () => {
    setTapCount((prev) => {
      const newCount = prev + 1;

      if (newCount >= 7) {
        setShowDevNotes(true);
        return 0; // Reset after showing
      }

      // Reset tap count if they stop tapping for 2 seconds
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);

      return newCount;
    });
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>

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
          <CustomDrawerItem label="Acasă" icon="home" navigateTo="HomeTabs" activeIconColor={STANDARD_BLUE} />
          <CustomDrawerItem label="Profilul Meu" icon="person" navigateTo="Profile" activeIconColor={STANDARD_BLUE} />
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
      </ScrollView>

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
          onPress={handleVersionTap}
          style={{
            marginTop: 10,
            paddingVertical: 5,
            alignItems: 'center',
            opacity: 0.6
          }}
        >
          <Text style={{
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 0.5
          }}>
            Versiune: 1.0.2
          </Text>
        </TouchableOpacity>
      </View>

      {/* DEV NOTES MEME MODAL */}
      <Modal
        visible={showDevNotes}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDevNotes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={require('../../assets/nerd_meme.png')}
              style={styles.memeImage}
              resizeMode="contain"
            />
            <Text style={styles.modalTitle}>Dev Notes</Text>
            <Text style={styles.modalText}>
              Developed out of passion for- hai că crecă...{'\n'}
              Sper să vă placă.{'\n\n'}
              <Text style={{ fontWeight: 'bold' }}>@george_1613</Text>{'\n'}
              Versiune: V1.0.2
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDevNotes(false)}
            >
              <Text style={styles.modalCloseText}>Nice</Text>
            </TouchableOpacity>
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
    width: '80%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  memeImage: {
    width: 150,
    height: 150,
    marginBottom: 15,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: STANDARD_BLUE,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  modalCloseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});