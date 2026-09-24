import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from '../../../constants/useThemeColor';
import { searchRooms, getRoomCategory } from '../data/buildingData';

const QUICK_FILTER_TAGS = [
  { id: 'toilet', label: 'Grupuri Sanitare', icon: 'water-outline', query: 'grup sanitar', color: '#06b6d4' },
  { id: 'laboratory', label: 'Laboratoare', icon: 'flask-outline', query: 'laborator', color: '#0284c7' },
  { id: 'classroom', label: 'Săli de Curs', icon: 'school-outline', query: 'sala de curs', color: '#3b82f6' },
  { id: 'amphitheatre', label: 'Amfiteatre', icon: 'people-outline', query: 'amfiteatru', color: '#8b5cf6' },
  { id: 'entrance', label: 'Intrare', icon: 'log-in-outline', query: 'intrare', color: '#10b981' },
];

const RoomSearchBar = ({ currentFloor, onSelectRoom, style }) => {
  const { colors, isDark } = useThemeColor();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Căutare inteligentă cu tag-uri: afișează max 8 sugestii relevante
  const suggestions = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    return searchRooms(query, currentFloor).slice(0, 8);
  }, [query, currentFloor]);

  const handleSelect = (room) => {
    Keyboard.dismiss();
    setQuery('');
    setIsFocused(false);
    if (onSelectRoom) {
      onSelectRoom(room);
    }
  };

  const handleFilterPress = (filterQuery) => {
    setQuery(filterQuery);
    setIsFocused(true);
  };

  const handleClear = () => {
    setQuery('');
  };

  const styles = createStyles(colors, isDark, isFocused);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Bara Principală de Căutare */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={isDark ? '#94a3b8' : '#64748b'}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Caută sală, laborator, toaletă..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 250)}
          autoCapitalize="none"
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

      {/* Dropdown Rezultate & Tag-uri Rapide */}
      {isFocused && (
        <View style={styles.suggestionsContainer}>
          {/* Bară de Tag-uri Rapide */}
          <View style={styles.quickTagsSection}>
            <Text style={styles.quickTagsHeader}>Categorii rapide:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.quickTagsScroll}
            >
              {QUICK_FILTER_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.quickTagChip,
                    query.toLowerCase().includes(tag.id) && {
                      backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.12)',
                      borderColor: tag.color,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleFilterPress(tag.query)}
                >
                  <Ionicons name={tag.icon} size={14} color={tag.color} style={{ marginRight: 5 }} />
                  <Text style={[styles.quickTagText, { color: colors.textPrimary }]}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Listă Sugestii */}
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              renderItem={({ item }) => {
                const cat = getRoomCategory(item);
                const floorLabel =
                  item.floor === 'B'
                    ? 'Demisol'
                    : item.floor === 'P'
                    ? 'Parter'
                    : `Etaj ${item.floor.replace('E', '')}`;

                return (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={[styles.roomCodeBadge, { backgroundColor: cat.color }]}>
                      <Text style={styles.roomCodeText}>{cat.badge}</Text>
                    </View>
                    <View style={styles.suggestionDetails}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.name || 'Sală'}
                      </Text>
                      <Text style={styles.suggestionSubtitle}>
                        {item.wing} • {floorLabel} • {cat.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isDark ? '#64748b' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          ) : query.length > 0 ? (
            <View style={styles.noResultsBox}>
              <Ionicons name="search-outline" size={20} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginBottom: 4 }} />
              <Text style={styles.noResultsText}>Nu s-a găsit nicio sală pentru „{query}”</Text>
            </View>
          ) : null}
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
      maxHeight: 320,
      overflow: 'hidden',
    },
    quickTagsSection: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
    },
    quickTagsHeader: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      marginLeft: 2,
    },
    quickTagsScroll: {
      flexDirection: 'row',
      gap: 6,
      paddingRight: 8,
    },
    quickTagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    },
    quickTagText: {
      fontSize: 12,
      fontWeight: '600',
    },
    resultsList: {
      maxHeight: 240,
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
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 10,
      minWidth: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roomCodeText: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 11,
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
    },
    noResultsBox: {
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noResultsText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

export default RoomSearchBar;
