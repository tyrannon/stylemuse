import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';

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
  outfitsShakeValue: Animated.Value;
  profileShakeValue: Animated.Value;
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
  outfitsShakeValue,
  profileShakeValue,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
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
          <Text style={[styles.bottomNavIcon, { color: showOutfitBuilder ? theme.colors.primary : theme.colors.textSecondary }]}>
            🎮
          </Text>
          <Text style={[styles.bottomNavLabel, { color: showOutfitBuilder ? theme.colors.primary : theme.colors.textSecondary, fontWeight: showOutfitBuilder ? 'bold' : '500' }]}>
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
          <Text style={[styles.bottomNavIcon, { color: showWardrobe ? theme.colors.primary : theme.colors.textSecondary }]}>
            👔
          </Text>
          <Text style={[styles.bottomNavLabel, { color: showWardrobe ? theme.colors.primary : theme.colors.textSecondary, fontWeight: showWardrobe ? 'bold' : '500' }]}>
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
      <Animated.View style={{
        transform: [{
          translateX: outfitsShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            shakeButton(outfitsShakeValue);
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
          <Text style={[styles.bottomNavIcon, { color: showOutfitsPage ? theme.colors.primary : theme.colors.textSecondary }]}>
            👗
          </Text>
          <Text style={[styles.bottomNavLabel, { color: showOutfitsPage ? theme.colors.primary : theme.colors.textSecondary, fontWeight: showOutfitsPage ? 'bold' : '500' }]}>
            Outfits
          </Text>
        </TouchableOpacity>
      </Animated.View>


      {/* Style DNA Profile Button */}
      <Animated.View style={{
        transform: [{
          translateX: profileShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            shakeButton(profileShakeValue);
            if (!showProfilePage) {
              navigateToProfile();
            } else if (showProfilePage) {
              // If already on profile page, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Text style={[styles.bottomNavIcon, { color: showProfilePage ? theme.colors.primary : theme.colors.textSecondary }]}>
            🧬
          </Text>
          <Text style={[styles.bottomNavLabel, { color: showProfilePage ? theme.colors.primary : theme.colors.textSecondary, fontWeight: showProfilePage ? 'bold' : '500' }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
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
    color: theme.colors.textSecondary,
  },
  bottomNavIconActive: {
    color: theme.colors.primary,
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  bottomNavLabelActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  centerAddButton: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  centerAddButtonIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
    marginHorizontal: 4,
  },
});