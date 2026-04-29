import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import api from '../../../../services/api';
import FormContainer from '../../../../components/layout/ScreenContainer';
import FormCard from '../../../../components/forms/FormCard';
import FormInput from '../../../../components/forms/FormInput';
import FormButton from '../../../../components/forms/FormButton';
import { useThemeColor } from '../../../../constants/useThemeColor';

export default function BadgeFormScreen({ route, navigation }) {
  const { badge, onGoBack } = route.params || {};
  const isEditing = !!badge;
  const { colors } = useThemeColor();

  const [name, setName] = useState(badge?.name || '');
  const [description, setDescription] = useState(badge?.description || '');
  const [iconName, setIconName] = useState(badge?.icon_name || '');
  const [key, setKey] = useState(badge?.key || '');
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  const handleSubmit = async () => {
    if (!name || !description || !iconName || !key) {
      Alert.alert("Eroare", "Toate câmpurile sunt obligatorii.");
      return;
    }
    setLoading(true);
    const badgeData = { name, description, icon_name: iconName, key };
    try {
      if (isEditing) {
        const { key, ...updateData } = badgeData;
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

  return (
    <FormContainer>
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
        <FormInput
          label="Iconiță (Ionicons)"
          value={iconName}
          onChangeText={setIconName}
          placeholder="ex: sparkles-outline"
          autoCapitalize="none"
        />
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
  note: { fontStyle: 'italic', color: colors.textSecondary, marginBottom: 10, marginTop: -5 },
});
