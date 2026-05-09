import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../constants/useThemeColor';

export default function DropdownPicker({ 
  options, // Array of { label: string, value: any }
  selectedValue, 
  onValueChange, 
  placeholder = "Selectează",
  style
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors, isDark } = useThemeColor();
  const styles = createStyles(colors, isDark);

  const selectedOption = options.find(o => o.value === selectedValue);

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.pickerButton, style]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.pickerText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          <SafeAreaView style={styles.modalContent}>
             <View style={styles.handleBar} />
             <Text style={styles.modalTitle}>{placeholder}</Text>
             <FlatList
                data={options}
                keyExtractor={(item) => String(item.value)}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.optionItem, item.value === selectedValue && styles.optionItemSelected]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text 
                      style={[styles.optionText, item.value === selectedValue && styles.optionTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.label}
                    </Text>
                    {item.value === selectedValue && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
             />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 200,
    width: '100%',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  optionItemSelected: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
