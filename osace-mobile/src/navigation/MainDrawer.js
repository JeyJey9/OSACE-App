import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Dimensions } from 'react-native';

// Hook-ul pentru temă
import { useThemeColor } from '../constants/useThemeColor';

// Navigatoare și Ecrane
import CoreAppNavigator from './CoreAppNavigator';
import ProfileScreen from '../features/Profile/screens/ProfileScreen';
import CustomDrawerContent from './components/CustomDrawerContent'; 
import ManagementNavigator from './ManagementNavigator';
import StatisticsScreen from '../features/Admin/screens/StatisticsScreen';
import LeaderboardScreen from '../features/Leaderboard/screens/LeaderboardScreen';
import EditProfileScreen from '../features/Profile/screens/EditProfileScreen';
import DataExportScreen from '../features/Profile/screens/DataExportScreen';
import NotificationPreferencesScreen from '../features/Profile/screens/NotificationPreferencesScreen';
import BlockedUsersScreen from '../features/Profile/screens/BlockedUsersScreen';
import BadgeCatalogScreen from '../features/BadgeCatalog/screens/BadgeCatalogScreen';
import MapScreen from '../features/Map/screens/MapScreen';
import CustomHeader from '../components/layout/CustomHeader';

const Drawer = createDrawerNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  const { colors, isDark } = useThemeColor();

  return (
    <ProfileStack.Navigator
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
        headerBackTitle: ' ', // Ensures clean back button arrow on iOS
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profilul Meu',
          header: ({ options }) => <CustomHeader title={options.title} />,
          headerShown: true
        }} 
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Setări Cont' }} 
      />
      <ProfileStack.Screen 
        name="DataExport" 
        component={DataExportScreen} 
        options={{ title: 'Export Date Personale' }} 
      />
      <ProfileStack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen} 
        options={{ title: 'Preferințe Notificări' }} 
      />
      <ProfileStack.Screen 
        name="BlockedUsers" 
        component={BlockedUsersScreen} 
        options={{ title: 'Utilizatori Blocați' }} 
      />
    </ProfileStack.Navigator>
  );
}

export default function MainDrawer() {
  const { colors } = useThemeColor();

  return (
    <Drawer.Navigator
      // Folosim componenta custom pentru a controla header-ul meniului lateral
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        header: ({ options }) => <CustomHeader title={options.title} />,
        // Stilul containerului Drawer (meniul lateral propriu-zis)
        drawerStyle: {
          backgroundColor: colors.card,
          width: 280,
        },
        // Culori pentru rândurile din meniu
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: colors.primary + '15', // Fundal transparent colorat pentru item-ul activ
        drawerLabelStyle: {
          fontWeight: '600',
          marginLeft: -10, // Aduce textul mai aproape de iconiță
        },
        swipeEdgeWidth: Dimensions.get('window').width * 0.25,
      })}
    >
      {/* 1. Ecranul Principal (Tabs) - Ascuns din listă */}
      <Drawer.Screen 
        name="HomeTabs" 
        component={CoreAppNavigator} 
        options={{ 
          title: 'Acasă', 
          headerShown: false,
          drawerItemStyle: { height: 0 } 
        }} 
      />

      {/* 2. Profilul Meu (Folosește acum Stack-ul de Profil cu swipe dezactivat) */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ 
          title: 'Profilul Meu', 
          headerShown: false, // Stack navigator desenează propriul antet / ascundem antetul Drawer-ului
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }} 
      />

      {/* 3. Clasament */}
      <Drawer.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{ 
          title: 'Clasament', 
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          )
        }} 
      />

      {/* 4. Catalog Realizări */}
      <Drawer.Screen 
        name="BadgeCatalog" 
        component={BadgeCatalogScreen} 
        options={{ 
          title: 'Catalog Realizări', 
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          )
        }} 
      />

      {/* 5. Harta Facultății */}
      <Drawer.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          title: 'Harta Facultății',
          headerShown: true,
          drawerIcon: ({color, size}) => (
            <Ionicons name="map-outline" size={size} color={color} />
          )
        }}
      />

      {/* 6. Statistici - Ascuns din listă */}
      <Drawer.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{ 
          title: 'Statistici', 
          headerShown: true,
          drawerItemStyle: { height: 0 }
        }} 
      />
      
      {/* 7. Navigator Admin - Ascuns din listă */}
      <Drawer.Screen 
        name="Management" 
        component={ManagementNavigator} 
        options={{ 
          title: 'Management',
          headerShown: false,
          drawerItemStyle: { height: 0 }
        }} 
      />
    </Drawer.Navigator>
  );
}