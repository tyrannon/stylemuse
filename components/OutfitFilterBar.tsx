import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  useOutfitFilter,
  OCCASION_OPTIONS,
  STYLE_OPTIONS,
  COLOR_OPTIONS,
  SEASON_OPTIONS,
  QUICK_FILTERS,
} from '../contexts/OutfitFilterContext';

interface FilterChipProps {
  label: string;
  emoji?: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, emoji, isActive, onPress, count }) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {emoji && <Text style={styles.chipEmoji}>{emoji}</Text>}
        <Text
          style={[
            styles.chipText,
            { color: isActive ? '#FFFFFF' : theme.colors.text },
          ]}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View
            style={[
              styles.chipCount,
              { backgroundColor: isActive ? '#FFFFFF' : theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.chipCountText,
                { color: isActive ? theme.colors.primary : '#FFFFFF' },
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const OutfitFilterBar: React.FC = () => {
  const { theme } = useTheme();
  const {
    filters,
    toggleFilter,
    clearAllFilters,
    setSearchQuery,
    applyQuickFilter,
    isFilterActive,
    getActiveFilterCount,
  } = useOutfitFilter();
  const [showFullFilters, setShowFullFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('quick');

  const styles = createStyles(theme);
  const activeCount = getActiveFilterCount();

  return (
    <>
      {/* Main Filter Bar */}
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits..."
            placeholderTextColor={theme.colors.textMuted}
            value={filters.searchQuery}
            onChangeText={setSearchQuery}
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFullFilters(true)}
            style={[
              styles.filterButton,
              isFilterActive() && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.filterIcon}>⚡</Text>
            <Text
              style={[
                styles.filterButtonText,
                { color: isFilterActive() ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              Filters
            </Text>
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Filter Chips */}
          {QUICK_FILTERS.map((quickFilter) => (
            <FilterChip
              key={quickFilter.id}
              label={quickFilter.label}
              emoji={quickFilter.emoji}
              isActive={false} // You could check if quick filter matches current filters
              onPress={() => applyQuickFilter(quickFilter)}
            />
          ))}
        </ScrollView>

        {/* Clear All Button */}
        {isFilterActive() && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full Filter Modal */}
      <Modal
        visible={showFullFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFullFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Filter Outfits
              </Text>
              <TouchableOpacity onPress={() => setShowFullFilters(false)}>
                <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Sections */}
            <ScrollView style={styles.modalScroll}>
              {/* Occasion Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Occasion
                </Text>
                <View style={styles.optionsGrid}>
                  {OCCASION_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      emoji={option.emoji}
                      isActive={filters.occasion.includes(option.value)}
                      onPress={() => toggleFilter('occasion', option.value)}
                    />
                  ))}
                </View>
              </View>

              {/* Style Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Style
                </Text>
                <View style={styles.optionsGrid}>
                  {STYLE_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      emoji={option.emoji}
                      isActive={filters.style.includes(option.value)}
                      onPress={() => toggleFilter('style', option.value)}
                    />
                  ))}
                </View>
              </View>

              {/* Color Palette Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Color Palette
                </Text>
                <View style={styles.optionsGrid}>
                  {COLOR_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      emoji={option.emoji}
                      isActive={filters.colorPalette.includes(option.value)}
                      onPress={() => toggleFilter('colorPalette', option.value)}
                    />
                  ))}
                </View>
              </View>

              {/* Season Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Season
                </Text>
                <View style={styles.optionsGrid}>
                  {SEASON_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      emoji={option.emoji}
                      isActive={filters.season.includes(option.value)}
                      onPress={() => toggleFilter('season', option.value)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={clearAllFilters}
                style={[styles.modalButton, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFullFilters(false)}
                style={[styles.modalButton, styles.modalPrimaryButton]}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  Apply Filters ({activeCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 12,
      height: 40,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    clearSearchIcon: {
      fontSize: 18,
      color: theme.colors.textMuted,
      paddingLeft: 8,
    },
    filterScroll: {
      flexGrow: 0,
    },
    filterScrollContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
    },
    filterIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    filterBadge: {
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
    },
    filterBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    chipEmoji: {
      fontSize: 16,
      marginRight: 6,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
    },
    chipCount: {
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
    },
    chipCountText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    clearButton: {
      position: 'absolute',
      right: 16,
      top: 60,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    clearButtonText: {
      color: theme.colors.error,
      fontSize: 14,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    modalCloseText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalScroll: {
      flex: 1,
    },
    filterSection: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalPrimaryButton: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalPrimaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

const styles = StyleSheet.create({
  // Placeholder for type checking
});