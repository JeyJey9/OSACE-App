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
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useAuth } from '../../Auth/AuthContext';

import { useThemeColor } from '../../../constants/useThemeColor';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId, onCommentAdded } = route.params;
  const { user } = useAuth();

  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const flatListRef = useRef(null);

  const isManager = user?.role === 'admin' || user?.role === 'coordonator';

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

  // ── Menu Handlers ──
  const openMenu = (comment) => {
    setSelectedComment(comment);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedComment(null);
  };

  const handleDeleteComment = () => {
    closeMenu();
    Alert.alert(
      'Confirmă Ștergerea',
      'Ești sigur că vrei să ștergi acest comentariu?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge', style: 'destructive', onPress: async () => {
            try {
              await api.delete(`/api/posts/comments/${selectedComment.id}`);
              setComments(prev => prev.filter(c => c.id !== selectedComment.id));
            } catch {
              Alert.alert('Eroare', 'Nu s-a putut șterge comentariul.');
            }
          }
        },
      ]
    );
  };

  const handleReportComment = async () => {
    closeMenu();
    try {
      await api.post(`/api/posts/comments/${selectedComment.id}/report`);
      Alert.alert('Raport trimis', 'Comentariul a fost raportat. Echipa de administrare va analiza raportul.');
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('Info', error.response.data.error);
      } else {
        Alert.alert('Eroare', 'Nu s-a putut trimite raportul.');
      }
    }
  };

  const handleBlockUser = () => {
    closeMenu();
    const userName = selectedComment.display_name || 'acest utilizator';
    Alert.alert(
      'Blochează Utilizator',
      `Ești sigur că vrei să blochezi pe ${userName}? Nu vei mai vedea comentariile acestui utilizator.`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Blochează', style: 'destructive', onPress: async () => {
            try {
              await api.post(`/api/posts/users/${selectedComment.user_id}/block`);
              // Re-fetch comments so blocked user's comments disappear
              fetchComments();
              Alert.alert('Utilizator blocat', `${userName} a fost blocat.`);
            } catch {
              Alert.alert('Eroare', 'Nu s-a putut bloca utilizatorul.');
            }
          }
        },
      ]
    );
  };

  const styles = createStyles(colors, isDark, insets);
  const isOwnComment = selectedComment?.user_id === (user?.userId || user?.id);

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
            <TouchableOpacity onPress={goToProfile} style={{ flex: 1 }}>
              <Text style={styles.commentName} numberOfLines={1}>{item.display_name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              • {formatDistanceToNow(new Date(item.created_at), { addSuffix: false, locale: ro })}
            </Text>
            <TouchableOpacity 
              onPress={() => openMenu(item)} 
              style={styles.menuDotsButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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

      {/* ── Action Menu Modal ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {/* Delete — only for admin/coordinator */}
            {isManager && (
              <>
                <TouchableOpacity style={styles.modalOption} onPress={handleDeleteComment}>
                  <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  </View>
                  <Text style={[styles.modalOptionText, { color: '#E74C3C' }]}>Șterge comentariul</Text>
                </TouchableOpacity>
                <View style={styles.modalDivider} />
              </>
            )}

            {/* Report — hidden on own comments */}
            {!isOwnComment && (
              <>
                <TouchableOpacity style={styles.modalOption} onPress={handleReportComment}>
                  <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(243, 156, 18, 0.1)' }]}>
                    <Ionicons name="flag-outline" size={20} color="#f39c12" />
                  </View>
                  <Text style={styles.modalOptionText}>Raportează comentariul</Text>
                </TouchableOpacity>
                <View style={styles.modalDivider} />
              </>
            )}

            {/* Block — hidden on own comments */}
            {!isOwnComment && (
              <>
                <TouchableOpacity style={styles.modalOption} onPress={handleBlockUser}>
                  <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
                    <Ionicons name="ban-outline" size={20} color="#C0392B" />
                  </View>
                  <Text style={styles.modalOptionText}>
                    Blochează pe {selectedComment?.display_name || 'utilizator'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.modalDivider} />
              </>
            )}

            {/* Cancel */}
            <TouchableOpacity style={styles.modalOption} onPress={closeMenu}>
              <View style={[styles.modalIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f5' }]}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.textSecondary }]}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors, isDark, insets) => StyleSheet.create({
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

  menuDotsButton: {
    paddingLeft: 8,
    paddingVertical: 2,
  },

  inputBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? Math.max(insets?.bottom || 0, 10) : 10,
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

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f5',
    marginHorizontal: 4,
  },
});