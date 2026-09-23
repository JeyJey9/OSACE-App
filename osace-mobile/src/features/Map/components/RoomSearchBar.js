import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
import { searchRooms } from '../data/buildingData';

const RoomSearchBar = ({ currentFloor, onSelectRoom, style }) => {
  const { colors, isDark } = useThemeColor();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Căutare inteligentă: afișează max 6 sugestii relevante
  const suggestions = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    return searchRooms(query, currentFloor).slice(0, 6);
  }, [query, currentFloor]);

  const handleSelect = (room) => {
    Keyboard.dismiss();
    setQuery('');
    setIsFocused(false);
    if (onSelectRoom) {
      onSelectRoom(room);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const styles = createStyles(colors, isDark, isFocused);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Bara de Căutare */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={isDark ? '#94a3b8' : '#64748b'}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Caută sală (ex: G003, K101, Curs)..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={isDark ? '#94a3b8' : '#94a3b8'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Sugestii / Autocomplete */}
      {isFocused && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                activeOpacity={0.7}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.roomCodeBadge}>
                  <Text style={styles.roomCodeText}>
                    {item.code?.toLowerCase().includes('aula') || item.code?.toLowerCase().includes('belea')
                      ? 'AULA'
                      : item.code}
                  </Text>
                </View>
                <View style={styles.suggestionDetails}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                    {item.name || 'Sală'}
                  </Text>
                  <Text style={styles.suggestionSubtitle}>
                    {item.wing} • {item.floor === 'B' ? 'Demisol' : item.floor === 'P' ? 'Parter' : item.floor} • {item.type}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors, isDark, isFocused) =>
  StyleSheet.create({
    wrapper: {
      zIndex: 30,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 46,
      borderWidth: 1,
      borderColor: isFocused
        ? colors.primary
        : isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    searchIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: 52,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 7,
      maxHeight: 250,
      overflow: 'hidden',
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    roomCodeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 10,
      minWidth: 46,
      alignItems: 'center',
    },
    roomCodeText: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 12,
    },
    suggestionDetails: {
      flex: 1,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    suggestionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
      textTransform: 'capitalize',
    },
  });

export default RoomSearchBar;
