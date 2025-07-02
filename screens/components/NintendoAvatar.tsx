import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EnhancedStyleDNA } from '../../types/Avatar';

interface NintendoAvatarProps {
  styleDNA: EnhancedStyleDNA;
  size?: 'small' | 'medium' | 'large';
}

export const NintendoAvatar: React.FC<NintendoAvatarProps> = ({ styleDNA, size = 'medium' }) => {
  // Generate avatar based on user inputs
  const generateAvatarParts = () => {
    const gender = styleDNA.personal_info?.gender || 'nonbinary';
    const hairColor = styleDNA.physical_attributes?.hair_color || 'brown';
    const hairLength = styleDNA.physical_attributes?.hair_length || 'Medium';
    const hairStyle = styleDNA.physical_attributes?.hair_style || 'Straight';
    const skinTone = styleDNA.physical_attributes?.skin_tone || 'Medium';
    const bodyType = styleDNA.physical_attributes?.body_type || 'Rectangle';
    const styleArchetypes = styleDNA.style_profile?.style_archetypes || [];
    const favoriteColors = styleDNA.style_profile?.color_preferences?.favorite_colors || [];

    // Face color based on skin tone
    const getFaceColor = () => {
      const skinMap: { [key: string]: string } = {
        'Fair': '#fdbcb4',
        'Light': '#f1c27d',
        'Medium': '#e0ac69',
        'Olive': '#c68642',
        'Dark': '#8d5524',
        'Deep': '#694b3a'
      };
      return skinMap[skinTone] || '#e0ac69';
    };

    // Hair color based on hair color input
    const getHairColor = () => {
      const lowerHair = hairColor.toLowerCase();
      if (lowerHair.includes('black')) return '#2c1810';
      if (lowerHair.includes('brown')) return '#8b4513';
      if (lowerHair.includes('blonde') || lowerHair.includes('blond')) return '#daa520';
      if (lowerHair.includes('red') || lowerHair.includes('ginger')) return '#cd853f';
      if (lowerHair.includes('gray') || lowerHair.includes('grey')) return '#808080';
      if (lowerHair.includes('white')) return '#f5f5f5';
      return '#8b4513';
    };

    // Hair shape based on length and style
    const getHairShape = () => {
      if (hairLength === 'Bald') return 'none';
      if (hairLength === 'Very Short' || hairStyle === 'Buzz Cut') return 'buzzcut';
      if (hairStyle === 'Pixie') return 'pixie';
      if (hairStyle === 'Bob') return 'bob';
      if (hairLength === 'Long' || hairLength === 'Very Long') return 'long';
      return 'medium';
    };

    // Outfit color based on style archetypes
    const getOutfitColor = () => {
      if (styleArchetypes.includes('Classic')) return '#2c3e50';
      if (styleArchetypes.includes('Bohemian')) return '#d2691e';
      if (styleArchetypes.includes('Minimalist')) return '#f8f8ff';
      if (styleArchetypes.includes('Edgy')) return '#2c2c2c';
      if (styleArchetypes.includes('Romantic')) return '#ffb6c1';
      if (styleArchetypes.includes('Trendy')) return '#ff69b4';
      if (styleArchetypes.includes('Sporty')) return '#1e90ff';
      if (styleArchetypes.includes('Glamorous')) return '#ffd700';
      if (styleArchetypes.includes('Preppy')) return '#ff6b6b';
      if (styleArchetypes.includes('Artsy')) return '#9370db';
      return '#4a90e2';
    };

    // Background color based on favorite colors
    const getBackgroundColor = () => {
      if (favoriteColors.length === 0) return '#f0f8ff';
      
      const colorMap: { [key: string]: string } = {
        'black': '#2c2c2c',
        'white': '#ffffff',
        'gray': '#8e8e93',
        'blue': '#007AFF',
        'navy': '#1d3557',
        'red': '#ff3b30',
        'pink': '#ff69b4',
        'purple': '#af52de',
        'green': '#30d158',
        'yellow': '#ffcc02',
        'orange': '#ff9500',
        'brown': '#a2845e',
        'beige': '#f2f2f7',
        'gold': '#ffd700',
        'rose': '#ff69b4',
        'emerald': '#50c878'
      };

      const firstColor = favoriteColors[0].toLowerCase();
      for (const [key, value] of Object.entries(colorMap)) {
        if (firstColor.includes(key)) {
          return value + '30'; // Add transparency
        }
      }
      return '#f0f8ff';
    };

    return {
      faceColor: getFaceColor(),
      hairColor: getHairColor(),
      hairShape: getHairShape(),
      outfitColor: getOutfitColor(),
      backgroundColor: getBackgroundColor(),
      hasAccessories: styleArchetypes.includes('Glamorous') || styleArchetypes.includes('Trendy')
    };
  };

  const avatar = generateAvatarParts();
  const sizeConfig = {
    small: { container: 60, face: 40, hair: 30 },
    medium: { container: 100, face: 70, hair: 50 },
    large: { container: 140, face: 100, hair: 70 }
  };

  const currentSize = sizeConfig[size];

  // Hair component based on shape
  const renderHair = () => {
    if (avatar.hairShape === 'none') return null;
    
    const hairStyles = {
      buzzcut: { height: currentSize.hair * 0.3, borderRadius: currentSize.hair / 2 },
      pixie: { height: currentSize.hair * 0.4, borderRadius: currentSize.hair * 0.3 },
      bob: { height: currentSize.hair * 0.6, borderRadius: currentSize.hair * 0.2 },
      medium: { height: currentSize.hair * 0.7, borderRadius: currentSize.hair * 0.25 },
      long: { height: currentSize.hair * 0.9, borderRadius: currentSize.hair * 0.3 }
    };

    const hairStyle = hairStyles[avatar.hairShape as keyof typeof hairStyles] || hairStyles.medium;

    return (
      <View
        style={[
          styles.hair,
          {
            width: currentSize.hair,
            height: hairStyle.height,
            backgroundColor: avatar.hairColor,
            borderRadius: hairStyle.borderRadius,
            top: -(hairStyle.height * 0.3),
          }
        ]}
      />
    );
  };

  return (
    <View style={[
      styles.container,
      {
        width: currentSize.container,
        height: currentSize.container,
        backgroundColor: avatar.backgroundColor,
        borderRadius: currentSize.container / 2,
      }
    ]}>
      {/* Hair */}
      {renderHair()}
      
      {/* Face */}
      <View
        style={[
          styles.face,
          {
            width: currentSize.face,
            height: currentSize.face,
            backgroundColor: avatar.faceColor,
            borderRadius: currentSize.face / 2,
          }
        ]}
      >
        {/* Eyes */}
        <View style={styles.eyes}>
          <View style={[styles.eye, { width: currentSize.face * 0.12, height: currentSize.face * 0.12 }]} />
          <View style={[styles.eye, { width: currentSize.face * 0.12, height: currentSize.face * 0.12 }]} />
        </View>
        
        {/* Nose */}
        <View style={[styles.nose, { 
          width: currentSize.face * 0.06, 
          height: currentSize.face * 0.06,
          backgroundColor: avatar.faceColor,
          borderColor: '#00000020'
        }]} />
        
        {/* Mouth */}
        <View style={[styles.mouth, { 
          width: currentSize.face * 0.15, 
          height: currentSize.face * 0.08,
          borderColor: '#00000040'
        }]} />
      </View>
      
      {/* Outfit indicator */}
      <View style={[styles.outfitIndicator, { 
        backgroundColor: avatar.outfitColor,
        width: currentSize.container * 0.3,
        height: currentSize.container * 0.2,
        bottom: currentSize.container * 0.1,
      }]} />
      
      {/* Accessories */}
      {avatar.hasAccessories && (
        <View style={[styles.accessory, {
          width: currentSize.container * 0.15,
          height: currentSize.container * 0.15,
          top: currentSize.container * 0.1,
          right: currentSize.container * 0.1,
        }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  face: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  hair: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
    marginTop: '25%',
    marginBottom: '5%',
  },
  eye: {
    backgroundColor: '#2c2c2c',
    borderRadius: 50,
  },
  nose: {
    borderRadius: 50,
    borderWidth: 1,
    marginBottom: '5%',
  },
  mouth: {
    borderBottomWidth: 2,
    borderRadius: 20,
  },
  outfitIndicator: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00000020',
  },
  accessory: {
    position: 'absolute',
    backgroundColor: '#ffd700',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#00000020',
  },
});