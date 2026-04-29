import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../Auth/AuthContext';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import CustomHeader from '../../../components/layout/CustomHeader';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function AdminMenuScreen({ navigation }) { 
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();

  const styles = createStyles(colors, isDark);

  const renderMenuItem = (title, iconName, targetScreen) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => navigation.navigate(targetScreen)} 
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={32} color={colors.primary} />
      </View>
      <Text style={styles.menuText} numberOfLines={2} textAlign="center">{title}</Text>
    </TouchableOpacity>
  );

  // Permitem accesul atât pentru admin, cât și pentru coordonator
  if (!user || (user.role !== 'admin' && user.role !== 'coordonator')) {
    return (
      <ScreenContainer>
        <Text style={styles.loadingTitle}>Se încarcă / Acces interzis...</Text>
      </ScreenContainer>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <ScreenContainer scrollable={true}>
      <CustomHeader />
      
      <View style={styles.menuList}>
        {/* --- VIZIBIL PENTRU TOȚI (Admin + Coordonator) --- */}
        {renderMenuItem("Activități", "calendar-outline", "AdminManageEvents")}
        {renderMenuItem("Aprobări Ore", "time-outline", "HourRequests")}
        
        {/* --- VIZIBIL DOAR PENTRU ADMIN --- */}
        {isAdmin && (
          <>
            {renderMenuItem("Utilizatori", "people-circle-outline", "AdminUserList")}
            {renderMenuItem("Notificare", "notifications-outline", "SendNotification")}
            {renderMenuItem("Badge-uri", "ribbon-outline", "ManageBadges")}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    color: colors.textPrimary,
  },
  menuList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    // Umbre
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: isDark ? 'rgba(52, 152, 219, 0.15)' : '#eaf4fc', // Un albastru foarte deschis
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
});