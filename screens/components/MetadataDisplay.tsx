import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { MetadataTag } from './MetadataTag';
import { 
  OCCASION_OPTIONS, 
  STYLE_OPTIONS, 
  COLOR_OPTIONS, 
  SEASON_OPTIONS 
} from '../../contexts/OutfitFilterContext';

interface OutfitMetadata {
  occasion?: string;
  style?: string[];
  colorPaletteType?: string;
  season?: string[];
  formality?: string;
  confidence?: number;
  styleScore?: number;
  weatherAppropriateness?: string;
  tags?: string[];
}

interface MetadataDisplayProps {
  metadata: OutfitMetadata;
  compact?: boolean;
}

export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata, compact = false }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!metadata) return null;

  // Helper to get option config
  const getOccasionConfig = (value: string) => 
    OCCASION_OPTIONS.find(opt => opt.value === value) || { emoji: '📌', label: value };
  
  const getStyleConfig = (value: string) =>
    STYLE_OPTIONS.find(opt => opt.value === value) || { emoji: '🎨', label: value };
  
  const getColorConfig = (value: string) =>
    COLOR_OPTIONS.find(opt => opt.value === value) || { emoji: '🎨', label: value };
  
  const getSeasonConfig = (value: string) =>
    SEASON_OPTIONS.find(opt => opt.value === value) || { emoji: '📅', label: value };

  // Get color for metadata tags
  const getTagColor = (type: string) => {
    switch (type) {
      case 'occasion': return theme.colors.primary + '20';
      case 'style': return theme.colors.secondary + '20';
      case 'season': return '#4CAF50' + '20';
      case 'color': return '#9C27B0' + '20';
      default: return theme.colors.surface;
    }
  };

  if (compact) {
    // Compact view for grid display
    return (
      <View style={styles.compactContainer}>
        {metadata.occasion && (
          <View style={styles.compactTag}>
            <Text style={styles.compactIcon}>{getOccasionConfig(metadata.occasion).emoji}</Text>
            <Text style={styles.compactLabel}>{getOccasionConfig(metadata.occasion).label}</Text>
          </View>
        )}
        {metadata.season && metadata.season[0] && (
          <View style={styles.compactTag}>
            <Text style={styles.compactIcon}>{getSeasonConfig(metadata.season[0]).emoji}</Text>
          </View>
        )}
      </View>
    );
  }

  // Full metadata display
  return (
    <View style={styles.container}>
      {/* Style Score */}
      {metadata.styleScore && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreIcon}>⭐</Text>
          <Text style={styles.scoreText}>Style Score: {metadata.styleScore}/100</Text>
        </View>
      )}

      {/* Metadata Tags Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Outfit Details</Text>
        <View style={styles.tagsContainer}>
          {/* Occasion */}
          {metadata.occasion && (
            <MetadataTag
              icon={getOccasionConfig(metadata.occasion).emoji}
              label={getOccasionConfig(metadata.occasion).label}
              color={getTagColor('occasion')}
            />
          )}

          {/* Styles */}
          {metadata.style?.map((styleItem, index) => {
            const config = getStyleConfig(styleItem);
            return (
              <MetadataTag
                key={`style-${index}`}
                icon={config.emoji}
                label={config.label}
                color={getTagColor('style')}
              />
            );
          })}

          {/* Color Palette */}
          {metadata.colorPaletteType && (
            <MetadataTag
              icon={getColorConfig(metadata.colorPaletteType).emoji}
              label={getColorConfig(metadata.colorPaletteType).label}
              color={getTagColor('color')}
            />
          )}

          {/* Seasons */}
          {metadata.season?.map((seasonItem, index) => {
            const config = getSeasonConfig(seasonItem);
            return (
              <MetadataTag
                key={`season-${index}`}
                icon={config.emoji}
                label={config.label}
                color={getTagColor('season')}
              />
            );
          })}

          {/* Formality */}
          {metadata.formality && (
            <MetadataTag
              icon="👔"
              label={metadata.formality}
              color={theme.colors.surface}
            />
          )}
        </View>
      </View>

      {/* Additional Details */}
      <View style={styles.detailsSection}>
        {metadata.weatherAppropriateness && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🌡️</Text>
            <Text style={styles.detailText}>Weather: {metadata.weatherAppropriateness}</Text>
          </View>
        )}
        {metadata.confidence && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💯</Text>
            <Text style={styles.detailText}>Confidence: {metadata.confidence}% match</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  compactTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface + 'CC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  compactIcon: {
    fontSize: 12,
  },
  compactLabel: {
    fontSize: 10,
    color: theme.colors.text,
    marginLeft: 3,
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});