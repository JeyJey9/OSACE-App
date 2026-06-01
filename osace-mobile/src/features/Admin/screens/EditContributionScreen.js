import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput, Modal, SafeAreaView, FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function EditContributionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useThemeColor();

  useLayoutEffect(() => {
    navigation.setOptions({
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
  }, [navigation, colors.textPrimary]);

  const contribution = route.params?.contribution;

  const [title, setTitle] = useState(contribution?.title || '');
  const [description, setDescription] = useState(contribution?.description || '');
  const [hoursToGrant, setHoursToGrant] = useState(contribution?.awarded_hours?.toString() || '');
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(
    contribution?.event_id ? { id: contribution.event_id, title: contribution.event_title } : null
  );
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!contribution) {
      Alert.alert('Eroare', 'Nu s-a furnizat nicio contribuție.');
      navigation.goBack();
      return;
    }
    fetchEvents();
  }, [contribution]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/admin/events/all');
      setEvents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    const numericHours = parseFloat(hoursToGrant.replace(',', '.'));
    if (!title.trim() || !description.trim()) {
      Alert.alert('Eroare', 'Introdu titlul și descrierea contribuției.');
      return;
    }
    if (isNaN(numericHours) || numericHours <= 0) {
      Alert.alert('Eroare', 'Introdu un număr valid de ore.');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.put(`/api/admin/contributions/${contribution.id}`, {
        title: title.trim(),
        description: description.trim(),
        awarded_hours: numericHours,
        event_id: selectedEvent ? selectedEvent.id : null
      });
      Toast.show({ type: 'success', text1: 'Modificări salvate!', text2: 'Contribuția a fost actualizată.' });
      navigation.goBack();
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert('Eroare', error.response?.data?.error || 'Nu am putut actualiza contribuția.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const styles = createStyles(colors, isDark);

  if (!contribution) return null;

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.container}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Editează Contribuția</Text>
          <Text style={styles.headerSubtitle}>
            Modifică detaliile contribuției pentru {contribution.target_name || `${contribution.target_first} ${contribution.target_last}`}.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Titlu</Text>
          <TextInput
            style={styles.input}
            placeholder="Titlu"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <Text style={styles.label}>Descriere</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Descriere detaliată..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          
          <Text style={styles.label}>Ore acordate</Text>
          <TextInput
            style={styles.input}
            placeholder="Ore"
            placeholderTextColor={colors.textSecondary}
            value={hoursToGrant}
            onChangeText={setHoursToGrant}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Eveniment Asociat (Opțional)</Text>
          <TouchableOpacity 
            style={styles.eventSelector} 
            onPress={() => setEventModalVisible(true)}
          >
            <Text style={{ color: selectedEvent ? colors.textPrimary : colors.textSecondary }}>
              {selectedEvent ? selectedEvent.title : "Fără eveniment asociat"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, (!title || !description || !hoursToGrant) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitLoading || !title || !description || !hoursToGrant}
          >
            {submitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Salvează Modificările</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal pentru selecție eveniment */}
      <Modal visible={eventModalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selectează Evenimentul</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => { setSelectedEvent(null); setEventModalVisible(false); }}
            >
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>Fără eveniment asociat</Text>
            </TouchableOpacity>
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => { setSelectedEvent(item); setEventModalVisible(false); }}
                >
                  <Text style={{ color: colors.textPrimary }}>{item.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(item.start_time.replace(' ', 'T')).toLocaleDateString('ro-RO')}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerInfo: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  eventSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: colors.background,
    margin: 20,
    marginTop: 100,
    borderRadius: 16,
    flex: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }
});
