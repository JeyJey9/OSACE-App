import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../constants/useThemeColor';
import { useAuth } from '../../Auth/AuthContext';
import api from '../../../services/api';
import Toast from 'react-native-toast-message';

export default function StudentVerificationScreen({ navigation }) {
  const { colors, isDark } = useThemeColor();
  const { reloadUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const BLUE = isDark ? '#4A90E2' : '#1566B9';

  const pick = async (source) => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Acordă accesul la ' + (source === 'camera' ? 'cameră' : 'galerie') + ' din Setări.');
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true });
    if (!result.canceled && result.assets?.length > 0) setSelectedImage(result.assets[0]);
  };

  const showOptions = () => Alert.alert('Adaugă fotografia', 'Alege sursa', [
    { text: 'Fă o poză acum', onPress: () => pick('camera') },
    { text: 'Alege din galerie', onPress: () => pick('gallery') },
    { text: 'Anulează', style: 'cancel' },
  ]);

  const handleSubmit = async () => {
    if (!selectedImage || !confirmed) return;
    setLoading(true);
    try {
      const uri = selectedImage.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('student_id_image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename, type,
      });
      await api.post('/api/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await reloadUser();
      Toast.show({ type: 'success', text1: 'Cerere trimisă!', text2: 'Vei fi notificat când legitimația ta este verificată.', visibilityTime: 4000 });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Eroare', err.response?.data?.error || 'A apărut o eroare la trimiterea cererii.');
    } finally {
      setLoading(false);
    }
  };

  const s = createStyles(colors, isDark, insets, BLUE);
  const canSubmit = !!selectedImage && confirmed && !loading;

  return (
    <View style={s.container}>
      <View style={s.blobTR} /><View style={s.blobBL} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.heroSection}>
          <View style={[s.heroIconBox, { backgroundColor: BLUE + '18', borderColor: BLUE + '35' }]}>
            <Ionicons name="shield-checkmark" size={40} color={BLUE} />
          </View>
          <Text style={s.heroTitle}>Verificare Student</Text>
          <Text style={s.heroSubtitle}>Încarcă legitimația ta pentru a putea participa la activitățile OSACE.</Text>
        </View>

        <View style={[s.infoStrip, { backgroundColor: BLUE + '12', borderColor: BLUE + '30' }]}>
          <Ionicons name="information-circle-outline" size={18} color={BLUE} />
          <Text style={[s.infoText, { color: BLUE }]}>Fotografia este verificată manual de un administrator. Datele tale sunt confidențiale.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionLabel}>FOTOGRAFIE LEGITIMAȚIE</Text>
          {selectedImage ? (
            <View>
              <Image source={{ uri: selectedImage.uri }} style={s.previewImage} resizeMode="cover" />
              <TouchableOpacity style={[s.changeBtn, { borderColor: BLUE }]} onPress={showOptions}>
                <Ionicons name="camera-outline" size={16} color={BLUE} />
                <Text style={[s.changeBtnText, { color: BLUE }]}>Schimbă fotografia</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.pickerArea} onPress={showOptions} activeOpacity={0.7}>
              <View style={[s.pickerIcon, { backgroundColor: BLUE + '15' }]}>
                <Ionicons name="camera" size={36} color={BLUE} />
              </View>
              <Text style={s.pickerTitle}>Adaugă fotografia legitimației</Text>
              <Text style={s.pickerSub}>Asigură-te că numele și CNP-ul sunt vizibile clar</Text>
              <View style={[s.pickerBadge, { backgroundColor: BLUE }]}>
                <Text style={s.pickerBadgeText}>Cameră sau Galerie</Text>
              </View>
            </TouchableOpacity>
          )}
          {[
            'Fotografiați față legitimației în lumină bună',
            'Asigurați-vă că numele și CNP-ul sunt lizibile',
            'Evitați reflexiile sau umbrele pe document',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <Ionicons name="checkmark-circle" size={15} color="#27ae60" />
              <Text style={s.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* GDPR Disclaimer */}
        <View style={s.gdprBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#f39c12" />
          <Text style={s.gdprText}>
            Conform normelor GDPR privind protecția datelor sensibile (Nume, CNP), fotografia legitimației <Text style={{ fontWeight: '800' }}>va fi ștearsă definitiv și irevocabil de pe serverele noastre</Text> în momentul în care un administrator îți procesează cererea.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.checkRow, confirmed && { borderColor: '#27ae60', backgroundColor: '#27ae6012' }]}
          onPress={() => setConfirmed(!confirmed)} activeOpacity={0.8}
        >
          <View style={[s.checkbox, confirmed && { backgroundColor: '#27ae60', borderColor: '#27ae60' }]}>
            {confirmed && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
          <Text style={s.checkText}>
            Confirm că <Text style={{ fontWeight: '800', color: colors.textPrimary }}>numele și CNP-ul</Text> din legitimația de student sunt informațiile mele personale și aparțin identității mele reale.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: BLUE, shadowColor: BLUE }, !canSubmit && { opacity: 0.45, shadowOpacity: 0 }]}
          onPress={handleSubmit} disabled={!canSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
              <Text style={s.submitText}>Trimite pentru verificare</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={s.footer}>Cererea va fi procesată de echipa administrativă în cel mai scurt timp.</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDark, insets, BLUE) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
  blobTR: { position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: BLUE + (isDark ? '15' : '0D') },
  blobBL: { position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: BLUE + (isDark ? '10' : '08') },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  backBtn: { marginTop: 12, marginBottom: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  heroSection: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  heroIconBox: { width: 84, height: 84, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  infoStrip: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 20, gap: 10 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 19, fontWeight: '500' },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.25 : 0.07, shadowRadius: 16, elevation: 5 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1.5, marginBottom: 14 },
  pickerArea: { borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#D5DCE6', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16 },
  pickerIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  pickerSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 14, lineHeight: 19 },
  pickerBadge: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  pickerBadgeText: { color: 'white', fontWeight: '700', fontSize: 13 },
  previewImage: { width: '100%', height: 220, borderRadius: 14, marginBottom: 12 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, marginBottom: 16 },
  changeBtnText: { fontWeight: '700', fontSize: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  tipText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#C5CDD6', justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  checkText: { flex: 1, fontSize: 13.5, color: colors.textSecondary, lineHeight: 21 },
  gdprBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: isDark ? 'rgba(243,156,18,0.12)' : '#FEF9E7', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(243,156,18,0.3)' },
  gdprText: { flex: 1, fontSize: 13, color: isDark ? '#f0c070' : '#7D5C00', lineHeight: 20 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
