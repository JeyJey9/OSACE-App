import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  PanResponder,
  Dimensions
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
// ▼▼▼ NOU: Importăm hook-ul de culori ▼▼▼
import { useThemeColor } from '../../constants/useThemeColor';

const LoadingState = ({ colors }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export default function ScreenContainer({ 
  children, 
  loading = false, 
  scrollable = true 
}) {
  // ▼▼▼ NOU: Preluăm culorile ▼▼▼
  const { colors } = useThemeColor();
  const navigation = useNavigation();

  // Implementăm manual swipe-ul pentru Drawer ca să nu fie blocat de ScrollView
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { width } = Dimensions.get('window');
        // Capturăm gestul doar dacă începe din primele 25% din stânga
        // Și dacă mișcarea orizontală este mai mare decât cea verticală
        if (
          evt.nativeEvent.pageX < width * 0.25 &&
          gestureState.dx > 15 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        ) {
          return true;
        }
        return false;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 30) {
          try {
            navigation.dispatch(DrawerActions.openDrawer());
          } catch (e) {
            console.log("Eroare la deschiderea drawer-ului din swipe", e);
          }
        }
      }
    })
  ).current;

  const containerStyles = [
    styles.container,
    { backgroundColor: colors.background }, // ◄ Aplicăm culoarea de fundal dinamic
    loading && styles.loadingBackground 
  ];
  
  return (
    <View style={containerStyles} {...panResponder.panHandlers}>
      {loading ? (
        <LoadingState colors={colors} />
      ) : scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      ) : (
        // Non-scrollable: wrap in a View so FlatList contentContainerStyle can add its own padding
        <View style={styles.nonScrollContent}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Am șters backgroundColor de aici, deoarece îl setăm dinamic mai sus
  },
  scrollContent: {
    paddingBottom: 110, // Floating tab bar (70px) + 15px offset + safe area buffer
  },
  nonScrollContent: {
    flex: 1,
  },
  loadingBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});