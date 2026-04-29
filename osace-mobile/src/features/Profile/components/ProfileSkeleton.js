import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from '../../../components/SkeletonItem';
import ScreenContainer from '../../../components/layout/ScreenContainer';
// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function ProfileSkeleton() {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer loading={false} scrollable={false}>
      
      {/* 1. Header-ul (Avatar + Nume) */}
      <View style={styles.headerContainer}>
        {/* Avatar (Cerc) */}
        <SkeletonItem width={90} height={90} borderRadius={45} style={{ marginBottom: 15 }} />
        
        {/* Nume (Linie lungă) */}
        <SkeletonItem width={200} height={26} style={{ marginBottom: 10 }} />
        
        {/* Rol (Linie scurtă) */}
        <SkeletonItem width={120} height={18} />
      </View>

      {/* 2. Stats Card (Ore) */}
      <View style={styles.card}>
        <View style={{ alignItems: 'center' }}>
          {/* Număr mare */}
          <SkeletonItem width={70} height={45} style={{ marginBottom: 8 }} />
          {/* Label */}
          <SkeletonItem width={110} height={16} />
        </View>
      </View>

      {/* 3. Info Card (Email) */}
      <View style={styles.card}>
        <View style={{ alignSelf: 'flex-start' }}>
            <SkeletonItem width={130} height={14} style={{ marginBottom: 8 }} />
            <SkeletonItem width={220} height={20} />
        </View>
      </View>

      {/* 4. Badges (Titlu + Cercuri) */}
      <View style={styles.badgesContainer}>
        <SkeletonItem width={140} height={22} style={{ marginBottom: 20 }} />
        
        <View style={{ flexDirection: 'row' }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginRight: 20, alignItems: 'center' }}>
              <SkeletonItem width={65} height={65} borderRadius={32.5} style={{ marginBottom: 8 }} />
              <SkeletonItem width={55} height={12} />
            </View>
          ))}
        </View>
      </View>

    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 35,
    backgroundColor: colors.card,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    // Adăugăm border pentru Dark Mode pentru consistență cu ProfileScreen
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
  },
  badgesContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
});