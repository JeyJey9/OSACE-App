// navigation/CoreAppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importăm navigatorul cu Tab-uri
import AppTabs from './AppTabs'; 

// Importăm ecranele care trebuie să apară "peste" tab-uri
import EventDetailScreen from '../features/Event/screens/EventDetailScreen';
import NotificationHistoryScreen from '../features//Notifications/screens/NotificationHistoryScreen';
// ▼▼▼ NOU: Importăm noul ecran de comentarii ▼▼▼
import CommentsScreen from '../features/Feed/screens/CommentsScreen';
import PublicProfileScreen from '../features/Profile/screens/PublicProfileScreen';
import { useThemeColor } from '../constants/useThemeColor';

const Stack = createNativeStackNavigator();

export default function CoreAppNavigator() {
  const { colors, isDark } = useThemeColor();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, 
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPrimary,
        },
        headerBackTitleVisible: false,
      }}
    >
      {/* Ecranul principal este setul tău de Tab-uri */}
      <Stack.Screen
        name="AppTabs"
        component={AppTabs}
        options={{ headerShown: false }} // Tab-urile își gestionează propriul antet
      />

      {/* Ecranul de Detalii Eveniment */}
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.eventTitle || 'Detalii',
          headerShown: false // Folosim header-ul custom din interiorul ecranului
        })}
      />

      {/* Ecranul de Istoric Notificări (pentru butonul clopoțel) */}
      <Stack.Screen
        name="NotificationHistory"
        component={NotificationHistoryScreen}
        options={{ 
          title: 'Istoric Notificări',
          headerShown: true 
        }}
      />
      
      {/* ▼▼▼ NOU: Ecranul pentru Comentarii ▼▼▼ */}
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={{ 
          title: 'Comentarii',
          headerShown: true,
          headerBackTitle: 'Înapoi' // Opțional, pentru iOS
        }} 
      />
      {/* ▲▲▲ SFÂRȘIT BLOC NOU ▲▲▲ */}

      <Stack.Screen 
        name="PublicProfile" 
        component={PublicProfileScreen}
        options={{ 
          title: 'Profil Utilizator',
          headerShown: true,
          headerBackTitle: 'Înapoi'
        }} 
      />

    </Stack.Navigator>
  );
}