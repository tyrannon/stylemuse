import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface MetadataTagProps {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export const MetadataTag: React.FC<MetadataTagProps> = ({ 
  icon, 
  label, 
  value,
  color,
  size = 'medium' 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, color, size);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>
    </View>
  );
};

const createStyles = (theme: any, customColor?: string, size: string = 'medium') => {
  const sizeConfig = {
    small: {
      paddingH: 8,
      paddingV: 4,
      fontSize: 12,
      iconSize: 14,
      borderRadius: 12,
    },
    medium: {
      paddingH: 12,
      paddingV: 6,
      fontSize: 14,
      iconSize: 16,
      borderRadius: 16,
    },
    large: {
      paddingH: 16,
      paddingV: 8,
      fontSize: 16,
      iconSize: 20,
      borderRadius: 20,
    },
  };

  const config = sizeConfig[size as keyof typeof sizeConfig];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: customColor || theme.colors.surface,
      paddingHorizontal: config.paddingH,
      paddingVertical: config.paddingV,
      borderRadius: config.borderRadius,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
      marginBottom: 8,
    },
    icon: {
      fontSize: config.iconSize,
      marginRight: 6,
    },
    textContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      fontSize: config.fontSize,
      color: theme.colors.text,
      fontWeight: '500',
    },
    value: {
      fontSize: config.fontSize,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
  });
};