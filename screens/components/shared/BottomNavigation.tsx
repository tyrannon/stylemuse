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
  openAddItemModal: () => void;
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
  openAddItemModal,
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

      {/* Center Add Button */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('medium');
          openAddItemModal();
        }}
        style={styles.centerAddButton}
      >
        <Text style={styles.centerAddButtonIcon}>+</Text>
      </TouchableOpacity>

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
        style={styles.bottomNavButton}
      >
        <Text style={[styles.bottomNavIcon, showProfilePage && styles.bottomNavIconActive]}>
          🧬
        </Text>
        <Text style={[styles.bottomNavLabel, showProfilePage && styles.bottomNavLabelActive]}>
          Profile
        </Text>
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
  centerAddButton: {
    width: 56,
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  centerAddButtonIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginHorizontal: 4,
  },
});