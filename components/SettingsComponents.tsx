import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Reusable Settings Row Component
interface SettingsRowProps {
  icon: string;
  title: string;
  value?: string;
  hasChevron?: boolean;
  onPress?: () => void;
  theme: any;
  rightComponent?: React.ReactNode;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  value,
  hasChevron = true,
  onPress,
  theme,
  rightComponent
}) => {
  return (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: theme.colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.leftContent}>
        <Text style={[styles.icon, { color: theme.colors.primary }]}>{icon}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <View style={styles.rightContent}>
        {rightComponent && rightComponent}
        {value && <Text style={[styles.value, { color: theme.colors.textSecondary }]}>{value}</Text>}
        {hasChevron && onPress && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.textMuted} 
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Settings Section Header
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  theme: any;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, theme }) => {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.card }]}>
        {children}
      </View>
    </View>
  );
};

// Theme Mode Option Component
interface ThemeModeOptionProps {
  mode: 'light' | 'dark' | 'system';
  currentMode: string;
  onSelect: (mode: 'light' | 'dark' | 'system') => void;
  theme: any;
}

export const ThemeModeOption: React.FC<ThemeModeOptionProps> = ({
  mode,
  currentMode,
  onSelect,
  theme
}) => {
  const isSelected = currentMode === mode;
  const getIcon = () => {
    switch (mode) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '🔄';
      default: return '⚙️';
    }
  };

  const getLabel = () => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'Auto';
      default: return mode;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        }
      ]}
      onPress={() => onSelect(mode)}
    >
      <Text style={styles.themeOptionIcon}>{getIcon()}</Text>
      <Text
        style={[
          styles.themeOptionText,
          {
            color: isSelected ? '#FFFFFF' : theme.colors.text,
          }
        ]}
      >
        {getLabel()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Settings Row Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44, // iOS standard touch target
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 17,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 8,
  },

  // Settings Section Styles
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },

  // Theme Option Styles
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    minWidth: 70,
  },
  themeOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});