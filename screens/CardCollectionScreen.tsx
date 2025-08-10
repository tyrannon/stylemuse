import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { StyleCard, CardRarity, CardType, CardCollection } from '../types/StyleCards';
import { SoundButton } from '../components/SoundButton';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface CardCollectionScreenProps {
  onGoBack: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 3; // 3 cards per row with padding

export default function CardCollectionScreen({ onGoBack }: CardCollectionScreenProps) {
  const [collection, setCollection] = useState<CardCollection | null>(null);
  const [cards, setCards] = useState<StyleCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | 'all'>('all');
  const [selectedType, setSelectedType] = useState<CardType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'date' | 'usage'>('rarity');
  const [selectedCard, setSelectedCard] = useState<StyleCard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCardCollection();
  }, []);

  const loadCardCollection = async () => {
    try {
      // Mock data for now - in production, this would load from AsyncStorage/API
      const mockCards: StyleCard[] = [
        {
          id: '1',
          name: 'Classic Denim Jacket',
          description: 'Timeless denim jacket perfect for casual outings',
          type: CardType.TOP,
          rarity: CardRarity.UNCOMMON,
          stylePoints: 75,
          versatility: 8,
          trendiness: 7,
          occasionMatch: 6,
          imageUrl: undefined,
          isHolographic: false,
          isShiny: false,
          primaryAttribute: 'casual' as any,
          season: 'all',
          colors: ['blue', 'indigo'],
          tags: ['denim', 'casual', 'jacket'],
          dateObtained: new Date(),
          timesUsed: 5,
          favorited: true,
          rarityMultiplier: 1.2,
        },
        {
          id: '2',
          name: 'Golden Evening Gown',
          description: 'Luxurious golden gown for special occasions',
          type: CardType.BOTTOM,
          rarity: CardRarity.LEGENDARY,
          stylePoints: 95,
          versatility: 4,
          trendiness: 9,
          occasionMatch: 10,
          imageUrl: undefined,
          isHolographic: true,
          isShiny: false,
          primaryAttribute: 'glamorous' as any,
          season: 'all',
          colors: ['gold', 'yellow'],
          tags: ['formal', 'gown', 'elegant'],
          dateObtained: new Date(),
          timesUsed: 2,
          favorited: true,
          rarityMultiplier: 2.0,
          specialAbility: 'Charm +50% for formal occasions',
        },
        // Add more mock cards...
      ];

      const mockCollection: CardCollection = {
        userId: 'user1',
        cards: mockCards,
        totalCards: mockCards.length,
        uniqueCards: mockCards.length,
        completionPercentage: 15,
        commonCount: mockCards.filter(c => c.rarity === CardRarity.COMMON).length,
        uncommonCount: mockCards.filter(c => c.rarity === CardRarity.UNCOMMON).length,
        rareCount: mockCards.filter(c => c.rarity === CardRarity.RARE).length,
        legendaryCount: mockCards.filter(c => c.rarity === CardRarity.LEGENDARY).length,
        mythicCount: mockCards.filter(c => c.rarity === CardRarity.MYTHIC).length,
        holographicCount: mockCards.filter(c => c.isHolographic).length,
        shinyCount: mockCards.filter(c => c.isShiny).length,
        collectionLevel: 5,
        prestigeRank: 'Fashion Enthusiast',
        lastUpdated: new Date(),
      };

      setCollection(mockCollection);
      setCards(mockCards);
      
      logger.info(LogCategories.GAMIFICATION, 'Card collection loaded', {
        totalCards: mockCards.length,
        uniqueCards: mockCards.length
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to load card collection', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCardCollection();
    setRefreshing(false);
  };

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(card => card.rarity === selectedRarity);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(card => card.type === selectedType);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = [CardRarity.COMMON, CardRarity.UNCOMMON, CardRarity.RARE, CardRarity.LEGENDARY, CardRarity.MYTHIC];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'date':
          return new Date(b.dateObtained).getTime() - new Date(a.dateObtained).getTime();
        case 'usage':
          return b.timesUsed - a.timesUsed;
        default:
          return 0;
      }
    });
  }, [cards, searchQuery, selectedRarity, selectedType, sortBy]);

  const getRarityColor = (rarity: CardRarity): string => {
    switch (rarity) {
      case CardRarity.COMMON: return '#9CA3AF';
      case CardRarity.UNCOMMON: return '#10B981';
      case CardRarity.RARE: return '#3B82F6';
      case CardRarity.LEGENDARY: return '#F59E0B';
      case CardRarity.MYTHIC: return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const renderCard = ({ item }: { item: StyleCard }) => (
    <SoundButton
      style={[styles.cardContainer, { borderColor: getRarityColor(item.rarity) }]}
      onPress={() => setSelectedCard(item)}
    >
      <View style={[styles.card, { backgroundColor: item.isHolographic ? '#1F2937' : '#FFFFFF' }]}>
        {/* Card Image */}
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: getRarityColor(item.rarity) }]}>
              <Text style={styles.placeholderText}>{item.type.toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        {/* Card Info */}
        <View style={styles.cardInfo}>
          <Text 
            style={[styles.cardName, { color: item.isHolographic ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[styles.cardRarity, { color: getRarityColor(item.rarity) }]}>
            {item.rarity.toUpperCase()}
          </Text>
          
          <View style={styles.cardStats}>
            <Text style={[styles.statText, { color: item.isHolographic ? '#D1D5DB' : '#6B7280' }]}>
              ⚡ {item.stylePoints}
            </Text>
            <Text style={[styles.statText, { color: item.isHolographic ? '#D1D5DB' : '#6B7280' }]}>
              Used: {item.timesUsed}
            </Text>
          </View>
          
          {item.favorited && (
            <Text style={styles.favoriteIcon}>❤️</Text>
          )}
        </View>
        
        {/* Holographic effect overlay */}
        {item.isHolographic && (
          <View style={styles.holographicOverlay} />
        )}
      </View>
    </SoundButton>
  );

  const renderStatsCard = () => {
    if (!collection) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Collection Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{collection.totalCards}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{collection.completionPercentage}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>Level {collection.collectionLevel}</Text>
            <Text style={styles.statLabel}>Collection</Text>
          </View>
        </View>
        <View style={styles.rarityBreakdown}>
          <View style={[styles.rarityItem, { backgroundColor: getRarityColor(CardRarity.COMMON) }]}>
            <Text style={styles.rarityCount}>{collection.commonCount}</Text>
          </View>
          <View style={[styles.rarityItem, { backgroundColor: getRarityColor(CardRarity.UNCOMMON) }]}>
            <Text style={styles.rarityCount}>{collection.uncommonCount}</Text>
          </View>
          <View style={[styles.rarityItem, { backgroundColor: getRarityColor(CardRarity.RARE) }]}>
            <Text style={styles.rarityCount}>{collection.rareCount}</Text>
          </View>
          <View style={[styles.rarityItem, { backgroundColor: getRarityColor(CardRarity.LEGENDARY) }]}>
            <Text style={styles.rarityCount}>{collection.legendaryCount}</Text>
          </View>
          <View style={[styles.rarityItem, { backgroundColor: getRarityColor(CardRarity.MYTHIC) }]}>
            <Text style={styles.rarityCount}>{collection.mythicCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SoundButton onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </SoundButton>
        <Text style={styles.headerTitle}>Card Collection</Text>
        <View style={styles.headerRight}>
          <Text style={styles.prestigeRank}>{collection?.prestigeRank}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Section */}
        {renderStatsCard()}

        {/* Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SoundButton
                style={[styles.filterButton, selectedRarity === 'all' && styles.filterButtonActive]}
                onPress={() => setSelectedRarity('all')}
              >
                <Text style={[styles.filterButtonText, selectedRarity === 'all' && styles.filterButtonTextActive]}>
                  All Rarities
                </Text>
              </SoundButton>
              
              {Object.values(CardRarity).map((rarity) => (
                <SoundButton
                  key={rarity}
                  style={[
                    styles.filterButton,
                    selectedRarity === rarity && styles.filterButtonActive,
                    { borderColor: getRarityColor(rarity) }
                  ]}
                  onPress={() => setSelectedRarity(rarity)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedRarity === rarity && styles.filterButtonTextActive,
                    { color: getRarityColor(rarity) }
                  ]}>
                    {rarity}
                  </Text>
                </SoundButton>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Cards Grid */}
        <FlatList
          data={filteredAndSortedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.cardsGrid}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Card Detail Modal */}
      {selectedCard && (
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.cardDetailModal}>
            <SoundButton
              style={styles.closeButton}
              onPress={() => setSelectedCard(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </SoundButton>
            
            <View style={[styles.detailCard, { borderColor: getRarityColor(selectedCard.rarity) }]}>
              <Text style={styles.detailCardName}>{selectedCard.name}</Text>
              <Text style={styles.detailCardDescription}>{selectedCard.description}</Text>
              
              <View style={styles.detailStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Style Points:</Text>
                  <Text style={styles.statValue}>{selectedCard.stylePoints}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Versatility:</Text>
                  <Text style={styles.statValue}>{selectedCard.versatility}/10</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Trendiness:</Text>
                  <Text style={styles.statValue}>{selectedCard.trendiness}/10</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Times Used:</Text>
                  <Text style={styles.statValue}>{selectedCard.timesUsed}</Text>
                </View>
              </View>
              
              {selectedCard.specialAbility && (
                <View style={styles.specialAbility}>
                  <Text style={styles.specialAbilityTitle}>Special Ability:</Text>
                  <Text style={styles.specialAbilityText}>{selectedCard.specialAbility}</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  prestigeRank: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  rarityBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rarityItem: {
    width: 40,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  cardsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    width: cardWidth,
    height: cardWidth * 1.4,
    marginBottom: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  card: {
    flex: 1,
    padding: 8,
  },
  cardImageContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardRarity: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statText: {
    fontSize: 8,
    fontWeight: '500',
  },
  favoriteIcon: {
    position: 'absolute',
    top: -25,
    right: 5,
    fontSize: 12,
  },
  holographicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.7,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetailModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailCard: {
    borderWidth: 3,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  detailCardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailStats: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  specialAbility: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
  },
  specialAbilityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 5,
  },
  specialAbilityText: {
    fontSize: 12,
    color: '#B45309',
    fontStyle: 'italic',
  },
});