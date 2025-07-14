import { View, Button, Image, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Pressable, TextInput, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { describeClothingItem } from '../utils/openai';
import { generateOutfitImage, analyzePersonalStyle, generatePersonalizedOutfitImage } from '../utils/openai';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hooks
import { useWardrobeData, WardrobeItem, LovedOutfit, LaundryStatus } from '../hooks/useWardrobeData';
import { useNavigationState } from '../hooks/useNavigationState';
import { useImageHandling } from '../hooks/useImageHandling';
import { useAmazonRecommendations } from '../hooks/useAmazonRecommendations';
import { useModalState } from '../hooks/useModalState';
import { useOutfitGeneration } from '../hooks/useOutfitGeneration';
import { useSmartSuggestions } from '../hooks/useSmartSuggestions';
import { useRandomOutfit } from '../hooks/useRandomOutfit';

// Components
import { SafeImage } from '../utils/SafeImage';
import { BottomNavigation } from './components/shared/BottomNavigation';
import { ItemDetailView } from './components/ItemDetailView';
import { OutfitDetailView } from './components/OutfitDetailView';
import { CategoryDropdown } from './components/CategoryDropdown';
import { BuilderPage } from './BuilderPage';
import { WardrobePage } from './WardrobePage';
import { DataMigrationModal } from '../components/DataMigrationModal';
import { OutfitsPage } from './OutfitsPage';
import { ProfilePage } from './ProfilePage';
import { CameraScreen } from './CameraScreen';
import { PhotoEditingScreen } from './PhotoEditingScreen';
import { SmartSuggestionsModal } from '../components/SmartSuggestionsModal';
import { OnlineItemCard } from './components/StyleAdvice/OnlineItemCard';
import { TextItemEntryModal } from '../components/TextItemEntryModal';
import { RandomOutfitButtons } from '../components/RandomOutfitButton';
import { AddItemPage } from './AddItemPage';
import { AIOutfitAssistant, AIOutfitAssistantRef } from '../components/AIOutfitAssistant';
import { UnifiedLoadingOverlay } from '../components/UnifiedLoadingOverlay';
import { useUnifiedLoading, LOADING_CONFIGS } from '../hooks/useUnifiedLoading';
import { useTheme } from '../contexts/ThemeContext';

// Utils and Services
import { getLaundryStatusDisplay } from '../utils/laundryStatus';
import { StorageService } from '../services/StorageService';
import { PersistenceService } from '../services/PersistenceService';
import { DataMigrationService, MigrationSummary } from '../services/DataMigrationService';
import { createStyles } from './styles/WardrobeUploadScreen.styles';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Types
import { StyleRecommendation } from '../types/StyleAdvice';
import { STORAGE_KEYS } from '../constants/storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WardrobeUploadScreen = () => {
  // Use our custom hooks for data and navigation state
  const wardrobeData = useWardrobeData();
  const navigationState = useNavigationState();
  const { theme, isDark } = useTheme();
  const unifiedLoading = useUnifiedLoading();
  const styles = createStyles(theme);
  
  // Ref for AIOutfitAssistant to trigger modal
  const aiOutfitAssistantRef = useRef<AIOutfitAssistantRef>(null);
  
  // Preload speed dial images on mount for instant rendering
  useEffect(() => {
    const preloadSpeedDialImages = async () => {
      const speedDialImages = [
        require('../assets/surprise.png'),
        require('../assets/casual.png'),
        require('../assets/business.png'),
        require('../assets/sporty.png'),
        require('../assets/datenight.png'),
        require('../assets/weekend.png'),
        require('../assets/party.png'),
        require('../assets/ai.png'),
      ];
      
      try {
        const promises = speedDialImages.map(source => 
          Image.prefetch(Image.resolveAssetSource(source).uri)
        );
        await Promise.all(promises);
        logger.info(LogCategories.PERFORMANCE, 'Speed dial images preloaded in WardrobeUploadScreen');
      } catch (error) {
        logger.warn(LogCategories.PERFORMANCE, 'Failed to preload some speed dial images', error);
      }
    };
    
    preloadSpeedDialImages();
  }, []); // Only run once on mount
  
  // Extract data and functions from hooks
  const {
    savedItems,
    setSavedItems,
    lovedOutfits,
    setLovedOutfits,
    profileImage,
    setProfileImage,
    styleDNA,
    setStyleDNA,
    selectedGender,
    setSelectedGender,
    AVAILABLE_CATEGORIES,
    categorizeItem,
    updateItemCategory,
    saveFieldUpdate,
    toggleOutfitLove,
    markOutfitAsViewed,
    markAllOutfitsAsViewed,
    markWardrobeItemAsViewed,
    markOutfitAsWorn,
    getSmartOutfitSuggestions,
    getOutfitWearStats,
    updateLaundryStatus,
    getItemsByLaundryStatus,
    getLaundryStats,
    getSmartWashSuggestions,
    deleteWardrobeItem,
    deleteLovedOutfit,
    deleteBulkWardrobeItems,
    deleteBulkOutfits,
    saveBulkWardrobeItems,
    clearAllData,
  } = wardrobeData;
  
  const {
    // Page states
    showOutfitBuilder,
    showWardrobe,
    showOutfitsPage,
    showProfilePage,
    showAddItemPage,
    showingItemDetail,
    showingOutfitDetail,
    detailViewItem,
    setDetailViewItem,
    detailViewOutfit,
    
    // Navigation functions
    navigateToBuilder,
    navigateToWardrobe,
    navigateToOutfits,
    navigateToProfile,
    navigateToAddItem,
    goBackToProfile,
    goBackToWardrobe,
    goBackToOutfits,
    openWardrobeItemView,
    openOutfitDetailView,
    
    // Editing states
    editingTitle,
    setEditingTitle,
    editingColor,
    setEditingColor,
    editingMaterial,
    setEditingMaterial,
    editingStyle,
    setEditingStyle,
    editingFit,
    setEditingFit,
    editingTags,
    setEditingTags,
    
    // Temp values
    tempTitle,
    setTempTitle,
    tempColor,
    setTempColor,
    tempMaterial,
    setTempMaterial,
    tempStyle,
    setTempStyle,
    tempFit,
    setTempFit,
    tempTags,
    setTempTags,
    newTagInput,
    setNewTagInput,
    
    // Category dropdown
    showCategoryDropdown,
    setShowCategoryDropdown,
    selectedCategory,
    setSelectedCategory,
  } = navigationState;

  // Ref for main scroll view to control scrolling
  const mainScrollViewRef = useRef<ScrollView>(null);

  // Migration state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const migrationService = DataMigrationService.getInstance();

  // Wrapper for openOutfitDetailView that marks outfit as viewed
  // This function handles the viewing tracking when user opens an outfit detail
  const openOutfitDetailViewWithTracking = useCallback(async (outfit: any) => {
    // Mark outfit as viewed if it hasn't been viewed yet
    if (outfit && outfit.id && !outfit.viewed) {
      const wasMarked = await markOutfitAsViewed(outfit.id);
      if (wasMarked) {
        // Decrement unviewed count to update badge
        setUnviewedOutfitsCount(prev => Math.max(0, prev - 1));
      }
    }
    // Open the detail view
    openOutfitDetailView(outfit);
  }, [markOutfitAsViewed, openOutfitDetailView]);

  // Wrapper for markAllOutfitsAsViewed that resets unviewed count
  // This handles the bulk marking functionality for "Mark All as Seen" button
  const markAllOutfitsAsViewedWithTracking = useCallback(async () => {
    const markedCount = await markAllOutfitsAsViewed();
    if (markedCount > 0) {
      // Reset unviewed count to 0 to clear badge
      setUnviewedOutfitsCount(0);
    }
    return markedCount;
  }, [markAllOutfitsAsViewed]);

  // Wrapper for openWardrobeItemView that marks item as viewed
  // This function handles wardrobe item viewing tracking and index resolution
  const openWardrobeItemViewWithTracking = useCallback(async (item: any, index?: number) => {
    console.log('[DEBUG] openWardrobeItemViewWithTracking called:', {
      item: { title: item?.title, isNew: item?.isNew },
      index
    });
    
    // Find the actual index in savedItems if not provided
    // This is needed because WardrobePage uses filtered/sorted items
    let actualIndex = index;
    if (typeof actualIndex !== 'number') {
      actualIndex = savedItems.findIndex(savedItem => savedItem.image === item.image);
    }
    
    console.log('[DEBUG] Actual index found:', actualIndex);
    
    // Mark item as viewed if it's new
    if (item && item.isNew && actualIndex >= 0) {
      console.log('[DEBUG] Marking item as viewed...');
      const wasMarked = await markWardrobeItemAsViewed(actualIndex);
      console.log('[DEBUG] Item marked as viewed:', wasMarked);
      if (wasMarked) {
        // No need to manually update count as useEffect will handle it
        // The useEffect watching savedItems will automatically recalculate newWardrobeItemCount
      }
    }
    // Open the detail view
    openWardrobeItemView(item);
  }, [markWardrobeItemAsViewed, openWardrobeItemView, savedItems]);

  // Custom navigate to builder with scroll
  const navigateToBuilderWithScroll = useCallback(() => {
    // Ensure state updates happen synchronously
    navigationState.setShowingItemDetail(false);
    navigationState.setDetailViewItem(null);
    navigationState.setShowingOutfitDetail(false);
    navigationState.setDetailViewOutfit(null);
    
    // Navigate to builder
    navigationState.setShowOutfitBuilder(true);
    navigationState.setShowWardrobe(false);
    navigationState.setShowLovedItems(false);
    navigationState.setShowProfilePage(false);
    navigationState.setShowOutfitsPage(false);
    navigationState.setShowAddItemPage(false);
    
    // Scroll to top after a short delay
    setTimeout(() => {
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 150);
  }, [navigationState]);

  // Comprehensive data refresh function for backup operations
  const handleDataRefresh = useCallback(async (operation: 'reset' | 'restore' = 'restore') => {
    console.log(`🔄 [WardrobeUpload] Handling ${operation} data refresh...`);
    
    if (operation === 'reset') {
      // For reset: immediately clear React state to show empty UI
      console.log('🧹 [WardrobeUpload] Clearing React state for reset...');
      clearAllData();
    }
    
    // Always reload from AsyncStorage (which should be empty after reset, populated after restore)
    console.log('📊 [WardrobeUpload] Reloading data from AsyncStorage...');
    await wardrobeData.loadWardrobeData();
    
    console.log(`✅ [WardrobeUpload] ${operation} refresh complete`);
  }, [clearAllData, wardrobeData.loadWardrobeData]);

  // Handle random outfit generation
  const handleRandomOutfit = useCallback(async (options?: any) => {
    console.log('🎲 [WardrobeUpload] Random outfit handler called', {
      savedItemsLength: savedItems.length,
      hasRandomOutfit: !!randomOutfit,
      hasOutfitGeneration: !!outfitGeneration
    });
    
    const generatedOutfit = await randomOutfit.generateRandomOutfit(options);
    if (generatedOutfit) {
      outfitGeneration.setGearSlots(generatedOutfit);
    }
  }, [randomOutfit, outfitGeneration, savedItems]);

  // Helper functions to get theme-appropriate images
  const getGenerateOutfitIcon = () => {
    if (theme.colorScheme === 'tokyo') {
      return theme.mode === 'dark' 
        ? require('../assets/GenerateOutfitCyber.png')
        : require('../assets/GenerateOutfitBrown.png');
    }
    return require('../assets/generateoutfit.png');
  };

  const getClearAllSlotsIcon = () => {
    if (theme.colorScheme === 'tokyo') {
      return theme.mode === 'dark'
        ? require('../assets/ClearAllSlotsCyber.png')
        : require('../assets/ClearAllSlotsKawaii.png');
    }
    return require('../assets/ClearAllSlotsGrey.png');
  };

  // Bounce animation helper
  const createBounceAnimation = (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]);
  };

  // Use our custom hooks for refactored functionality
  const imageHandling = useImageHandling();
  const amazonRecommendations = useAmazonRecommendations();
  const modalState = useModalState();
  const outfitGeneration = useOutfitGeneration(savedItems, categorizeItem, navigateToBuilderWithScroll, unifiedLoading);
  const smartSuggestions = useSmartSuggestions();
  const randomOutfit = useRandomOutfit(savedItems);
  // Removed separate styleDNALoading - now using main unifiedLoading

  // Image and description states (keeping these for backward compatibility)
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Animation and UI states
  // Legacy spinValue removed - now using unified loading
  const [analyzingProfile, setAnalyzingProfile] = useState(false);
  const [outfitModalVisible, setOutfitModalVisible] = useState(false);
  const [outfitScale] = useState(new Animated.Value(1));
  const [outfitTranslateX] = useState(new Animated.Value(0));
  const [outfitTranslateY] = useState(new Animated.Value(0));
  const [currentScale, setCurrentScale] = useState(1);
  const [builderShakeValue] = useState(new Animated.Value(0));
  const [wardrobeShakeValue] = useState(new Animated.Value(0));
  const [outfitsShakeValue] = useState(new Animated.Value(0));
  const [profileShakeValue] = useState(new Animated.Value(0));

  // Bounce animations for outfit builder icons
  const [gearSlotBounces] = useState(() => ({
    top: new Animated.Value(1),
    bottom: new Animated.Value(1),
    shoes: new Animated.Value(1),
    jacket: new Animated.Value(1),
    hat: new Animated.Value(1),
    accessories: new Animated.Value(1)
  }));
  const [generateOutfitBounce] = useState(new Animated.Value(1));
  const [clearAllBounce] = useState(new Animated.Value(1));
  
  // Unviewed outfits tracking - tracks count of outfits not yet opened by user
  const [unviewedOutfitsCount, setUnviewedOutfitsCount] = useState(0);
  
  // New wardrobe items tracking - tracks count of items not yet viewed in detail
  const [newWardrobeItemCount, setNewWardrobeItemCount] = useState(0);
  
  // Calculate new wardrobe item count when savedItems changes
  // This effect automatically updates the badge count on the wardrobe tab
  useEffect(() => {
    const newCount = savedItems.filter(item => item.isNew).length;
    console.log('[DEBUG] Calculating new wardrobe items:', {
      totalItems: savedItems.length,
      newItems: savedItems.filter(item => item.isNew),
      newCount
    });
    setNewWardrobeItemCount(newCount);
  }, [savedItems]);
  
  // Wrap navigateToOutfits to reset unviewed count
  const navigateToOutfitsWithReset = useCallback(() => {
    setUnviewedOutfitsCount(0);
    navigateToOutfits();
  }, [navigateToOutfits]);
  
  // Multi-item detection state
  const [detectedItemsState, setDetectedItemsState] = useState<any[]>([]);
  const [cameraMode, setCameraMode] = useState<'single' | 'multi'>('single');
  
  
  // Header loading animation
  const [headerSpinValue] = useState(new Animated.Value(0));
  
  // Start spinning animation when loading starts
  useEffect(() => {
    if (unifiedLoading.isLoading) {
      const spinAnimation = Animated.loop(
        Animated.timing(headerSpinValue, {
          toValue: 1,
          duration: 800, // Faster animation - was 1000ms
          useNativeDriver: true,
        }),
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    } else {
      headerSpinValue.setValue(0);
    }
  }, [unifiedLoading.isLoading, headerSpinValue]);


  // Check for migration needs on app startup
  useEffect(() => {
    const checkMigration = async () => {
      try {
        if (!migrationChecked) {
          console.log('🔍 Checking if data migration is needed...');
          const needsMigration = await migrationService.checkNeedsMigration();
          
          if (needsMigration) {
            console.log('📦 Data migration needed - showing prompt');
            const shouldMigrate = await migrationService.showMigrationPrompt();
            if (shouldMigrate) {
              setShowMigrationModal(true);
            }
          } else {
            console.log('✅ No migration needed');
          }
          
          setMigrationChecked(true);
        }
      } catch (error) {
        console.error('Migration check failed:', error);
        setMigrationChecked(true);
      }
    };

    // Only check migration after initial wardrobe data is loaded
    if (savedItems.length > 0 && !migrationChecked) {
      checkMigration();
    } else if (savedItems.length === 0 && !migrationChecked) {
      // No items to migrate
      setMigrationChecked(true);
    }
  }, [savedItems.length, migrationChecked]);

  const handleMigrationComplete = async (summary: MigrationSummary) => {
    setShowMigrationModal(false);
    
    try {
      await migrationService.showMigrationResults(summary);
      
      // Reload wardrobe data to reflect any changes
      if (summary.recoveredItems > 0) {
        console.log('♻️ Reloading wardrobe data after migration...');
        // The migration already updates the data, so we just need to refresh the state
        window.location?.reload?.(); // For web only
      }
    } catch (error) {
      console.error('Failed to show migration results:', error);
    }
  };

  // Wardrobe inventory and editing states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editItemTitle, setEditItemTitle] = useState<string>("");
  const [editItemTags, setEditItemTags] = useState<string[]>([]);
  const [editItemNewTag, setEditItemNewTag] = useState<string>("");
  const [currentLovedOutfitIndex, setCurrentLovedOutfitIndex] = useState<number>(0);
  const [lovedOutfitModalVisible, setLovedOutfitModalVisible] = useState(false);

  // Wardrobe sorting and filtering
  const [sortBy, setSortBy] = useState<'recent' | 'category' | 'name'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLaundryStatus, setFilterLaundryStatus] = useState<string>('all');

  // Camera integration states
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [viewingWardrobeItem, setViewingWardrobeItem] = useState<any | null>(null);
  const [wardrobeItemModalVisible, setWardrobeItemModalVisible] = useState(false);
  
  // Category editing states are now provided by useNavigationState hook
  
  // Detail view states and editing states are now provided by useNavigationState hook

  // Navigation states are now provided by useNavigationState hook

  // Extract storage functions from our refactored hooks/services
  const saveWardrobeItems = StorageService.saveWardrobeItems;
  const saveLovedOutfits = StorageService.saveLovedOutfits;
  const saveStyleDNA = StorageService.saveStyleDNA;
  const saveSelectedGender = StorageService.saveSelectedGender;
  const saveProfileImage = StorageService.saveProfileImage;

  // Extract functions from our refactored hooks
  const {
    loadCachedAmazonSuggestions,
    findSimilarOnAmazon,
    handleWishlistSave,
    handleViewDetails
  } = amazonRecommendations;

  // Amazon functions are now provided by amazonRecommendations hook

  const handleDeleteItem = (item: WardrobeItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title || 'this item'}" from your wardrobe? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWardrobeItem(item);
              setDetailViewItem(null); // Close the detail view after deletion
              navigateToWardrobe(); // Navigate back to wardrobe page
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      await deleteLovedOutfit(outfitId);
    } catch (error) {
      console.error('Error deleting outfit:', error);
      throw error;
    }
  };

  const updateStyleDNA = async (updatedStyleDNA: EnhancedStyleDNA) => {
    try {
      setStyleDNA(updatedStyleDNA);
      await AsyncStorage.setItem(STORAGE_KEYS.STYLE_DNA, JSON.stringify(updatedStyleDNA));
      console.log('✅ Enhanced Style DNA updated and saved to storage');
    } catch (error) {
      console.error('❌ Error updating style DNA:', error);
    }
  };

  // Load data from storage on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        console.log('🔄 Loading stored data...');
        
        // Load wardrobe items
        try {
          const storedWardrobe = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
          if (storedWardrobe) {
            const parsedWardrobe = JSON.parse(storedWardrobe);
            setSavedItems(parsedWardrobe);
            console.log(`✅ Loaded ${parsedWardrobe.length} wardrobe items`);
          }
        } catch (error) {
          console.error('❌ Error loading wardrobe items:', error);
          setSavedItems([]); // Reset to empty array
        }

        // Load loved outfits
        try {
          const storedLovedOutfits = await AsyncStorage.getItem(STORAGE_KEYS.LOVED_OUTFITS);
          if (storedLovedOutfits) {
            const parsedLovedOutfits = JSON.parse(storedLovedOutfits);
            // Convert date strings back to Date objects
            const outfitsWithDates = parsedLovedOutfits.map((outfit: any) => ({
              ...outfit,
              createdAt: new Date(outfit.createdAt)
            }));
            setLovedOutfits(outfitsWithDates);
            console.log(`✅ Loaded ${outfitsWithDates.length} loved outfits`);
          }
        } catch (error) {
          console.error('❌ Error loading loved outfits:', error);
          setLovedOutfits([]); // Reset to empty array
        }

        // Load style DNA
        try {
          const storedStyleDNA = await AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA);
          if (storedStyleDNA) {
            const parsedStyleDNA = JSON.parse(storedStyleDNA);
            setStyleDNA(parsedStyleDNA);
            console.log('✅ Loaded style DNA');
          }
        } catch (error) {
          console.error('❌ Error loading style DNA:', error);
          setStyleDNA(null); // Reset to null
        }

        // Load selected gender
        try {
          const storedGender = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER);
          if (storedGender) {
            // Gender is stored as a plain string, not JSON
            setSelectedGender(storedGender);
            console.log(`✅ Loaded selected gender: ${storedGender}`);
          }
        } catch (error) {
          console.error('❌ Error loading selected gender:', error);
          setSelectedGender(null); // Reset to null
        }

        // Load profile image
        try {
          const storedProfileImage = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
          if (storedProfileImage) {
            // Profile image is likely stored as a plain string URI, not JSON
            // Try parsing first, but fallback to using as string
            try {
              const parsedProfileImage = JSON.parse(storedProfileImage);
              setProfileImage(parsedProfileImage);
            } catch (parseError) {
              // If JSON parse fails, it's probably a plain string URI
              setProfileImage(storedProfileImage);
            }
            console.log('✅ Loaded profile image');
          }
        } catch (error) {
          console.error('❌ Error loading profile image:', error);
          setProfileImage(null); // Reset to null
        }

        console.log('✅ All stored data loaded successfully');
        
        // 💾 Initialize automatic backup system
        try {
          await PersistenceService.autoBackup();
          console.log('💾 Auto backup check completed');
        } catch (error) {
          console.error('⚠️ Auto backup failed (non-critical):', error);
          // Don't throw - backup failures shouldn't break app startup
        }
        
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Load cached Amazon suggestions when item detail view opens
  useEffect(() => {
    if (showingItemDetail && detailViewItem) {
      // Reset Amazon suggestions state
      amazonRecommendations.setAmazonSuggestions([]);
      amazonRecommendations.setShowAmazonSuggestions(false);
      amazonRecommendations.setLastSearchTimestamp(null);
      amazonRecommendations.setAmazonPreviewImage(null);
      
      // Load cached suggestions for this item
      loadCachedAmazonSuggestions(detailViewItem);
    }
  }, [showingItemDetail, detailViewItem, loadCachedAmazonSuggestions]);


  // Extract image handling functions from our refactored hook
  const { pickImage, handleGenerateItemImage, downloadAndSaveImage } = imageHandling;

  // Function to handle automatic description and saving of clothing item
  const handleAutoDescribeAndSave = async (imageUri: string, isBulkUpload = false) => {
    if (!isBulkUpload) {
      // Show unified loading overlay for single image analysis
      unifiedLoading.showLoading({
        ...LOADING_CONFIGS.IMAGE_ANALYSIS,
        subtitle: 'Analyzing your clothing item...',
      });
      setDescription(null);
      setTitle(null);
      setTags([]);
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await describeClothingItem(base64);
      const cleanResult = result.replace(/```json|```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanResult);
      } catch (err) {
        console.error("❌ JSON Parse error:", err, cleanResult);
        if (!isBulkUpload) {
          alert("AI returned invalid formatting. Try again.");
        }
        return;
      }

      const itemTitle = parsed.title;
      const itemDescription = parsed.description;
      const itemTags = parsed.tags;
      const itemColor = parsed.color;
      const itemMaterial = parsed.material;
      const itemStyle = parsed.style;
      const itemFit = parsed.fit;

      // Set the state for display (only if not bulk upload)
      if (!isBulkUpload) {
        setTitle(itemTitle);
        setDescription(itemDescription);
        setTags(itemTags);
      }

      // Save to wardrobe
      setSavedItems(prev => {
        const newItem = {
          image: imageUri,
          title: itemTitle,
          description: itemDescription,
          tags: itemTags,
          color: itemColor,
          material: itemMaterial,
          style: itemStyle,
          fit: itemFit,
          isNew: true, // Mark as new item
        };
        console.log('[DEBUG] handleAutoDescribeAndSave - Adding new item:', {
          title: newItem.title,
          isNew: newItem.isNew
        });
        const newItems = [...prev, newItem];
        // Save to storage
        saveWardrobeItems(newItems);
        return newItems;
      });

      if (!isBulkUpload) {
        // Automatically categorize the item
        const newItem = {
          image: imageUri,
          title: itemTitle,
          description: itemDescription,
          tags: itemTags,
          color: itemColor,
          material: itemMaterial,
          style: itemStyle,
          fit: itemFit,
          isNew: true,
        };
        const category = categorizeItem(newItem);
        alert(`Item analyzed and saved to wardrobe! 📁 Categorized as: ${category.toUpperCase()}`);
      }

    } catch (err) {
      console.error(err);
      if (!isBulkUpload) {
        alert("Failed to analyze image");
      }
    } finally {
      if (!isBulkUpload) {
        unifiedLoading.hideLoading();
      }
    }
  };

  // Functions Section


  // Function to handle item selection for outfit generation
  const handleItemSelection = (imageUri: string) => {
    if (!outfitGeneration.isSelectionMode) return;
    
    if (outfitGeneration.selectedItemsForOutfit.includes(imageUri)) {
      // Remove from selection
      outfitGeneration.setSelectedItemsForOutfit(outfitGeneration.selectedItemsForOutfit.filter(uri => uri !== imageUri));
    } else {
      // Add to selection
      outfitGeneration.setSelectedItemsForOutfit([...outfitGeneration.selectedItemsForOutfit, imageUri]);
    }
  };

  // Function to handle saving text-only items
  const handleSaveTextItem = async (item: Partial<WardrobeItem>) => {
    try {
      // Add unique identifier for text-only items
      const newItem: WardrobeItem = {
        image: 'text-only',
        title: item.title || item.description || 'Untitled Item',
        description: item.description || '',
        tags: item.tags || [],
        color: item.color || '',
        material: item.material || '',
        style: item.style || '',
        fit: item.fit || '',
        category: item.category || '',
        isNew: true, // Mark as new item
        laundryStatus: item.laundryStatus || 'clean',
      };

      // Save to wardrobe
      setSavedItems(prev => {
        const newItems = [...prev, newItem];
        // Save to storage
        saveWardrobeItems(newItems);
        return newItems;
      });

      // Categorize the item
      const category = categorizeItem(newItem);
      Alert.alert(
        'Success! 🎉',
        `Text item saved to wardrobe!\n📁 Categorized as: ${category.toUpperCase()}`,
        [
          { text: 'Done', style: 'default' },
          { 
            text: 'Add Another', 
            style: 'default',
            onPress: () => modalState.setShowTextItemModal(true)
          }
        ]
      );
    } catch (error) {
      console.error('Error saving text item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  };

  // SIMPLE DIRECT APPROACH - No modal, just call library picker directly
  const pickMultipleImages = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      imageHandling.setBulkUploading(true);
      // Bulk upload now uses unified loading - handled by imageHandling hook
      imageHandling.setBulkProgress({ current: 0, total: result.assets.length });
      
      alert(`Processing ${result.assets.length} images...`);
      
      // Process each image one by one
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        imageHandling.setBulkProgress({ current: i + 1, total: result.assets.length });
        
        try {
          await handleAutoDescribeAndSave(asset.uri, true);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to process image ${i + 1}:`, error);
        }
      }
      
      imageHandling.setBulkUploading(false);
      // Bulk upload now uses unified loading - handled by imageHandling hook
      imageHandling.setBulkProgress({ current: 0, total: 0 });
      alert(`Successfully added ${result.assets.length} items to your wardrobe! 🎉`);
    }
  };

  // SIMPLE DIRECT CAMERA APPROACH - No modal, just open camera directly
  const openCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCameraMode('single'); // Default to single mode for main camera
    modalState.setShowCamera(true);
  };

  // Function to open the add item page
  const openAddItemModal = () => {
    navigateToAddItem();
  };

  // Function to handle camera capture from add item page
  const handleAddItemCameraPress = async () => {
    // Go to camera screen directly in single mode
    setCameraMode('single');
    modalState.setShowCamera(true);
  };

  // Function to handle multi-item camera press from add item page
  const handleAddItemMultiItemCameraPress = async () => {
    // Go to camera screen directly in multi-item mode
    setCameraMode('multi');
    modalState.setShowCamera(true);
  };

  // Function to pick images from library with "Add Another" flow for single items
  const pickMultipleImagesFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        await handleAutoDescribeAndSave(asset.uri, false);
        
        // Offer to add another image
        setTimeout(() => {
          Alert.alert(
            'Success! 🎉',
            'Successfully added 1 item to your wardrobe!',
            [
              { text: 'Done', style: 'default' },
              { 
                text: 'Add Another', 
                style: 'default',
                onPress: () => pickMultipleImagesFromLibrary()
              }
            ]
          );
        }, 500);
        
      } catch (error) {
        console.error(`Failed to process image:`, error);
        alert(`Failed to process image: ${error.message}`);
      }
    }
  };

  // Function to handle photo library from add item page (single photo)
  const handleAddItemPhotoLibraryPress = async () => {
    await pickMultipleImagesFromLibrary();
  };

  // Function to handle bulk upload from add item page 
  const handleAddItemBulkUploadPress = async () => {
    await pickMultipleImages();
  };

  // Function to handle text entry from add item page
  const handleAddItemTextEntryPress = () => {
    modalState.setShowTextItemModal(true);
  };


  // Function to handle photo taken from camera
  const handlePhotoTaken = (photoUri: string) => {
    modalState.setShowCamera(false);
    setCapturedPhotoUri(photoUri);
    modalState.setShowPhotoEditing(true);
  };

  // Function to handle photo editing save
  const handlePhotoEditingSave = async (editedPhotoUri: string) => {
    modalState.setShowPhotoEditing(false);
    setCapturedPhotoUri(null);
    setDetectedItemsState([]);
    
    // Process the edited photo through AI analysis
    await handleAutoDescribeAndSave(editedPhotoUri, false);
  };

  // Function to handle photo editing cancel/retake
  const handlePhotoEditingRetake = () => {
    modalState.setShowPhotoEditing(false);
    setCapturedPhotoUri(null);
    setDetectedItemsState([]);
    modalState.setShowCamera(true);
  };

  // Function to handle direct camera photo (skip editing for now)
  const handleCameraPhotoDirect = async (photoUri: string) => {
    modalState.setShowCamera(false);
    setCapturedPhotoUri(null);
    
    // Process directly through AI analysis (skip editing screen for now to avoid complexity)
    await handleAutoDescribeAndSave(photoUri, false);
  };

  // Function to handle multi-item detection from camera
  const handleMultiItemDetected = async (detectedItems: any[]) => {
    modalState.setShowCamera(false);
    
    if (detectedItems.length === 0) {
      Alert.alert('No Items Detected', 'No clothing items were detected in the photo.');
      return;
    }

    // Navigate to photo editing with multi-item mode
    const photoUri = detectedItems[0].originalImageUri;
    setCapturedPhotoUri(photoUri);
    modalState.setShowPhotoEditing(true);
    
    // Store detected items for photo editing screen
    setDetectedItemsState(detectedItems);
  };

  // Function to handle multi-item save from photo editing
  const handleMultiItemSave = async (croppedItems: any[]) => {
    try {
      console.log(`🔍 [MULTI-ITEM] Processing ${croppedItems.length} cropped items for wardrobe save...`);
      console.log('📋 [MULTI-ITEM] Cropped items data:', JSON.stringify(croppedItems, null, 2));
      
      // Validate cropped items
      if (!croppedItems || croppedItems.length === 0) {
        console.error('❌ [MULTI-ITEM] No cropped items provided');
        Alert.alert('Error', 'No items were successfully cropped. Please try again.');
        return;
      }
      
      // Validate that saveBulkWardrobeItems function exists
      if (!saveBulkWardrobeItems) {
        console.error('❌ [MULTI-ITEM] saveBulkWardrobeItems function not available');
        Alert.alert('Error', 'Save function not available. Please restart the app.');
        return;
      }
      
      console.log('✅ [MULTI-ITEM] Validation passed, proceeding with save...');
      
      // Close editing screen first
      modalState.setShowPhotoEditing(false);
      setCapturedPhotoUri(null);
      setDetectedItemsState([]);
      
      // Show enhanced loading state for multi-item save
      unifiedLoading.showLoading(LOADING_CONFIGS.MULTI_ITEM_SAVE);
      
      console.log('🔄 [MULTI-ITEM] Calling saveBulkWardrobeItems...');
      // Use the bulk save function from wardrobe data hook
      await saveBulkWardrobeItems(croppedItems);
      
      unifiedLoading.hideLoading();
      
      console.log(`✅ [MULTI-ITEM] Successfully saved ${croppedItems.length} items to wardrobe`);
      
      Alert.alert(
        '🎉 Success!', 
        `${croppedItems.length} items have been added to your wardrobe.`,
        [{ text: 'View Wardrobe', onPress: () => navigateToWardrobe() }]
      );
      
    } catch (error) {
      unifiedLoading.hideLoading();
      console.error('❌ [MULTI-ITEM] Error saving multi-item detection results:', error);
      console.error('❌ [MULTI-ITEM] Error details:', {
        message: error.message,
        stack: error.stack,
        croppedItemsLength: croppedItems?.length || 'undefined'
      });
      Alert.alert(
        'Save Error', 
        `Failed to save items to wardrobe: ${error.message || 'Unknown error'}. Please try again.`
      );
    }
  };


  // Function to generate outfit based on selected items
  // This function will create a new outfit image using the selected items
  // It will also consider the user's style DNA if available and weather data if provided
  const handleGenerateOutfit = async () => {
    const equippedItems = getEquippedItems();
    
    if (equippedItems.length < 1) {
      alert("Please equip at least 1 item to generate an outfit!");
      return;
    }

    // Warn if no gender is selected but allow generation to proceed
    if (!selectedGender) {
      const proceed = confirm("No gender selected. Outfits may not match your preferred style. Continue anyway?");
      if (!proceed) return;
    }

    outfitGeneration.setGeneratingOutfit(true);
    unifiedLoading.showLoading(LOADING_CONFIGS.OUTFIT_GENERATION);
    
    try {
      // Set the selected items for outfit display
      outfitGeneration.setSelectedItemsForOutfit(equippedItems.map(item => item.image));
      
      // Generate personalized outfit based on style DNA
      const generatedImageUrl = await generatePersonalizedOutfitImage(equippedItems, styleDNA, selectedGender);
      
      if (generatedImageUrl) {
        // Download the generated outfit locally
        try {
          const localImageUri = await downloadAndSaveOutfit(generatedImageUrl);
          outfitGeneration.setGeneratedOutfit(localImageUri);
          resetOutfitTransform(); // Reset transform for new image
          setOutfitModalVisible(true); // Show the modal
          
          // Automatically save to loved outfits
          const equippedItems = getEquippedItems();
          const newLovedOutfit = {
            id: Date.now().toString(),
            image: localImageUri, // Use local URI instead of URL
                  styleDNA: styleDNA || null,
            selectedItems: equippedItems.map(item => item.image),
            gender: selectedGender || null,
            createdAt: new Date(),
            isLoved: false, // Don't automatically love generated outfits
            viewed: false, // New outfit hasn't been viewed yet
            // Wear tracking fields
            wearHistory: [],
            timesWorn: 0,
            suggestedForReWear: false,
          };
          
          setLovedOutfits(prev => {
            const newOutfits = [newLovedOutfit, ...prev];
            // Save to storage
            saveLovedOutfits(newOutfits);
            return newOutfits;
          });
          
          // Increment unviewed outfits count
          setUnviewedOutfitsCount(prev => prev + 1);
          
          const message = styleDNA ? "AI-generated outfit created on YOUR style! 🎨✨" : "AI-generated outfit created! 📸";
          alert(message + "\n\n✨ Outfit automatically saved to your Loved collection!");
        } catch (downloadError) {
          console.error('Failed to download outfit:', downloadError);
          // Fallback: use the URL directly but warn the user
          outfitGeneration.setGeneratedOutfit(generatedImageUrl);
          resetOutfitTransform();
          setOutfitModalVisible(true);
          alert("Outfit generated! ⚠️ Couldn't save locally - please save to Loved collection manually.");
        }
      } else {
        throw new Error("Failed to generate outfit image");
      }
      
    } catch (error) {
      console.error('Error generating outfit:', error);
      alert("Failed to generate AI outfit. Please try again.");
    } finally {
      outfitGeneration.setGeneratingOutfit(false);
      unifiedLoading.hideLoading();
    }
  };

  // Function to analyze profile image and extract style DNA
  const analyzeProfileImage = async (imageUri: string) => {
    setAnalyzingProfile(true);
    unifiedLoading.showLoading(LOADING_CONFIGS.STYLE_DNA_ANALYSIS);
    
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await analyzePersonalStyle(base64);
      console.log("🔍 Raw Style DNA response:", result);
      
      // More aggressive cleaning of the response
      let cleanResult = result
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*{/, '{')  // Remove everything before the first {
        .replace(/}[^}]*$/, '}') // Remove everything after the last }
        .trim();

      console.log("🧼 Cleaned Style DNA response:", cleanResult);

      let parsed;
      try {
        parsed = JSON.parse(cleanResult);
        setStyleDNA(parsed);
        // Save to storage
        saveStyleDNA(parsed);
        console.log("✅ Parsed Style DNA:", parsed);
        alert("Style DNA analyzed! 🧬✨ Your personal style profile is ready!");
      } catch (parseErr) {
        console.error("❌ Style DNA JSON Parse error:", parseErr);
        console.error("🔍 Attempted to parse:", cleanResult);
        
        // Fallback: create a basic style DNA object
        const fallbackDNA = {
          ai_analysis: {
            appearance: {
              hair_color: "not specified",
              build: "average",
              complexion: "medium",
              approximate_age_range: "20s-30s"
            },
            style_preferences: {
              current_style_visible: "casual",
              preferred_styles: ["casual", "contemporary"],
              color_palette: ["neutral", "versatile"],
              fit_preferences: "comfortable"
            },
            outfit_generation_notes: "General style preferences"
          }
        };
        
        setStyleDNA(fallbackDNA);
        // Save to storage
        StorageService.saveStyleDNA(fallbackDNA);
        alert("Style DNA created with basic profile! 🧬 (AI response had formatting issues, but we'll still personalize your outfits!)");
      }

    } catch (err) {
      console.error("❌ Profile analysis error:", err);
      alert("Failed to analyze your style. Please try again.");
    } finally {
      setAnalyzingProfile(false);
      unifiedLoading.hideLoading();
    }
  };

  // Function to pick a profile image and analyze it
  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1], // Square crop for profile photo
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      // Save to storage
      saveProfileImage(imageUri);
      
      // Automatically analyze the profile
      await analyzeProfileImage(imageUri);
    }
  };



  // Legacy spinning animation functions removed - now using unified loading

  // Function to handle pinch zoom for outfit image
  const handlePinchZoom = (scale: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale));
    outfitScale.setValue(newScale);
    setCurrentScale(newScale);
  };

  // Function to handle pan for outfit image
  const handlePan = (translateX: number, translateY: number) => {
    outfitTranslateX.setValue(translateX);
    outfitTranslateY.setValue(translateY);
  };

  // Function to handle double tap zoom
  const handleDoubleTapZoom = () => {
    const newScale = currentScale > 1 ? 1 : 2;
    
    Animated.timing(outfitScale, {
      toValue: newScale,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setCurrentScale(newScale);
    
    if (newScale === 1) {
      // Reset position when zooming out
      resetOutfitTransform();
    }
  };

  // Gesture handlers for pinch and pan
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: outfitScale } }],
    { useNativeDriver: true }
  );

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: outfitTranslateX, translationY: outfitTranslateY } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const newScale = Math.max(0.5, Math.min(3, event.nativeEvent.scale));
      setCurrentScale(newScale);
    }
  };

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      // Keep the final position
      outfitTranslateX.setValue(event.nativeEvent.translationX);
      outfitTranslateY.setValue(event.nativeEvent.translationY);
    }
  };

  // Function to reset outfit image transform
  const resetOutfitTransform = () => {
    Animated.parallel([
      Animated.timing(outfitScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(outfitTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(outfitTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCurrentScale(1);
  };

  // Function to open slot selection modal
  const openSlotSelection = (slotKey: string) => {
    modalState.setSelectedSlot(slotKey);
    modalState.setSlotSelectionModalVisible(true);
  };

  // Function to assign item to gear slot
  const assignItemToSlot = (slotKey: string, item: any) => {
    outfitGeneration.setGearSlots({
      ...outfitGeneration.gearSlots,
      [slotKey]: {
        itemId: item.image,
        itemImage: item.image,
        itemTitle: item.title || 'Untitled Item',
      }
    });
    modalState.setSlotSelectionModalVisible(false);
    modalState.setSelectedSlot(null);
  };

  // Function to clear gear slot
  const clearGearSlot = (slotKey: string) => {
    outfitGeneration.setGearSlots({
      ...outfitGeneration.gearSlots,
      [slotKey]: {
        itemId: null,
        itemImage: null,
        itemTitle: null,
      }
    });
  };

  // Function to get all equipped items for outfit generation
  const getEquippedItems = () => {
    const equippedItems = [];
    for (const [slotKey, slotData] of Object.entries(outfitGeneration.gearSlots)) {
      if (slotData.itemId) {
        const item = savedItems.find(savedItem => savedItem.image === slotData.itemId);
        if (item) {
          equippedItems.push(item);
        }
      }
    }
    return equippedItems;
  };

  // categorizeItem function is now provided by useWardrobeData hook

  // AVAILABLE_CATEGORIES is now provided by useWardrobeData hook

  // Function to get items filtered by category
  const getItemsByCategory = (category: string, sortOrder?: 'asc' | 'desc') => {
    const filteredItems = savedItems.filter(item => {
      const itemCategory = categorizeItem(item);
      return itemCategory === category;
    });
    
    // Apply sorting if sortOrder is provided
    if (sortOrder) {
      // Since items don't have timestamps, we'll use the array index
      // Items added later are at the end of the array
      const itemsWithIndex = filteredItems.map((item, index) => ({ item, originalIndex: savedItems.indexOf(item) }));
      
      itemsWithIndex.sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.originalIndex - a.originalIndex; // Newest first (higher index = newer)
        } else {
          return a.originalIndex - b.originalIndex; // Oldest first (lower index = older)
        }
      });
      
      return itemsWithIndex.map(({ item }) => item);
    }
    
    return filteredItems;
  };

  // updateItemCategory function is now provided by useWardrobeData hook

  // Function to edit wardrobe item
  const editWardrobeItem = (item: any) => {
    console.log('Edit wardrobe item tapped:', item.title);
    setEditingItem(item);
    setEditItemTitle(item.title || "");
    setEditItemTags(item.tags || []);
    setEditItemNewTag("");
  };

  // Function to save edited item
  const saveEditedItem = () => {
    if (!editingItem) return;
    
    setSavedItems(prev => {
      const newItems = prev.map(item => 
        item.image === editingItem.image 
          ? { ...item, title: editItemTitle, tags: editItemTags }
          : item
      );
      // Save to storage
      saveWardrobeItems(newItems);
      return newItems;
    });
    
    setEditingItem(null);
    setEditItemTitle("");
    setEditItemTags([]);
    setEditItemNewTag("");
  };


  // Function to add tag to editing item
  const addTagToEditingItem = () => {
    if (editItemNewTag.trim() && !editItemTags.includes(editItemNewTag.trim())) {
      setEditItemTags([...editItemTags, editItemNewTag.trim()]);
      setEditItemNewTag("");
    }
  };

  // Function to remove tag from editing item
  const removeTagFromEditingItem = (tagToRemove: string) => {
    setEditItemTags(editItemTags.filter(tag => tag !== tagToRemove));
  };

  // Function to save outfit to loved collection
  const saveOutfitToLoved = () => {
    if (!outfitGeneration.generatedOutfit) return;
    
    const equippedItems = getEquippedItems();
    
    const newLovedOutfit = {
      id: Date.now().toString(),
      image: outfitGeneration.generatedOutfit,
      styleDNA: styleDNA || null,
      selectedItems: equippedItems.map(item => item.image),
      gender: selectedGender || null,
      createdAt: new Date(),
      isLoved: false, // Don't automatically love when saving
      viewed: false, // New outfit hasn't been viewed yet
      // Wear tracking fields
      wearHistory: [],
      timesWorn: 0,
      suggestedForReWear: false,
      hasBeenViewed: false, // Legacy field - keeping for backward compatibility
    };
    
    setLovedOutfits(prev => {
      const newOutfits = [newLovedOutfit, ...prev];
      // Save to storage
      saveLovedOutfits(newOutfits);
      return newOutfits;
    });
    
    // Increment unviewed outfits count
    setUnviewedOutfitsCount(prev => prev + 1);
    
    alert("Outfit saved to your collection! 👗");
  };


  // Function to remove outfit from loved collection
  const removeLovedOutfit = (outfitId: string) => {
    setLovedOutfits(prev => {
      const newOutfits = prev.filter(outfit => outfit.id !== outfitId);
      // Save to storage
      saveLovedOutfits(newOutfits);
      return newOutfits;
    });
    alert("Outfit removed from Loved collection");
  };

  // Function to view loved outfit in modal
  const viewLovedOutfit = (outfit: any) => {
    outfitGeneration.setGeneratedOutfit(outfit.image);
    resetOutfitTransform();
    setOutfitModalVisible(true);
  };

  // Function to download image to photo library
  const downloadImage = async (imageUri: string) => {
    try {
      // Request permission to save to photo library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required to save images!');
        return;
      }

      let fileUri = imageUri;
      
      // If it's a URL, download it first
      if (imageUri.startsWith('http')) {
        const tempUri = FileSystem.documentDirectory + 'temp_outfit_' + Date.now() + '.jpg';
        const downloadResult = await FileSystem.downloadAsync(imageUri, tempUri);
        
        if (downloadResult.status === 200) {
          fileUri = downloadResult.uri;
        } else {
          throw new Error('Failed to download image');
        }
      }

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('StyleMuse Outfits', asset, false);
      alert('✨ Outfit saved to your photo library! 📸');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  // Function to download and save generated outfit locally
  const downloadAndSaveOutfit = async (imageUrl: string) => {
    try {
      console.log('🔄 Downloading generated outfit...');
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `outfit_${timestamp}.jpg`;
      const localUri = FileSystem.documentDirectory + fileName;
      
      // Download the image to local storage
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
      
      if (downloadResult.status === 200) {
        console.log('✅ Outfit downloaded successfully:', localUri);
        return localUri;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('❌ Error downloading outfit:', error);
      throw error;
    }
  };

  // Function to navigate to next loved outfit
  const nextLovedOutfit = () => {
    if (lovedOutfits.length > 0) {
      setCurrentLovedOutfitIndex((prev) => 
        prev === lovedOutfits.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Function to navigate to previous loved outfit
  const previousLovedOutfit = () => {
    if (lovedOutfits.length > 0) {
      setCurrentLovedOutfitIndex((prev) => 
        prev === 0 ? lovedOutfits.length - 1 : prev - 1
      );
    }
  };

  // Function to open loved outfit modal with navigation
  const openLovedOutfitModal = (outfit: any, index: number) => {
    setCurrentLovedOutfitIndex(index);
    setLovedOutfitModalVisible(true);
  };

  // Extract outfit generation function from our refactored hook
  const { generateOutfitSuggestions } = outfitGeneration;

  // Function to get sorted and filtered wardrobe items
  const getSortedAndFilteredItems = () => {
    let filteredItems = [...savedItems];
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filteredItems = filteredItems.filter(item => categorizeItem(item) === filterCategory);
    }
    
    // Apply laundry status filter
    if (filterLaundryStatus !== 'all') {
      filteredItems = filteredItems.filter(item => (item.laundryStatus || 'clean') === filterLaundryStatus);
    }
    
    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recent':
          // Items are already in chronological order (newest first) due to how they're added
          // We'll use the array index as a proxy for recency
          comparison = savedItems.indexOf(a) - savedItems.indexOf(b);
          break;
        case 'category':
          comparison = categorizeItem(a).localeCompare(categorizeItem(b));
          break;
        case 'name':
          comparison = (a.title || 'Untitled Item').localeCompare(b.title || 'Untitled Item');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filteredItems;
  };

  // Function to get unique categories from wardrobe
  const getUniqueCategories = () => {
    const categories = savedItems.map(item => categorizeItem(item));
    return ['all', ...Array.from(new Set(categories))];
  };

  // Function to get unique laundry statuses from wardrobe
  const getUniqueLaundryStatuses = () => {
    const statuses = savedItems.map(item => item.laundryStatus || 'clean');
    return ['all', ...Array.from(new Set(statuses))];
  };

  // Function to get category display name
  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Items',
      'top': 'Tops',
      'bottom': 'Bottoms',
      'shoes': 'Shoes',
      'jacket': 'Jackets',
      'hat': 'Hats',
      'accessories': 'Accessories'
    };
    return displayNames[category] || category;
  };

  // Function to get laundry status display name
  const getLaundryStatusDisplayName = (status: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Status',
      'clean': '✨ Clean',
      'dirty': '🧺 Dirty',
      'in-laundry': '🌊 Washing',
      'drying': '💨 Drying',
      'needs-ironing': '👔 Needs Iron',
      'out-of-rotation': '📦 Stored'
    };
    return displayNames[status] || status;
  };

  // Function to get sort display name
  const getSortDisplayName = (sortType: string) => {
    const displayNames: { [key: string]: string } = {
      'recent': 'Recently Added',
      'category': 'Category',
      'name': 'Name'
    };
    return displayNames[sortType] || sortType;
  };

  // openWardrobeItemView and goBackToWardrobe functions are now provided by useNavigationState hook

  // openOutfitDetailView and goBackToOutfits functions are now provided by useNavigationState hook

  // Function to save field updates
  // saveFieldUpdate function is now provided by useWardrobeData hook

  // Function to trigger haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle[type]);
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  };

  // REMOVED: Legacy smart outfit suggestions - now using unified AIOutfitAssistant

  const handleSmartSuggestionsGenerated = (suggestion: any) => {
    // Auto-fill the outfit builder with the generated suggestions
    outfitGeneration.setGearSlots({
      top: suggestion.top ? { 
        itemId: suggestion.top.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.top.image, 
        itemTitle: suggestion.top.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
      bottom: suggestion.bottom ? { 
        itemId: suggestion.bottom.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.bottom.image, 
        itemTitle: suggestion.bottom.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
      shoes: suggestion.shoes ? { 
        itemId: suggestion.shoes.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.shoes.image, 
        itemTitle: suggestion.shoes.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
      jacket: suggestion.jacket ? { 
        itemId: suggestion.jacket.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.jacket.image, 
        itemTitle: suggestion.jacket.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
      hat: suggestion.hat ? { 
        itemId: suggestion.hat.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.hat.image, 
        itemTitle: suggestion.hat.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
      accessories: suggestion.accessories ? { 
        itemId: suggestion.accessories.image, // Use image as itemId to match getEquippedItems logic
        itemImage: suggestion.accessories.image, 
        itemTitle: suggestion.accessories.title 
      } : { itemId: null, itemImage: null, itemTitle: null },
    });

    // Show enhanced success feedback with AI analysis
    const feedbackMessage = `✨ AI-Curated Outfit Complete! 

${suggestion.reasoning}

Style Score: ${suggestion.styleScore || suggestion.confidence}%
${suggestion.formality ? `Formality: ${suggestion.formality}` : ''}
${suggestion.colorPalette && suggestion.colorPalette.length > 0 ? `Color Palette: ${suggestion.colorPalette.join(', ')}` : ''}

${suggestion.missingItems && suggestion.missingItems.length > 0 ? 
  `\n💡 To complete this look:\n${suggestion.missingItems.map(item => `• ${item.description} - ${item.reason}`).join('\n')}` : 
  ''}`;
    
    alert(feedbackMessage);
    triggerHaptic('medium');
  };

  // Function to shake animation
  const shakeButton = (shakeValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(shakeValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Function to toggle outfit love status
  // toggleOutfitLove function is now provided by useWardrobeData hook

  // Function to get sorted outfits (loved first, then by date)
  const getSortedOutfits = () => {
    return [...lovedOutfits].sort((a, b) => {
      // Loved outfits first
      if (a.isLoved && !b.isLoved) return -1;
      if (!a.isLoved && b.isLoved) return 1;
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // View for the Wardrobe Upload Screen 
  // This is the main component that renders the wardrobe upload screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Main Content */}
        <View style={{ flex: 1 }}>
        <ScrollView 
          ref={mainScrollViewRef}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

{/* App Title */}
<View style={{ marginBottom: 20, alignItems: 'center' }}>
  <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 5, color: theme.colors.text }}>
    StyleMuse
  </Text>
  <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
    AI-Powered Virtual Closet ✨
  </Text>
</View>

{/* Bulk upload progress is now handled by UnifiedLoadingOverlay */}

{/* Style DNA Analysis now uses Unified Loading Overlay */}

{/* Spinning animation and loading text for outfit generation */}
{/* Old spinning animation replaced with unified loading system - handled by useOutfitGeneration hook */}





  </View>




      {/* Outfit Modal with Pinch-to-Zoom */}
      <Modal
        visible={outfitModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOutfitModalVisible(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.outfitModalOverlay}>
            <ScrollView 
              style={[styles.outfitModalContent, { backgroundColor: theme.colors.background }]}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.outfitModalHeader}>
                <Text style={styles.outfitModalTitle}>
                  {styleDNA ? "Your Personalized AI Outfit! 🧬✨" : "Your AI-Generated Outfit"}
                </Text>
                
                {/* Close button */}
                <TouchableOpacity
                  onPress={() => setOutfitModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Zoomable Image Container */}
              <View style={styles.imageContainer}>
                {outfitGeneration.generatedOutfit ? (
                  <GestureHandlerRootView style={{ width: '100%', height: '100%' }}>
                    <PanGestureHandler
                      onGestureEvent={onPanGestureEvent}
                      onHandlerStateChange={onPanHandlerStateChange}
                    >
                      <Animated.View style={{ width: '100%', height: '100%' }}>
                        <PinchGestureHandler
                          onGestureEvent={onPinchGestureEvent}
                          onHandlerStateChange={onPinchHandlerStateChange}
                        >
                          <Animated.View
                            style={[
                              styles.zoomableImage,
                              {
                                transform: [
                                  { scale: outfitScale },
                                  { translateX: outfitTranslateX },
                                  { translateY: outfitTranslateY }
                                ]
                              }
                            ]}
                          >
                            <TouchableOpacity
                              onPress={() => {
                                // Single tap to close modal
                                setOutfitModalVisible(false);
                              }}
                              onLongPress={handleDoubleTapZoom}
                              activeOpacity={1}
                              style={styles.outfitImageTouchable}
                            >
                              <SafeImage
                                uri={outfitGeneration.generatedOutfit}
                                style={styles.outfitImage}
                                resizeMode="contain"
                                onError={(error) => console.log('Image error:', error)}
                                onLoad={() => console.log('Image loaded successfully')}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </PinchGestureHandler>
                      </Animated.View>
                    </PanGestureHandler>
                  </GestureHandlerRootView>
                ) : (
                  <View style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Text style={{ color: '#666', fontSize: 16 }}>No outfit image available</Text>
                    <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>generatedOutfit: {outfitGeneration.generatedOutfit || 'null'}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons - Moved up for better UX */}
              <View style={styles.outfitModalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setOutfitModalVisible(false);
                    outfitGeneration.setGeneratedOutfit(null);
                    outfitGeneration.setSelectedItemsForOutfit([]);
                    outfitGeneration.setIsSelectionMode(true);
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>🔄 Generate Another</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setOutfitModalVisible(false);
                    outfitGeneration.setGeneratedOutfit(null);
                    outfitGeneration.setSelectedItemsForOutfit([]);
                  }}
                  style={[styles.actionButton, styles.keepOutfitButton]}
                >
                  <Text style={styles.actionButtonText}>✅ Keep This Outfit</Text>
                </TouchableOpacity>
              </View>

              {/* Original Items Section */}
              {outfitGeneration.selectedItemsForOutfit.length > 0 && (
                <View style={styles.originalItemsContainer}>
                  <Text style={styles.originalItemsTitle}>Based on these items:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.originalItemsScroll}
                  >
                    {outfitGeneration.selectedItemsForOutfit.map((imageUri, index) => (
                      <View key={index} style={styles.originalItemCard}>
                        <Image 
                          source={{ uri: imageUri }} 
                          style={styles.originalItemImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.originalItemNumber}>#{index + 1}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Controls */}
              <View style={styles.outfitModalControls}>
                <TouchableOpacity
                  onPress={() => handlePinchZoom(currentScale + 0.3)}
                  style={styles.controlButton}
                >
                  <Text style={styles.controlButtonText}>🔍 Zoom In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={resetOutfitTransform}
                  style={styles.controlButton}
                >
                  <Text style={styles.controlButtonText}>🔄 Reset</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handlePinchZoom(currentScale - 0.3)}
                  style={styles.controlButton}
                >
                  <Text style={styles.controlButtonText}>🔍 Zoom Out</Text>
                </TouchableOpacity>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  💡 Pinch to zoom • Drag to pan • Long press to quick zoom • Tap to close
                </Text>
              </View>

            </ScrollView>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Slot Selection Modal */}
      <Modal
        visible={modalState.slotSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => modalState.setSlotSelectionModalVisible(false)}
      >
        <Pressable
          onPress={() => modalState.setSlotSelectionModalVisible(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.slotSelectionModalContent}>
            <View style={styles.slotSelectionHeader}>
              <View style={styles.slotSelectionTitleContainer}>
                <Text style={styles.slotSelectionTitle}>
                  Select {modalState.selectedSlot?.toUpperCase()} Item
                </Text>
                <Text style={styles.slotSelectionSubtitle}>
                  Showing {getItemsByCategory(modalState.selectedSlot || '', modalState.slotSortOrder).length} {modalState.selectedSlot} items
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => modalState.setSlotSortOrder(modalState.slotSortOrder === 'asc' ? 'desc' : 'asc')}
                style={styles.slotSortButton}
              >
                <Text style={styles.slotSortButtonText}>
                  {modalState.slotSortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.slotSelectionScroll}>
              {getItemsByCategory(modalState.selectedSlot || '', modalState.slotSortOrder).map((item, index) => (
                <TouchableOpacity
                  key={`${item.image}-${index}`}
                  onPress={() => assignItemToSlot(modalState.selectedSlot!, item)}
                  style={styles.slotSelectionItem}
                >
                  <SafeImage
                    uri={item.image}
                    style={styles.slotSelectionItemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.slotSelectionItemInfo}>
                    <Text style={styles.slotSelectionItemTitle}>
                      {item.title || 'Untitled Item'}
                    </Text>
                    <Text style={styles.slotSelectionItemDescription}>
                      {item.description}
                    </Text>
                    <View style={styles.slotSelectionItemTags}>
                      {item.tags?.slice(0, 3).map((tag, tagIndex) => (
                        <View key={tagIndex} style={styles.slotSelectionItemTag}>
                          <Text style={styles.slotSelectionItemTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {categorizeItem(item).toUpperCase()}
                      </Text>
                    </View>
                    
                    {/* Outfit Ideas Button for Slot Selection */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        generateOutfitSuggestions(item, styleDNA);
                      }}
                      style={styles.slotOutfitSuggestionsButton}
                    >
                      <Text style={styles.slotOutfitSuggestionsButtonText}>🎨 Outfit Ideas</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              
              {getItemsByCategory(modalState.selectedSlot || '', modalState.slotSortOrder).length === 0 && (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>
                    No {modalState.selectedSlot} items found
                  </Text>
                  <Text style={styles.noItemsSubtext}>
                    Add some {modalState.selectedSlot} items to your wardrobe first!
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => modalState.setSlotSelectionModalVisible(false)}
              style={styles.slotSelectionCloseButton}
            >
              <Text style={styles.slotSelectionCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={editingItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingItem(null)}
      >
        <Pressable
          onPress={() => setEditingItem(null)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.editItemModalContent}>
            <View style={styles.editItemModalHeader}>
              <Text style={styles.editItemModalTitle}>
                ✏️ Edit Item Details
              </Text>
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                style={styles.closeEditButton}
              >
                <Text style={styles.closeEditButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Scrollable Form Content */}
            <ScrollView style={styles.editItemModalScroll} showsVerticalScrollIndicator={true}>
              {editingItem && (
                <>
                  <Image
                    source={{ uri: editingItem.image }}
                    style={styles.editItemImage}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.editItemForm}>
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Title:</Text>
                      <TextInput
                        value={editItemTitle}
                        onChangeText={setEditItemTitle}
                        style={styles.editItemInput}
                        placeholder="Enter item title"
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Description:</Text>
                      <TextInput
                        value={editingItem.description}
                        style={styles.editItemInput}
                        placeholder="Item description"
                        multiline
                        numberOfLines={3}
                        editable={false}
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Color:</Text>
                      <TextInput
                        value={editingItem.color}
                        style={styles.editItemInput}
                        placeholder="Item color"
                        editable={false}
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Material:</Text>
                      <TextInput
                        value={editingItem.material}
                        style={styles.editItemInput}
                        placeholder="Item material"
                        editable={false}
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Style:</Text>
                      <TextInput
                        value={editingItem.style}
                        style={styles.editItemInput}
                        placeholder="Item style"
                        editable={false}
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Fit:</Text>
                      <TextInput
                        value={editingItem.fit}
                        style={styles.editItemInput}
                        placeholder="Item fit"
                        editable={false}
                      />
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Category:</Text>
                      <View style={styles.categoryDisplay}>
                        <Text style={styles.categoryDisplayText}>
                          {categorizeItem(editingItem).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.editItemField}>
                      <Text style={styles.editItemLabel}>Tags:</Text>
                      <View style={styles.editItemTagsContainer}>
                        {editItemTags.map((tag, index) => (
                          <View key={index} style={styles.editItemTag}>
                            <Text style={styles.editItemTagText}>{tag}</Text>
                            <TouchableOpacity
                              onPress={() => removeTagFromEditingItem(tag)}
                              style={styles.removeTagButton}
                            >
                              <Text style={styles.removeTagButtonText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.addTagContainer}>
                        <TextInput
                          value={editItemNewTag}
                          onChangeText={setEditItemNewTag}
                          style={styles.addTagInput}
                          placeholder="Add new tag"
                        />
                        <TouchableOpacity
                          onPress={addTagToEditingItem}
                          style={styles.addTagButton}
                        >
                          <Text style={styles.addTagButtonText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            {/* Static Action Buttons */}
            <View style={styles.editItemModalActions}>
              <TouchableOpacity
                onPress={saveEditedItem}
                style={styles.saveEditButton}
              >
                <Text style={styles.saveEditButtonText}>💾 Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => deleteWardrobeItem(editingItem)}
                style={styles.deleteEditButton}
              >
                <Text style={styles.deleteEditButtonText}>🗑️ Delete Item</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                style={styles.cancelEditButton}
              >
                <Text style={styles.cancelEditButtonText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Loved Outfit Modal with Navigation */}
      <Modal
        visible={lovedOutfitModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLovedOutfitModalVisible(false)}
      >
        <View style={styles.outfitModalOverlay}>
          <View style={styles.outfitModalContent}>
            {/* Header with navigation */}
            <View style={styles.outfitModalHeader}>
              <TouchableOpacity
                onPress={previousLovedOutfit}
                style={styles.navigationArrow}
                disabled={lovedOutfits.length <= 1}
              >
                <Text style={[styles.navigationArrowText, lovedOutfits.length <= 1 && styles.navigationArrowDisabled]}>
                  ◀️
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.outfitModalTitle}>
                ❤️ Loved Outfit {currentLovedOutfitIndex + 1} of {lovedOutfits.length}
              </Text>
              
              <TouchableOpacity
                onPress={nextLovedOutfit}
                style={styles.navigationArrow}
                disabled={lovedOutfits.length <= 1}
              >
                <Text style={[styles.navigationArrowText, lovedOutfits.length <= 1 && styles.navigationArrowDisabled]}>
                  ▶️
                </Text>
              </TouchableOpacity>
            </View>

            {/* Outfit Image */}
            {lovedOutfits[currentLovedOutfitIndex] && (
              <View style={styles.imageContainer}>
                <GestureHandlerRootView style={{ width: '100%', height: '100%' }}>
                  <PanGestureHandler
                    onGestureEvent={onPanGestureEvent}
                    onHandlerStateChange={onPanHandlerStateChange}
                  >
                    <Animated.View style={{ width: '100%', height: '100%' }}>
                      <PinchGestureHandler
                        onGestureEvent={onPinchGestureEvent}
                        onHandlerStateChange={onPinchHandlerStateChange}
                      >
                        <Animated.View
                          style={[
                            styles.zoomableImage,
                            {
                              transform: [
                                { scale: outfitScale },
                                { translateX: outfitTranslateX },
                                { translateY: outfitTranslateY }
                              ]
                            }
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              // Single tap to close modal
                              setLovedOutfitModalVisible(false);
                            }}
                            onLongPress={handleDoubleTapZoom}
                            activeOpacity={1}
                            style={styles.outfitImageTouchable}
                          >
                            <Image
                              source={{ uri: lovedOutfits[currentLovedOutfitIndex].image }}
                              style={styles.outfitImage}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      </PinchGestureHandler>
                    </Animated.View>
                  </PanGestureHandler>
                </GestureHandlerRootView>
              </View>
            )}

            {/* Outfit Info */}
            {lovedOutfits[currentLovedOutfitIndex] && (
              <View style={styles.outfitInfoContainer}>

                {/* Style DNA indicator */}
                {lovedOutfits[currentLovedOutfitIndex].styleDNA && (
                  <View style={styles.styleDNAInfo}>
                    <Text style={styles.styleDNAText}>
                      🧬 Personalized based on your Style DNA
                    </Text>
                  </View>
                )}

                {/* Gender indicator */}
                {lovedOutfits[currentLovedOutfitIndex].gender && (
                  <View style={styles.genderInfo}>
                    <Text style={styles.genderText}>
                      {lovedOutfits[currentLovedOutfitIndex].gender === 'male' ? '👨' : 
                       lovedOutfits[currentLovedOutfitIndex].gender === 'female' ? '👩' : '🌈'} {lovedOutfits[currentLovedOutfitIndex].gender}
                    </Text>
                  </View>
                )}

                {/* Date */}
                <Text style={styles.outfitDateText}>
                  Created: {lovedOutfits[currentLovedOutfitIndex].createdAt.toLocaleDateString()}
                </Text>

                {/* Items used */}
                <Text style={styles.outfitItemsText}>
                  {lovedOutfits[currentLovedOutfitIndex].selectedItems.length} items used
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.outfitModalActions}>
              <TouchableOpacity
                onPress={() => downloadImage(lovedOutfits[currentLovedOutfitIndex]?.image)}
                style={styles.downloadButton}
              >
                <Text style={styles.downloadButtonText}>⬇️ Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => removeLovedOutfit(lovedOutfits[currentLovedOutfitIndex]?.id)}
                style={styles.removeLovedButton}
              >
                <Text style={styles.removeLovedButtonText}>🗑️ Remove</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setLovedOutfitModalVisible(false)}
                style={styles.closeLovedButton}
              >
                <Text style={styles.closeLovedButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort & Filter Modal */}
      <Modal
        visible={modalState.showSortFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => modalState.setShowSortFilterModal(false)}
      >
        <Pressable
          onPress={() => modalState.setShowSortFilterModal(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.sortFilterModalContent}>
            <View style={styles.sortFilterModalHeader}>
              <Text style={styles.sortFilterModalTitle}>
                🔍 Sort & Filter Wardrobe
              </Text>
              <TouchableOpacity
                onPress={() => modalState.setShowSortFilterModal(false)}
                style={styles.closeSortFilterButton}
              >
                <Text style={styles.closeSortFilterButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.sortFilterModalScroll}>
              {/* Sort Options */}
              <View style={styles.sortSection}>
                <Text style={styles.sortSectionTitle}>Sort By:</Text>
                <View style={styles.sortOptionsContainer}>
                  {['recent', 'category', 'name'].map((sortType) => (
                    <TouchableOpacity
                      key={sortType}
                      onPress={() => setSortBy(sortType as 'recent' | 'category' | 'name')}
                      style={[
                        styles.sortOptionButton,
                        sortBy === sortType && styles.sortOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.sortOptionButtonText,
                        sortBy === sortType && styles.sortOptionButtonTextActive
                      ]}>
                        {getSortDisplayName(sortType)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Order */}
              <View style={styles.sortOrderSection}>
                <Text style={styles.sortSectionTitle}>Sort Order:</Text>
                <View style={styles.sortOrderContainer}>
                  <TouchableOpacity
                    onPress={() => setSortOrder('asc')}
                    style={[
                      styles.sortOrderButton,
                      sortOrder === 'asc' && styles.sortOrderButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.sortOrderButtonText,
                      sortOrder === 'asc' && styles.sortOrderButtonTextActive
                    ]}>
                      ↑ Ascending
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setSortOrder('desc')}
                    style={[
                      styles.sortOrderButton,
                      sortOrder === 'desc' && styles.sortOrderButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.sortOrderButtonText,
                      sortOrder === 'desc' && styles.sortOrderButtonTextActive
                    ]}>
                      ↓ Descending
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter by Category */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Category:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueCategories().map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setFilterCategory(category)}
                      style={[
                        styles.filterOptionButton,
                        filterCategory === category && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterCategory === category && styles.filterOptionButtonTextActive
                      ]}>
                        {getCategoryDisplayName(category)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter by Laundry Status */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Laundry Status:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueLaundryStatuses().map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFilterLaundryStatus(status)}
                      style={[
                        styles.filterOptionButton,
                        filterLaundryStatus === status && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterLaundryStatus === status && styles.filterOptionButtonTextActive
                      ]}>
                        {getLaundryStatusDisplayName(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Results Preview */}
              <View style={styles.resultsPreviewSection}>
                <Text style={styles.sortSectionTitle}>Results:</Text>
                <View style={styles.resultsPreviewContainer}>
                  <Text style={styles.resultsPreviewText}>
                    Showing {getSortedAndFilteredItems().length} of {savedItems.length} items
                  </Text>
                  <Text style={styles.resultsPreviewSubtext}>
                    {filterCategory !== 'all' && `Category: ${getCategoryDisplayName(filterCategory)}`}
                    {filterLaundryStatus !== 'all' && (filterCategory !== 'all' ? ' • ' : '')}
                    {filterLaundryStatus !== 'all' && `Status: ${getLaundryStatusDisplayName(filterLaundryStatus)}`}
                    {(filterCategory !== 'all' || filterLaundryStatus !== 'all') && sortBy !== 'recent' && ' • '}
                    {sortBy !== 'recent' && `Sorted by: ${getSortDisplayName(sortBy)} (${sortOrder === 'asc' ? '↑' : '↓'})`}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.sortFilterModalActions}>
              <TouchableOpacity
                onPress={() => {
                  setSortBy('recent');
                  setSortOrder('desc');
                  setFilterCategory('all');
                  setFilterLaundryStatus('all');
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>🔄 Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => modalState.setShowSortFilterModal(false)}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>✅ Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>


        











{/* Single image AI analysis now uses unified loading - no need for custom loading UI */}







{/* Outfit Builder - Always Show */}
<View style={{ 
  marginTop: 20, 
  position: 'relative',
  display: showOutfitBuilder ? 'flex' : 'none' 
}}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center', color: theme.colors.text }}>
    🎮 Outfit Builder
  </Text>
  

  {/* Random Outfit Generator */}
  <View style={styles.randomOutfitSection}>
    <View style={styles.randomOutfitButtonContainer}>
      <RandomOutfitButtons
        onGenerate={handleRandomOutfit}
        onAIGenerate={() => {
          // Open the AI outfit assistant modal via ref
          aiOutfitAssistantRef.current?.openConfigModal();
        }}
        isGenerating={randomOutfit.isGenerating}
        disabled={savedItems.length < 3}
      />
    </View>
    
    {/* AI Outfit Assistant (hidden, modal only) */}
    <AIOutfitAssistant
      ref={aiOutfitAssistantRef}
      context="builder"
      styleDNA={styleDNA}
      size="medium"
      onOutfitGenerated={(outfit) => {
        // When AI outfit assistant generates suggestions, fill the gear slots
        console.log('🎯 AI Outfit Assistant generated outfit, filling slots...');
        generateOutfitSuggestions(null, styleDNA, {
          occasion: outfit.occasion || 'casual',
          style: 'coordinated',
          weather: 'moderate',
          time: 'day',
          location: 'general'
        });
      }}
      sharedLoading={unifiedLoading}
      renderButton={false}
    />

    {savedItems.length < 3 && (
      <Text style={styles.randomOutfitWarning}>
        ⚠️ Need at least 3 items for complete outfits
      </Text>
    )}

    {randomOutfit.lastGeneration && (
      <View style={styles.generationStatsContainer}>
        <Text style={styles.generationStatsTitle}>✨ Last Generation:</Text>
        <Text style={styles.generationStats}>
          Style: {randomOutfit.lastGeneration.style} • 
          Completeness: {Math.round(randomOutfit.lastGeneration.completeness)}% • 
          {randomOutfit.lastGeneration.generationTime}ms
        </Text>
        {randomOutfit.lastGeneration.colorHarmony && (
          <Text style={styles.colorHarmonyIndicator}>
            🎨 Color harmony achieved
          </Text>
        )}
      </View>
    )}
  </View>
  
  {/* Style DNA analysis now uses the main unified loading overlay */}
  
  {/* Gear Slot Grid */}
  <View style={styles.gearSlotGrid}>
    {/* First Row */}
    <View style={styles.gearRow}>
      <Animated.View style={{ transform: [{ scale: gearSlotBounces.top }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.top).start();
            openSlotSelection('top');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.top.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.top.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.top.itemImage} style={styles.gearSlotImage} category="top" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('top')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                TOP
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/top.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.top.itemImage && styles.gearSlotLabelFilled]}>
                TOP
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: gearSlotBounces.bottom }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.bottom).start();
            openSlotSelection('bottom');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.bottom.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.bottom.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.bottom.itemImage} style={styles.gearSlotImage} category="bottom" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('bottom')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                BOTTOM
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/bottom.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.bottom.itemImage && styles.gearSlotLabelFilled]}>
                BOTTOM
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: gearSlotBounces.shoes }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.shoes).start();
            openSlotSelection('shoes');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.shoes.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.shoes.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.shoes.itemImage} style={styles.gearSlotImage} category="shoes" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('shoes')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                SHOES
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/shoes.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.shoes.itemImage && styles.gearSlotLabelFilled]}>
                SHOES
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>

    {/* Second Row */}
    <View style={styles.gearRow}>
      <Animated.View style={{ transform: [{ scale: gearSlotBounces.jacket }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.jacket).start();
            openSlotSelection('jacket');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.jacket.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.jacket.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.jacket.itemImage} style={styles.gearSlotImage} category="jacket" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('jacket')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                JACKET
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/jacket.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.jacket.itemImage && styles.gearSlotLabelFilled]}>
                JACKET
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: gearSlotBounces.hat }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.hat).start();
            openSlotSelection('hat');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.hat.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.hat.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.hat.itemImage} style={styles.gearSlotImage} category="hat" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('hat')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                HAT
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/hat.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.hat.itemImage && styles.gearSlotLabelFilled]}>
                HAT
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: gearSlotBounces.accessories }] }}>
        <TouchableOpacity
          onPress={() => {
            createBounceAnimation(gearSlotBounces.accessories).start();
            openSlotSelection('accessories');
          }}
          style={[styles.gearSlot, outfitGeneration.gearSlots.accessories.itemImage && styles.gearSlotFilled]}
        >
          {outfitGeneration.gearSlots.accessories.itemImage ? (
            <>
              <View style={styles.gearSlotImageContainer}>
                <SafeImage uri={outfitGeneration.gearSlots.accessories.itemImage} style={styles.gearSlotImage} category="accessories" placeholder="item" />
                <TouchableOpacity
                  onPress={() => clearGearSlot('accessories')}
                  style={styles.clearSlotButton}
                >
                  <Text style={styles.clearSlotText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.gearSlotLabel, styles.gearSlotLabelFilled]}>
                ACCESSORIES
              </Text>
            </>
          ) : (
            <>
              <Image 
                source={require('../assets/accessories.png')} 
                style={styles.gearSlotIcon} 
                resizeMode="contain"
              />
              <Text style={[styles.gearSlotLabel, outfitGeneration.gearSlots.accessories.itemImage && styles.gearSlotLabelFilled]}>
                ACCESSORIES
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  </View>

  {/* REMOVED: Legacy Smart Outfit Suggestions Button - now using unified AIOutfitAssistant */}

  {/* Generate Outfit Button */}
  <View style={{ marginTop: 20, alignItems: 'center' }}>
    <Animated.View style={{ transform: [{ scale: generateOutfitBounce }] }}>
      <TouchableOpacity
        onPress={() => {
          createBounceAnimation(generateOutfitBounce).start();
          handleGenerateOutfit();
        }}
        disabled={outfitGeneration.generatingOutfit || getEquippedItems().length < 1}
        style={{
          opacity: (outfitGeneration.generatingOutfit || getEquippedItems().length < 1) ? 0.5 : 1
        }}
      >
        <Image 
          source={getGenerateOutfitIcon()} 
          style={styles.generateOutfitImageButton} 
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
    
    {getEquippedItems().length > 0 && (
      <Text style={styles.equippedCount}>
        Equipped: {getEquippedItems().length} items
      </Text>
    )}
  </View>

  {/* Clear All Button */}
  <View style={{ marginTop: 16, alignItems: 'center' }}>
    <Animated.View style={{ transform: [{ scale: clearAllBounce }] }}>
      <TouchableOpacity
        onPress={() => {
          createBounceAnimation(clearAllBounce).start();
          outfitGeneration.setGearSlots({
            top: { itemId: null, itemImage: null, itemTitle: null },
            bottom: { itemId: null, itemImage: null, itemTitle: null },
            shoes: { itemId: null, itemImage: null, itemTitle: null },
            jacket: { itemId: null, itemImage: null, itemTitle: null },
            hat: { itemId: null, itemImage: null, itemTitle: null },
            accessories: { itemId: null, itemImage: null, itemTitle: null },
          });
        }}
      >
        <Image 
          source={getClearAllSlotsIcon()} 
          style={styles.clearAllImageButton} 
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  </View>
</View>

{/* Loved Outfits Section - Moved to dedicated Outfits page */}

{/* Wardrobe Section */}
<View style={{ display: showWardrobe ? 'flex' : 'none' }}>
  <WardrobePage
    savedItems={savedItems}
    showSortFilterModal={modalState.showSortFilterModal}
    setShowSortFilterModal={modalState.setShowSortFilterModal}
    filterCategory={filterCategory}
    filterLaundryStatus={filterLaundryStatus}
    sortBy={sortBy}
    sortOrder={sortOrder}
    getSortedAndFilteredItems={getSortedAndFilteredItems}
    getCategoryDisplayName={getCategoryDisplayName}
    getLaundryStatusDisplayName={getLaundryStatusDisplayName}
    getSortDisplayName={getSortDisplayName}
    openWardrobeItemView={openWardrobeItemViewWithTracking}
    categorizeItem={categorizeItem}
    generateOutfitSuggestions={generateOutfitSuggestions}
    showLaundryAnalytics={modalState.showLaundryAnalytics}
    setShowLaundryAnalytics={modalState.setShowLaundryAnalytics}
    getLaundryStats={getLaundryStats}
    getSmartWashSuggestions={getSmartWashSuggestions}
    getItemsByLaundryStatus={getItemsByLaundryStatus}
    // Navigation
    onNavigateToBuilder={navigateToBuilder}
    // Bulk operations
    deleteBulkWardrobeItems={deleteBulkWardrobeItems}
  />
</View>

{/* Item Detail View */}
{showingItemDetail && detailViewItem && (
  <ItemDetailView
    item={detailViewItem}
    onBack={goBackToWardrobe}
    onSaveField={(field, value) => saveFieldUpdate(detailViewItem, field, value)}
    onCategoryPress={() => modalState.setCategoryDropdownVisible(true)}
    onDelete={deleteWardrobeItem}
    onNavigateToBuilder={navigateToBuilder}
    generateOutfitSuggestions={generateOutfitSuggestions}
    categorizeItem={categorizeItem}
    sharedLoading={unifiedLoading}
    editingTitle={editingTitle}
    setEditingTitle={setEditingTitle}
    editingColor={editingColor}
    setEditingColor={setEditingColor}
    editingMaterial={editingMaterial}
    setEditingMaterial={setEditingMaterial}
    editingStyle={editingStyle}
    setEditingStyle={setEditingStyle}
    editingFit={editingFit}
    setEditingFit={setEditingFit}
    editingTags={editingTags}
    setEditingTags={setEditingTags}
    tempTitle={tempTitle}
    setTempTitle={setTempTitle}
    tempColor={tempColor}
    setTempColor={setTempColor}
    tempMaterial={tempMaterial}
    setTempMaterial={setTempMaterial}
    tempStyle={tempStyle}
    setTempStyle={setTempStyle}
    tempFit={tempFit}
    setTempFit={setTempFit}
    tempTags={tempTags}
    setTempTags={setTempTags}
    newTagInput={newTagInput}
    setNewTagInput={setNewTagInput}
  />
)}

{/* Outfit Detail View */}
{showingOutfitDetail && detailViewOutfit && (
  <OutfitDetailView
    outfit={detailViewOutfit}
    savedItems={savedItems}
    onBack={goBackToOutfits}
    onToggleLove={toggleOutfitLove}
    onDownloadImage={downloadImage}
    onItemTap={(item) => {
      goBackToOutfits(); // Close outfit detail first
      openWardrobeItemView(item); // Open item detail
    }}
    onMarkAsWorn={markOutfitAsWorn}
    onDelete={handleDeleteOutfit}
    categorizeItem={categorizeItem}
  />
)}

{/* Profile Page */}
<View style={{ display: showProfilePage ? 'flex' : 'none' }}>
  <ProfilePage
    profileImage={profileImage}
    styleDNA={styleDNA}
    selectedGender={selectedGender}
    savedItems={savedItems}
    lovedOutfits={lovedOutfits}
    analyzingProfile={analyzingProfile}
    pickProfileImage={pickProfileImage}
    analyzeProfileImage={analyzeProfileImage}
    setShowGenderSelector={modalState.setShowGenderSelector}
    onUpdateStyleDNA={updateStyleDNA}
    triggerHaptic={triggerHaptic}
    onRefreshData={handleDataRefresh}
  />
</View>


{/* Outfits Page */}
<View style={{ display: showOutfitsPage ? 'flex' : 'none' }}>
  <OutfitsPage
    lovedOutfits={lovedOutfits}
    getSortedOutfits={getSortedOutfits}
    getSmartOutfitSuggestions={getSmartOutfitSuggestions}
    getOutfitWearStats={getOutfitWearStats}
    openOutfitDetailView={openOutfitDetailViewWithTracking}
    toggleOutfitLove={toggleOutfitLove}
    downloadImage={downloadImage}
    markOutfitAsWorn={markOutfitAsWorn}
    markAllOutfitsAsViewed={markAllOutfitsAsViewedWithTracking}
    navigateToBuilder={navigateToBuilder}
    deleteBulkOutfits={deleteBulkOutfits}
    savedItems={savedItems}
    categorizeItem={categorizeItem}
  />
</View>

{/* Add Item Page */}
{showAddItemPage && (
  <AddItemPage
    onCameraPress={handleAddItemCameraPress}
    onMultiItemCameraPress={handleAddItemMultiItemCameraPress}
    onPhotoLibraryPress={handleAddItemPhotoLibraryPress}
    onBulkUploadPress={handleAddItemBulkUploadPress}
    onTextEntryPress={handleAddItemTextEntryPress}
  />
)}


        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        showOutfitBuilder={showOutfitBuilder}
        showWardrobe={showWardrobe}
        showOutfitsPage={showOutfitsPage}
        showProfilePage={showProfilePage}
        showingItemDetail={showingItemDetail}
        showingOutfitDetail={showingOutfitDetail}
        navigateToBuilder={navigateToBuilder}
        navigateToWardrobe={navigateToWardrobe}
        navigateToOutfits={navigateToOutfitsWithReset}
        navigateToProfile={navigateToProfile}
        goBackToOutfits={goBackToOutfits}
        pickMultipleImages={pickMultipleImages}
        openCamera={openCamera}
        openAddItemModal={openAddItemModal}
        triggerHaptic={triggerHaptic}
        mainScrollViewRef={mainScrollViewRef}
        builderShakeValue={builderShakeValue}
        wardrobeShakeValue={wardrobeShakeValue}
        outfitsShakeValue={outfitsShakeValue}
        profileShakeValue={profileShakeValue}
        unviewedOutfitsCount={unviewedOutfitsCount}
        newWardrobeItemCount={newWardrobeItemCount}
      />
      {/* End of Profile Page */}

 

      {/* Gender Selector Modal */}
      <Modal
        visible={modalState.showGenderSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => modalState.setShowGenderSelector(false)}
      >
        <Pressable
          onPress={() => modalState.setShowGenderSelector(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.genderSelectorModal}>
            <View style={styles.genderSelectorHeader}>
              <Text style={styles.genderSelectorTitle}>
                Select Gender Identity
              </Text>
              <TouchableOpacity
                onPress={() => modalState.setShowGenderSelector(false)}
                style={styles.closeGenderButton}
              >
                <Text style={styles.closeGenderButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.genderSelectorSubtitle}>
              This helps AI generate outfits that match your preferred style
            </Text>
            
            <View style={styles.genderOptionsContainer}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedGender('male');
                  saveSelectedGender('male');
                  modalState.setShowGenderSelector(false);
                }}
                style={[
                  styles.genderOption,
                  selectedGender === 'male' && styles.genderOptionActive
                ]}
              >
                <Text style={styles.genderOptionIcon}>👨</Text>
                <Text style={[
                  styles.genderOptionText,
                  selectedGender === 'male' && styles.genderOptionTextActive
                ]}>
                  Male
                </Text>
                <Text style={styles.genderOptionDescription}>
                  Masculine styling
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectedGender('female');
                  saveSelectedGender('female');
                  modalState.setShowGenderSelector(false);
                }}
                style={[
                  styles.genderOption,
                  selectedGender === 'female' && styles.genderOptionActive
                ]}
              >
                <Text style={styles.genderOptionIcon}>👩</Text>
                <Text style={[
                  styles.genderOptionText,
                  selectedGender === 'female' && styles.genderOptionTextActive
                ]}>
                  Female
                </Text>
                <Text style={styles.genderOptionDescription}>
                  Feminine styling
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectedGender('nonbinary');
                  saveSelectedGender('nonbinary');
                  modalState.setShowGenderSelector(false);
                }}
                style={[
                  styles.genderOption,
                  selectedGender === 'nonbinary' && styles.genderOptionActive
                ]}
              >
                <Text style={styles.genderOptionIcon}>🌈</Text>
                <Text style={[
                  styles.genderOptionText,
                  selectedGender === 'nonbinary' && styles.genderOptionTextActive
                ]}>
                  Non-Binary
                </Text>
                <Text style={styles.genderOptionDescription}>
                  Gender-neutral styling
                </Text>
              </TouchableOpacity>
            </View>

            {selectedGender && (
              <View style={[
                styles.genderConfirmation,
                selectedGender === 'male' && { backgroundColor: '#E3F2FD' },
                selectedGender === 'female' && { backgroundColor: '#FCE4EC' },
                selectedGender === 'nonbinary' && { backgroundColor: '#F3E5F5' }
              ]}>
                <Text style={[
                  styles.genderConfirmationText,
                  selectedGender === 'male' && { color: '#1976D2' },
                  selectedGender === 'female' && { color: '#C2185B' },
                  selectedGender === 'nonbinary' && { color: '#7B1FA2' }
                ]}>
                  ✅ Outfits will be generated for {selectedGender === 'male' ? 'masculine' : 
                                                  selectedGender === 'female' ? 'feminine' : 'non-binary'} style
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={modalState.categoryDropdownVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => modalState.setCategoryDropdownVisible(false)}
      >
        <Pressable
          style={styles.categoryModalOverlay}
          onPress={() => modalState.setCategoryDropdownVisible(false)}
        >
          <Pressable style={styles.categoryModalContent} onPress={() => {}}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Debug: {modalState.categoryDropdownVisible ? 'Visible' : 'Hidden'}
              </Text>
              <TouchableOpacity
                onPress={() => modalState.setCategoryDropdownVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryModalScroll}>
              {AVAILABLE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={async () => {
                    await updateItemCategory(detailViewItem, category);
                    modalState.setCategoryDropdownVisible(false);
                  }}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && styles.categoryOptionSelected
                  ]}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.categoryOptionTextSelected
                  ]}>
                    {category.toUpperCase()}
                  </Text>
                  {selectedCategory === category && (
                    <Text style={styles.categoryCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>


      {/* Camera Screen */}
      {modalState.showCamera && (
        <View style={styles.fullScreenOverlay}>
          <CameraScreen
            onPhotoTaken={cameraMode === 'single' ? handleCameraPhotoDirect : handlePhotoTaken}
            onCancel={() => modalState.setShowCamera(false)}
            mode="wardrobe"
            showGrid={true}
            onMultiItemDetected={handleMultiItemDetected}
            defaultMultiItemMode={cameraMode === 'multi'}
          />
        </View>
      )}

      {/* Photo Editing Screen */}
      {modalState.showPhotoEditing && capturedPhotoUri && (
        <View style={styles.fullScreenOverlay}>
          <PhotoEditingScreen
            photoUri={capturedPhotoUri}
            onSave={handlePhotoEditingSave}
            onRetake={handlePhotoEditingRetake}
            mode="wardrobe"
            multiItemMode={detectedItemsState.length > 0}
            detectedItems={detectedItemsState}
            onMultiItemSave={handleMultiItemSave}
          />
        </View>
      )}

      {/* Text Item Entry Modal */}
      <TextItemEntryModal
        visible={modalState.showTextItemModal}
        onClose={() => modalState.setShowTextItemModal(false)}
        onSave={handleSaveTextItem}
        categories={AVAILABLE_CATEGORIES}
      />

      {/* Smart Suggestions Modal */}
      <SmartSuggestionsModal
        visible={smartSuggestions.showSuggestionsModal}
        onClose={smartSuggestions.closeSuggestionsModal}
        suggestions={smartSuggestions.suggestions}
        currentSuggestion={smartSuggestions.currentSuggestion}
        onSelectSuggestion={smartSuggestions.selectSuggestion}
        onAddToWishlist={smartSuggestions.addSuggestedItemToWishlist}
        isGenerating={smartSuggestions.isGenerating}
      />

      {/* Header Loading Bar - Simple and Non-blocking */}
      {unifiedLoading.isLoading && (
        <View style={styles.headerLoadingContainer}>
          <View style={styles.headerLoadingContent}>
            <Text style={styles.headerLoadingText}>
              {unifiedLoading.loadingConfig?.title || 'Processing...'}
            </Text>
            <Animated.View
              style={{
                transform: [{
                  rotate: headerSpinValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }}
            >
              <Text style={styles.headerLoadingSpinner}>⚙️</Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Data Migration Modal */}
      <DataMigrationModal
        visible={showMigrationModal}
        onComplete={handleMigrationComplete}
      />
      
    </SafeAreaView>
  );
};

// Export the WardrobeUploadScreen component
export default WardrobeUploadScreen;
