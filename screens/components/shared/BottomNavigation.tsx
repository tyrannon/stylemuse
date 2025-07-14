import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ScrollView, Image, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';

// Preload dock icons to prevent sequential loading
const preloadIcons = () => {
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/builder.png')).uri);
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/wardrobe.png')).uri);
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/outfits.png')).uri);
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/profile.png')).uri);
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/AddToWardrobePlusBlue.png')).uri);
  Image.prefetch(Image.resolveAssetSource(require('../../../assets/AddToWardrobePlusPink.png')).uri);
};

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
  
  // Unviewed outfits count - shows badge on Outfits tab
  unviewedOutfitsCount?: number;
  
  // New wardrobe items count - shows badge on Wardrobe tab
  newWardrobeItemCount?: number;
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
  unviewedOutfitsCount = 0,
  newWardrobeItemCount = 0,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Determine which + icon to use based on theme
  const getAddIcon = () => {
    // Use pink icon for cyber and kawaii themes
    if (theme.name === 'cyber' || theme.name === 'kawaii') {
      return require('../../../assets/AddToWardrobePlusPink.png');
    }
    // Use blue icon for all other themes (light, dark, etc.)
    return require('../../../assets/AddToWardrobePlusBlue.png');
  };
  
  // Preload icons on component mount
  useEffect(() => {
    preloadIcons();
  }, []);
  
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
    <BlurView intensity={80} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={styles.bottomNavigation}>
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
style={[styles.bottomNavIcon, { opacity: 1.0 }]} 
          />
          {showOutfitBuilder && <View style={styles.activeIndicator} />}
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
          <View>
            <Image 
              source={require('../../../assets/wardrobe.png')}
              style={[styles.bottomNavIcon, { opacity: 1.0 }]} 
            />
            {/* Badge showing count of new wardrobe items */}
            {newWardrobeItemCount > 0 && (
              <View style={styles.unviewedOutfitsBadge}>
                <Text style={styles.unviewedOutfitsText}>
                  {newWardrobeItemCount > 99 ? '99+' : newWardrobeItemCount}
                </Text>
              </View>
            )}
          </View>
          {showWardrobe && <View style={styles.activeIndicator} />}
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
        <Image 
          source={getAddIcon()}
          style={styles.centerAddIcon}
        />
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
          <View>
            <Image 
              source={require('../../../assets/outfits.png')}
              style={[styles.bottomNavIcon, { opacity: 1.0 }]} 
            />
            {/* Badge showing count of unviewed outfits */}
            {unviewedOutfitsCount > 0 && (
              <View style={styles.unviewedOutfitsBadge}>
                <Text style={styles.unviewedOutfitsText}>
                  {unviewedOutfitsCount > 99 ? '99+' : unviewedOutfitsCount}
                </Text>
              </View>
            )}
          </View>
          {showOutfitsPage && <View style={styles.activeIndicator} />}
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
style={[styles.bottomNavIcon, { opacity: 1.0 }]} 
          />
          {showProfilePage && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </Animated.View>
    </BlurView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    ...theme.shadows.large,
  },
  bottomNavButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bottomNavIcon: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    marginTop: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  centerAddIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  unviewedOutfitsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  unviewedOutfitsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});