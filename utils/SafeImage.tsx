import React from 'react';
import { Image, View, Text, ImageProps, ViewStyle } from 'react-native';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null | undefined;
  fallbackStyle?: ViewStyle;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  uri, 
  fallbackStyle, 
  style, 
  ...props 
}) => {
  // Check if URI is valid
  const isValidUri = uri && 
    typeof uri === 'string' && 
    uri.trim() !== '' && 
    (uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('/'));

  if (isValidUri) {
    return <Image source={{ uri }} style={style} {...props} />;
  }

  // Fallback for invalid URIs
  const fallbackStyles = [
    style,
    {
      backgroundColor: '#f5f5f5',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
    },
    fallbackStyle,
  ];

  return (
    <View style={fallbackStyles}>
      <Text style={{ fontSize: 24, color: '#ccc' }}>📷</Text>
    </View>
  );
};