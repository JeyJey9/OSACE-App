import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl // <-- NOU: Import RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../features/Auth/AuthContext'; 
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import PostCard from '../components/PostCard'; 
import FeedSkeleton from '../components/FeedSkeleton';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';
import EmptyState from '../../../components/EmptyState';
import CustomHeader from '../../../components/layout/CustomHeader';

export default function NewsFeedScreen() {
  const navigation = useNavigation();
  const { user, reloadUser } = useAuth();
  // Tab name differs by role: admin uses 'Admin', coordinator uses 'Coordonare'
  const managementTabName = user?.role === 'admin' ? 'Admin' : 'Coordonare';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // <-- NOU: state pentru refresh

  const { colors } = useThemeColor();

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Eroare la preluarea postărilor:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca noutățile.");
    } finally {
      setLoading(false);
    }
  };

  // ▼▼▼ NOU: Funcția de refresh ▼▼▼
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPosts(),
      reloadUser()
    ]);
    setRefreshing(false);
  }, [reloadUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      fetchPosts();
    }, [])
  );

  const onPostUpdate = (updatedPost) => {
    setPosts(currentPosts => 
      currentPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
    );
  };
  
  const onPostDelete = (deletedPostId) => {
    setPosts(currentPosts => 
      currentPosts.filter(p => p.id !== deletedPostId)
    );
  };

  const styles = createStyles(colors);

  return (
    <ScreenContainer scrollable={false}>
      <CustomHeader />
      {loading ? (
        <FeedSkeleton />
      ) : (
        <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            item={item} 
            onPostUpdate={onPostUpdate} 
            onPostDelete={onPostDelete}
            currentUserRole={user?.role} 
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        // ▼▼▼ NOU: Adăugat refreshControl ▼▼▼
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <EmptyState
            illustration="no_feed"
            title="Nicio noutate încă"
            subtitle="Nu există postaje în momentul de faţă. Revino mai târziu!"
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      )}

      {(user?.role === 'admin' || user?.role === 'coordonator') && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate(managementTabName, { screen: 'PostForm' })}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors) => StyleSheet.create({
  listContent: { paddingBottom: 130 }, // Floating tab bar clearance + FAB
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  fab: { position: 'absolute', right: 20, bottom: 100, backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
});