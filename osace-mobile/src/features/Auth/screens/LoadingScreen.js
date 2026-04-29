import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../AuthContext'; 

// Am scos tot ce ținea de AsyncStorage, api, și Notifications.
// AuthContext se ocupă de token, iar AppTabs.js se ocupă de notificări.

export default function LoadingScreen({ navigation }) {
  // 1. Ascultăm starea reală a autentificării direct din Context
  const { user, loading } = useAuth(); 

  useEffect(() => {
    // 2. Așteptăm ca AuthContext să termine de verificat token-ul
    //    (când 'loading' devine 'false')
    if (!loading) {
      if (user) {
        // 3. Dacă AuthContext a găsit un user, mergem la Main
        navigation.replace('Main');
      } else {
        // 4. Dacă AuthContext NU a găsit un user, mergem la Login
        navigation.replace('Login');
      }
    }
  }, [loading, user, navigation]); // Acest hook rulează când 'loading' sau 'user' se schimbă

  // 5. Cât timp AuthContext lucrează (loading === true),
  //    acest ecran afișează doar un spinner.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1C748C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});