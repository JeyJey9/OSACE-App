import React, { useEffect } from 'react';
import { Platform, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../features/Auth/AuthContext';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

import HomeScreen from '../features/Home/screens/HomeScreen';
import MyEventsScreen from '../features/Event/screens/MyEventsScreen';
import HistoryScreen from '../features/History/screens/HistoryScreen';
import NewsFeedScreen from '../features/Feed/screens/NewsFeedScreen';
import ManagementNavigator from './ManagementNavigator';
import AssignHoursScreen from '../features/Admin/users/screens/AssignHoursScreen';

// ▼▼▼ NOU: Importăm hook-ul nostru de culori ▼▼▼
import { useThemeColor } from '../constants/useThemeColor';

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[Push Token] Permisiunea pentru notificări a fost refuzată.');
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'abd7ab63-afc2-4280-9e8f-fe551af8581d',
    })).data;
    console.log("[Push Token] Token-ul Expo Push obținut:", token);
  } catch (e) {
    console.error("[Push Token] Eroare la obținerea token-ului:", e);
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C',
    });
  }

  return token;
}

export default function AppTabs() {
  const { user } = useAuth();

  // ▼▼▼ NOU: Obținem culorile și schema curentă ▼▼▼
  const { colors, theme } = useThemeColor();
  const isDark = theme === 'dark';

  useEffect(() => {
    const setupPushNotifications = async () => {
      if (user) {
        console.log('[Push Setup] Utilizator logat, se obține token-ul push...');
        const pushToken = await registerForPushNotificationsAsync();

        if (pushToken) {
          try {
            await api.post('/api/profile/push-token', { token: pushToken });
            console.log('[Push Setup] Token trimis la server cu succes.');
          } catch (error) {
            console.error('[Push Setup] Eroare la trimiterea token-ului la server:', error.response?.data || error.message);
          }
        }
      }
    };

    setupPushNotifications();
  }, [user]);



  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 15,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: isDark ? 'rgba(25, 30, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 35,
          height: 70,
          borderWidth: 3.5,// Increased thickness slightly
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', // Much more visible border
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.4 : 0.15, // Increased shadow for better separation
          shadowRadius: 20,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 12,
          paddingBottom: 12,
        },
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Activități') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Activitățile Mele') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'Istoric') {
            iconName = focused ? 'archive' : 'archive-outline';
          } else if (route.name === 'Coordonare') {
            iconName = focused ? 'build' : 'build-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Noutăți') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          }

          return <Ionicons name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: isDark ? '#4A90E2' : '#1566B9',
        tabBarInactiveTintColor: colors.textSecondary,
      })}
    >
      <Tab.Screen
        name="Noutăți"
        component={NewsFeedScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Activități"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Activitățile Mele"
        component={MyEventsScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Istoric"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />

      {user && user.role === 'coordonator' && (
        <Tab.Screen
          name="Coordonare"
          component={ManagementNavigator}
          options={{ headerShown: false }}
        />
      )}

      {user && user.role === 'admin' && (
        <Tab.Screen
          name="Admin"
          component={ManagementNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Tab.Navigator>
  );
}

