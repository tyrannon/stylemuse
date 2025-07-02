import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { EnhancedStyleDNA } from '../../types/Avatar';
import { SafeImage } from '../../utils/SafeImage';

interface AvatarVisualizationProps {
  styleDNA: EnhancedStyleDNA;
}

const { width: screenWidth } = Dimensions.get('window');

export const AvatarVisualization: React.FC<AvatarVisualizationProps> = ({ styleDNA }) => {
  // Get avatar characteristics
  const hairColor = styleDNA.physical_attributes?.hair_color || 'brown';
  const skinTone = styleDNA.physical_attributes?.skin_tone || 'Medium';
  const bodyType = styleDNA.physical_attributes?.body_type || 'Rectangle';
  const name = styleDNA.personal_info?.name || 'Your Avatar';
  const gender = styleDNA.personal_info?.gender || 'nonbinary';
  
  // Get style preferences
  const styleArchetypes = styleDNA.style_profile?.style_archetypes || [];
  const favoriteColors = styleDNA.style_profile?.color_preferences?.favorite_colors || [];
  
  // Map characteristics to visual elements
  const getHairEmoji = () => {
    const lowerHair = hairColor.toLowerCase();
    if (gender === 'male') {
      if (lowerHair.includes('black')) return '👨🏽‍🦱';
      if (lowerHair.includes('brown')) return '👨🏽';
      if (lowerHair.includes('blonde') || lowerHair.includes('blond')) return '👨🏼';
      if (lowerHair.includes('red') || lowerHair.includes('ginger')) return '👨🏻‍🦰';
      if (lowerHair.includes('gray') || lowerHair.includes('grey')) return '👨🏽‍🦳';
      return '👨🏽';
    } else if (gender === 'female') {
      if (lowerHair.includes('black')) return '👩🏽‍🦱';
      if (lowerHair.includes('brown')) return '👩🏽';
      if (lowerHair.includes('blonde') || lowerHair.includes('blond')) return '👩🏼';
      if (lowerHair.includes('red') || lowerHair.includes('ginger')) return '👩🏻‍🦰';
      if (lowerHair.includes('gray') || lowerHair.includes('grey')) return '👩🏽‍🦳';
      return '👩🏽';
    } else {
      return '🧑🏽';
    }
  };

  const getBodyTypeDescription = () => {
    switch (bodyType) {
      case 'Pear': return 'Pear shape - curves at hips';
      case 'Apple': return 'Apple shape - fuller midsection';
      case 'Hourglass': return 'Hourglass - balanced curves';
      case 'Rectangle': return 'Rectangle - straight silhouette';
      case 'Athletic': return 'Athletic - strong & toned';
      case 'Inverted Triangle': return 'Inverted triangle - broad shoulders';
      default: return 'Unique body shape';
    }
  };

  const getStylePersonality = () => {
    if (styleArchetypes.length === 0) return 'Discovering your style...';
    if (styleArchetypes.length === 1) return `${styleArchetypes[0]} style lover`;
    if (styleArchetypes.length === 2) return `${styleArchetypes[0]} meets ${styleArchetypes[1]}`;
    return `Multi-style explorer (${styleArchetypes.slice(0, 2).join(' + ')} + more)`;
  };

  const getClothingEmojis = () => {
    const emojis = [];
    if (styleArchetypes.includes('Classic')) emojis.push('👔');
    if (styleArchetypes.includes('Bohemian')) emojis.push('🌻');
    if (styleArchetypes.includes('Minimalist')) emojis.push('🤍');
    if (styleArchetypes.includes('Edgy')) emojis.push('🖤');
    if (styleArchetypes.includes('Romantic')) emojis.push('🌸');
    if (styleArchetypes.includes('Trendy')) emojis.push('✨');
    if (styleArchetypes.includes('Sporty')) emojis.push('👟');
    if (styleArchetypes.includes('Glamorous')) emojis.push('💎');
    
    return emojis.length > 0 ? emojis.slice(0, 3) : ['👕', '👖', '👟'];
  };

  const sizes = styleDNA.physical_attributes?.clothing_sizes;
  const measurements = styleDNA.physical_attributes?.body_measurements;

  return (
    <View style={styles.container}>
      {/* Avatar Character */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarImageContainer}>
          {styleDNA.avatar_image_url ? (
            <SafeImage 
              uri={styleDNA.avatar_image_url}
              style={styles.avatarImage}
              fallbackStyle={styles.avatarPlaceholder}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.placeholderEmoji}>🎨</Text>
              <Text style={styles.placeholderText}>Avatar will generate when you save</Text>
            </View>
          )}
        </View>
        <Text style={styles.avatarName}>{name}</Text>
        <Text style={styles.avatarSubtitle}>{getStylePersonality()}</Text>
      </View>

      {/* Style Indicators */}
      <View style={styles.styleIndicators}>
        <Text style={styles.indicatorTitle}>Style Vibes</Text>
        <View style={styles.emojiRow}>
          {getClothingEmojis().map((emoji, index) => (
            <View key={index} style={styles.emojiContainer}>
              <Text style={styles.styleEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Body Type:</Text>
          <Text style={styles.statValue}>{getBodyTypeDescription()}</Text>
        </View>
        
        {sizes?.tops && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Size:</Text>
            <Text style={styles.statValue}>
              Tops {sizes.tops}{sizes.bottoms ? ` • Bottoms ${sizes.bottoms}` : ''}
            </Text>
          </View>
        )}
        
        {measurements?.height && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Height:</Text>
            <Text style={styles.statValue}>{measurements.height}</Text>
          </View>
        )}

        {favoriteColors.length > 0 && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Loves:</Text>
            <Text style={styles.statValue}>{favoriteColors.slice(0, 3).join(', ')}</Text>
          </View>
        )}
      </View>

      {/* Completion Badge */}
      <View style={styles.completionBadge}>
        <Text style={styles.badgeText}>
          {getCompletionPercentage(styleDNA)}% Complete
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getCompletionPercentage(styleDNA)}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const getCompletionPercentage = (styleDNA: EnhancedStyleDNA): number => {
  let completed = 0;
  let total = 12;

  // Check completion of key fields
  if (styleDNA.personal_info?.name) completed++;
  if (styleDNA.personal_info?.age_range) completed++;
  if (styleDNA.physical_attributes?.clothing_sizes?.tops) completed++;
  if (styleDNA.physical_attributes?.clothing_sizes?.bottoms) completed++;
  if (styleDNA.physical_attributes?.hair_color) completed++;
  if (styleDNA.physical_attributes?.hair_length) completed++;
  if (styleDNA.physical_attributes?.hair_style) completed++;
  if (styleDNA.physical_attributes?.skin_tone) completed++;
  if (styleDNA.physical_attributes?.body_type) completed++;
  if (styleDNA.style_profile?.style_archetypes?.length) completed++;
  if (styleDNA.style_profile?.fashion_goals?.length) completed++;
  if (styleDNA.lifestyle?.occupation) completed++;

  return Math.round((completed / total) * 100);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  placeholderEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  placeholderText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 12,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginTop: 12,
  },
  avatarSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 200,
  },
  styleIndicators: {
    marginBottom: 16,
    alignItems: 'center',
  },
  indicatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  styleEmoji: {
    fontSize: 20,
  },
  quickStats: {
    width: '100%',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  completionBadge: {
    width: '100%',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});