import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import { useThemeColor } from '../../../constants/useThemeColor';

export default function AssignContributionScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hoursToGrant, setHoursToGrant] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const navigation = useNavigation();
  const { colors, isDark } = useThemeColor();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Eroare la încărcarea utilizatorilor.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleSubmit = async () => {
    const numericHours = parseFloat(hoursToGrant.replace(',', '.'));
    if (!selectedUserId) {
      Alert.alert('Eroare', 'Selectează un voluntar.');
      return;
    }
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
      await api.post('/api/admin/contributions', {
        user_id: selectedUserId,
        title: title.trim(),
        description: description.trim(),
        awarded_hours: numericHours,
      });
      Toast.show({ type: 'success', text1: 'Cerere trimisă!', text2: 'Așteaptă aprobarea unui admin.' });
      navigation.goBack();
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert('Eroare', error.response?.data?.error || 'Nu am putut trimite cererea.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      (user.first_name?.toLowerCase().includes(query) || 
       user.last_name?.toLowerCase().includes(query) || 
       user.display_name?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const styles = createStyles(colors, isDark);

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUserId === item.id;

    return (
      <TouchableOpacity 
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => setSelectedUserId(isSelected ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <Ionicons 
          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={isSelected ? colors.primary : colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Acordare Contribuție Specială</Text>
          <Text style={styles.headerSubtitle}>
            Alege un voluntar și completează detaliile realizării (ex: Grafică Poster, Ajutor Logistică).
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Caută voluntar..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>Niciun utilizator găsit.</Text>}
            />
          </View>
        )}

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Titlu (ex: Design Poster Event)"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Descriere detaliată..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Ore acordate (ex: 5.5)"
            placeholderTextColor={colors.textSecondary}
            value={hoursToGrant}
            onChangeText={setHoursToGrant}
            keyboardType="numeric"
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, (!selectedUserId || !title || !description || !hoursToGrant) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedUserId || submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Trimite spre Aprobare</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 110,
  },
  headerInfo: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    padding: 8,
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userCardSelected: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
  },
  formContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
