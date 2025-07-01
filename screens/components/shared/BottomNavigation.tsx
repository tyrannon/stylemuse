import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

interface BottomNavigationProps {
  // Page states
  showOutfitBuilder: boolean;
  showWardrobe: boolean;
  showOutfitsPage: boolean;
  showProfilePage: boolean;
  showingItemDetail: boolean;
  showingOutfitDetail: boolean;
  
  // Navigation functions
  navigateToBuilder: () => void;
  navigateToWardrobe: () => void;
  navigateToOutfits: () => void;
  navigateToProfile: () => void;
  goBackToOutfits: () => void;
  
  // Other functions
  pickMultipleImages: () => void;
  openCamera: () => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
  
  // Scroll ref for scroll-to-top functionality
  mainScrollViewRef: React.RefObject<ScrollView>;
  
  // Animation values
  builderShakeValue: Animated.Value;
  wardrobeShakeValue: Animated.Value;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  showOutfitBuilder,
  showWardrobe,
  showOutfitsPage,
  showProfilePage,
  showingItemDetail,
  showingOutfitDetail,
  navigateToBuilder,
  navigateToWardrobe,
  navigateToOutfits,
  navigateToProfile,
  goBackToOutfits,
  pickMultipleImages,
  openCamera,
  triggerHaptic,
  mainScrollViewRef,
  builderShakeValue,
  wardrobeShakeValue,
}) => {
  const shakeButton = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.bottomNavigation}>
      {/* Outfit Builder Toggle Button */}
      <Animated.View style={{
        transform: [{
          translateX: builderShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            shakeButton(builderShakeValue);
            if (!showOutfitBuilder) {
              navigateToBuilder();
            } else if (showOutfitBuilder) {
              // If already on builder page, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Text style={[styles.bottomNavIcon, showOutfitBuilder && styles.bottomNavIconActive]}>
            🎮
          </Text>
          <Text style={[styles.bottomNavLabel, showOutfitBuilder && styles.bottomNavLabelActive]}>
            Builder
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Wardrobe Toggle Button */}
      <Animated.View style={{
        transform: [{
          translateX: wardrobeShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            shakeButton(wardrobeShakeValue);
            if (!showWardrobe) {
              navigateToWardrobe();
            } else if (showWardrobe && !showingItemDetail) {
              // If already on wardrobe page and not viewing item detail, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Text style={[styles.bottomNavIcon, showWardrobe && styles.bottomNavIconActive]}>
            👔
          </Text>
          <Text style={[styles.bottomNavLabel, showWardrobe && styles.bottomNavLabelActive]}>
            Wardrobe
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Center Buttons (Photo Library + Camera) */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            pickMultipleImages();
          }}
          style={styles.centerButton}
        >
          <Text style={styles.centerButtonIcon}>📚</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            openCamera();
          }}
          style={styles.centerButton}
        >
          <Text style={styles.centerButtonIcon}>📸</Text>
        </TouchableOpacity>
      </View>

      {/* Outfits Page Button */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          // If outfit detail is open, just go back to outfits
          if (showingOutfitDetail) {
            goBackToOutfits();
          } else if (!showOutfitsPage) {
            navigateToOutfits();
          } else if (showOutfitsPage) {
            // If already on outfits page, scroll to top
            mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }
        }}
        style={styles.bottomNavButton}
      >
        <Text style={[styles.bottomNavIcon, showOutfitsPage && styles.bottomNavIconActive]}>
          👗
        </Text>
        <Text style={[styles.bottomNavLabel, showOutfitsPage && styles.bottomNavLabelActive]}>
          Outfits
        </Text>
      </TouchableOpacity>

      {/* Style DNA Profile Button */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          if (!showProfilePage) {
            navigateToProfile();
          } else if (showProfilePage) {
            // If already on profile page, scroll to top
            mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }
        }}
        style={styles.profileButton}
      >
        <Text style={styles.profileButtonPlaceholder}>🧬</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomNavButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomNavIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#666',
  },
  bottomNavIconActive: {
    color: '#007AFF',
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  bottomNavLabelActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  centerButton: {
    width: 48,
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginHorizontal: 4,
  },
  centerButtonIcon: {
    fontSize: 24,
    color: 'white',
  },
  centerButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonPlaceholder: {
    fontSize: 20,
    color: '#666',
  },
});