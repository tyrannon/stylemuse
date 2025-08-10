import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { StylePack, StyleCard, CardRarity } from '../../types/StyleCards';
import { soundService } from '../../services/SoundService';
import { logger } from '../../utils/DebugLogger';
import { LogCategories } from '../../constants/LogCategories';

interface PackOpeningModalProps {
  visible: boolean;
  pack: StylePack | null;
  cards: StyleCard[];
  onClose: () => void;
  onOpenPack: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  visible,
  pack,
  cards,
  onClose,
  onOpenPack,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Animations
  const packRotateAnim = useRef(new Animated.Value(0)).current;
  const packScaleAnim = useRef(new Animated.Value(1)).current;
  const cardRevealAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnims = useRef(cards.map(() => new Animated.Value(screenWidth))).current;

  useEffect(() => {
    if (visible && pack) {
      resetAnimations();
    }
  }, [visible, pack]);

  const resetAnimations = () => {
    setIsOpening(false);
    setShowCards(false);
    setCurrentCardIndex(0);
    packRotateAnim.setValue(0);
    packScaleAnim.setValue(1);
    cardRevealAnim.setValue(0);
    cardSlideAnims.forEach(anim => anim.setValue(screenWidth));
  };

  const handleOpenPack = async () => {
    if (!pack || isOpening) return;

    setIsOpening(true);
    
    try {
      // Play pack opening sound
      await soundService.playPackOpen();
      
      // Pack opening animation
      Animated.sequence([
        // Rotate and scale pack
        Animated.parallel([
          Animated.timing(packRotateAnim, {
            toValue: 360,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(packScaleAnim, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(packScaleAnim, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Fade out pack, fade in cards
        Animated.timing(cardRevealAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCards(true);
        revealCardsSequentially();
      });

      // Call the actual pack opening logic
      onOpenPack();
      
      logger.info(LogCategories.GAMIFICATION, 'Pack opened with animation', {
        packType: pack.type,
        cardCount: cards.length
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to open pack', error);
      setIsOpening(false);
    }
  };

  const revealCardsSequentially = () => {
    cards.forEach((_, index) => {
      setTimeout(() => {
        Animated.spring(cardSlideAnims[index], {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        
        if (index === cards.length - 1) {
          // All cards revealed
          setTimeout(() => setIsOpening(false), 500);
        }
      }, index * 200);
    });
  };

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

  const getRarityGlow = (rarity: CardRarity): string => {
    switch (rarity) {
      case CardRarity.RARE: return 'rgba(59, 130, 246, 0.5)';
      case CardRarity.LEGENDARY: return 'rgba(245, 158, 11, 0.7)';
      case CardRarity.MYTHIC: return 'rgba(139, 92, 246, 0.8)';
      default: return 'transparent';
    }
  };

  if (!visible || !pack) return null;

  const packRotation = packRotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Pack Opening Stage */}
          {!showCards && (
            <View style={styles.packContainer}>
              <Animated.View
                style={[
                  styles.packImage,
                  {
                    transform: [
                      { rotate: packRotation },
                      { scale: packScaleAnim }
                    ],
                  },
                ]}
              >
                <View style={[styles.packCard, { backgroundColor: '#4F46E5' }]}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packDescription}>{pack.description}</Text>
                  <Text style={styles.cardCount}>{pack.cardCount} Cards</Text>
                </View>
              </Animated.View>
              
              {!isOpening && (
                <TouchableOpacity
                  style={styles.openButton}
                  onPress={handleOpenPack}
                >
                  <Text style={styles.openButtonText}>Open Pack!</Text>
                </TouchableOpacity>
              )}
              
              {isOpening && (
                <Text style={styles.openingText}>Opening Pack...</Text>
              )}
            </View>
          )}

          {/* Cards Reveal Stage */}
          {showCards && (
            <Animated.View style={[styles.cardsContainer, { opacity: cardRevealAnim }]}>
              <Text style={styles.revealTitle}>You Got:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsScrollView}
              >
                {cards.map((card, index) => (
                  <Animated.View
                    key={card.id}
                    style={[
                      styles.cardContainer,
                      {
                        transform: [{ translateX: cardSlideAnims[index] }],
                        shadowColor: getRarityGlow(card.rarity),
                      },
                    ]}
                  >
                    <View style={[
                      styles.card,
                      {
                        borderColor: getRarityColor(card.rarity),
                        backgroundColor: card.isHolographic ? '#1F2937' : '#FFFFFF',
                      }
                    ]}>
                      {/* Card Image */}
                      <View style={styles.cardImageContainer}>
                        {card.imageUrl ? (
                          <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
                        ) : (
                          <View style={[styles.placeholderImage, { backgroundColor: getRarityColor(card.rarity) }]}>
                            <Text style={styles.placeholderText}>{card.type.toUpperCase()}</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Card Info */}
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: card.isHolographic ? '#FFFFFF' : '#000000' }]}>
                          {card.name}
                        </Text>
                        <Text style={[styles.cardRarity, { color: getRarityColor(card.rarity) }]}>
                          {card.rarity.toUpperCase()}
                        </Text>
                        <View style={styles.cardStats}>
                          <Text style={[styles.statText, { color: card.isHolographic ? '#D1D5DB' : '#6B7280' }]}>
                            ⚡ {card.stylePoints}
                          </Text>
                          <Text style={[styles.statText, { color: card.isHolographic ? '#D1D5DB' : '#6B7280' }]}>
                            🔄 {card.versatility}/10
                          </Text>
                        </View>
                      </View>
                      
                      {/* Holographic effect */}
                      {card.isHolographic && (
                        <View style={styles.holographicOverlay} />
                      )}
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>
              
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  packContainer: {
    alignItems: 'center',
  },
  packImage: {
    marginBottom: 40,
  },
  packCard: {
    width: 200,
    height: 280,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  packName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  packDescription: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FBBF24',
  },
  openButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  openButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  openingText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  revealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 30,
  },
  cardsScrollView: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    marginHorizontal: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    width: 160,
    height: 220,
    borderRadius: 12,
    borderWidth: 3,
    padding: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardImageContainer: {
    flex: 1,
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statText: {
    fontSize: 10,
    fontWeight: '500',
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
  closeButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 30,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PackOpeningModal;