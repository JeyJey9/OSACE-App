import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from '../../../components/SkeletonItem';
import ScreenContainer from '../../../components/layout/ScreenContainer';

// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function BadgeSkeleton() {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  return (
    <ScreenContainer loading={false} scrollable={true}>
      
      {/* Titlu Secțiune (Catalog Badge-uri) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 }}>
        <SkeletonItem width={180} height={26} />
      </View>

      <View style={styles.gridContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <View key={i} style={styles.gridItem}>
             {/* Iconița Badge (Cerc) */}
             <SkeletonItem 
               width={70} 
               height={70} 
               borderRadius={35} 
               style={{ marginBottom: 12 }} 
             />
             
             {/* Nume Badge */}
             <SkeletonItem width="80%" height={16} style={{ marginBottom: 6 }} />
             
             {/* Scurtă descriere / Cerință */}
             <SkeletonItem width="100%" height={10} />
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  gridItem: {
    width: '48%', // Păstrăm layout-ul pe două coloane
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    // Umbre și borduri adaptive
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  }
});