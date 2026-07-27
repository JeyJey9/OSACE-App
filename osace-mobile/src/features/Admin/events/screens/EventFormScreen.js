import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import api from '../../../../services/api';
import Toast from 'react-native-toast-message';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Ionicons from '@expo/vector-icons/Ionicons';
import FormContainer from '../../../../components/layout/ScreenContainer';
import FormInput from '../../../../components/forms/FormInput';
import FormButton from '../../../../components/forms/FormButton';
import { useThemeColor } from '../../../../constants/useThemeColor';

const CATEGORY_OPTIONS = {
  sedinta: { label: 'Ședință', icon: 'briefcase', activeColor: '#3498db' },
  social: { label: 'Social', icon: 'people', activeColor: '#27ae60' },
  proiect: { label: 'Proiect', icon: 'bulb', activeColor: '#f39c12' },
};

export default function EventFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { colors, isDark } = useThemeColor();

  const eventToEdit = route.params?.eventToEdit;
  const eventToDuplicate = route.params?.eventToDuplicate;
  const isEditMode = !!eventToEdit;
  const isDuplicateMode = !!eventToDuplicate;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('1'); 
  const [category, setCategory] = useState('social'); 
  const [allowOvertime, setAllowOvertime] = useState(true);
  const [sendNotification, setSendNotification] = useState(false);
  
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600 * 1000));
  
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(null); 

  useLayoutEffect(() => {
    let headerTitle = 'Activitate Nouă';
    if (isEditMode) headerTitle = 'Editează Activitate';
    if (isDuplicateMode) headerTitle = 'Duplică Activitate';

    navigation.setOptions({
      title: headerTitle,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textPrimary, isEditMode, isDuplicateMode]);

  useEffect(() => { if (!isFocused) setPickerVisible(null); }, [isFocused]);

  useEffect(() => {
    if (isEditMode) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setStartTime(new Date(eventToEdit.start_time));
      setEndTime(new Date(eventToEdit.end_time));
      setDuration(String(eventToEdit.duration_hours || '1'));
      setCategory(eventToEdit.category || 'social');
      setAllowOvertime(eventToEdit.allow_overtime !== false);
    } else if (isDuplicateMode) {
      setTitle(eventToDuplicate.title || '');
      setDescription(eventToDuplicate.description || '');
      setLocation(eventToDuplicate.location || '');
      setDuration(String(eventToDuplicate.duration_hours || '1'));
      setCategory(eventToDuplicate.category || 'social');
      setAllowOvertime(eventToDuplicate.allow_overtime !== false);

      // Duplicare cu offset automat de +24 ore (+1 zi) de la original
      const origStart = new Date(eventToDuplicate.start_time);
      const origEnd = new Date(eventToDuplicate.end_time);
      const nextStart = new Date(origStart.getTime() + 24 * 60 * 60 * 1000);
      const nextEnd = new Date(origEnd.getTime() + 24 * 60 * 60 * 1000);
      
      setStartTime(nextStart);
      setEndTime(nextEnd);
    }
  }, [isEditMode, isDuplicateMode, eventToEdit, eventToDuplicate]);

  // Recalculare automată a duratei în ore când se schimbă timpii
  const updateTimes = (pickerType, selectedDate) => {
    let newStart = startTime;
    let newEnd = endTime;

    if (pickerType === 'start') {
      newStart = selectedDate;
      setStartTime(selectedDate);
      if (selectedDate >= endTime) {
        newEnd = new Date(selectedDate.getTime() + 3600 * 1000);
        setEndTime(newEnd);
      }
    } else {
      newEnd = selectedDate;
      setEndTime(selectedDate);
    }

    const diffHours = (newEnd - newStart) / (1000 * 60 * 60);
    if (diffHours > 0) {
      setDuration(diffHours.toFixed(1).replace('.0', ''));
    }
    setPickerVisible(null);
  };

  const styles = createStyles(colors, isDark);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !duration || !category) {
      Alert.alert('Eroare', 'Toate câmpurile marcate sunt obligatorii.');
      return;
    }
    setLoading(true);
    const eventData = {
      title: title.trim(), 
      description: description.trim(), 
      location: location.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_hours: parseFloat(duration),
      category,
      allow_overtime: allowOvertime,
      send_notification: sendNotification,
    };

    try {
      if (isEditMode) {
        await api.put(`/api/events/${eventToEdit.id}`, eventData);
        Toast.show({ type: 'success', text1: 'Modificat! ✅', text2: 'Modificările au fost salvate.' });
      } else {
        await api.post('/api/events', eventData);
        Toast.show({ 
          type: 'success', 
          text1: isDuplicateMode ? 'Duplicat! 📋' : 'Creat! 🎉', 
          text2: isDuplicateMode ? 'Noua activitate a fost duplicată cu succes.' : 'Activitatea a fost publicată.' 
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error("Eroare salvare event:", error.response?.data);
      Alert.alert('Eroare', error.response?.data?.error || 'Salvarea a eșuat. Verifică datele.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeroHeader = () => {
    let iconName = "add-circle-outline";
    let heroTitle = "Creează o Activitate Nouă";
    let heroSub = "Completează detaliile mai jos pentru a publica activitatea voluntarilor.";

    if (isEditMode) {
      iconName = "pencil-outline";
      heroTitle = "Editează Activitatea";
      heroSub = "Modifică orele, descrierea sau programul activității existente.";
    } else if (isDuplicateMode) {
      iconName = "copy-outline";
      heroTitle = "Duplică Activitatea";
      heroSub = "Se creează o copie nouă cu datele pre-completate (+1 zi decalaj).";
    }

    return (
      <View style={styles.heroBanner}>
        <View style={styles.heroIconBadge}>
          <Ionicons name={iconName} size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroBannerTitle}>{heroTitle}</Text>
          <Text style={styles.heroBannerSub}>{heroSub}</Text>
        </View>
      </View>
    );
  };

  const renderCategorySelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Categorie Activitate</Text>
      <View style={styles.categoryOptions}>
        {Object.entries(CATEGORY_OPTIONS).map(([key, { label, icon, activeColor }]) => {
          const isSelected = category === key;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              style={[
                styles.categoryButton,
                isSelected 
                  ? { backgroundColor: activeColor + '18', borderColor: activeColor } 
                  : { backgroundColor: colors.background, borderColor: colors.border }
              ]}
              onPress={() => setCategory(key)}
            >
              <Ionicons 
                name={isSelected ? icon : `${icon}-outline`} 
                size={20} 
                color={isSelected ? activeColor : colors.textSecondary} 
                style={{ marginBottom: 4 }} 
              />
              <Text style={[
                styles.categoryButtonText,
                { color: isSelected ? activeColor : colors.textSecondary, fontWeight: isSelected ? '800' : '600' }
              ]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <FormContainer>
      {renderHeroHeader()}

      {/* DETALII GENERALE */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.cardHeaderTitle}>Informații Generale</Text>
        </View>

        <FormInput 
          label="Titlu Activitate" 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Ex: Ecologizare Parc Tineretului" 
        />
        
        {renderCategorySelector()}
        
        <FormInput 
          label="Descriere & Obiective" 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Scrie ce vom face, ce responsabilități au voluntarii..." 
          multiline={true} 
          numberOfLines={4}
        />
        
        <FormInput 
          label="Locație" 
          value={location} 
          onChangeText={setLocation} 
          placeholder="Ex: Corpul S, Sala S01 / Parc Tineretului" 
        />
      </View>

      {/* PROGRAMARE & DURATĂ */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.cardHeaderTitle}>Program & Durată</Text>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Început</Text>
            <TouchableOpacity onPress={() => setPickerVisible('start')} style={styles.dateButton} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.dateIcon} />
              <View>
                <Text style={styles.dateText}>
                  {startTime.toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: '2-digit' })}
                </Text>
                <Text style={styles.timeSubText}>
                  {startTime.toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateCol}>
            <Text style={styles.label}>Sfârșit</Text>
            <TouchableOpacity onPress={() => setPickerVisible('end')} style={styles.dateButton} activeOpacity={0.7}>
              <Ionicons name="flag-outline" size={18} color="#e74c3c" style={styles.dateIcon} />
              <View>
                <Text style={styles.dateText}>
                  {endTime.toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: '2-digit' })}
                </Text>
                <Text style={styles.timeSubText}>
                  {endTime.toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <FormInput 
          label="Durată Calculată (Ore)" 
          value={duration} 
          onChangeText={setDuration} 
          keyboardType="numeric" 
          placeholder="Ex: 2" 
        />
      </View>

      {/* SETĂRI & PERMISIUNI */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
          <Text style={styles.cardHeaderTitle}>Reguli & Notificări</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Permite Overtime</Text>
            <Text style={styles.switchDescription}>
              Calculează ore suplimentare și permite check-in devreme. Dacă e dezactivat, voluntarii primesc strict orele fixe.
            </Text>
          </View>
          <Switch
            trackColor={{ false: isDark ? "#444" : "#ddd", true: colors.primary + '80' }}
            thumbColor={allowOvertime ? colors.primary : "#f4f3f4"}
            onValueChange={setAllowOvertime}
            value={allowOvertime}
          />
        </View>
        
        {!isEditMode && (
          <View style={[styles.switchRow, { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Notifică Voluntarii</Text>
              <Text style={styles.switchDescription}>
                Trimite o notificare push tuturor voluntarilor pentru a-i anunța despre această activitate.
              </Text>
            </View>
            <Switch
              trackColor={{ false: isDark ? "#444" : "#ddd", true: colors.primary + '80' }}
              thumbColor={sendNotification ? colors.primary : "#f4f3f4"}
              onValueChange={setSendNotification}
              value={sendNotification}
            />
          </View>
        )}
      </View>

      <View style={styles.buttonWrapper}>
        <FormButton
          title={isEditMode ? "Salvează Modificările" : isDuplicateMode ? "Duplică & Salvează" : "Creează Activitatea"}
          iconName={isEditMode ? "save-outline" : isDuplicateMode ? "copy-outline" : "add-circle-outline"}
          onPress={handleSubmit}
          loading={loading}
        />
      </View>

      <DateTimePickerModal
        isVisible={!!pickerVisible}
        mode="datetime"
        date={pickerVisible === 'start' ? startTime : endTime}
        onConfirm={(date) => updateTimes(pickerVisible, date)}
        onCancel={() => setPickerVisible(null)}
      />
    </FormContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(74, 144, 226, 0.12)' : '#ebf5fb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 12,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(74, 144, 226, 0.2)' : '#d4e6f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  heroBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: { marginTop: 6, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  dateCol: { flex: 1 },
  dateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    gap: 10,
  },
  dateIcon: { marginRight: 2 },
  dateText: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary },
  timeSubText: { fontSize: 11, color: colors.textSecondary, marginTop: 1, fontWeight: '600' },
  categoryOptions: { flexDirection: 'row', gap: 10 },
  categoryButton: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  categoryButtonText: { fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTextContainer: { flex: 1, paddingRight: 15 },
  switchTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  switchDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  buttonWrapper: { marginTop: 10, marginBottom: 40 },
});
