import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColor } from '../../../../constants/useThemeColor';

import FormContainer from '../../../../components/layout/ScreenContainer';
import FormInput from '../../../../components/forms/FormInput';
import FormButton from '../../../../components/forms/FormButton';

export default function PostFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  const postToEdit = route.params?.postToEdit;
  const isEditMode = !!postToEdit?.id;

  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  const [postDate, setPostDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false); 
  const [existingImageUrls, setExistingImageUrls] = useState(null); 

  const resetFormState = () => {
    setDescription('');
    setImages([]); 
    setPostDate(new Date());
    setExistingImageUrls(null); 
  };

  useEffect(() => {
    const handleGoBack = () => {
      navigation.navigate('Noutăți');
    };

    const renderBackButton = () => (
      <TouchableOpacity
        onPress={handleGoBack}
        style={{ marginLeft: 10, padding: 5 }} 
      >
        <Ionicons name="arrow-back" size={24} color="#1C748C" />
      </TouchableOpacity>
    );

    if (isEditMode) {
      navigation.setOptions({ 
        title: 'Editează Postare',
        headerLeft: () => renderBackButton(),
      });
      setDescription(postToEdit.description);
      setPostDate(new Date(postToEdit.created_at)); 
      if (postToEdit.image_urls && postToEdit.image_urls.length > 0) {
        setExistingImageUrls(postToEdit.image_urls[0]);
      }
    } else {
      navigation.setOptions({ 
        title: 'Postare Nouă',
        headerLeft: () => renderBackButton(),
      });
    }
  }, [isEditMode, postToEdit, navigation]);

  const handleConfirmDate = (date) => {
    setPostDate(date);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const pickImages = async () => {
    if (isEditMode) return; 

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Eroare', 'Avem nevoie de permisiunea de a accesa galeria foto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, 
      selectionLimit: 10, 
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => {
        const localUri = asset.uri;
        const fileType = localUri.split('.').pop();
        const fileName = localUri.split('/').pop();
        
        return {
          key: `image-${Date.now()}-${Math.random()}`, 
          uri: localUri,
          type: `image/${fileType}`,
          name: fileName,
        };
      });
      setImages(prevImages => [...prevImages, ...selectedImages]);
    }
  };

  const handleSubmit = async () => {
    if (!description || (!isEditMode && images.length === 0)) { 
      Alert.alert('Eroare', isEditMode ? 'Descrierea este obligatorie.' : 'Te rog adaugă cel puțin o imagine și o descriere.');
      return;
    }
    setLoading(true);
    
    if (isEditMode) {
        try {
            const payload = { 
                description: description,
                created_at: postDate.toISOString(),
            };
            await api.put(`/api/posts/${postToEdit.id}`, payload);
            Alert.alert('Succes', 'Postarea a fost actualizată.');
            navigation.goBack();
        } catch (error) {
            console.error("Eroare la editare:", error.response?.data || error.message);
            Alert.alert('Eroare', 'Actualizarea a eșuat.');
        } finally {
            setLoading(false);
        }
        return;
    }

    const formData = new FormData();
    images.forEach((imageFile) => {
      formData.append('images', imageFile); 
    });
    formData.append('description', description);
    formData.append('created_at', postDate.toISOString()); 

    try {
      await api.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Succes', 'Postarea a fost creată!');
      resetFormState();
      navigation.goBack(); 

    } catch (error) {
      console.error("Eroare la crearea postării:", error.response?.data || error.message);
      Alert.alert('Eroare', 'Nu s-a putut crea postarea.');
    } finally {
      setLoading(false);
    }
  };
  
  const removeImage = (uri) => {
    setImages(prevImages => prevImages.filter(image => image.uri !== uri));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FormContainer>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.card}>
            <Text style={styles.header}>{isEditMode ? 'Editează Postare' : 'Postare Nouă'}</Text>

            <View style={styles.imagePickerContainer}>
            <DraggableFlatList
                horizontal
                data={images}
                keyExtractor={(item) => item.key} 
                onDragEnd={({ data }) => setImages(data)} 
                ListEmptyComponent={() => (
                    (isEditMode && existingImageUrls) ? (
                        <View style={styles.imagePreviewContainer}>
                          <Image source={{ uri: existingImageUrls }} style={styles.imagePreview} resizeMode="contain" />
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImages} disabled={isEditMode}>
                            <Ionicons name="camera" size={40} color={colors.textSecondary} />
                            <Text style={styles.imagePlaceholderText}>Alege Imagini (max 10)</Text>
                        </TouchableOpacity>
                    )
                )}
                renderItem={({ item, drag, isActive }) => (
                  <TouchableOpacity
                    style={[ styles.imagePreviewContainer, { opacity: isActive ? 0.5 : 1 }]}
                    onLongPress={drag}
                  >
                    <Image source={{ uri: item.uri }} style={styles.imagePreview} resizeMode="contain" />
                    {!isEditMode && (
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(item.uri)}>
                        <Ionicons name="close-circle" size={24} color="#C0392B" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )}
            />
            {images.length > 0 && !isEditMode && (
                <TouchableOpacity style={styles.addMoreButton} onPress={pickImages}>
                    <Ionicons name="add-circle" size={30} color={colors.primary} />
                </TouchableOpacity>
            )}
          </View>
          </View>

          <View style={styles.card}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Data Postării</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {postDate.toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}
                </Text>
              </TouchableOpacity>
            </View>
            
            <FormInput
              label="Descriere"
              placeholder="Adaugă o descriere..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
            />
          </View>
          
          <View style={styles.buttonWrapper}>
            <FormButton
              title={isEditMode ? "Salvează Modificările" : "Publică Postarea"}
              iconName={isEditMode ? "save-outline" : "send-outline"}
              onPress={handleSubmit} 
              loading={loading}
              variant={isEditMode ? "primary" : "danger"}
            />
          </View>
        </KeyboardAvoidingView>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="datetime"
          date={postDate}
          onConfirm={handleConfirmDate}
          onCancel={handleCancelDate}
          isDarkModeEnabled={isDark}
        />
      </FormContainer>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: colors.textPrimary },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateCol: { marginBottom: 15 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12 },
  dateIcon: { marginRight: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  imagePickerContainer: { height: 250, marginBottom: 5 },
  imagePicker: { width: 250, height: 250, backgroundColor: isDark ? colors.border : '#f8f9fa', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary + '80', borderStyle: 'dashed' },
  imagePlaceholderText: { color: colors.textSecondary, marginTop: 10, fontWeight: '600' },
  imagePreviewContainer: { width: 250, height: 250, marginRight: 10, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', borderRadius: 12 },
  addMoreButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: colors.card, borderRadius: 20, padding: 2, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  buttonWrapper: { marginTop: 10, marginBottom: 40 },
});
