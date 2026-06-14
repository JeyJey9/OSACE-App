import React, { useEffect } from 'react';
import { Platform, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../features/Auth/AuthContext';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

import HomeScreen from '../features/Home/screens/HomeScreen';
import MyEventsScreen from '../features/Event/screens/MyEventsScreen';
import HistoryScreen from '../features/History/screens/HistoryScreen';
import NewsFeedScreen from '../features/Feed/screens/NewsFeedScreen';
import ManagementNavigator from './ManagementNavigator';

import { useThemeColor } from '../constants/useThemeColor';
import CustomHeader from '../components/layout/CustomHeader';

const Tab = createMaterialTopTabNavigator();

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

function FloatingTabBar({ state, descriptors, navigation, colors, isDark }) {
  return (
    <View style={[styles.tabBarContainer, {
      backgroundColor: isDark ? 'rgba(25, 30, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.4 : 0.15,
    }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        let iconName;
        if (route.name === 'Activități') {
          iconName = isFocused ? 'list-circle' : 'list-circle-outline';
        } else if (route.name === 'Activitățile Mele') {
          iconName = isFocused ? 'person-circle' : 'person-circle-outline';
        } else if (route.name === 'Istoric') {
          iconName = isFocused ? 'archive' : 'archive-outline';
        } else if (route.name === 'Coordonare') {
          iconName = isFocused ? 'build' : 'build-outline';
        } else if (route.name === 'Admin') {
          iconName = isFocused ? 'shield' : 'shield-outline';
        } else if (route.name === 'Noutăți') {
          iconName = isFocused ? 'newspaper' : 'newspaper-outline';
        }

        const color = isFocused
          ? (isDark ? '#4A90E2' : '#1566B9')
          : colors.textSecondary;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.tabLabel, { color }]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function useIsInsideAdminSubScreen() {
  const activePath = useNavigationState(state => {
    function getActiveRouteNames(navState, names = []) {
      if (!navState) return names;
      const route = navState.routes[navState.index];
      if (!route) return names;
      names.push(route.name);
      if (route.state) {
        return getActiveRouteNames(route.state, names);
      }
      return names;
    }
    return getActiveRouteNames(state);
  });

  if (!activePath || activePath.length === 0) return false;
  const hasAdmin = activePath.includes('Admin') || activePath.includes('Coordonare');
  if (!hasAdmin) return false;

  // Ascunde header-ul doar în submeniuri (când ecranul activ nu este meniul principal)
  const activeLeaf = activePath[activePath.length - 1];
  return activeLeaf !== 'AdminMenu' && activeLeaf !== 'Admin' && activeLeaf !== 'Coordonare';
}

const withHeaderOffset = (Component) => {
  return (props) => {
    const insets = useSafeAreaInsets();
    const headerPaddingTop = Platform.OS === 'android'
      ? (insets?.top || 25) + 12
      : Math.max(insets?.top || 0, 12);
    const paddingTop = headerPaddingTop + 105;

    return (
      <View style={{ flex: 1, paddingTop }}>
        <Component {...props} />
      </View>
    );
  };
};

export default function AppTabs() {
  const { user } = useAuth();
  const { colors, theme } = useThemeColor();
  const isDark = theme === 'dark';
  const hideHeader = useIsInsideAdminSubScreen();

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
    <View style={{ flex: 1 }}>
      {/* Header-ul stă fix absolut în afara pager-ului — se ascunde cu tranziție nativă de transformare */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <CustomHeader isHidden={hideHeader} />
      </View>

      <Tab.Navigator
        tabBarPosition="bottom"
        tabBar={(props) => <FloatingTabBar {...props} colors={colors} isDark={isDark} />}
        screenOptions={({ route }) => ({
          lazy: false,
          swipeEnabled: Platform.OS === 'android' || route.name !== 'Noutăți',
          animationEnabled: true,
        })}
      >
        <Tab.Screen
          name="Noutăți"
          component={withHeaderOffset(NewsFeedScreen)}
        />

        <Tab.Screen
          name="Activități"
          component={withHeaderOffset(HomeScreen)}
        />

        <Tab.Screen
          name="Activitățile Mele"
          component={withHeaderOffset(MyEventsScreen)}
        />

        <Tab.Screen
          name="Istoric"
          component={withHeaderOffset(HistoryScreen)}
        />

        {user && user.role === 'coordonator' && (
          <Tab.Screen
            name="Coordonare"
            component={ManagementNavigator}
          />
        )}

        {user && user.role === 'admin' && (
          <Tab.Screen
            name="Admin"
            component={ManagementNavigator}
          />
        )}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: 20,
    right: 20,
    elevation: 5,
    borderRadius: 35,
    height: 70,
    borderWidth: 3.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
});

