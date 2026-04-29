import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from '../../../components/SkeletonItem';
import ScreenContainer from '../../../components/layout/ScreenContainer';

// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function LeaderboardSkeleton() {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer loading={false} scrollable={true}>
      {/* 1. Secțiunea Podium (Top 3) */}
      <View style={styles.podiumContainer}>
        
        {/* Locul 2 (Stânga) */}
        <View style={styles.podiumPosition}>
            <SkeletonItem width={55} height={55} borderRadius={27.5} style={{ marginBottom: 8 }} />
            <SkeletonItem width={65} height={90} borderRadius={8} />
        </View>

        {/* Locul 1 (Centru - Mai înalt) */}
        <View style={[styles.podiumPosition, { marginHorizontal: 15, paddingBottom: 20 }]}>
            <SkeletonItem width={75} height={75} borderRadius={37.5} style={{ marginBottom: 8 }} />
            <SkeletonItem width={85} height={130} borderRadius={8} />
        </View>

        {/* Locul 3 (Dreapta) */}
        <View style={styles.podiumPosition}>
            <SkeletonItem width={50} height={50} borderRadius={25} style={{ marginBottom: 8 }} />
            <SkeletonItem width={60} height={70} borderRadius={8} />
        </View>
      </View>

      {/* 2. Titlu / Filtre (Optional, dacă ai în UI real) */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <SkeletonItem width={140} height={20} />
      </View>

      {/* 3. Lista de sub podium (Locurile 4+) */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.listItem}>
           {/* Rank (Poziția) */}
           <SkeletonItem width={25} height={18} style={{ marginRight: 15 }} />
           
           {/* Avatar */}
           <SkeletonItem width={42} height={42} borderRadius={21} style={{ marginRight: 12 }} />
           
           {/* Nume Voluntar */}
           <View style={{ flex: 1 }}>
             <SkeletonItem width="60%" height={16} />
           </View>

           {/* Scor / Ore */}
           <SkeletonItem width={40} height={16} borderRadius={4} />
        </View>
      ))}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 40,
    paddingBottom: 25,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9f9f9', // O nuanță discretă pentru zona de podium
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  podiumPosition: {
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    // Stiluri pentru consistență (Umbre/Borduri)
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 3,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  }
});