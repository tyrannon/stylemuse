import React, { memo, useState } from 'react';
import { Image, View, Text, StyleSheet, ImageSourcePropType } from 'react-native';

interface SpeedDialIconProps {
  source: ImageSourcePropType;
  style?: any;
  fallbackEmoji?: string;
  size?: number;
}

const SpeedDialIcon: React.FC<SpeedDialIconProps> = memo(({
  source,
  style,
  fallbackEmoji,
  size = 50
}) => {
  const [imageError, setImageError] = useState(false);

  // If image failed, show fallback
  if (imageError && fallbackEmoji) {
    return (
      <View style={[styles.fallbackContainer, { width: size, height: size }, style]}>
        <Text style={[styles.fallbackEmoji, { fontSize: size * 0.6 }]}>
          {fallbackEmoji}
        </Text>
      </View>
    );
  }

  // Simply render the image - let React Native handle caching for bundled assets
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );
});

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  fallbackEmoji: {
    textAlign: 'center',
  },
});

export default SpeedDialIcon;