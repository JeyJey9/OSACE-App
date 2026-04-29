import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from '../../../components/SkeletonItem';
import ScreenContainer from '../../../components/layout/ScreenContainer';
// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function HistorySkeleton() {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer loading={false} scrollable={true}>
      
      {/* Header-ul cu Total Ore (Mimăm cardul de sumar) */}
      <View style={styles.totalCard}>
         <SkeletonItem width={160} height={20} style={{ marginBottom: 12 }} />
         <SkeletonItem width={100} height={45} />
      </View>

      {/* Titlu Listă (Activitățile tale) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <SkeletonItem width={180} height={26} />
      </View>

      {/* Lista de Carduri de Activitate */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          {/* Titlu Eveniment */}
          <SkeletonItem width="75%" height={20} style={{ marginBottom: 10 }} />
          
          {/* Locație/Categorie */}
          <SkeletonItem width="50%" height={14} style={{ marginBottom: 18 }} />
          
          {/* Footer Card (Data + Iconiță) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <SkeletonItem width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
             <SkeletonItem width={120} height={14} />
          </View>
        </View>
      ))}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  totalCard: {
    // Dacă vrei să simulezi cardul de brand (închis), 
    // poțI folosi isDark ? colors.card : '#0E3035'
    backgroundColor: isDark ? colors.card : '#0E3035', 
    margin: 20,
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    // Umbre și borduri pentru consistență
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 3,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  }
});