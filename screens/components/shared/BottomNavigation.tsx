import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ScrollView, Image, Easing } from 'react-native';
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
  
  const bounceButton = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: -15,
        duration: 150,
        useNativeDriver: true,
        // Ease out for upward motion
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.bottomNavigation}>
      {/* Outfit Builder Toggle Button */}
      <Animated.View style={{
        transform: [{
          translateY: builderShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            bounceButton(builderShakeValue);
            if (!showOutfitBuilder) {
              navigateToBuilder();
            } else if (showOutfitBuilder) {
              // If already on builder page, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Image 
            source={require('../../../assets/builder.png')}
            style={[
              styles.bottomNavIcon,
              { 
                width: 40,
                height: 40,
                resizeMode: 'contain',
                opacity: showOutfitBuilder ? 1.0 : 0.6
              }
            ]} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Wardrobe Toggle Button */}
      <Animated.View style={{
        transform: [{
          translateY: wardrobeShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            bounceButton(wardrobeShakeValue);
            if (!showWardrobe) {
              navigateToWardrobe();
            } else if (showWardrobe && !showingItemDetail) {
              // If already on wardrobe page and not viewing item detail, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Image 
            source={require('../../../assets/wardrobe.png')}
            style={[
              styles.bottomNavIcon,
              { 
                width: 40,
                height: 40,
                resizeMode: 'contain',
                opacity: showWardrobe ? 1.0 : 0.6
              }
            ]} 
          />
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
          translateY: outfitsShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            bounceButton(outfitsShakeValue);
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
          <Image 
            source={require('../../../assets/outfits.png')}
            style={[
              styles.bottomNavIcon,
              { 
                width: 40,
                height: 40,
                resizeMode: 'contain',
                opacity: showOutfitsPage ? 1.0 : 0.6
              }
            ]} 
          />
        </TouchableOpacity>
      </Animated.View>


      {/* Style DNA Profile Button */}
      <Animated.View style={{
        transform: [{
          translateY: profileShakeValue
        }]
      }}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            bounceButton(profileShakeValue);
            if (!showProfilePage) {
              navigateToProfile();
            } else if (showProfilePage) {
              // If already on profile page, scroll to top
              mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }}
          style={styles.bottomNavButton}
        >
          <Image 
            source={require('../../../assets/profile.png')}
            style={[
              styles.bottomNavIcon,
              { 
                width: 40,
                height: 40,
                resizeMode: 'contain',
                opacity: showProfilePage ? 1.0 : 0.6
              }
            ]} 
          />
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  bottomNavButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomNavIcon: {
    marginBottom: 0,
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
    width: 64,
    height: 64,
    backgroundColor: theme.colors.primary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  centerAddButtonIcon: {
    fontSize: 36,
    color: 'white',
    fontWeight: '300',
    marginHorizontal: 4,
  },
});