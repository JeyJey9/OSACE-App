import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Switch } from 'react-native';
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
  sedinta: { label: 'Ședință', icon: 'briefcase-outline' },
  social: { label: 'Social', icon: 'people-outline' },
  proiect: { label: 'Proiect', icon: 'bulb-outline' },
};

export default function EventFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { colors, isDark } = useThemeColor();

  const eventToEdit = route.params?.eventToEdit;
  const isEditMode = !!eventToEdit;

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

  useEffect(() => { if (!isFocused) setPickerVisible(null); }, [isFocused]);

  useEffect(() => {
    if (isEditMode) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setLocation(eventToEdit.location);
      setStartTime(new Date(eventToEdit.start_time));
      setEndTime(new Date(eventToEdit.end_time));
      setDuration(String(eventToEdit.duration_hours));
      setCategory(eventToEdit.category || 'social');
      setAllowOvertime(eventToEdit.allow_overtime !== false);
    }
  }, [isEditMode, eventToEdit]);

  const styles = createStyles(colors, isDark);

  const handleSubmit = async () => {
    if (!title || !description || !location || !duration || !category) {
      Alert.alert('Eroare', 'Toate câmpurile sunt obligatorii.');
      return;
    }
    setLoading(true);
    const eventData = {
      title, 
      description, 
      location,
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
      } else {
        await api.post('/api/events', eventData);
      }
      Toast.show({ type: 'success', text1: 'Succes!', text2: 'Activitatea a fost salvată.' });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Eroare', 'Salvarea a eșuat. Verifică datele.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Tip Activitate</Text>
      <View style={styles.categoryOptions}>
        {Object.entries(CATEGORY_OPTIONS).map(([key, { label, icon }]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryButton,
              category === key ? styles.categoryButtonSelected : styles.categoryButtonInactive
            ]}
            onPress={() => setCategory(key)}
          >
            <Ionicons 
              name={icon} 
              size={18} 
              color={category === key ? colors.primary : colors.textSecondary} 
              style={{ marginBottom: 4 }} 
            />
            <Text style={[
                styles.categoryButtonText,
                category === key ? styles.categoryTextSelected : styles.categoryTextInactive
            ]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <FormContainer>
      <View style={styles.card}>
        <FormInput label="Titlu Activitate" value={title} onChangeText={setTitle} placeholder="Ex: Ecologizare Parc" />
        {renderCategorySelector()}
        <FormInput label="Descriere" value={description} onChangeText={setDescription} placeholder="Detalii despre ce vom face..." multiline={true} />
        <FormInput label="Locație" value={location} onChangeText={setLocation} placeholder="Ex: Str. Principală, nr. 1" />
      </View>

      <View style={styles.card}>
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Început</Text>
            <TouchableOpacity onPress={() => setPickerVisible('start')} style={styles.dateButton}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {startTime.toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateCol}>
            <Text style={styles.label}>Sfârșit</Text>
            <TouchableOpacity onPress={() => setPickerVisible('end')} style={styles.dateButton}>
              <Ionicons name="flag-outline" size={18} color={colors.textSecondary} style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {endTime.toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FormInput label="Durata programată (ore)" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="Ex: 2" />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Permite Overtime</Text>
            <Text style={styles.switchDescription}>
              Calculează ore suplimentare și permite check-in devreme. Dacă e debifat, voluntarii primesc strict orele setate mai sus.
            </Text>
          </View>
          <Switch
            trackColor={{ false: isDark ? "#555" : "#ddd", true: colors.primary + '80' }}
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
                Trimite o notificare push tuturor voluntarilor pentru a-i anunța că activitatea a fost adăugată.
              </Text>
            </View>
            <Switch
              trackColor={{ false: isDark ? "#555" : "#ddd", true: colors.primary + '80' }}
              thumbColor={sendNotification ? colors.primary : "#f4f3f4"}
              onValueChange={setSendNotification}
              value={sendNotification}
            />
          </View>
        )}
      </View>

      <View style={styles.buttonWrapper}>
        <FormButton
          title={isEditMode ? "Salvează Modificările" : "Creează Activitatea"}
          iconName={isEditMode ? "save-outline" : "add-circle-outline"}
          onPress={handleSubmit}
          loading={loading}
        />
      </View>

      <DateTimePickerModal
        isVisible={!!pickerVisible}
        mode="datetime"
        date={pickerVisible === 'start' ? startTime : endTime}
        onConfirm={(date) => {
          pickerVisible === 'start' ? setStartTime(date) : setEndTime(date);
          setPickerVisible(null);
        }}
        onCancel={() => setPickerVisible(null)}
      />
    </FormContainer>
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
  inputGroup: { marginTop: 10, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  dateCol: { flex: 1 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12 },
  dateIcon: { marginRight: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  categoryOptions: { flexDirection: 'row', gap: 10 },
  categoryButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  categoryButtonInactive: { backgroundColor: colors.background, borderColor: colors.border },
  categoryButtonSelected: { backgroundColor: isDark ? colors.primary + '20' : '#EBF5FB', borderColor: colors.primary },
  categoryButtonText: { fontSize: 12, fontWeight: 'bold' },
  categoryTextInactive: { color: colors.textSecondary },
  categoryTextSelected: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTextContainer: { flex: 1, paddingRight: 15 },
  switchTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  switchDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  buttonWrapper: { marginTop: 10, marginBottom: 40 },
});
