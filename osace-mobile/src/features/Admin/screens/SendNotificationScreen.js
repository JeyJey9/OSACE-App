// src/features/Admin/screens/SendNotificationScreen.js
import React, { useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../../services/api';

import FormContainer from '../../../components/layout/ScreenContainer';
import FormCard from '../../../components/forms/FormCard';
import FormInput from '../../../components/forms/FormInput';
import FormButton from '../../../components/forms/FormButton';
import { useThemeColor } from '../../../constants/useThemeColor';

const TARGET_ROLES = [
  { id: 'all', label: 'Toți Membrii', roles: ['admin', 'coordonator', 'user'] },
  { id: 'user', label: 'Voluntari', roles: ['user'] },
  { id: 'coordonator', label: 'Coordonatori', roles: ['coordonator'] },
  { id: 'admin', label: 'Admini', roles: ['admin'] },
];

const TEMPLATES = [
  {
    icon: 'megaphone-outline',
    label: 'Anunț Important',
    title: '📢 Anunț Important OSACE',
    message: 'Salutare! Dorim să vă aducem la cunoștință o informație importantă...',
  },
  {
    icon: 'alarm-outline',
    label: 'Memento Ședință',
    title: '⏰ Memento Ședință Generală',
    message: 'Vă reamintim că astăzi la ora 18:00 va avea loc ședința generală.',
  },
  {
    icon: 'sparkles-outline',
    label: 'Activitate Nouă',
    title: '🎉 Activitate Nouă Disponibilă!',
    message: 'S-au deschis înscrierile pentru o nouă activitate. Intră în aplicație pentru detalii!',
  },
  {
    icon: 'warning-outline',
    label: 'Schimbare Program',
    title: '⚠️ Modificare de Program',
    message: 'Atenție! Programul pentru activitatea de astăzi a suferit modificări.',
  },
];

export default function SendNotificationScreen({ navigation }) {
  const { colors, isDark } = useThemeColor();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState(['admin', 'coordonator', 'user']);

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

  const styles = createStyles(colors, isDark);

  const toggleTargetGroup = (targetId) => {
    if (targetId === 'all') {
      if (selectedRoles.length === 3) {
        setSelectedRoles([]);
      } else {
        setSelectedRoles(['admin', 'coordonator', 'user']);
      }
      return;
    }

    if (selectedRoles.includes(targetId)) {
      setSelectedRoles(prev => prev.filter(r => r !== targetId));
    } else {
      setSelectedRoles(prev => [...prev, targetId]);
    }
  };

  const applyTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Eroare", "Titlul și mesajul sunt obligatorii.");
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert("Eroare", "Trebuie selectat cel puțin un grup țintă.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/admin/notifications/send-all', {
        title: title.trim(),
        message: message.trim(),
        roles: selectedRoles
      });
      Alert.alert("Succes", response.data.message || "Notificare trimisă cu succes!");
      setTitle('');
      setMessage('');
      navigation.goBack(); 
    } catch (error) {
      console.error("Eroare la trimiterea notificării:", error.response?.data);
      Alert.alert("Eroare", error.response?.data?.error || "A apărut o eroare la trimitere.");
    } finally {
      setLoading(false);
    }
  };

  const isAllSelected = selectedRoles.length === 3;

  return (
    <FormContainer>
      {/* ── 1. Live Lock-Screen Notification Preview ── */}
      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.previewTitle}>PREVIZUALIZARE LOCK SCREEN</Text>
        </View>

        <View style={styles.notificationBanner}>
          <View style={styles.bannerHeader}>
            <View style={styles.appBadge}>
              <View style={styles.appIconBg}>
                <Ionicons name="notifications" size={12} color="#fff" />
              </View>
              <Text style={styles.appName}>OSACE</Text>
            </View>
            <Text style={styles.timeText}>acum</Text>
          </View>

          <Text style={styles.bannerNotifTitle} numberOfLines={1}>
            {title.trim() || 'Titlu notificare...'}
          </Text>
          <Text style={styles.bannerNotifMessage} numberOfLines={2}>
            {message.trim() || 'Mesajul notificării push va apărea aici exact așa cum îl vor vedea voluntarii pe ecranul blocat...'}
          </Text>
        </View>
      </View>

      <FormCard title="Trimite Notificare Broadcast">
        {/* ── 2. Target Audience Chips ── */}
        <Text style={styles.fieldLabel}>Destinatari (Grup Țintă):</Text>
        <View style={styles.targetChipsContainer}>
          {TARGET_ROLES.map((group) => {
            const isSelected = group.id === 'all' 
              ? isAllSelected 
              : selectedRoles.includes(group.id);

            return (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.8}
                onPress={() => toggleTargetGroup(group.id)}
                style={[
                  styles.targetChip,
                  isSelected && styles.targetChipActive
                ]}
              >
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.targetChipText,
                  isSelected && styles.targetChipTextActive
                ]}>
                  {group.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. Quick Templates ── */}
        <Text style={styles.fieldLabel}>Șabloane Rapide (1-Tap Presets):</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.templateScrollContent}
        >
          {TEMPLATES.map((tmpl, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => applyTemplate(tmpl)}
              style={styles.templateChip}
            >
              <Ionicons name={tmpl.icon} size={15} color={colors.primary} />
              <Text style={styles.templateChipText}>{tmpl.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Form Inputs */}
        <FormInput
          label="Titlu Notificare"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Eveniment Nou Adăugat!"
        />

        <FormInput
          label="Mesaj Notificare"
          value={message}
          onChangeText={setMessage}
          placeholder="Scrie textul notificării push..."
          multiline={true}
        />

        <FormButton
          title="Trimite Notificarea Acum"
          iconName="paper-plane"
          onPress={handleSendNotification}
          loading={loading}
        />
      </FormCard>
    </FormContainer>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  previewSection: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  notificationBanner: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIconBg: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bannerNotifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  bannerNotifMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '400',
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Target Chips
  targetChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f3f4f6',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
  },
  targetChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  targetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  targetChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // Templates
  templateScrollContent: {
    gap: 8,
    paddingBottom: 14,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});