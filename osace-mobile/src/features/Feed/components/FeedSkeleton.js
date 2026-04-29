import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonItem from '../../../components/SkeletonItem';
import ScreenContainer from '../../../components/layout/ScreenContainer';

// ▼▼▼ NOU: Importăm sistemul de teme ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';

export default function FeedSkeleton() {
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  // Simulăm 2 postări pentru loading state
  return (
    <ScreenContainer loading={false} scrollable={true}>
      {[1, 2].map((item) => (
        <View key={item} style={styles.postContainer}>
          
          {/* Header Postare (Avatar + Nume + Dată) */}
          <View style={styles.header}>
            <SkeletonItem 
              width={45} 
              height={45} 
              borderRadius={22.5} 
              style={{ marginRight: 12 }} 
            />
            <View>
              <SkeletonItem width={140} height={16} style={{ marginBottom: 6 }} />
              <SkeletonItem width={90} height={12} />
            </View>
          </View>
          
          {/* Imaginea principală a postării */}
          <SkeletonItem 
            width="100%" 
            height={220} 
            borderRadius={12} 
            style={{ marginBottom: 15 }} 
          />
          
          {/* Footer / Descriere (Linii de text) */}
          <SkeletonItem width="95%" height={15} style={{ marginBottom: 8 }} />
          <SkeletonItem width="70%" height={15} style={{ marginBottom: 15 }} />

          {/* Simulăm zona de interacțiune (Like/Comment) */}
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <SkeletonItem width={60} height={25} borderRadius={12} />
            <SkeletonItem width={60} height={25} borderRadius={12} />
          </View>
        </View>
      ))}
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  postContainer: {
    backgroundColor: colors.card,
    marginBottom: 20,
    padding: 15,
    marginHorizontal: 15, // Adăugăm padding lateral pentru a nu atinge marginile ecranului
    borderRadius: 16,
    // Umbre discrete
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 5,
    // Bordură fină pentru Dark Mode
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  }
});