import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../Auth/AuthContext';
import api from '../../../services/api';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function AdminMenuScreen({ navigation }) { 
  const { user } = useAuth();
  const { colors, isDark } = useThemeColor();

  const [counts, setCounts] = useState({
    hourRequests: 0,
    reportedComments: 0,
    contributionRequests: 0,
    studentVerifications: 0,
  });

  const styles = createStyles(colors, isDark);

  const fetchCounts = async () => {
    try {
      const response = await api.get('/api/admin/pending-counts');
      if (response && response.data) {
        setCounts(response.data);
      }
    } catch (error) {
      console.error('Eroare la preluarea numerelor de cereri pending:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user && (user.role === 'admin' || user.role === 'coordonator')) {
        fetchCounts();
      }
    }, [user])
  );

  const renderMenuItem = (title, iconName, targetScreen, badgeCount = 0) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => navigation.navigate(targetScreen)} 
    >
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
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
      <View style={styles.menuList}>
        {/* --- VIZIBIL PENTRU TOȚI (Admin + Coordonator) --- */}
        {renderMenuItem("Activități", "calendar-outline", "AdminManageEvents")}
        {renderMenuItem("Aprobări Ore", "time-outline", "HourRequests", counts.hourRequests)}
        {renderMenuItem("Cerere Contribuție", "star-outline", "AssignContribution")}
        {renderMenuItem("Rapoarte", "flag-outline", "ReportedComments", counts.reportedComments)}
        
        {/* --- VIZIBIL DOAR PENTRU ADMIN --- */}
        {isAdmin && (
          <>
            {renderMenuItem("Aprobări Contribuții", "shield-checkmark-outline", "ContributionRequests", counts.contributionRequests)}
            {renderMenuItem("Gestionează Contribuții", "list-outline", "ManageContributions")}
            {renderMenuItem("Verificări Studenți", "card-outline", "StudentVerificationRequests", counts.studentVerifications)}
            {renderMenuItem("Utilizatori", "people-circle-outline", "AdminUserList")}
            {renderMenuItem("Notificare", "notifications-outline", "SendNotification")}
            {renderMenuItem("Badge-uri", "ribbon-outline", "ManageBadges")}
            {renderMenuItem("Jurnale", "document-text-outline", "AuditLog")}
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
    position: 'relative',
    // Umbre
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e74c3c', // Vibrant premium red
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
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