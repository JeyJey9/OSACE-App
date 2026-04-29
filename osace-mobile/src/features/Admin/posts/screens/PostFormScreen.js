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
      if (isEditMode) {
        navigation.navigate('Noutăți');
      } else {
        navigation.navigate('Admin', { screen: 'AdminMenu' });
      }
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
          <Text style={styles.header}>{isEditMode ? 'Editează Postare' : 'Postare Nouă'}</Text>

          <View style={styles.imagePickerContainer}>
            <DraggableFlatList
                horizontal
                data={images}
                keyExtractor={(item) => item.key} 
                onDragEnd={({ data }) => setImages(data)} 
                ListEmptyComponent={() => (
                    (isEditMode && existingImageUrls) ? (
                        <Image source={{ uri: existingImageUrls }} style={styles.imagePreview} />
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
                    <Image source={{ uri: item.uri }} style={styles.imagePreview} />
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
          
          <Text style={styles.label}>Data Postării</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={styles.dateText}>
              {postDate.toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}
            </Text>
          </TouchableOpacity>
          
          <FormInput
            label="Descriere"
            placeholder="Adaugă o descriere..."
            value={description}
            onChangeText={setDescription}
            multiline={true}
          />
          
          <FormButton
            title={isEditMode ? "Salvează Modificările" : "Publică Postarea"}
            iconName={isEditMode ? "save-outline" : "send-outline"}
            onPress={handleSubmit} 
            loading={loading}
            variant={isEditMode ? "primary" : "danger"}
          />
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
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: colors.textPrimary },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginTop: 15, marginBottom: 5 },
  dateButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 15, paddingHorizontal: 15, minHeight: 50, justifyContent: 'center', marginBottom: 10 },
  dateText: { fontSize: 16, color: colors.textPrimary },
  imagePickerContainer: { height: 250, marginBottom: 15 },
  imagePicker: { width: 250, height: 250, backgroundColor: isDark ? colors.border : '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  imagePlaceholderText: { color: colors.textSecondary, marginTop: 10 },
  imagePreviewContainer: { width: 250, height: 250, marginRight: 10 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: 5, right: 5, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', borderRadius: 12 },
  addMoreButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: colors.card, borderRadius: 20, padding: 2 },
});
