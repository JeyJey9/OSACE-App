import React, { useEffect, useCallback, useMemo } from 'react';
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

// ─── FloatingTabBar ─────────────────────────────────────────────────────────
// React.memo previne re-render-uri inutile când pager-ul se actualizează
const FloatingTabBar = React.memo(function FloatingTabBar({ state, descriptors, navigation, colors, isDark }) {
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
});

// ─── useIsInsideAdminSubScreen ───────────────────────────────────────────────
// Selectorul returnează un boolean primitiv — re-render NUMAI când valoarea se schimbă
function useIsInsideAdminSubScreen() {
  return useNavigationState(state => {
    if (!state) return false;

    // Traversăm arborele de navigație fără a aloca un array temporar
    let current = state;
    let hasAdmin = false;
    let leafName = '';

    while (current) {
      const route = current.routes[current.index];
      if (!route) break;
      leafName = route.name;
      if (route.name === 'Admin' || route.name === 'Coordonare') hasAdmin = true;
      current = route.state ?? null;
    }

    if (!hasAdmin) return false;
    return leafName !== 'AdminMenu' && leafName !== 'Admin' && leafName !== 'Coordonare';
  });
}

// ─── Wrapped screens ─────────────────────────────────────────────────────────
// CRITIC: aceste componente trebuie create UNA SINGURĂ DATĂ, în afara lui AppTabs.
// Dacă ar fi create în JSX (withHeaderOffset(HomeScreen)), React le-ar trata ca
// tipuri noi la fiecare render al AppTabs → demontare + remontare completă la swipe = LAG.
const HeaderHeightContext = React.createContext(140);

function HeaderOffsetWrapper({ children }) {
  const headerHeight = React.useContext(HeaderHeightContext);
  return <View style={{ flex: 1, paddingTop: headerHeight }}>{children}</View>;
}

function NewsFeedTab(props) {
  return <HeaderOffsetWrapper><NewsFeedScreen {...props} /></HeaderOffsetWrapper>;
}
function HomeTab(props) {
  return <HeaderOffsetWrapper><HomeScreen {...props} /></HeaderOffsetWrapper>;
}
function MyEventsTab(props) {
  return <HeaderOffsetWrapper><MyEventsScreen {...props} /></HeaderOffsetWrapper>;
}
function HistoryTab(props) {
  return <HeaderOffsetWrapper><HistoryScreen {...props} /></HeaderOffsetWrapper>;
}

// ─── screenOptions — obiect static, nu funcție inline ───────────────────────
// Funcția e necesară pentru a diferi swipeEnabled per-route, dar o memoizăm
function buildScreenOptions({ route }) {
  return {
    lazy: false,
    swipeEnabled: Platform.OS === 'android' || route.name !== 'Noutăți',
    animationEnabled: true,
  };
}

// ─── AppTabs ─────────────────────────────────────────────────────────────────
export default function AppTabs() {
  const { user } = useAuth();
  const { colors, theme } = useThemeColor();
  const isDark = theme === 'dark';
  const hideHeader = useIsInsideAdminSubScreen();

  const insets = useSafeAreaInsets();
  const initialHeaderPaddingTop = Platform.OS === 'android'
    ? (insets?.top || 25) + 12
    : Math.max(insets?.top || 0, 12);
  const [headerHeight, setHeaderHeight] = React.useState(initialHeaderPaddingTop + 85);

  // tabBar callback stabil — nu recrea FloatingTabBar la fiecare render al AppTabs
  const renderTabBar = useCallback(
    (props) => <FloatingTabBar {...props} colors={colors} isDark={isDark} />,
    [colors, isDark]
  );

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
    <HeaderHeightContext.Provider value={headerHeight}>
      <View style={{ flex: 1 }}>
        {/* Header-ul stă fix absolut în afara pager-ului */}
        <View 
          style={styles.headerContainer} 
          pointerEvents={hideHeader ? 'none' : 'auto'}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) setHeaderHeight(height);
          }}
        >
          <CustomHeader isHidden={hideHeader} />
        </View>

        <Tab.Navigator
          tabBarPosition="bottom"
          tabBar={renderTabBar}
          screenOptions={buildScreenOptions}
        >
          <Tab.Screen name="Noutăți" component={NewsFeedTab} />
          <Tab.Screen name="Activități" component={HomeTab} />
          <Tab.Screen name="Activitățile Mele" component={MyEventsTab} />
          <Tab.Screen name="Istoric" component={HistoryTab} />

          {user && user.role === 'coordonator' && (
            <Tab.Screen name="Coordonare" component={ManagementNavigator} />
          )}

          {user && user.role === 'admin' && (
            <Tab.Screen name="Admin" component={ManagementNavigator} />
          )}
        </Tab.Navigator>
      </View>
    </HeaderHeightContext.Provider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
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
