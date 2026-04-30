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

import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId, onCommentAdded } = route.params;

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
      Alert.alert("Eroare", "Nu s-au putut încărca comentariile.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchComments(); }, [postId]));

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
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      Alert.alert("Eroare", "Comentariul tău nu a putut fi trimis.");
    } finally {
      setSending(false);
    }
  };

  const styles = createStyles(colors, isDark);

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

        <View style={styles.commentContentWrapper}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={goToProfile}>
              <Text style={styles.commentName} numberOfLines={1}>{item.full_name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              • {formatDistanceToNow(new Date(item.created_at), { addSuffix: false, locale: ro })}
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CommentItem item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.border} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>Fii primul care comentează!</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Adaugă un comentariu..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendComment}
              disabled={sending || !newComment.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="paper-plane"
                  size={24}
                  color={newComment.trim() ? colors.primary : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.background },
  listContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' },

  commentContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: colors.border },
  commentAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: isDark ? colors.card : '#f0f0f0', justifyContent: 'center', alignItems: 'center' },

  commentContentWrapper: { flex: 1, justifyContent: 'center' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentName: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },
  commentTime: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  commentContent: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },

  inputBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: isDark ? colors.card : '#f0f2f5', // Culoare standard tip Facebook pentru input
    borderRadius: 20,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    padding: 8,
    marginLeft: 5,
    marginBottom: 2 // Aliniere frumoasă jos
  },
});