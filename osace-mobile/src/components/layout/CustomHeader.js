import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../features/Auth/AuthContext';
import { useThemeColor } from '../../constants/useThemeColor';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Returns a time-appropriate Romanian greeting, cached so it doesn't flicker on tab changes
let cachedGreeting = null;
let lastHour = null;

const getGreeting = () => {
  const date = new Date();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1; // 0-indexed

  // Return the cached message if we are still in the same hour
  if (cachedGreeting && lastHour === hour) {
    return cachedGreeting;
  }

  lastHour = hour;
  let msgs = [];

  // --- SPECIAL DATES OVERRIDE ---
  if (month === 1 && day === 1) {
    msgs = ['Un an nou fericit!', 'La mulți ani!', 'This is your year,', 'Time to lock in.'];
  } else if (month === 3 && day === 8) {
    msgs = ['La mulți ani de 8 Martie!', 'O primăvară frumoasă!'];
  } else if (month === 4 && day === 1) {
    msgs = ['Ziua păcălelilor...'];
  } else if (month === 12 && day === 25) {
    msgs = ['Crăciun Fericit!'];
  } else if (month === 12 && day === 31) {
    msgs = ['Ultima zi din an!', 'Pregătit de Revelion?'];
  } else {
    // --- REGULAR TIME-BASED GREETINGS ---
    if (hour >= 0 && hour < 5) {
      // Deep night
      msgs = [
        'Noapte Alba?',
        'Ia o pauza... te roaga userul care face UI-ul...',
        'E târziu...',
        'Încă o cafea?',
        'Doomscrolling?',
      ];
    } else if (hour >= 5 && hour < 9) {
      // Early morning
      msgs = [
        'Bună dimineața,',
        'O zi frumoasă,',
        'Spor la cafeluță,',
      ];
    } else if (hour >= 9 && hour < 12) {
      // Morning
      msgs = [
        'Spor la cafeluță,',
        'Salut,',
        'Hei,',
        'Bine ai venit,',
      ];
    } else if (hour >= 12 && hour < 14) {
      // Noon
      msgs = [
        'Pauza de masă?',
        'Salut,',
        'Capul sus, cade coroana,'
      ];
    } else if (hour >= 14 && hour < 18) {
      // Afternoon
      msgs = [
        'Salut,',
        'Bună,',
        'Hei,',
        'Bine ai venit,',
      ];
    } else if (hour >= 18 && hour < 21) {
      // Evening
      msgs = [
        'Bună seara,',
        'Seară bună,',
        'Seară faină,',
      ];
    } else {
      // Late night (21-24)
      msgs = [
        'Seară târzie,',
        'Seară faină,',
        'Noapte bună... sau nu,',
      ];
    }
  } // <-- End of REGULAR TIME-BASED GREETINGS else block

  cachedGreeting = msgs[Math.floor(Math.random() * msgs.length)];
  return cachedGreeting;
};

export default function CustomHeader({ title, showRole = true }) {
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();
  const STANDARD_BLUE = isDark ? '#4A90E2' : '#1566B9';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin';
  const isCoordonator = user?.role === 'coordonator';

  let roleText = 'Voluntar';
  let roleColor = '#27ae60';

  if (isAdmin) {
    roleText = 'Admin';
    roleColor = '#E74C3C';
  } else if (isCoordonator) {
    roleText = 'Coordonator';
    roleColor = '#F39C12'; // A nice gold/orange for coordonator
  }

  const headerStyles = createStyles(colors, isDark, STANDARD_BLUE, insets, roleColor);

  return (
    <View style={headerStyles.headerContainer}>
      <View style={headerStyles.headerTitleContainer}>
        {title ? (
          <Text style={headerStyles.headerTitleBig}>{title}</Text>
        ) : (
          <>
            <Text style={headerStyles.greetingText}>{getGreeting().toUpperCase()}</Text>
            <View style={headerStyles.nameRow}>
              <Text style={headerStyles.headerTitleBig} numberOfLines={1}>
                {user?.display_name || user?.first_name || 'Utilizator'}
              </Text>
            </View>
          </>
        )}

        {showRole && !title && (
          <View style={headerStyles.roleTag}>
            <Text style={headerStyles.roleText}>{roleText}</Text>
          </View>
        )}
      </View>

      <View style={headerStyles.headerIcons}>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationHistory')}
          style={headerStyles.iconButton}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {/* Un mic indicator roșu opțional pentru notificări viitoare */}
          {/* <View style={headerStyles.notificationDot} /> */}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={headerStyles.iconButton}
        >
          <Ionicons name="grid" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors, isDark, STANDARD_BLUE, insets, roleColor) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (insets?.top || 25) + 15 : Math.max(insets?.top || 0, 15),
    paddingBottom: 20,
    backgroundColor: colors.background, // Se integrează transparent în ecran, nu mai arată a 'cutie' separată
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleBig: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: roleColor + '20', // Opacitate 20%
    borderWidth: 1,
    borderColor: roleColor + '40',
  },
  roleText: {
    color: roleColor,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    borderWidth: 1.5,
    borderColor: colors.card,
  }
});
