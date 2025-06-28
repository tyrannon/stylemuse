import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { LovedOutfit } from '../../hooks/useWardrobeData';
import { SafeImage } from '../../utils/SafeImage';

interface OutfitWearStats {
  totalOutfits: number;
  wornOutfits: number;
  neverWornOutfits: number;
  totalWears: number;
  averageWearsPerOutfit: number;
  mostWornOutfit: LovedOutfit | null;
  favoriteOutfits: LovedOutfit[];
  readyForReSuggestion: number;
}

interface OutfitAnalyticsProps {
  stats: OutfitWearStats;
  onOutfitPress: (outfit: LovedOutfit) => void;
}

export const OutfitAnalytics: React.FC<OutfitAnalyticsProps> = ({
  stats,
  onOutfitPress,
}) => {
  const utilizationPercentage = stats.totalOutfits > 0 
    ? Math.round((stats.wornOutfits / stats.totalOutfits) * 100)
    : 0;

  // Helper function to safely format dates
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'Never';
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.warn('Invalid date in analytics:', error);
      return 'Invalid date';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Outfit Analytics</Text>
        <Text style={styles.subtitle}>
          Insights into your outfit wearing patterns
        </Text>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.statNumber}>{stats.totalOutfits}</Text>
          <Text style={styles.statLabel}>Total Outfits</Text>
        </View>
        
        <View style={[styles.statCard, styles.successCard]}>
          <Text style={styles.statNumber}>{stats.wornOutfits}</Text>
          <Text style={styles.statLabel}>Worn</Text>
        </View>
        
        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.statNumber}>{stats.neverWornOutfits}</Text>
          <Text style={styles.statLabel}>Never Worn</Text>
        </View>
        
        <View style={[styles.statCard, styles.infoCard]}>
          <Text style={styles.statNumber}>{stats.totalWears}</Text>
          <Text style={styles.statLabel}>Total Wears</Text>
        </View>
      </View>

      {/* Utilization Rate */}
      <View style={styles.utilizationCard}>
        <Text style={styles.utilizationTitle}>👔 Wardrobe Utilization</Text>
        <View style={styles.utilizationBarContainer}>
          <View style={styles.utilizationBar}>
            <View 
              style={[
                styles.utilizationFill, 
                { 
                  width: `${utilizationPercentage}%`,
                  backgroundColor: utilizationPercentage >= 70 ? '#4CAF50' : 
                                   utilizationPercentage >= 40 ? '#FF9800' : '#FF5722'
                }
              ]} 
            />
          </View>
          <Text style={styles.utilizationText}>
            {utilizationPercentage}% of outfits have been worn
          </Text>
        </View>
        
        <Text style={styles.utilizationSubtext}>
          Average: {stats.averageWearsPerOutfit} wears per outfit
        </Text>
      </View>

      {/* Most Worn Outfit */}
      {stats.mostWornOutfit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Most Worn Outfit</Text>
          <TouchableOpacity 
            style={styles.mostWornCard}
            onPress={() => onOutfitPress(stats.mostWornOutfit!)}
          >
            <SafeImage
              uri={stats.mostWornOutfit.image}
              style={styles.mostWornImage}
              resizeMode="cover"
            />
            <View style={styles.mostWornInfo}>
              <Text style={styles.mostWornTitle}>
                Champion Outfit 👑
              </Text>
              <Text style={styles.mostWornStats}>
                Worn {stats.mostWornOutfit.timesWorn} times
              </Text>
              {stats.mostWornOutfit.lastWorn && (
                <Text style={styles.mostWornDate}>
                  Last worn: {formatDate(stats.mostWornOutfit.lastWorn)}
                </Text>
              )}
              {stats.mostWornOutfit.weatherData && (
                <Text style={styles.mostWornWeather}>
                  🌡️ {stats.mostWornOutfit.weatherData.temperature}°F outfit
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Favorite Outfits */}
      {stats.favoriteOutfits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ⭐ Top Favorites ({stats.favoriteOutfits.length})
          </Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoritesContainer}
          >
            {stats.favoriteOutfits.map((outfit, index) => (
              <TouchableOpacity
                key={outfit.id}
                style={styles.favoriteCard}
                onPress={() => onOutfitPress(outfit)}
              >
                <View style={styles.favoriteRank}>
                  <Text style={styles.favoriteRankText}>#{index + 1}</Text>
                </View>
                
                <SafeImage
                  uri={outfit.image}
                  style={styles.favoriteImage}
                  resizeMode="cover"
                />
                
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteWears}>
                    {outfit.timesWorn} wears
                  </Text>
                  {outfit.isLoved && (
                    <Text style={styles.favoriteLoved}>❤️</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ready for Re-suggestion */}
      {stats.readyForReSuggestion > 0 && (
        <View style={styles.reminderCard}>
          <Text style={styles.reminderIcon}>🔔</Text>
          <Text style={styles.reminderTitle}>Ready to Re-wear!</Text>
          <Text style={styles.reminderText}>
            {stats.readyForReSuggestion} outfit{stats.readyForReSuggestion !== 1 ? 's are' : ' is'} ready to be worn again
          </Text>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Style Tips</Text>
        <View style={styles.tipsList}>
          {utilizationPercentage < 30 && (
            <Text style={styles.tipText}>
              • Try wearing some of your never-worn outfits to maximize your wardrobe!
            </Text>
          )}
          {stats.neverWornOutfits > 5 && (
            <Text style={styles.tipText}>
              • You have {stats.neverWornOutfits} unworn outfits - perfect for new looks!
            </Text>
          )}
          {stats.averageWearsPerOutfit < 1 && (
            <Text style={styles.tipText}>
              • Consider re-wearing your favorite outfits more often!
            </Text>
          )}
          {stats.favoriteOutfits.length > 0 && (
            <Text style={styles.tipText}>
              • Your most-worn outfits are clearly winners - create similar looks!
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  utilizationCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  utilizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  utilizationBarContainer: {
    marginBottom: 12,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  utilizationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  utilizationSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mostWornCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mostWornImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  mostWornInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mostWornTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mostWornStats: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  mostWornDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  mostWornWeather: {
    fontSize: 12,
    color: '#666',
  },
  favoritesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  favoriteCard: {
    width: 100,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteRank: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  favoriteRankText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  favoriteImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  favoriteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteWears: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  favoriteLoved: {
    fontSize: 12,
  },
  reminderCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  reminderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 14,
    color: '#FF8F00',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});