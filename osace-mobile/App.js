import 'react-native-get-random-values'; 
import { decode } from 'base-64';
if(typeof global.atob === 'undefined') {
  global.atob = decode;
}

import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/features/Auth/AuthContext'; 
import MainDrawer from './src/navigation/MainDrawer';
import LoginScreen from './src/features/Auth/screens/LoginScreen';
import RegisterScreen from './src/features/Auth/screens/RegisterScreen';
import LoadingScreen from './src/features/Auth/screens/LoadingScreen';
import NotificationHistoryScreen from './src/features/Notifications/screens/NotificationHistoryScreen';
import ScanScreen from './src/features/Event/screens/ScanScreen';
import ForgotPasswordScreen from './src/features/Auth/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/features/Auth/screens/ResetPasswordScreen';
import OnboardingScreen from './src/features/Auth/screens/OnboardingScreen';
import { PermissionProvider } from './src/features/Auth/PermissionContext';
import NetworkBanner from './src/components/NetworkBanner';

import { ThemeProvider, useThemeColor } from './src/constants/useThemeColor';

// ▼▼▼ NOU: Importăm GlassAlert global ▼▼▼
import GlassAlert, { setCustomAlertRef, CustomAlert } from './src/components/layout/GlassAlert';

// Monkey patch global Alert.alert to use our custom GlassAlert system!
Alert.alert = (title, message, buttons, options) => {
  CustomAlert.alert(title, message, buttons);
};

const Stack = createNativeStackNavigator();

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={{ 
      width: '90%', 
      backgroundColor: 'white', 
      borderRadius: 10, 
      borderLeftWidth: 6, 
      borderLeftColor: '#27ae60',
      padding: 18, 
      marginTop: 15,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.15, 
      shadowRadius: 8, 
      shadowOffset: { width: 0, height: 3 } 
    }}>
      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 }}>
        {text1}
      </Text>
      <Text style={{ fontSize: 15, color: '#34495e', lineHeight: 22 }}>
        {text2}
      </Text>
    </View>
  ),
  
  info: ({ text1, text2 }) => (
    <View style={{ 
      width: '90%', 
      backgroundColor: 'white', 
      borderRadius: 10, 
      borderLeftWidth: 6, 
      borderLeftColor: '#3498db',
      padding: 18, 
      marginTop: 15,
      elevation: 5, 
      shadowColor: '#000', 
      shadowOpacity: 0.15, 
      shadowRadius: 8, 
      shadowOffset: { width: 0, height: 3 } 
    }}>
      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 }}>
        {text1}
      </Text>
      <Text style={{ fontSize: 15, color: '#34495e', lineHeight: 22 }}>
        {text2}
      </Text>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={{ 
      width: '90%', 
      backgroundColor: 'white', 
      borderRadius: 10, 
      borderLeftWidth: 6, 
      borderLeftColor: '#e74c3c',
      padding: 18, 
      marginTop: 15,
      elevation: 5, 
      shadowColor: '#000', 
      shadowOpacity: 0.15, 
      shadowRadius: 8, 
      shadowOffset: { width: 0, height: 3 } 
    }}>
      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 }}>
        {text1}
      </Text>
      <Text style={{ fontSize: 15, color: '#34495e', lineHeight: 22 }}>
        {text2}
      </Text>
    </View>
  )
};

function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_completed').then(value => {
      setIsFirstLaunch(value === null);
    });
  }, []);

  if (authLoading || isFirstLaunch === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff', // Se va suprascrie în ThemeWrapper, dar e bine să avem un default curat
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
        },
        headerBackTitleVisible: false,
      }}
    >
      {user ? (
        <>
          {isFirstLaunch ? (
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ headerShown: false }} 
            />
          ) : null}

          <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
          
          <Stack.Screen 
            name="NotificationHistory" 
            component={NotificationHistoryScreen}
            options={{ title: 'Istoric Notificări', headerShown: true }} 
          />
          <Stack.Screen
            name="ScanScreen"
            component={ScanScreen}
            options={{ title: 'Scanează Prezența', headerShown: true }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ResetPassword" 
            component={ResetPasswordScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function ThemeWrapper() {
  const { colors, isDark } = useThemeColor(); 

  const MyTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={MyTheme}>
      <AppNavigator />
      <GlassAlert ref={setCustomAlertRef} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <ThemeWrapper />
            <NetworkBanner />
          </PermissionProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}