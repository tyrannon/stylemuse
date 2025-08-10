import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { soundService } from '../services/SoundService';
import { cardGenerationService } from '../services/CardGenerationService';
import { StyleCard, StylePack, CardRarity } from '../types/StyleCards';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

interface PackOpeningModalProps {
  visible: boolean;
  onClose: () => void;
  pack: StylePack | null;
  onCardsRevealed: (cards: StyleCard[]) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  visible,
  onClose,
  pack,
  onCardsRevealed,
}) => {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<'closed' | 'opening' | 'revealing' | 'complete'>('closed');
  const [generatedCards, setGeneratedCards] = useState<StyleCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Animation values
  const packScaleAnim = useRef(new Animated.Value(1)).current;
  const packRotateAnim = useRef(new Animated.Value(0)).current;
  const packShakeAnim = useRef(new Animated.Value(0)).current;
  const cardRevealAnims = useRef<Animated.Value[]>([]).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && pack) {
      resetAnimations();
      generatePackCards();
    }
  }, [visible, pack]);

  const resetAnimations = () => {
    setPhase('closed');
    setCurrentCardIndex(0);
    setGeneratedCards([]);
    packScaleAnim.setValue(1);
    packRotateAnim.setValue(0);
    packShakeAnim.setValue(0);
    sparkleAnim.setValue(0);
    cardRevealAnims.splice(0);
  };

  const generatePackCards = async () => {
    if (!pack) return;

    try {
      // Generate cards based on pack type
      const cards = cardGenerationService.generateCardsForPack(
        pack.cardCount,
        pack.type === 'premium' ? CardRarity.RARE : undefined
      );

      setGeneratedCards(cards);

      // Initialize card reveal animations
      cardRevealAnims.splice(0);
      cards.forEach(() => {
        cardRevealAnims.push(new Animated.Value(0));
      });

      logger.info(LogCategories.GAMIFICATION, 'Pack cards generated', {
        packId: pack.id,
        cardCount: cards.length,
        rarities: cards.map(c => c.rarity),
      });
    } catch (error) {
      logger.error(LogCategories.GAMIFICATION, 'Failed to generate pack cards', error as Error);
    }
  };

  const startPackOpening = async () => {
    if (phase !== 'closed' || !pack) return;

    setPhase('opening');
    await soundService.playPackOpen();

    // Pack opening animation sequence
    Animated.sequence([
      // Shake and grow
      Animated.parallel([
        Animated.sequence([
          Animated.timing(packShakeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(packShakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(packScaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Spin and explode
      Animated.parallel([
        Animated.timing(packRotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(packScaleAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setPhase('revealing');
      startCardReveal();
    });
  };

  const startCardReveal = () => {
    if (generatedCards.length === 0) return;

    const revealCard = (index: number) => {
      if (index >= generatedCards.length) {
        setPhase('complete');
        return;
      }

      setCurrentCardIndex(index);
      
      // Play sound for rare cards
      const card = generatedCards[index];
      if (card.rarity === CardRarity.LEGENDARY || card.rarity === CardRarity.MYTHIC) {
        soundService.playAchievement();
      } else if (card.rarity === CardRarity.RARE) {
        soundService.playSuccess();
      }

      Animated.spring(cardRevealAnims[index], {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => revealCard(index + 1), 800);
      });
    };

    revealCard(0);
  };

  const handleComplete = () => {
    if (generatedCards.length > 0) {
      onCardsRevealed(generatedCards);
    }
    onClose();
  };

  const getRarityColor = (rarity: CardRarity): string => {
    switch (rarity) {
      case CardRarity.COMMON:
        return '#8B8B8B';
      case CardRarity.UNCOMMON:
        return '#4CAF50';
      case CardRarity.RARE:
        return '#2196F3';
      case CardRarity.LEGENDARY:
        return '#FF9800';
      case CardRarity.MYTHIC:
        return '#9C27B0';
      default:
        return theme.colors.text;
    }
  };

  const getRarityGradient = (rarity: CardRarity): string[] => {
    switch (rarity) {
      case CardRarity.MYTHIC:
        return ['#9C27B0', '#E91E63', '#FF9800'];
      case CardRarity.LEGENDARY:
        return ['#FF9800', '#FFD54F'];
      case CardRarity.RARE:
        return ['#2196F3', '#64B5F6'];
      case CardRarity.UNCOMMON:
        return ['#4CAF50', '#81C784'];
      default:
        return ['#8B8B8B', '#BDBDBD'];
    }
  };

  if (!visible || !pack) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {phase === 'closed' && (
          <View style={styles.packContainer}>
            <Animated.View
              style={[
                styles.pack,
                {
                  transform: [
                    { scale: packScaleAnim },
                    {
                      rotate: packRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    {
                      translateX: packShakeAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, -5, 5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.packBox,
                  {
                    backgroundColor: pack.type === 'premium' ? '#FFD700' : '#8B4513',
                  },
                ]}
              >
                <Text style={styles.packIcon}>📦</Text>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
                <Text style={styles.cardCountLabel}>{pack.cardCount} Cards</Text>
              </View>
            </Animated.View>

            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: theme.colors.primary }]}
              onPress={startPackOpening}
            >
              <Text style={styles.openButtonText}>🎁 Open Pack!</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'opening' && (
          <View style={styles.openingContainer}>
            <Animated.View
              style={[
                styles.sparkles,
                {
                  opacity: sparkleAnim,
                  transform: [{ scale: sparkleAnim }],
                },
              ]}
            >
              <Text style={styles.sparkleText}>✨ ✨ ✨</Text>
              <Text style={styles.openingText}>Opening Pack...</Text>
              <Text style={styles.sparkleText}>✨ ✨ ✨</Text>
            </Animated.View>
          </View>
        )}

        {(phase === 'revealing' || phase === 'complete') && (
          <View style={styles.cardsContainer}>
            <Text style={[styles.revealTitle, { color: theme.colors.text }]}>
              {phase === 'revealing' ? 'Revealing Cards...' : 'Pack Complete!'}
            </Text>

            <View style={styles.cardsGrid}>
              {generatedCards.map((card, index) => (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.cardContainer,
                    {
                      opacity: cardRevealAnims[index],
                      transform: [
                        {
                          scale: cardRevealAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: getRarityColor(card.rarity),
                        borderWidth: 2,
                      },
                    ]}
                  >
                    {card.imageUrl && (
                      <Image
                        source={{ uri: card.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.cardContent}>
                      <Text
                        style={[
                          styles.cardName,
                          { color: getRarityColor(card.rarity) },
                        ]}
                        numberOfLines={2}
                      >
                        {card.name}
                      </Text>
                      <View style={styles.cardStats}>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                            Style
                          </Text>
                          <Text style={[styles.statValue, { color: theme.colors.text }]}>
                            {card.stylePoints}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.cardRarity,
                            { color: getRarityColor(card.rarity) },
                          ]}
                        >
                          {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                        </Text>
                      </View>
                      {card.isHolographic && (
                        <Text style={styles.holographicLabel}>✨ Holographic</Text>
                      )}
                      {card.isShiny && (
                        <Text style={styles.shinyLabel}>⭐ Shiny</Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            {phase === 'complete' && (
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: theme.colors.success }]}
                onPress={handleComplete}
              >
                <Text style={styles.completeButtonText}>
                  🎉 Add to Collection
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packContainer: {
    alignItems: 'center',
  },
  pack: {
    marginBottom: 40,
  },
  packBox: {
    width: 200,
    height: 240,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  packIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  packName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  packDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  cardCountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  openButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  openButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  openingContainer: {
    alignItems: 'center',
  },
  sparkles: {
    alignItems: 'center',
  },
  sparkleText: {
    fontSize: 32,
    marginVertical: 16,
  },
  openingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  revealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  cardContainer: {
    width: (screenWidth - 64) / 2,
    maxWidth: 160,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardStats: {
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  holographicLabel: {
    fontSize: 9,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 2,
  },
  shinyLabel: {
    fontSize: 9,
    color: '#FF69B4',
    textAlign: 'center',
    marginTop: 2,
  },
  completeButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});