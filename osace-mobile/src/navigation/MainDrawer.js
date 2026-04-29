import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';

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
import BadgeCatalogScreen from '../features/BadgeCatalog/screens/BadgeCatalogScreen';
import MapScreen from '../features/Map/screens/MapScreen';
import CustomHeader from '../components/layout/CustomHeader';

const Drawer = createDrawerNavigator();

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

      {/* 2. Profilul Meu */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profilul Meu', 
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }} 
      />
      
      {/* 3. Editează Profil - Ascuns din listă */}
      <Drawer.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ 
          title: 'Setări Cont', 
          headerShown: true,
          drawerItemStyle: { height: 0 } 
        }} 
      />

      {/* 4. Clasament */}
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

      {/* 5. Catalog Realizări */}
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

      {/* 6. Harta Facultății */}
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

      {/* 7. Statistici - Ascuns din listă */}
      <Drawer.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{ 
          title: 'Statistici', 
          headerShown: true,
          drawerItemStyle: { height: 0 }
        }} 
      />
      
      {/* 8. Navigator Admin - Ascuns din listă */}
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