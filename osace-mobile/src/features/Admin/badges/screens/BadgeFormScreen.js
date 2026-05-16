import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../../services/api';
import FormContainer from '../../../../components/layout/ScreenContainer';
import FormCard from '../../../../components/forms/FormCard';
import FormInput from '../../../../components/forms/FormInput';
import FormButton from '../../../../components/forms/FormButton';
import { useThemeColor } from '../../../../constants/useThemeColor';

const RULE_TYPES = [
  { value: 'manual', label: 'Manual (Acordat de Admin)' },
  { value: 'total_events', label: 'Număr Total Evenimente' },
  { value: 'total_hours', label: 'Număr Total Ore' },
  { value: 'category_count', label: 'Nr. Evenimente (sedinta/social/proiect)' },
  { value: 'category_hours', label: 'Nr. Ore pe Categorie' },
  { value: 'monthly_events', label: 'Evenimente într-o lună' },
  { value: 'weekly_hours', label: 'Ore într-o săptămână' },
  { value: 'perfect_streak', label: 'Evenimente Consecutive (Streak)' },
  { value: 'evening_events', label: 'Evenimente de Seară' }
];

const PREDEFINED_ICONS = [
  'star-outline', 'trophy-outline', 'medal-outline', 'flame-outline', 
  'heart-outline', 'diamond-outline', 'bulb-outline', 'rocket-outline', 
  'shield-checkmark-outline', 'time-outline', 'people-outline', 
  'color-palette-outline', 'leaf-outline', 'planet-outline',
  'flash-outline', 'gift-outline', 'ribbon-outline', 'happy-outline',
  'school-outline', 'book-outline', 'fitness-outline', 'accessibility-outline',
  'sunny-outline', 'moon-outline', 'water-outline'
];

export default function BadgeFormScreen({ route, navigation }) {
  const { badge, onGoBack } = route.params || {};
  const isEditing = !!badge;
  const { colors } = useThemeColor();

  const [name, setName] = useState(badge?.name || '');
  const [description, setDescription] = useState(badge?.description || '');
  const [iconName, setIconName] = useState(badge?.icon_name || PREDEFINED_ICONS[0]);
  const [key, setKey] = useState(badge?.key || '');
  
  const [ruleType, setRuleType] = useState(badge?.rule_type || 'manual');
  const [ruleValue, setRuleValue] = useState(badge?.rule_value || '');

  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  const handleSubmit = async () => {
    if (!name || !description || !iconName || !key) {
      Alert.alert("Eroare", "Câmpurile Nume, Descriere, Iconiță și Cheie sunt obligatorii.");
      return;
    }
    if (ruleType !== 'manual' && !ruleValue) {
      Alert.alert("Eroare", "Trebuie să introduci o valoare pentru regula selectată.");
      return;
    }

    setLoading(true);
    const badgeData = { 
      name, 
      description, 
      icon_name: iconName, 
      key,
      rule_type: ruleType,
      rule_value: ruleType === 'manual' ? null : ruleValue
    };

    try {
      if (isEditing) {
        const { key: _, ...updateData } = badgeData;
        await api.put(`/api/admin/badges/${badge.id}`, updateData);
      } else {
        await api.post('/api/admin/badges', badgeData);
      }
      Alert.alert("Succes", `Badge-ul a fost ${isEditing ? 'actualizat' : 'creat'}.`);
      if (onGoBack) onGoBack();
      navigation.goBack();
    } catch (error) {
      Alert.alert("Eroare la salvare", error.response?.data?.error || "A apărut o problemă.");
    } finally {
      setLoading(false);
    }
  };

  const renderRuleTypeSelector = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>Tip Regulă</Text>
      <View style={styles.buttonGroup}>
        {RULE_TYPES.map(rt => (
          <Text 
            key={rt.value}
            style={[styles.typeButton, ruleType === rt.value && styles.typeButtonSelected]}
            onPress={() => setRuleType(rt.value)}
          >
            {rt.label}
          </Text>
        ))}
      </View>
    </View>
  );

  const renderIconPicker = () => (
    <View style={styles.iconPickerContainer}>
      <Text style={styles.label}>Alege o Iconiță</Text>
      <View style={styles.selectedIconDisplay}>
        <Ionicons name={iconName} size={40} color={colors.primary} />
        <Text style={[styles.selectedIconText, { color: colors.textSecondary }]}>{iconName}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScrollGrid}>
        <View style={styles.iconGrid}>
          {PREDEFINED_ICONS.map((icon) => (
            <TouchableOpacity 
              key={icon} 
              style={[styles.iconButton, iconName === icon && styles.iconButtonSelected]}
              onPress={() => setIconName(icon)}
            >
              <Ionicons name={icon} size={28} color={iconName === icon ? '#fff' : colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <FormContainer scrollable={true}>
      <FormCard title={isEditing ? "Editează Badge" : "Badge Nou"}>
        <FormInput
          label="Nume Badge"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Primii Pași"
        />
        <FormInput
          label="Descriere"
          value={description}
          onChangeText={setDescription}
          placeholder="Descrierea badge-ului"
          multiline={true}
        />
        
        {renderIconPicker()}

        <FormInput
          label="Cheie Unică (KEY)"
          value={key}
          onChangeText={setKey}
          placeholder="ex: FIRST_EVENT"
          autoCapitalize="none"
          editable={!isEditing}
          style={isEditing && styles.inputDisabled}
        />
        {isEditing && (
          <Text style={styles.note}>Cheia (KEY) nu poate fi modificată după creare.</Text>
        )}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Reguli Gamification</Text>
        
        {renderRuleTypeSelector()}

        {ruleType !== 'manual' && (
          <FormInput
            label="Valoare Regulă"
            value={ruleValue}
            onChangeText={setRuleValue}
            placeholder={ruleType.includes('category') ? "ex: sedinta:5" : "ex: 50"}
            autoCapitalize="none"
          />
        )}
        {ruleType.includes('category') && (
          <Text style={styles.note}>Format: categorie:număr (ex: sedinta:5, social:10)</Text>
        )}

        <FormButton
          title={isEditing ? "Actualizează" : "Creează"}
          iconName={isEditing ? "save-outline" : "add-outline"}
          onPress={handleSubmit}
          loading={loading}
        />
      </FormCard>
    </FormContainer>
  );
}

const createStyles = (colors) => StyleSheet.create({
  inputDisabled: { backgroundColor: colors.border, color: colors.textSecondary },
  note: { fontStyle: 'italic', color: colors.textSecondary, marginBottom: 10, marginTop: -5, fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 15 },
  pickerContainer: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 12,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: '#fff',
    fontWeight: 'bold',
  },
  iconPickerContainer: { marginBottom: 20 },
  selectedIconDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: colors.background, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  selectedIconText: { marginLeft: 10, fontSize: 14, fontWeight: 'bold' },
  iconScrollGrid: { paddingBottom: 10 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 10 }, // 280px width forces wrap to create a grid inside horizontal scroll
  iconButton: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  iconButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
