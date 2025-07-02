import React, { useState } from 'react';
import { Image, View, Text, ImageProps, ViewStyle } from 'react-native';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null | undefined;
  fallbackStyle?: ViewStyle;
  category?: string;
  placeholder?: 'item' | 'outfit' | 'generic';
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  uri, 
  fallbackStyle, 
  style, 
  category,
  placeholder = 'generic',
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if URI is valid
  const isValidUri = uri && 
    typeof uri === 'string' && 
    uri.trim() !== '' && 
    (uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('/'));

  const getCategoryIcon = (cat?: string) => {
    if (!cat) return '👔';
    
    const categoryLower = cat.toLowerCase();
    if (categoryLower.includes('top') || categoryLower.includes('shirt') || categoryLower.includes('blouse')) return '👕';
    if (categoryLower.includes('bottom') || categoryLower.includes('pants') || categoryLower.includes('jeans')) return '👖';
    if (categoryLower.includes('shoes') || categoryLower.includes('sneaker') || categoryLower.includes('boot')) return '👟';
    if (categoryLower.includes('jacket') || categoryLower.includes('coat') || categoryLower.includes('blazer')) return '🧥';
    if (categoryLower.includes('hat') || categoryLower.includes('cap') || categoryLower.includes('beanie')) return '👒';
    if (categoryLower.includes('accessory') || categoryLower.includes('jewelry') || categoryLower.includes('bag')) return '💼';
    if (categoryLower.includes('dress')) return '👗';
    if (categoryLower.includes('skirt')) return '👗';
    return '👔';
  };

  const getPlaceholderIcon = () => {
    switch (placeholder) {
      case 'item':
        return getCategoryIcon(category);
      case 'outfit':
        return '✨';
      default:
        return '📷';
    }
  };

  const getPlaceholderColors = () => {
    switch (placeholder) {
      case 'item':
        return {
          backgroundColor: '#f8f9fa',
          borderColor: '#dee2e6',
          iconColor: '#6c757d',
        };
      case 'outfit':
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          iconColor: '#e17055',
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          borderColor: '#e0e0e0',
          iconColor: '#ccc',
        };
    }
  };

  // If we have a valid URI and no error, try to load the image
  if (isValidUri && !imageError) {
    return (
      <Image 
        source={{ uri }} 
        style={style} 
        onError={() => {
          console.log('Image failed to load:', uri);
          setImageError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        onLoadStart={() => setIsLoading(true)}
        {...props} 
      />
    );
  }

  // Fallback for invalid URIs or load errors
  const colors = getPlaceholderColors();
  const fallbackStyles = [
    style,
    {
      backgroundColor: colors.backgroundColor,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
    },
    fallbackStyle,
  ];

  return (
    <View style={fallbackStyles}>
      <Text style={{ fontSize: 32, color: colors.iconColor, marginBottom: 4 }}>
        {getPlaceholderIcon()}
      </Text>
      {placeholder === 'item' && (
        <Text style={{ fontSize: 10, color: colors.iconColor, textAlign: 'center' }}>
          {category ? category.toUpperCase() : 'ITEM'}
        </Text>
      )}
      {placeholder === 'item' && category && (
        <Text style={{ fontSize: 8, color: '#FF9500', textAlign: 'center', marginTop: 2 }}>
          AMAZON
        </Text>
      )}
      {imageError && (
        <Text style={{ fontSize: 8, color: '#dc3545', textAlign: 'center', marginTop: 2 }}>
          Image unavailable
        </Text>
      )}
    </View>
  );
};