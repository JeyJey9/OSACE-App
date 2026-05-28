import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Image
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';

const MapScreen = ({ navigation }) => {
  const { colors, isDark } = useThemeColor();

  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerShown: true,
        title: 'Harta Facultății'
      });
    }
  }, [navigation]);

  const handleStressBerbece = () => {
    Alert.alert(
      "✉️ Misiune: Stresează-l pe Berbece",
      "Ești pe cale să ceri stadiul hărții. Vrei să-i trimiți un feedback direct designerului nostru pentru a grăbi procesul?",
      [
        { text: "Mai târziu", style: "cancel" },
        {
          text: "Da, stresează-l!",
          onPress: () => {
            Alert.alert("Succes!", "Petiția ta a fost înregistrată. Berbece a primit o notificare mentală să deschidă Figma! 🎨🚀");
          }
        }
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        {/* Animated-like construct icon container */}
        <View style={styles.iconContainer}>
          <Ionicons name="construct" size={50} color={colors.primary} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Work In Progress</Text>
          </View>
        </View>

        <Text style={styles.title}>Șantierele OSACE 🏗️</Text>

        <Text style={styles.subtitle}>
          Harta interactivă a facultății este în plină fază de proiectare și construcție digitală.
        </Text>

        {/* Playful alert box */}
        <View style={styles.jokeCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#f39c12" style={styles.jokeIcon} />
          <View style={styles.jokeTextContainer}>
            <Text style={styles.jokeTitle}>Vrei harta mai repede? ⏰</Text>
            <Text style={styles.jokeText}>
              Mergi și stresează-l pe Berbece să termine designul! Fiecare mesaj îl aduce cu 5 minute mai aproape de finalizare.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={handleStressBerbece}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.actionButtonText}>Stresează-l pe Berbece</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 120,
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  jokeCard: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(243, 156, 18, 0.08)' : '#fef9eb',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(243, 156, 18, 0.2)' : '#fbeec7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    alignItems: 'flex-start',
    width: '100%',
  },
  jokeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  jokeTextContainer: {
    flex: 1,
  },
  jokeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: isDark ? '#f5b041' : '#b7791f',
    marginBottom: 4,
  },
  jokeText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default MapScreen;