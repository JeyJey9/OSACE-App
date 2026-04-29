import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Share,
  Alert,
  ScrollView, 
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api'; 
import { useThemeColor } from '../../../constants/useThemeColor';
import * as Haptics from 'expo-haptics';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};
const MAX_DESCRIPTION_LENGTH = 100;

export default function PostCard({ item, onPostUpdate, onPostDelete, currentUserRole }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions(); 
  // ▼▼▼ NOU: Preluăm culorile din temă ▼▼▼
  const { colors } = useThemeColor();

  const [isLiked, setIsLiked] = useState(item.is_liked_by_me);
  const [likeCount, setLikeCount] = useState(parseInt(item.likes_count, 10));
  const [commentCount, setCommentCount] = useState(parseInt(item.comment_count, 10) || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleEdit = () => {
    navigation.navigate('Admin', { 
      screen: 'PostForm', 
      params: { 
        postToEdit: {
          id: item.id,
          description: item.description,
          created_at: item.created_at,
          image_urls: item.image_urls
        }
      } 
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Uite ce a postat OSACE: ${item.image_urls ? item.image_urls[0] : 'o postare'}`
      });
    } catch (error) {
      Alert.alert(error.message);
    }
  };
  
  const handleDelete = async () => {
    Alert.alert(
      "Confirmă Ștergerea",
      "Ești sigur că vrei să ștergi această postare?",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Șterge", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/api/posts/${item.id}`);
              if (onPostDelete) onPostDelete(item.id); 
            } catch (err) {
              Alert.alert("Eroare", "Nu s-a putut șterge postarea.");
            }
          }
        }
      ]
    );
  };

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLikeState = !isLiked;
    const newLikeCount = newLikeState ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLikeState);
    setLikeCount(newLikeCount);

    try {
      if (newLikeState) {
        await api.post(`/api/posts/${item.id}/like`);
      } else {
        await api.delete(`/api/posts/${item.id}/like`);
      }
    } catch (error) {
      console.error("Eroare la like/unlike:", error);
      setIsLiked(!newLikeState); 
      setLikeCount(newLikeState ? newLikeCount - 1 : newLikeCount + 1);
      Alert.alert("Eroare", "Acțiunea a eșuat. Încearcă din nou.");
    }
  };

  const toggleText = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleGoToComments = () => {
    navigation.navigate('Comments', { 
      postId: item.id,
      onCommentAdded: () => {
        setCommentCount(prevCount => prevCount + 1);
      }
    });
  };

  // Creăm stilurile dinamic ca să aibă acces la colors
  const styles = createStyles(colors);

  const descriptionExists = item.description && item.description.length > 0;
  const isLongText = descriptionExists && item.description.length > MAX_DESCRIPTION_LENGTH;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Image 
            source={require('../../../assets/osace.png')} 
            style={styles.avatar}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.creatorName}>{item.creator_name}</Text>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        {(currentUserRole === 'admin' || currentUserRole === 'coordonator') && (
          <View style={styles.adminActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButtonAdmin}>
              {/* Iconița de Edit cu Primary Color */}
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#C0392B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.postImageContainer, { width: width }]}
      >
        {Array.isArray(item.image_urls) &&
          item.image_urls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={{ width: width, height: "100%" }}
              resizeMode="contain"
            />
          ))}
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={28} 
            /* Modificat: Inima goală ia culoarea textului */
            color={isLiked ? "#C0392B" : colors.textPrimary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoToComments} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.likeCount}>{likeCount} like-uri</Text>
        {descriptionExists && (
          <>
            <Text style={styles.description}>
                <Text style={styles.creatorName}>{item.creator_name} </Text>
                {isLongText && !isExpanded ? 
                `${item.description.substring(0, MAX_DESCRIPTION_LENGTH)}...` : 
                item.description
              }
            </Text>
            {isLongText && (
              <TouchableOpacity onPress={toggleText}>
                <Text style={styles.showMoreButton}>
                  {isExpanded ? 'Afișează mai puțin' : 'Afișează mai mult'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {commentCount > 0 ? (
          <TouchableOpacity onPress={handleGoToComments}>
            <Text style={styles.commentButtonText}>
              Vezi toate cele {commentCount} comentarii
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleGoToComments}>
            <Text style={styles.commentButtonText}>
              Adaugă un comentariu...
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

// ▼▼▼ Modificat pentru generare dinamică ▼▼▼
const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card, // Fundal card
    marginBottom: 10,
    elevation: 1,
    borderTopWidth: 1, // Opțional: adaugă o bordură foarte fină pentru delimitare mai bună
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  headerInfo: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden', 
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.border, // Fundal avatar fallback
  },
  headerTextContainer: {
    flex: 1, 
    marginRight: 10, 
  },
  creatorName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textPrimary, // Text principal
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary, // Text secundar
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    minHeight: 200, 
    backgroundColor: colors.background, // Fundal unde nu e imagine
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  actionButton: {
    marginRight: 15,
  },
  adminActions: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonAdmin: { 
    marginRight: 15,
  },
  detailsContainer: {
    paddingHorizontal: 15,
    paddingTop: 0,
    paddingBottom: 15,
  },
  likeCount: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  showMoreButton: {
    color: colors.textSecondary,
    fontWeight: '500', 
    marginTop: 5,
  },
  commentButtonText: {
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 8,
  }
});