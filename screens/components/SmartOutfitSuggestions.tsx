import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { LovedOutfit } from '../../hooks/useWardrobeData';
import { SafeImage } from '../../utils/SafeImage';

// Helper function to safely format dates
const formatDate = (date: any): string => {
  try {
    if (!date) return 'Never';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.warn('Invalid date in suggestions:', error);
    return 'Invalid date';
  }
};

// Helper function to safely calculate days since worn
const getDaysSinceWorn = (lastWorn: any): number | null => {
  try {
    if (!lastWorn) return null;
    const lastWornDate = lastWorn instanceof Date ? lastWorn : new Date(lastWorn);
    return Math.floor((new Date().getTime() - lastWornDate.getTime()) / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Invalid lastWorn date:', error);
    return null;
  }
};

interface SmartOutfitSuggestionsProps {
  suggestions: LovedOutfit[];
  onOutfitPress: (outfit: LovedOutfit) => void;
  onMarkAsWorn: (outfitId: string) => void;
}

export const SmartOutfitSuggestions: React.FC<SmartOutfitSuggestionsProps> = ({
  suggestions,
  onOutfitPress,
  onMarkAsWorn,
}) => {
  if (suggestions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🤔</Text>
        <Text style={styles.emptyTitle}>No Suggestions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Create and wear some outfits to get smart suggestions!
        </Text>
      </View>
    );
  }

  const neverWorn = suggestions.filter(s => s.timesWorn === 0);
  const readyForReWear = suggestions.filter(s => s.timesWorn > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧠 Smart Outfit Suggestions</Text>
        <Text style={styles.subtitle}>
          Based on your wear history and preferences
        </Text>
      </View>

      {neverWorn.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✨ Never Worn ({neverWorn.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {neverWorn.map((outfit) => (
              <OutfitSuggestionCard
                key={outfit.id}
                outfit={outfit}
                onPress={() => onOutfitPress(outfit)}
                onMarkAsWorn={() => onMarkAsWorn(outfit.id)}
                suggestionReason="Never worn before"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {readyForReWear.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🔄 Ready for Re-wear ({readyForReWear.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {readyForReWear.map((outfit) => {
              const daysSinceWorn = getDaysSinceWorn(outfit.lastWorn) || 0;
              
              return (
                <OutfitSuggestionCard
                  key={outfit.id}
                  outfit={outfit}
                  onPress={() => onOutfitPress(outfit)}
                  onMarkAsWorn={() => onMarkAsWorn(outfit.id)}
                  suggestionReason={`${daysSinceWorn} days since last worn`}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

interface OutfitSuggestionCardProps {
  outfit: LovedOutfit;
  onPress: () => void;
  onMarkAsWorn: () => void;
  suggestionReason: string;
}

const OutfitSuggestionCard: React.FC<OutfitSuggestionCardProps> = ({
  outfit,
  onPress,
  onMarkAsWorn,
  suggestionReason,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} style={styles.cardContent}>
        <SafeImage
          uri={outfit.image}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        {/* Quick Mark as Worn button */}
        <TouchableOpacity
          onPress={onMarkAsWorn}
          style={styles.quickWornButton}
        >
          <Text style={styles.quickWornText}>👔</Text>
        </TouchableOpacity>
        
        {/* Love indicator */}
        {outfit.isLoved && (
          <View style={styles.loveIndicator}>
            <Text style={styles.loveIndicatorText}>❤️</Text>
          </View>
        )}
        
        <View style={styles.cardInfo}>
          <Text style={styles.suggestionReason}>{suggestionReason}</Text>
          
          {/* Weather info if available */}
          {outfit.weatherData && (
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherText}>
                🌡️ {outfit.weatherData.temperature}°F
              </Text>
            </View>
          )}
          
          {/* Wear count */}
          <Text style={styles.wearCount}>
            Worn {outfit.timesWorn} time{outfit.timesWorn !== 1 ? 's' : ''}
          </Text>
          
          {/* Creation date */}
          <Text style={styles.createdDate}>
            Created {formatDate(outfit.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 180,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickWornButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickWornText: {
    fontSize: 16,
    color: 'white',
  },
  loveIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loveIndicatorText: {
    fontSize: 12,
  },
  cardInfo: {
    gap: 4,
  },
  suggestionReason: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  weatherBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  weatherText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  wearCount: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  createdDate: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});