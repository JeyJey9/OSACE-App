import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

// ▼▼▼ NOU: Importuri pentru Temă și Layout ▼▼▼
import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId, onCommentAdded } = route.params;
  
  // ▼▼▼ NOU: Preluăm culorile ▼▼▼
  const { colors, isDark } = useThemeColor();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Eroare la preluarea comentariilor:", error);
      Alert.alert("Eroare", "Nu s-au putut încărca comentariile.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComments();
    }, [postId])
  );

  const handleSendComment = async () => {
    if (newComment.trim() === '' || sending) return;
    setSending(true);
    try {
      const response = await api.post(`/api/posts/${postId}/comments`, {
        content: newComment.trim()
      });
      setComments(prevComments => [...prevComments, response.data]);
      setNewComment('');
      if (onCommentAdded) onCommentAdded();
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      Alert.alert("Eroare", "Comentariul tău nu a putut fi trimis.");
    } finally {
      setSending(false);
    }
  };

  const styles = createStyles(colors, isDark);

  // ▼▼▼ MUTAT ÎN INTERIOR: Pentru acces la styles/colors ▼▼▼
  const CommentItem = ({ item }) => {
    const goToProfile = () => navigation.navigate('PublicProfile', { userId: item.user_id });

    return (
      <View style={styles.commentContainer}>
        <TouchableOpacity onPress={goToProfile}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: `${api.defaults.baseURL}${item.avatar_url}` }} 
              style={styles.commentAvatar} 
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Ionicons name="person" size={18} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <TouchableOpacity style={styles.commentNameWrapper} onPress={goToProfile}>
              <Text style={styles.commentName} numberOfLines={1}>{item.full_name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime} numberOfLines={1}> 
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ro })}
            </Text>
          </View>
          <Text style={styles.commentContent}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <ScreenContainer loading={true} />;

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={({ item }) => <CommentItem item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Fii primul care comentează!</Text>
            </View>
          }
        />

        {/* Bara de Input Adaptivă */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Scrie un comentariu..."
            placeholderTextColor={colors.textSecondary}
            multiline
            keyboardAppearance={isDark ? 'dark' : 'light'}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: colors.primary }]} 
            onPress={handleSendComment}
            disabled={sending || !newComment.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.background },
  listContainer: { padding: 15, paddingBottom: 30, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  
  commentContainer: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: colors.border },
  commentAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: isDark ? colors.border : '#eee', justifyContent: 'center', alignItems: 'center' },
  
  commentBubble: { 
    flex: 1, 
    backgroundColor: colors.card, 
    borderRadius: 18, 
    padding: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  commentNameWrapper: { flex: 1, marginRight: 8 },
  commentName: { fontWeight: 'bold', fontSize: 14, color: colors.textPrimary },
  commentTime: { fontSize: 11, color: colors.textSecondary },
  commentContent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },

  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Padding extra pentru home indicator
    borderTopWidth: 1, 
    borderTopColor: colors.border, 
    backgroundColor: colors.card 
  },
  textInput: { 
    flex: 1, 
    backgroundColor: colors.background, 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    fontSize: 16, 
    color: colors.textPrimary,
    maxHeight: 100, 
    marginRight: 10,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border
  },
  sendButton: { borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});