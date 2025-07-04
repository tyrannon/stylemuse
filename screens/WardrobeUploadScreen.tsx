import { View, Button, Image, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Pressable, TextInput, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { describeClothingItem, detectMultipleClothingItems, cropDetectedItems, analyzeSpecificClothingItem } from '../utils/openai';
import { generateOutfitImage, analyzePersonalStyle, generatePersonalizedOutfitImage, generateWeatherBasedOutfit } from '../utils/openai';
import * as Location from 'expo-location';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
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

// Components
import { SafeImage } from '../utils/SafeImage';
import { BottomNavigation } from './components/shared/BottomNavigation';
import { ItemDetailView } from './components/ItemDetailView';
import { OutfitDetailView } from './components/OutfitDetailView';
import { CategoryDropdown } from './components/CategoryDropdown';
import { BuilderPage } from './BuilderPage';
import { WardrobePage } from './WardrobePage';
import { OutfitsPage } from './OutfitsPage';
import { ProfilePage } from './ProfilePage';
import { AvatarCustomizationPage } from './AvatarCustomizationPage';
import { CameraScreen } from './CameraScreen';
import { PhotoEditingScreen } from './PhotoEditingScreen';
import { SmartSuggestionsModal } from '../components/SmartSuggestionsModal';
import { OnlineItemCard } from './components/StyleAdvice/OnlineItemCard';
import { TextItemEntryModal } from '../components/TextItemEntryModal';
import { AddItemPage } from './AddItemPage';
import { MultiItemProgressModal } from '../components/MultiItemProgressModal';
import { AIOutfitAssistant } from '../components/AIOutfitAssistant';

// Utils and Services
import { getLaundryStatusDisplay } from '../utils/laundryStatus';
import { StorageService } from '../services/StorageService';
import { PersistenceService } from '../services/PersistenceService';
import { styles } from './styles/WardrobeUploadScreen.styles';
import { 
  getItemsByColorFamily, 
  getItemsBySeason, 
  getItemsByTemperature, 
  getItemsByCoordinationPotential, 
  getColorFamilyEmoji, 
  getSeasonalEmoji 
} from '../utils/colorIntelligence';

// Types
import { StyleRecommendation } from '../types/StyleAdvice';
import { EnhancedStyleDNA } from '../types/Avatar';
import { STORAGE_KEYS } from '../constants/storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WardrobeUploadScreen = () => {
  // Use our custom hooks for data and navigation state
  const wardrobeData = useWardrobeData();
  const navigationState = useNavigationState();
  
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
    // Wishlist functions
    wishlistItems,
    removeFromWishlist,
    updateWishlistPurchaseStatus,
  } = wardrobeData;
  
  const {
    // Page states
    showOutfitBuilder,
    showWardrobe,
    showOutfitsPage,
    showProfilePage,
    showAvatarCustomization,
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
    navigateToAvatarCustomization,
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
    navigationState.setShowAvatarCustomization(false);
    navigationState.setShowAddItemPage(false);
    
    // Scroll to top after a short delay
    setTimeout(() => {
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 150);
  }, [navigationState]);

  // Use our custom hooks for refactored functionality
  const imageHandling = useImageHandling();
  const amazonRecommendations = useAmazonRecommendations();
  const modalState = useModalState();
  const outfitGeneration = useOutfitGeneration(savedItems, categorizeItem, navigateToBuilderWithScroll);
  const smartSuggestions = useSmartSuggestions();

  // Image and description states (keeping these for backward compatibility)
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Animation and UI states
  const [spinValue] = useState(new Animated.Value(0));
  const [analyzingProfile, setAnalyzingProfile] = useState(false);
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cameraMode, setCameraMode] = useState<'wardrobe' | 'profile' | 'outfit' | 'multi-item'>('wardrobe');
  const [outfitModalVisible, setOutfitModalVisible] = useState(false);
  
  // Multi-item progress tracking
  const [showMultiItemProgress, setShowMultiItemProgress] = useState(false);
  const [multiItemDetectedItems, setMultiItemDetectedItems] = useState<any[]>([]);
  const [multiItemCurrentStep, setMultiItemCurrentStep] = useState(0);
  const [multiItemLogs, setMultiItemLogs] = useState<string[]>([]);

  // Helper function to add logs to progress modal
  const addMultiItemLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setMultiItemLogs(prev => [...prev, logEntry]);
    console.log(logEntry); // Still log to console for debugging
  };
  const [outfitScale] = useState(new Animated.Value(1));
  const [outfitTranslateX] = useState(new Animated.Value(0));
  const [outfitTranslateY] = useState(new Animated.Value(0));
  const [currentScale, setCurrentScale] = useState(1);
  const [builderShakeValue] = useState(new Animated.Value(0));
  const [wardrobeShakeValue] = useState(new Animated.Value(0));

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
  
  // Color-based filtering state variables
  const [filterColorFamily, setFilterColorFamily] = useState<string>('all');
  const [filterSeason, setFilterSeason] = useState<string>('all');
  const [filterTemperature, setFilterTemperature] = useState<string>('all');
  const [filterCoordination, setFilterCoordination] = useState<string>('all');

  // Slot selection modal sorting state
  const [slotSortBy, setSlotSortBy] = useState<'recent-newest' | 'recent-oldest' | 'category' | 'name'>('recent-newest');
  const [showSlotSortOptions, setShowSlotSortOptions] = useState(false);
  const slotSortAnimationValue = useRef(new Animated.Value(0)).current;
  const [isSlotSortAnimating, setIsSlotSortAnimating] = useState(false);

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
        const storedWardrobe = await AsyncStorage.getItem(STORAGE_KEYS.WARDROBE_ITEMS);
        if (storedWardrobe) {
          const parsedWardrobe = JSON.parse(storedWardrobe);
          setSavedItems(parsedWardrobe);
          console.log(`✅ Loaded ${parsedWardrobe.length} wardrobe items`);
        }

        // Load loved outfits
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

        // Load style DNA
        const storedStyleDNA = await AsyncStorage.getItem(STORAGE_KEYS.STYLE_DNA);
        if (storedStyleDNA) {
          const parsedStyleDNA = JSON.parse(storedStyleDNA);
          setStyleDNA(parsedStyleDNA);
          console.log('✅ Loaded style DNA');
        }

        // Load selected gender
        const storedGender = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_GENDER);
        if (storedGender) {
          const parsedGender = JSON.parse(storedGender);
          setSelectedGender(parsedGender);
          console.log(`✅ Loaded selected gender: ${parsedGender}`);
        }

        // Load profile image
        const storedProfileImage = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
        if (storedProfileImage) {
          const parsedProfileImage = JSON.parse(storedProfileImage);
          setProfileImage(parsedProfileImage);
          console.log('✅ Loaded profile image');
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
      imageHandling.setLoading(true);
      startSpinAnimation(); // Start spinning animation for single image
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
        const newItems = [
          ...prev,
          {
            image: imageUri,
            title: itemTitle,
            description: itemDescription,
            tags: itemTags,
            color: itemColor,
            material: itemMaterial,
            style: itemStyle,
            fit: itemFit,
          },
        ];
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
        imageHandling.setLoading(false);
        stopSpinAnimation(); // Stop spinning animation for single image
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
      startSpinAnimation(); // Start spinning animation for bulk upload
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
      stopSpinAnimation(); // Stop spinning animation for bulk upload
      imageHandling.setBulkProgress({ current: 0, total: 0 });
      alert(`Successfully added ${result.assets.length} items to your wardrobe! 🎉`);
    }
  };

  // SIMPLE DIRECT CAMERA APPROACH - No modal, just open camera directly
  const openCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    modalState.setShowCamera(true);
  };

  // Function to open the add item page
  const openAddItemModal = () => {
    navigateToAddItem();
  };

  // Function to handle camera capture from add item page
  const handleAddItemCameraPress = async () => {
    // Go to camera screen directly
    setCameraMode('wardrobe');
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

  // Function to handle multi-item detection from add item page
  const handleAddItemMultiItemPress = async () => {
    // Navigate to camera with multi-item mode
    modalState.setShowCamera(true);
    setCameraMode('multi-item');
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
    
    // Process the edited photo through AI analysis
    await handleAutoDescribeAndSave(editedPhotoUri, false);
  };

  // Function to handle photo editing cancel/retake
  const handlePhotoEditingRetake = () => {
    modalState.setShowPhotoEditing(false);
    modalState.setShowCamera(true);
  };

  // Function to handle direct camera photo (skip editing for now)
  const handleCameraPhotoDirect = async (photoUri: string) => {
    modalState.setShowCamera(false);
    setCapturedPhotoUri(null);
    
    if (cameraMode === 'multi-item') {
      // Handle multi-item detection
      await handleMultiItemDetection(photoUri);
    } else {
      // Process single item directly through AI analysis
      await handleAutoDescribeAndSave(photoUri, false);
    }
  };

  // Function to handle multi-item detection workflow
  const handleMultiItemDetection = async (photoUri: string) => {
    try {
      // Reset progress state and show modal
      setMultiItemLogs([]);
      setMultiItemCurrentStep(0);
      setMultiItemDetectedItems([]);
      setShowMultiItemProgress(true);
      
      addMultiItemLog('🔍 Starting multi-item detection for photo...');
      addMultiItemLog('📸 Converting image to base64 for AI analysis...');

      // Convert image to base64 for AI analysis
      const base64Image = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      addMultiItemLog('🤖 Calling AI detection service...');
      setMultiItemCurrentStep(0); // Detection step

      // Call AI detection function
      const detectionResult = await detectMultipleClothingItems(base64Image);

      if (detectionResult.success && detectionResult.itemsFound > 0) {
        addMultiItemLog(`🎉 Detection complete! Found ${detectionResult.itemsFound} items:`);
        detectionResult.items.forEach((item: any, index: number) => {
          addMultiItemLog(`  ${index + 1}. ${item.itemType}: ${item.description}`);
        });
        
        setMultiItemDetectedItems(detectionResult.items);
        setMultiItemCurrentStep(1); // Move to first item analysis
        
        // Auto-start processing
        setTimeout(() => {
          processDetectedItems(detectionResult.items, photoUri);
        }, 1500);
      } else {
        addMultiItemLog('❌ No items detected or detection failed');
        addMultiItemLog(`Error: ${detectionResult.message}`);
        
        setTimeout(() => {
          setShowMultiItemProgress(false);
          Alert.alert(
            '😔 No Items Detected',
            detectionResult.message || 'Could not detect individual clothing items in this photo. Try taking a clearer photo with better lighting, or use the regular camera mode for single items.',
            [
              {
                text: 'Try Again',
                style: 'default',
                onPress: () => {
                  setCameraMode('multi-item');
                  modalState.setShowCamera(true);
                }
              },
              {
                text: 'Use Single Mode',
                style: 'default',
                onPress: () => handleAutoDescribeAndSave(photoUri, false)
              }
            ]
          );
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Multi-item detection error:', error);
      Alert.alert(
        '😔 Detection Failed',
        'Something went wrong during item detection. You can try again or use single item mode.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setCameraMode('multi-item');
              modalState.setShowCamera(true);
            }
          },
          {
            text: 'Use Single Mode',
            onPress: () => handleAutoDescribeAndSave(photoUri, false)
          }
        ]
      );
    }
  };

  // Function to process each detected item individually
  const processDetectedItems = async (detectedItems: any[], originalPhotoUri: string) => {
    try {
      addMultiItemLog(`🔄 Starting processing of ${detectedItems.length} detected items...`);
      
      let successCount = 0;
      let failureCount = 0;
      const processedItems: any[] = [];

      for (let i = 0; i < detectedItems.length; i++) {
        const item = detectedItems[i];
        setMultiItemCurrentStep(i + 1); // Update progress step
        addMultiItemLog(`📝 Processing item ${i + 1}/${detectedItems.length}: ${item.itemType}`);

        try {
          // Convert image to base64 for targeted AI analysis
          const base64Image = await FileSystem.readAsStringAsync(originalPhotoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          addMultiItemLog(`🎯 Running targeted analysis for ${item.itemType}...`);
          addMultiItemLog(`📐 Using bounding box: (${item.boundingBox?.top_left?.[0]}, ${item.boundingBox?.top_left?.[1]}) to (${item.boundingBox?.bottom_right?.[0]}, ${item.boundingBox?.bottom_right?.[1]})`);
          
          // Use the new targeted analysis function with bounding box context
          const analysisResult = await analyzeSpecificClothingItem(base64Image, item);
          const parsedResult = JSON.parse(analysisResult);

          // Create enhanced item data with detection context and bounding box metadata
          const enhancedItem = {
            ...parsedResult,
            title: `${parsedResult.title} (Item ${i + 1})`,
            description: `${parsedResult.description} [Detected via Multi-Item AI: ${item.description}]`,
            image: originalPhotoUri,
            category: categorizeItem(parsedResult),
            tags: [...(parsedResult.tags || []), 'multi-item-detected', `detected-as-${item.itemType}`],
            multiItemData: {
              originalImage: originalPhotoUri,
              boundingBox: item.boundingBox,
              detectionId: item.id,
              confidence: item.confidence,
              detectedWithItems: detectedItems.map(detectedItem => `item-${detectedItem.id}`),
              itemType: item.itemType,
              isFromMultiDetection: true,
            },
            detectionInfo: {
              originalDetection: item,
              detectionConfidence: item.confidence,
              detectionPosition: item.position,
              multiItemBatch: true,
              batchSize: detectedItems.length,
              itemIndex: i + 1
            }
          };

          // Add to processed items array instead of saving immediately
          processedItems.push(enhancedItem);
          successCount++;
          addMultiItemLog(`✅ Successfully analyzed ${item.itemType}: ${parsedResult.title}`);

        } catch (itemError) {
          addMultiItemLog(`❌ Failed to process ${item.itemType}: ${itemError.message}`);
          failureCount++;
        }
      }

      // Now save all processed items at once
      setMultiItemCurrentStep(detectedItems.length + 1); // Move to saving step
      addMultiItemLog(`💾 Saving ${processedItems.length} processed items to wardrobe...`);
      
      if (processedItems.length > 0) {
        const updatedItems = [...savedItems, ...processedItems];
        setSavedItems(updatedItems);
        await AsyncStorage.setItem('stylemuse_wardrobe_items', JSON.stringify(updatedItems));
        addMultiItemLog(`✅ Successfully saved ${processedItems.length} items to wardrobe!`);
      }

      // Complete the process
      setMultiItemCurrentStep(detectedItems.length + 2); // Complete
      addMultiItemLog(`🎉 Multi-item processing complete!`);
      addMultiItemLog(`📊 Results: ${successCount} success, ${failureCount} failed`);
      
      // Show final results after a delay
      setTimeout(async () => {
        setShowMultiItemProgress(false);
        
        if (successCount > 0) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            '🎉 Multi-Item Success!',
            `Successfully added ${successCount} items to your wardrobe!${failureCount > 0 ? ` (${failureCount} items failed to process)` : ''}`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          Alert.alert(
            '😔 Processing Failed',
            'Unable to process any of the detected items. Please try individual photos or check your image quality.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      Alert.alert(
        '😔 Processing Error',
        'Something went wrong while processing the detected items.',
        [{ text: 'OK', style: 'default' }]
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
    startSpinAnimation();
    
    try {
      // Set the selected items for outfit display
      outfitGeneration.setSelectedItemsForOutfit(equippedItems.map(item => item.image));
      
      // Get weather data if we have it, otherwise use regular generation
      const currentWeather = weatherData || await getLocationAndWeather();
      
      // Generate weather-appropriate outfit if we have weather data
      const generatedImageUrl = currentWeather ? 
        await generateWeatherBasedOutfit(equippedItems, styleDNA, currentWeather, selectedGender) :
        await generatePersonalizedOutfitImage(equippedItems, styleDNA, selectedGender);
      
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
            weatherData: weatherData || null,
            styleDNA: styleDNA || null,
            selectedItems: equippedItems.map(item => item.image),
            gender: selectedGender || null,
            createdAt: new Date(),
            isLoved: false, // Don't automatically love generated outfits
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
          
          const message = currentWeather ? 
            `Perfect for ${currentWeather.temperature}°F and ${currentWeather.description}! 🌤️` :
            (styleDNA ? "AI-generated outfit created on YOUR style! 🎨✨" : "AI-generated outfit created! 📸");
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
      stopSpinAnimation();
    }
  };

  // Function to analyze profile image and extract style DNA
  const analyzeProfileImage = async (imageUri: string) => {
    setAnalyzingProfile(true);
    
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

  // Function to fetch weather data based on location
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      // Use app config for API key
      const API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey;
      
      if (!API_KEY) {
        throw new Error('Weather API key not found in app config');
      }
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      return {
        temperature: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        main: data.weather[0].main,
        wind_speed: Math.round(data.wind.speed),
        city: data.name
      };
    } catch (error) {
      console.error('❌ Weather fetch error:', error);
      throw error;
    }
  };

  // Function to get location and weather data
  const getLocationAndWeather = async () => {
    setLoadingWeather(true);
    
    try {
      // Get location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location is required for weather-based outfits!');
        setLoadingWeather(false);
        return null;
      }

      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      setLocation({ latitude, longitude });

      // Get weather data
      const weather = await fetchWeatherData(latitude, longitude);
      setWeatherData(weather);
      
      return weather;
    } catch (error) {
      console.error('❌ Location/Weather error:', error);
      alert('Failed to get location/weather data');
      return null;
    } finally {
      setLoadingWeather(false);
    }
  };

  // Enhanced function to select weather-appropriate items with context awareness
  // This function considers location context (indoor/outdoor) and improved weather logic
  const selectWeatherAppropriateItems = (items: any[], weather: any, location: string = 'general', occasion: string = 'casual') => {
    const temp = weather.temperature;
    const feelsLike = weather.feels_like || temp; // Use feels_like if available
    const isRaining = weather.description.includes('rain');
    const isSnowing = weather.description.includes('snow');
    
    // Determine if location is primarily indoor or outdoor
    const indoorLocations = ['office', 'restaurant', 'home', 'club'];
    const outdoorLocations = ['outdoors', 'city', 'beach'];
    const isIndoorContext = indoorLocations.some(loc => location.includes(loc));
    const isOutdoorContext = outdoorLocations.some(loc => location.includes(loc));
    
    // Categorize items by type
    const categorizedItems = {
      tops: [],
      bottoms: [],
      outerwear: [],
      shoes: [],
      accessories: []
    };
    
    items.forEach(item => {
      const tags = item.tags || [];
      const style = item.style?.toLowerCase() || '';
      const title = item.title?.toLowerCase() || '';
      
      // Categorize each item
      if (tags.some(tag => ['top', 't-shirt', 'shirt', 'blouse', 'tank', 'crop'].includes(tag.toLowerCase())) ||
          style.includes('shirt') || style.includes('top') || style.includes('blouse')) {
        categorizedItems.tops.push(item);
      } else if (tags.some(tag => ['bottom', 'pants', 'jeans', 'shorts', 'skirt', 'dress'].includes(tag.toLowerCase())) ||
                 style.includes('jeans') || style.includes('pants') || style.includes('shorts') || 
                 style.includes('skirt') || style.includes('dress')) {
        categorizedItems.bottoms.push(item);
      } else if (tags.some(tag => ['jacket', 'coat', 'blazer', 'cardigan', 'sweater'].includes(tag.toLowerCase())) ||
                 style.includes('jacket') || style.includes('coat') || style.includes('blazer')) {
        categorizedItems.outerwear.push(item);
      } else if (tags.some(tag => ['shoes', 'boots', 'sandals', 'sneakers'].includes(tag.toLowerCase())) ||
                 style.includes('shoes') || style.includes('boots')) {
        categorizedItems.shoes.push(item);
      } else {
        categorizedItems.accessories.push(item);
      }
    });
    
    // Enhanced weather filtering with improved temperature thresholds
    const filterByWeather = (categoryItems) => {
      return categoryItems.filter(item => {
        const tags = item.tags || [];
        const material = item.material?.toLowerCase() || '';
        const style = item.style?.toLowerCase() || '';
        
        // Use feels_like temperature for more accurate comfort assessment
        const effectiveTemp = feelsLike;
        
        // Very cold weather (under 40°F) - Heavy winter gear
        if (effectiveTemp < 40) {
          return tags.some(tag => 
            ['winter', 'heavy', 'wool', 'down', 'thermal', 'long-sleeve', 'pants', 'jeans', 'boots', 'coat', 'jacket', 'sweater', 'scarf', 'gloves'].includes(tag.toLowerCase())
          ) || ['wool', 'fleece', 'down', 'cashmere', 'denim', 'thermal'].includes(material) ||
             style.includes('winter') || style.includes('heavy') || style.includes('warm');
        }
        
        // Cold weather (40-55°F) - Layers recommended
        if (effectiveTemp >= 40 && effectiveTemp < 55) {
          return tags.some(tag => 
            ['warm', 'layer', 'long-sleeve', 'pants', 'jeans', 'boots', 'cardigan', 'sweater', 'light-jacket'].includes(tag.toLowerCase())
          ) || ['wool', 'fleece', 'cotton', 'denim'].includes(material) ||
             style.includes('long') || style.includes('jeans') || style.includes('pants') || style.includes('layer');
        }
        
        // Cool weather (55-68°F) - Light layers, versatile pieces
        if (effectiveTemp >= 55 && effectiveTemp < 68) {
          return tags.some(tag => 
            ['light', 'layer', 'versatile', 'jeans', 'pants', 'long-sleeve', 'short-sleeve', 'light-cardigan'].includes(tag.toLowerCase())
          ) || style.includes('jeans') || style.includes('pants') || style.includes('layer') || 
             (!style.includes('shorts') && !style.includes('tank'));
        }
        
        // Comfortable weather (68-78°F) - Most versatile range
        if (effectiveTemp >= 68 && effectiveTemp < 78) {
          return tags.some(tag => 
            ['comfortable', 'versatile', 'light', 'short-sleeve', 'long-sleeve', 'jeans', 'pants', 'shorts', 'skirt', 'dress'].includes(tag.toLowerCase())
          ) || !style.includes('heavy') && !style.includes('winter');
        }
        
        // Warm weather (78-85°F) - Light, breathable fabrics
        if (effectiveTemp >= 78 && effectiveTemp < 85) {
          return tags.some(tag => 
            ['summer', 'light', 'breathable', 'short', 'shorts', 'skirt', 'dress', 't-shirt', 'tank', 'sandals'].includes(tag.toLowerCase())
          ) || ['cotton', 'linen', 'silk', 'bamboo'].includes(material) ||
             style.includes('short') || style.includes('light') || style.includes('summer');
        }
        
        // Hot weather (85°F+) - Minimal, ultra-light clothing
        if (effectiveTemp >= 85) {
          return tags.some(tag => 
            ['hot-weather', 'ultra-light', 'minimal', 'shorts', 'tank', 'sundress', 'sandals', 'flip-flops'].includes(tag.toLowerCase())
          ) || ['linen', 'silk', 'cotton', 'bamboo'].includes(material) ||
             style.includes('tank') || style.includes('shorts') || style.includes('minimal');
        }
        
        return true; // Include if no specific weather rules apply
      });
    };
    
    // Get weather-appropriate items from each category
    const weatherTops = filterByWeather(categorizedItems.tops);
    const weatherBottoms = filterByWeather(categorizedItems.bottoms);
    const weatherOuterwear = filterByWeather(categorizedItems.outerwear);
    const weatherShoes = filterByWeather(categorizedItems.shoes);
    
    // Build a balanced outfit
    const selectedItems = [];
    
    // Always pick at least 1 top
    if (weatherTops.length > 0) {
      selectedItems.push(weatherTops[0]);
    } else if (categorizedItems.tops.length > 0) {
      // Fallback to any top if no weather-appropriate tops
      selectedItems.push(categorizedItems.tops[0]);
    }
    
    // Always pick at least 1 bottom (unless it's a dress)
    if (weatherBottoms.length > 0) {
      const bottom = weatherBottoms[0];
      // Check if the selected top is a dress
      const selectedTop = selectedItems[0];
      const isTopADress = selectedTop && (
        selectedTop.style?.toLowerCase().includes('dress') ||
        selectedTop.tags?.some(tag => tag.toLowerCase() === 'dress')
      );
      
      if (!isTopADress) {
        selectedItems.push(bottom);
      }
    } else if (categorizedItems.bottoms.length > 0) {
      // Fallback to any bottom
      const selectedTop = selectedItems[0];
      const isTopADress = selectedTop && (
        selectedTop.style?.toLowerCase().includes('dress') ||
        selectedTop.tags?.some(tag => tag.toLowerCase() === 'dress')
      );
      
      if (!isTopADress) {
        selectedItems.push(categorizedItems.bottoms[0]);
      }
    }
    
    // Context-aware outerwear logic - NO mandatory jackets for indoor occasions!
    const effectiveTemp = feelsLike; // Define effectiveTemp for this context
    
    const shouldAddOuterwear = () => {
      // For indoor contexts, only add outerwear if it's very cold or if it's part of the style
      if (isIndoorContext) {
        // Indoor spaces are typically climate controlled
        // Only add outerwear for style (blazers, cardigans) or if extremely cold outside
        if (effectiveTemp < 45 && occasion === 'work') {
          return true; // Professional blazer for very cold commute to work
        }
        if (effectiveTemp < 35) {
          return true; // Extremely cold, might need layer even indoors
        }
        // For restaurants, clubs, home - no outerwear needed regardless of outside temp
        return false;
      }
      
      // For outdoor contexts, consider weather more seriously
      if (isOutdoorContext) {
        if (effectiveTemp < 65) return true; // Outdoor activities need warmth
        if (isRaining || isSnowing) return true; // Weather protection
        return false;
      }
      
      // For general/mixed contexts, use moderate thresholds
      if (effectiveTemp < 55) return true; // Cooler weather
      if (isRaining || isSnowing) return true; // Weather protection
      
      return false;
    };

    // Apply the context-aware outerwear logic
    if (shouldAddOuterwear() && weatherOuterwear.length > 0) {
      selectedItems.push(weatherOuterwear[0]);
      console.log(`🧥 Added outerwear for ${isIndoorContext ? 'indoor' : isOutdoorContext ? 'outdoor' : 'general'} context at ${effectiveTemp}°F`);
    } else if (selectedItems.length < 3 && categorizedItems.outerwear.length > 0 && !isIndoorContext) {
      // Only add optional outerwear for non-indoor contexts
      selectedItems.push(categorizedItems.outerwear[0]);
      console.log(`👔 Added optional outerwear for non-indoor context`);
    } else {
      console.log(`🚫 No outerwear needed - ${isIndoorContext ? 'indoor' : isOutdoorContext ? 'outdoor' : 'general'} context at ${effectiveTemp}°F`);
    }
    
    // Add shoes if available and slots remain
    if (selectedItems.length < 4 && weatherShoes.length > 0) {
      selectedItems.push(weatherShoes[0]);
    } else if (selectedItems.length < 4 && categorizedItems.shoes.length > 0) {
      selectedItems.push(categorizedItems.shoes[0]);
    }
    
    // Fill remaining slots with weather-appropriate accessories or any remaining items
    while (selectedItems.length < 4 && selectedItems.length < items.length) {
      const remainingItems = items.filter(item => 
        !selectedItems.some(selected => selected.image === item.image)
      );
      
      if (remainingItems.length === 0) break;
      
      // Prefer weather-appropriate items
      const weatherAppropriate = filterByWeather(remainingItems);
      if (weatherAppropriate.length > 0) {
        selectedItems.push(weatherAppropriate[0]);
      } else {
        selectedItems.push(remainingItems[0]);
      }
    }
    
    return selectedItems.map(item => item.image);
  };

  // Function to start the spinning animation
  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Function to stop the spinning animation
  const stopSpinAnimation = () => {
    spinValue.stopAnimation();
    spinValue.setValue(0);
  };

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
  const getItemsByCategory = (category: string) => {
    return savedItems.filter(item => {
      const itemCategory = categorizeItem(item);
      return itemCategory === category;
    });
  };

  // Function to get sorted slot items
  const getSortedSlotItems = (category: string) => {
    let categoryItems = getItemsByCategory(category);
    
    switch (slotSortBy) {
      case 'recent-newest':
        // Since we don't have timestamps, use array order (newest items are typically added last)
        categoryItems = [...categoryItems].reverse();
        break;
      case 'recent-oldest':
        // Original array order (oldest first)
        categoryItems = [...categoryItems];
        break;
      case 'category':
        categoryItems.sort((a, b) => categorizeItem(a).localeCompare(categorizeItem(b)));
        break;
      case 'name':
        categoryItems.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
        break;
    }
    
    return categoryItems;
  };

  // Function to get slot sort display name
  const getSlotSortDisplayName = (sortType: string) => {
    const displayNames: { [key: string]: string } = {
      'recent-newest': 'Recently Added (Newest First)',
      'recent-oldest': 'Recently Added (Oldest First)',
      'category': 'Category',
      'name': 'Name'
    };
    return displayNames[sortType] || sortType;
  };

  // Function to toggle slot sort options with animation
  const toggleSlotSortOptions = () => {
    if (isSlotSortAnimating) return; // Prevent rapid tapping
    
    setIsSlotSortAnimating(true);
    const toValue = showSlotSortOptions ? 0 : 1;
    
    Animated.timing(slotSortAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsSlotSortAnimating(false);
    });
    
    setShowSlotSortOptions(!showSlotSortOptions);
  };

  // Function to handle slot sort selection
  const handleSlotSortSelection = (sortType: 'recent-newest' | 'recent-oldest' | 'category' | 'name') => {
    if (isSlotSortAnimating) return; // Prevent selection during animation
    
    setSlotSortBy(sortType);
    
    // Close sort options with animation
    setTimeout(() => {
      toggleSlotSortOptions();
    }, 150); // Small delay to show selection feedback
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
      weatherData: weatherData || null,
      styleDNA: styleDNA || null,
      selectedItems: equippedItems.map(item => item.image),
      gender: selectedGender || null,
      createdAt: new Date(),
      isLoved: false, // Don't automatically love when saving
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
    
    // Apply color family filter
    if (filterColorFamily !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.colorIntelligence?.colorFamily?.toLowerCase() === filterColorFamily.toLowerCase()
      );
    }
    
    // Apply seasonal filter
    if (filterSeason !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.colorIntelligence?.seasonalMapping?.toLowerCase() === filterSeason.toLowerCase()
      );
    }
    
    // Apply temperature filter
    if (filterTemperature !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.colorIntelligence?.colorTemperature?.toLowerCase().includes(filterTemperature.toLowerCase())
      );
    }
    
    // Apply coordination potential filter
    if (filterCoordination !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.colorIntelligence?.coordinationPotential?.toLowerCase().includes(filterCoordination.toLowerCase())
      );
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

  // Color intelligence helper functions
  const getUniqueColorFamilies = () => {
    const colorFamilies = savedItems
      .map(item => item.colorIntelligence?.colorFamily)
      .filter(Boolean);
    return ['all', ...Array.from(new Set(colorFamilies))];
  };

  const getUniqueSeasons = () => {
    const seasons = savedItems
      .map(item => item.colorIntelligence?.seasonalMapping)
      .filter(Boolean);
    return ['all', ...Array.from(new Set(seasons))];
  };

  const getUniqueTemperatures = () => {
    const temperatures = savedItems
      .map(item => item.colorIntelligence?.colorTemperature)
      .filter(Boolean);
    return ['all', ...Array.from(new Set(temperatures))];
  };

  const getUniqueCoordinations = () => {
    const coordinations = savedItems
      .map(item => item.colorIntelligence?.coordinationPotential)
      .filter(Boolean);
    return ['all', ...Array.from(new Set(coordinations))];
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

  // Color intelligence display name functions
  const getColorFamilyDisplayName = (colorFamily: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Colors',
      'reds': `${getColorFamilyEmoji('reds')} Reds`,
      'blues': `${getColorFamilyEmoji('blues')} Blues`,
      'greens': `${getColorFamilyEmoji('greens')} Greens`,
      'neutrals': `${getColorFamilyEmoji('neutrals')} Neutrals`,
      'pastels': `${getColorFamilyEmoji('pastels')} Pastels`,
      'earth': `${getColorFamilyEmoji('earth')} Earth Tones`,
      'jewel': `${getColorFamilyEmoji('jewel')} Jewel Tones`,
    };
    return displayNames[colorFamily] || `${getColorFamilyEmoji(colorFamily)} ${colorFamily}`;
  };

  const getSeasonDisplayName = (season: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Seasons',
      'spring': `${getSeasonalEmoji('spring')} Spring`,
      'summer': `${getSeasonalEmoji('summer')} Summer`,
      'autumn': `${getSeasonalEmoji('autumn')} Autumn`,
      'winter': `${getSeasonalEmoji('winter')} Winter`,
      'year-round': `${getSeasonalEmoji('year-round')} Year-Round`,
    };
    return displayNames[season] || `${getSeasonalEmoji(season)} ${season}`;
  };

  const getTemperatureDisplayName = (temperature: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Temperatures',
      'warm-toned': '🔥 Warm Tones',
      'cool-toned': '❄️ Cool Tones',
      'neutral-temperature': '🌡️ Neutral',
    };
    return displayNames[temperature] || `🌡️ ${temperature}`;
  };

  const getCoordinationDisplayName = (coordination: string) => {
    const displayNames: { [key: string]: string } = {
      'all': 'All Types',
      'neutral base': '🤍 Neutral Base',
      'statement piece': '✨ Statement Piece',
      'monochromatic friendly': '🎨 Mono-Friendly',
      'accent piece': '💫 Accent Piece',
    };
    return displayNames[coordination] || `🎯 ${coordination}`;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <ScrollView 
          ref={mainScrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>

{/* App Title */}
<View style={{ marginBottom: 20, alignItems: 'center' }}>
  <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 5, color: '#333' }}>
    StyleMuse
  </Text>
  <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
    AI-Powered Virtual Closet ✨
  </Text>
</View>

{/* Progress indicator during bulk upload */}
{imageHandling.bulkUploading && (
  <View style={{ marginTop: 20, alignItems: 'center', padding: 20 }}>
    {/* Spinning Icon */}
    <Animated.View
      style={{
        transform: [{
          rotate: spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        }]
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 15 }}>📚</Text>
    </Animated.View>
    
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#007AFF' }}>
      Processing images... ✨
    </Text>
    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginBottom: 15 }}>
      {imageHandling.bulkProgress.current} of {imageHandling.bulkProgress.total}
    </Text>
    <View style={{
      width: 250,
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <View style={{
        width: `${(imageHandling.bulkProgress.current / imageHandling.bulkProgress.total) * 100}%`,
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
      }} />
    </View>
    <Text style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
      AI is analyzing each item and adding to your wardrobe
    </Text>
  </View>
)}

{/* Style DNA Analysis Progress */}
{analyzingProfile && (
  <View style={{ marginBottom: 20, alignItems: 'center', padding: 15, backgroundColor: '#f0f8f0', borderRadius: 12, marginHorizontal: 20 }}>
    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#4CAF50' }}>
      Analyzing Style DNA... 🧬
    </Text>
    <View style={{
      width: 250,
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <Animated.View style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
        transform: [{
          translateX: spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-250, 250]
          })
        }]
      }} />
    </View>
    <Text style={{ fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' }}>
      AI is analyzing your style preferences and appearance
    </Text>
  </View>
)}

{/* Spinning animation and loading text for outfit generation */}
{outfitGeneration.generatingOutfit && (
  <View style={{ marginTop: 20, alignItems: 'center', padding: 20 }}>
    {/* Spinning Icon */}
    <Animated.View
      style={{
        transform: [{
          rotate: spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        }]
      }}
    >
      <Text style={{ fontSize: 40 }}>✨</Text>
    </Animated.View>
    
    {/* Loading Text */}
    <Text style={{ 
      fontSize: 18, 
      fontWeight: 'bold', 
      marginTop: 10,
      color: '#007AFF' 
    }}>
      Creating Your Outfit...
    </Text>
    
    {/* Sub-text */}
    <Text style={{ 
      fontSize: 14, 
      color: '#666',
      marginTop: 5,
      textAlign: 'center' 
    }}>
      AI is designing the perfect look ✨
    </Text>
    
    {/* Progress dots animation */}
    <View style={{ flexDirection: 'row', marginTop: 15 }}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#007AFF',
            marginHorizontal: 3,
            opacity: spinValue.interpolate({
              inputRange: [0, 0.33, 0.66, 1],
              outputRange: index === 0 ? [1, 0.3, 0.3, 1] : 
                         index === 1 ? [0.3, 1, 0.3, 0.3] : 
                                      [0.3, 0.3, 1, 0.3]
            })
          }}
        />
      ))}
    </View>
    
    {/* Cancel button */}
    <TouchableOpacity
      onPress={() => {
        outfitGeneration.setGeneratingOutfit(false);
        stopSpinAnimation();
        outfitGeneration.setIsSelectionMode(true);
      }}
      style={{
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc'
      }}
    >
      <Text style={{ color: '#666' }}>Cancel</Text>
    </TouchableOpacity>
  </View>
)}





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
            <View style={styles.outfitModalContent}>
              {/* Header */}
              <View style={styles.outfitModalHeader}>
                <Text style={styles.outfitModalTitle}>
                  {weatherData && styleDNA ? "Your Personalized Weather Outfit! 🧬🌤️" : 
                   weatherData ? "Perfect Weather Outfit! 🌤️" :
                   styleDNA ? "Your Personalized AI Outfit! 🧬✨" : "Your AI-Generated Outfit"}
                </Text>
                
                {/* Weather info if available */}
                {weatherData && (
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherText}>
                      🌡️ {weatherData.temperature}°F • {weatherData.description}
                    </Text>
                  </View>
                )}
                
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

              {/* Action Buttons */}
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
            </View>
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
            <Text style={styles.slotSelectionTitle}>
              Select {modalState.selectedSlot?.toUpperCase()} Item
            </Text>
            <Text style={styles.slotSelectionSubtitle}>
              Showing {getSortedSlotItems(modalState.selectedSlot || '').length} {modalState.selectedSlot} items
            </Text>
            
            {/* Sorting Controls */}
            <View style={styles.slotSelectionHeader}>
              <Text style={styles.slotSelectionSortLabel}>
                📊 {getSlotSortDisplayName(slotSortBy)}
              </Text>
              <TouchableOpacity
                onPress={toggleSlotSortOptions}
                style={[
                  styles.slotSortButton,
                  showSlotSortOptions && styles.slotSortButtonActive
                ]}
                disabled={isSlotSortAnimating}
              >
                <Animated.View style={{
                  transform: [{
                    rotate: slotSortAnimationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg']
                    })
                  }]
                }}>
                  <Text style={[styles.slotSortButtonText, showSlotSortOptions && styles.slotSortButtonTextActive]}>🔍</Text>
                </Animated.View>
                <Text style={[styles.slotSortButtonText, showSlotSortOptions && styles.slotSortButtonTextActive]}>Sort</Text>
              </TouchableOpacity>
            </View>
            
            {/* Slot Sort Options */}
            {showSlotSortOptions && (
              <Animated.View 
                style={[
                  styles.slotSortOptionsContainer,
                  {
                    opacity: slotSortAnimationValue,
                    transform: [{
                      scaleY: slotSortAnimationValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.slotSortOptionsHeader}>
                  <Text style={styles.slotSortOptionsTitle}>Sort by:</Text>
                </View>
                
                <View style={styles.slotSortOptionsList}>
                  {[
                    { key: 'recent-newest', icon: '🕐', label: 'Recently Added (Newest First)' },
                    { key: 'recent-oldest', icon: '🕑', label: 'Recently Added (Oldest First)' },
                    { key: 'category', icon: '📂', label: 'Category' },
                    { key: 'name', icon: '🔤', label: 'Name' }
                  ].map(({ key, icon, label }) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleSlotSortSelection(key as any)}
                      style={[
                        styles.slotSortOption,
                        slotSortBy === key && styles.slotSortOptionActive
                      ]}
                      disabled={isSlotSortAnimating}
                    >
                      <View style={styles.slotSortOptionContent}>
                        <Text style={styles.slotSortOptionIcon}>{icon}</Text>
                        <Text style={[
                          styles.slotSortOptionText,
                          slotSortBy === key && styles.slotSortOptionTextActive
                        ]}>
                          {label}
                        </Text>
                      </View>
                      {slotSortBy === key && (
                        <Animated.View style={{
                          transform: [{
                            scale: slotSortAnimationValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.5, 1]
                            })
                          }]
                        }}>
                          <Text style={styles.slotSortOptionCheck}>✓</Text>
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}
            
            <ScrollView style={styles.slotSelectionScroll}>
              {getSortedSlotItems(modalState.selectedSlot || '').map((item, index) => (
                <TouchableOpacity
                  key={index}
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
              
              {getSortedSlotItems(modalState.selectedSlot || '').length === 0 && (
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
                {/* Weather info if available */}
                {lovedOutfits[currentLovedOutfitIndex].weatherData && (
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherText}>
                      🌡️ {lovedOutfits[currentLovedOutfitIndex].weatherData.temperature}°F • {lovedOutfits[currentLovedOutfitIndex].weatherData.description}
                    </Text>
                  </View>
                )}

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

              {/* Filter by Color Family */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Color Family:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueColorFamilies().map((colorFamily) => (
                    <TouchableOpacity
                      key={colorFamily}
                      onPress={() => setFilterColorFamily(colorFamily)}
                      style={[
                        styles.filterOptionButton,
                        filterColorFamily === colorFamily && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterColorFamily === colorFamily && styles.filterOptionButtonTextActive
                      ]}>
                        {getColorFamilyDisplayName(colorFamily)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter by Season */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Season:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueSeasons().map((season) => (
                    <TouchableOpacity
                      key={season}
                      onPress={() => setFilterSeason(season)}
                      style={[
                        styles.filterOptionButton,
                        filterSeason === season && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterSeason === season && styles.filterOptionButtonTextActive
                      ]}>
                        {getSeasonDisplayName(season)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter by Temperature */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Temperature:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueTemperatures().map((temperature) => (
                    <TouchableOpacity
                      key={temperature}
                      onPress={() => setFilterTemperature(temperature)}
                      style={[
                        styles.filterOptionButton,
                        filterTemperature === temperature && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterTemperature === temperature && styles.filterOptionButtonTextActive
                      ]}>
                        {getTemperatureDisplayName(temperature)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Filter by Coordination */}
              <View style={styles.filterSection}>
                <Text style={styles.sortSectionTitle}>Filter by Coordination:</Text>
                <View style={styles.filterOptionsContainer}>
                  {getUniqueCoordinations().map((coordination) => (
                    <TouchableOpacity
                      key={coordination}
                      onPress={() => setFilterCoordination(coordination)}
                      style={[
                        styles.filterOptionButton,
                        filterCoordination === coordination && styles.filterOptionButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptionButtonText,
                        filterCoordination === coordination && styles.filterOptionButtonTextActive
                      ]}>
                        {getCoordinationDisplayName(coordination)}
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
                    {filterColorFamily !== 'all' && ((filterCategory !== 'all' || filterLaundryStatus !== 'all') ? ' • ' : '')}
                    {filterColorFamily !== 'all' && `Color: ${getColorFamilyDisplayName(filterColorFamily)}`}
                    {filterSeason !== 'all' && ((filterCategory !== 'all' || filterLaundryStatus !== 'all' || filterColorFamily !== 'all') ? ' • ' : '')}
                    {filterSeason !== 'all' && `Season: ${getSeasonDisplayName(filterSeason)}`}
                    {filterTemperature !== 'all' && ((filterCategory !== 'all' || filterLaundryStatus !== 'all' || filterColorFamily !== 'all' || filterSeason !== 'all') ? ' • ' : '')}
                    {filterTemperature !== 'all' && `Temp: ${getTemperatureDisplayName(filterTemperature)}`}
                    {filterCoordination !== 'all' && ((filterCategory !== 'all' || filterLaundryStatus !== 'all' || filterColorFamily !== 'all' || filterSeason !== 'all' || filterTemperature !== 'all') ? ' • ' : '')}
                    {filterCoordination !== 'all' && `Coord: ${getCoordinationDisplayName(filterCoordination)}`}
                    {(filterCategory !== 'all' || filterLaundryStatus !== 'all' || filterColorFamily !== 'all' || filterSeason !== 'all' || filterTemperature !== 'all' || filterCoordination !== 'all') && sortBy !== 'recent' && ' • '}
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
                  setFilterColorFamily('all');
                  setFilterSeason('all');
                  setFilterTemperature('all');
                  setFilterCoordination('all');
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


        











{/* Spinning animation and loading text for single image AI analysis */}
{imageHandling.loading && (
  <View style={{ marginTop: 20, alignItems: 'center', padding: 20 }}>
    {/* Spinning Icon */}
    <Animated.View
      style={{
        transform: [{
          rotate: spinValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        }]
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 15 }}>🤖</Text>
    </Animated.View>
    
    {/* Loading Text */}
    <Text style={{
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007AFF',
      textAlign: 'center',
      marginBottom: 5
    }}>
      Analyzing with AI...
    </Text>
    <Text style={{
      fontSize: 14,
      color: '#666',
      textAlign: 'center'
    }}>
      AI is identifying colors, materials, and style
    </Text>
  </View>
)}







{/* Outfit Builder - Always Show */}
{showOutfitBuilder && (
    <View style={{ marginTop: 20, position: 'relative' }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
    🎮 Outfit Builder
  </Text>
  
  {/* AI Outfit Assistant - Unified Smart Suggestions */}
  <View style={{ marginBottom: 20 }}>
    <AIOutfitAssistant
      userProfile={{
        gender: selectedGender,
        stylePreference: 'versatile',
      }}
      styleDNA={styleDNA}
      context="builder"
      size="large"
      onOutfitGenerated={(outfit) => {
        console.log('✅ AI Outfit Assistant generated outfit:', outfit);
        
        // Fill the gear slots with the AI-generated outfit
        if (outfit && outfit.items) {
          const updatedSlots = { ...outfitGeneration.gearSlots };
          
          outfit.items.forEach((item: any) => {
            let slotKey = item.category;
            
            // Map AI categories to gear slot keys
            if (slotKey === 'outerwear') slotKey = 'jacket';
            
            if (['top', 'bottom', 'shoes', 'jacket', 'hat', 'accessories'].includes(slotKey)) {
              // For existing wardrobe items, use their image
              if (item.isFromWardrobe && !item.isPlaceholder) {
                // Try exact match first
                let wardrobeItem = savedItems.find(w => w.title === item.title);
                
                // If exact match fails, try fuzzy matching
                if (!wardrobeItem) {
                  const itemLower = item.title.toLowerCase();
                  wardrobeItem = savedItems.find(w => {
                    const titleLower = (w.title || '').toLowerCase();
                    return titleLower.includes(itemLower.split(' ')[0]) || // Match first word
                           itemLower.includes(titleLower.split(' ')[0]) ||  // Or vice versa
                           (item.color && titleLower.includes(item.color.toLowerCase())) || // Match by color
                           (item.style && titleLower.includes(item.style.toLowerCase()));   // Match by style
                  });
                  
                  if (wardrobeItem) {
                    console.log(`🔄 Found fuzzy match: "${item.title}" → "${wardrobeItem.title}"`);
                  }
                }
                
                if (wardrobeItem) {
                  console.log(`🎯 Adding ${slotKey}: ${item.title} to gear slot`);
                  updatedSlots[slotKey as keyof typeof updatedSlots] = {
                    itemId: wardrobeItem.image,
                    itemImage: wardrobeItem.image,
                    itemTitle: wardrobeItem.title || 'Untitled Item',
                  };
                } else {
                  console.log(`❌ Could not find wardrobe item: ${item.title} (category: ${slotKey})`);
                  console.log(`💡 Available ${slotKey} items:`, savedItems.filter(w => w.category === slotKey || w.tags?.includes(slotKey)).map(w => w.title));
                }
              } else {
                console.log(`⏭️ Skipping ${slotKey}: ${item.title} (isFromWardrobe: ${item.isFromWardrobe}, isPlaceholder: ${item.isPlaceholder})`);
              }
              // For suggested items, we'll show them in the Smart Suggestions modal
            }
          });
          
          // Update all gear slots at once
          outfitGeneration.setGearSlots(updatedSlots);
          
          // Show success message with a delay to not conflict with Smart Suggestions modal
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Delay the alert to let the Smart Suggestions modal appear first
          setTimeout(() => {
            Alert.alert(
              '✨ Outfit Generated!',
              `"${outfit.outfitName}" has been created! Your gear slots have been filled with existing wardrobe items.`,
              [{ text: 'Great!' }]
            );
          }, 500);
        }
      }}
    />
  </View>
  
  {/* AI Loading Overlay */}
  {outfitGeneration.generatingSuggestions && (
    <View style={styles.aiLoadingOverlay}>
      <View style={styles.aiLoadingCard}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.aiLoadingTitle}>🤖 AI Creating Your Outfit...</Text>
        <Text style={styles.aiLoadingSubtext}>Analyzing your style & wardrobe</Text>
      </View>
    </View>
  )}
  
  {/* Gear Slot Grid */}
  <View style={styles.gearSlotGrid}>
    {/* First Row */}
    <View style={styles.gearRow}>
      <TouchableOpacity
        onPress={() => openSlotSelection('top')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.top.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.top.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.top.itemImage} style={styles.gearSlotImage} category="top" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('top')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>👕</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          TOP {outfitGeneration.gearSlots.top.itemImage && `(${getItemsByCategory('top').length})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openSlotSelection('bottom')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.bottom.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.bottom.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.bottom.itemImage} style={styles.gearSlotImage} category="bottom" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('bottom')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>👖</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          BOTTOM {outfitGeneration.gearSlots.bottom.itemImage && `(${getItemsByCategory('bottom').length})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openSlotSelection('shoes')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.shoes.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.shoes.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.shoes.itemImage} style={styles.gearSlotImage} category="shoes" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('shoes')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>👟</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          SHOES {outfitGeneration.gearSlots.shoes.itemImage && `(${getItemsByCategory('shoes').length})`}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Second Row */}
    <View style={styles.gearRow}>
      <TouchableOpacity
        onPress={() => openSlotSelection('jacket')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.jacket.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.jacket.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.jacket.itemImage} style={styles.gearSlotImage} category="jacket" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('jacket')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>🧥</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          JACKET {outfitGeneration.gearSlots.jacket.itemImage && `(${getItemsByCategory('jacket').length})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openSlotSelection('hat')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.hat.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.hat.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.hat.itemImage} style={styles.gearSlotImage} category="hat" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('hat')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>🎩</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          HAT {outfitGeneration.gearSlots.hat.itemImage && `(${getItemsByCategory('hat').length})`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openSlotSelection('accessories')}
        style={[styles.gearSlot, outfitGeneration.gearSlots.accessories.itemImage && styles.gearSlotFilled]}
      >
        {outfitGeneration.gearSlots.accessories.itemImage ? (
          <>
            <SafeImage uri={outfitGeneration.gearSlots.accessories.itemImage} style={styles.gearSlotImage} category="accessories" placeholder="item" />
            <TouchableOpacity
              onPress={() => clearGearSlot('accessories')}
              style={styles.clearSlotButton}
            >
              <Text style={styles.clearSlotText}>✕</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.gearSlotIcon}>💍</Text>
        )}
        <Text style={styles.gearSlotLabel}>
          ACCESSORIES {outfitGeneration.gearSlots.accessories.itemImage && `(${getItemsByCategory('accessories').length})`}
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* REMOVED: Legacy Smart Outfit Suggestions Button - now using unified AIOutfitAssistant */}

  {/* Generate Outfit Button */}
  <View style={{ marginTop: 10, alignItems: 'center' }}>
    <TouchableOpacity
      onPress={handleGenerateOutfit}
      disabled={outfitGeneration.generatingOutfit || getEquippedItems().length < 1}
      style={[
        styles.generateOutfitButton,
        (outfitGeneration.generatingOutfit || getEquippedItems().length < 1) && styles.generateOutfitButtonDisabled
      ]}
    >
      <Text style={styles.generateOutfitButtonText}>
        {outfitGeneration.generatingOutfit ? '🎮 Generating...' : '🎮 Generate Outfit'}
      </Text>
    </TouchableOpacity>
    
    {getEquippedItems().length > 0 && (
      <Text style={styles.equippedCount}>
        Equipped: {getEquippedItems().length} items
      </Text>
    )}
  </View>

  {/* Clear All Button */}
  <View style={{ marginTop: 15, alignItems: 'center' }}>
    <TouchableOpacity
      onPress={() => {
        outfitGeneration.setGearSlots({
          top: { itemId: null, itemImage: null, itemTitle: null },
          bottom: { itemId: null, itemImage: null, itemTitle: null },
          shoes: { itemId: null, itemImage: null, itemTitle: null },
          jacket: { itemId: null, itemImage: null, itemTitle: null },
          hat: { itemId: null, itemImage: null, itemTitle: null },
          accessories: { itemId: null, itemImage: null, itemTitle: null },
        });
      }}
      style={styles.clearAllButton}
    >
      <Text style={styles.clearAllButtonText}>🗑️ Clear All Slots</Text>
    </TouchableOpacity>
  </View>
</View>
)}

{/* Loved Outfits Section - Moved to dedicated Outfits page */}

{/* Wardrobe Section */}
{showWardrobe && (
  <WardrobePage
    savedItems={savedItems}
    showSortFilterModal={modalState.showSortFilterModal}
    setShowSortFilterModal={modalState.setShowSortFilterModal}
    filterCategory={filterCategory}
    filterLaundryStatus={filterLaundryStatus}
    filterColorFamily={filterColorFamily}
    filterSeason={filterSeason}
    filterTemperature={filterTemperature}
    filterCoordination={filterCoordination}
    sortBy={sortBy}
    sortOrder={sortOrder}
    getSortedAndFilteredItems={getSortedAndFilteredItems}
    getCategoryDisplayName={getCategoryDisplayName}
    getLaundryStatusDisplayName={getLaundryStatusDisplayName}
    getSortDisplayName={getSortDisplayName}
    getColorFamilyDisplayName={getColorFamilyDisplayName}
    getSeasonDisplayName={getSeasonDisplayName}
    getTemperatureDisplayName={getTemperatureDisplayName}
    getCoordinationDisplayName={getCoordinationDisplayName}
    openWardrobeItemView={openWardrobeItemView}
    categorizeItem={categorizeItem}
    generateOutfitSuggestions={generateOutfitSuggestions}
    showLaundryAnalytics={modalState.showLaundryAnalytics}
    setShowLaundryAnalytics={modalState.setShowLaundryAnalytics}
    getLaundryStats={getLaundryStats}
    getSmartWashSuggestions={getSmartWashSuggestions}
    getItemsByLaundryStatus={getItemsByLaundryStatus}
    // Navigation
    onNavigateToBuilder={navigateToBuilder}
    // Smart suggestions hook for modal coordination
    smartSuggestionsHook={smartSuggestions}
    // Wishlist data and functions
    wishlistItems={wishlistItems}
    removeFromWishlist={removeFromWishlist}
    updateWishlistPurchaseStatus={updateWishlistPurchaseStatus}
    addItemToWardrobe={(item) => {
      console.log('📥 Adding purchased item to wardrobe:', item.title);
      const updatedItems = [...savedItems, item];
      setSavedItems(updatedItems);
      // Save to storage
      AsyncStorage.setItem('stylemuse_wardrobe_items', JSON.stringify(updatedItems));
    }}
  />
)}

{/* Item Detail View */}
{showingItemDetail && detailViewItem && (
  <ItemDetailView
    item={detailViewItem}
    onBack={goBackToWardrobe}
    onSaveField={(field, value) => saveFieldUpdate(detailViewItem, field, value)}
    onCategoryPress={() => modalState.setCategoryDropdownVisible(true)}
    onDelete={deleteWardrobeItem}
    onNavigateToBuilder={navigateToBuilder}
    onGenerateOutfitSuggestions={(item) => generateOutfitSuggestions(item, styleDNA)}
    categorizeItem={categorizeItem}
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
{showProfilePage && (
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
    navigateToAvatarCustomization={navigateToAvatarCustomization}
  />
)}

{/* Avatar Customization Page */}
{showAvatarCustomization && (
  <AvatarCustomizationPage
    currentStyleDNA={styleDNA}
    selectedGender={selectedGender}
    onSave={updateStyleDNA}
    onBack={goBackToProfile}
  />
)}

{/* Outfits Page */}
{showOutfitsPage && (
  <OutfitsPage
    lovedOutfits={lovedOutfits}
    getSortedOutfits={getSortedOutfits}
    getSmartOutfitSuggestions={getSmartOutfitSuggestions}
    getOutfitWearStats={getOutfitWearStats}
    openOutfitDetailView={openOutfitDetailView}
    toggleOutfitLove={toggleOutfitLove}
    downloadImage={downloadImage}
    markOutfitAsWorn={markOutfitAsWorn}
    navigateToBuilder={navigateToBuilder}
  />
)}

{/* Add Item Page */}
{showAddItemPage && (
  <AddItemPage
    onCameraPress={handleAddItemCameraPress}
    onPhotoLibraryPress={handleAddItemPhotoLibraryPress}
    onBulkUploadPress={handleAddItemBulkUploadPress}
    onMultiItemPress={handleAddItemMultiItemPress}
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
        navigateToOutfits={navigateToOutfits}
        navigateToProfile={navigateToProfile}
        goBackToOutfits={goBackToOutfits}
        pickMultipleImages={pickMultipleImages}
        openCamera={openCamera}
        openAddItemModal={openAddItemModal}
        triggerHaptic={triggerHaptic}
        mainScrollViewRef={mainScrollViewRef}
        builderShakeValue={builderShakeValue}
        wardrobeShakeValue={wardrobeShakeValue}
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
            onPhotoTaken={handleCameraPhotoDirect}
            onCancel={() => modalState.setShowCamera(false)}
            mode={cameraMode}
            showGrid={true}
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
          />
        </View>
      )}

      {/* REMOVED: Legacy Smart Suggestion Modal - now using unified AIOutfitAssistant + SmartSuggestionsModal */}

      {/* Text Item Entry Modal */}
      <TextItemEntryModal
        visible={modalState.showTextItemModal}
        onClose={() => modalState.setShowTextItemModal(false)}
        onSave={handleSaveTextItem}
        categories={AVAILABLE_CATEGORIES}
      />

      {/* Multi-Item Progress Modal */}
      <MultiItemProgressModal
        visible={showMultiItemProgress}
        detectedItems={multiItemDetectedItems}
        currentStep={multiItemCurrentStep}
        logs={multiItemLogs}
        onComplete={() => setShowMultiItemProgress(false)}
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
    </SafeAreaView>
  );
};

// Export the WardrobeUploadScreen component
export default WardrobeUploadScreen;
