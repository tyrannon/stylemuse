import { View, Button, Image, StyleSheet, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Pressable, TextInput, Animated, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { describeClothingItem } from '../utils/openai';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { generateOutfitImage, analyzePersonalStyle, generatePersonalizedOutfitImage, generateWeatherBasedOutfit } from '../utils/openai';
import * as Location from 'expo-location';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WardrobeUploadScreen = () => {
  // State Variables
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedItems, setSavedItems] = useState<
  { 
    image: string; 
    title?: string; 
    description: string; 
    tags?: string[];
    color?: string;
    material?: string;
    style?: string;
    fit?: string;
  }[]
>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [selectedItem, setSelectedItem] = useState<{
    image: string;
    title?: string;
    description: string;
    tags?: string[];
    color?: string;
    material?: string;
    style?: string;
    fit?: string;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemsForOutfit, setSelectedItemsForOutfit] = useState<string[]>([]);
  const [generatedOutfit, setGeneratedOutfit] = useState<string | null>(null);
  const [generatingOutfit, setGeneratingOutfit] = useState(false);

  // State for loved outfits
  const [lovedOutfits, setLovedOutfits] = useState<{
    id: string;
    image: string;
    weatherData?: any;
    styleDNA?: any;
    selectedItems: string[];
    gender: string | null;
    createdAt: Date;
  }[]>([]);

  // Animated value for spin effect
  const [spinValue] = useState(new Animated.Value(0));

  // State for profile image and style DNA
  // This can be used for future profile-related features
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [styleDNA, setStyleDNA] = useState<any | null>(null);
  const [analyzingProfile, setAnalyzingProfile] = useState(false);

  // State for weather data
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // State for outfit modal and zoom
  const [outfitModalVisible, setOutfitModalVisible] = useState(false);
  const [outfitScale] = useState(new Animated.Value(1));
  const [outfitTranslateX] = useState(new Animated.Value(0));
  const [outfitTranslateY] = useState(new Animated.Value(0));
  const [currentScale, setCurrentScale] = useState(1);

  // State for gender selection
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'nonbinary' | null>(null);

  // State for gear slot system
  const [gearSlots, setGearSlots] = useState<{
    [key: string]: {
      itemId: string | null;
      itemImage: string | null;
      itemTitle: string | null;
    };
  }>({
    top: { itemId: null, itemImage: null, itemTitle: null },
    bottom: { itemId: null, itemImage: null, itemTitle: null },
    shoes: { itemId: null, itemImage: null, itemTitle: null },
    jacket: { itemId: null, itemImage: null, itemTitle: null },
    hat: { itemId: null, itemImage: null, itemTitle: null },
    accessories: { itemId: null, itemImage: null, itemTitle: null },
  });

  // State for slot selection modal
  const [slotSelectionModalVisible, setSlotSelectionModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // State for wardrobe inventory modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editItemTitle, setEditItemTitle] = useState<string>("");
  const [editItemTags, setEditItemTags] = useState<string[]>([]);
  const [editItemNewTag, setEditItemNewTag] = useState<string>("");

  // Function to pick a single image from the library
  const pickImage = async () => {
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
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      
      // Single upload (not bulk)
      await handleAutoDescribeAndSave(imageUri, false);
    }
  };

  // Function to handle automatic description and saving of clothing item
  const handleAutoDescribeAndSave = async (imageUri: string, isBulkUpload = false) => {
    if (!isBulkUpload) {
      setLoading(true);
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
      setSavedItems(prev => [
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
      ]);

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
        setLoading(false);
      }
    }
  };

  // Functions Section

  // Function to handle item deletion
  const handleDeleteItem = () => {
    if (!selectedItem) return;

    setSavedItems(prev =>
      prev.filter(item => !(item.image === selectedItem.image && item.description === selectedItem.description))
    );

    setModalVisible(false);
    setSelectedItem(null);
  };

  // Function to handle item selection for outfit generation
  const handleItemSelection = (imageUri: string) => {
    if (!isSelectionMode) return;
    
    if (selectedItemsForOutfit.includes(imageUri)) {
      // Remove from selection
      setSelectedItemsForOutfit(prev => prev.filter(uri => uri !== imageUri));
    } else {
      // Add to selection
      setSelectedItemsForOutfit(prev => [...prev, imageUri]);
    }
  };

  // Function to pick multiple images for bulk upload
  const pickMultipleImages = async () => {
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
      setBulkUploading(true);
      setBulkProgress({ current: 0, total: result.assets.length });
      
      alert(`Processing ${result.assets.length} images...`);
      
      // Process each image one by one
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        setBulkProgress({ current: i + 1, total: result.assets.length });
        
        try {
          // Fix: Pass the isBulkUpload parameter as true
          await handleAutoDescribeAndSave(asset.uri, true);
          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to process image ${i + 1}:`, error);
          // Continue with next image even if one fails
        }
      }
      
      setBulkUploading(false);
      setBulkProgress({ current: 0, total: 0 });
      alert(`Successfully added ${result.assets.length} items to your wardrobe! 🎉`);
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

    setGeneratingOutfit(true);
    startSpinAnimation();
    
    try {
      // Set the selected items for outfit display
      setSelectedItemsForOutfit(equippedItems.map(item => item.image));
      
      // Get weather data if we have it, otherwise use regular generation
      const currentWeather = weatherData || await getLocationAndWeather();
      
      // Generate weather-appropriate outfit if we have weather data
      const generatedImageUrl = currentWeather ? 
        await generateWeatherBasedOutfit(equippedItems, styleDNA, currentWeather, selectedGender) :
        await generatePersonalizedOutfitImage(equippedItems, styleDNA, selectedGender);
      
      if (generatedImageUrl) {
        setGeneratedOutfit(generatedImageUrl);
        resetOutfitTransform(); // Reset transform for new image
        setOutfitModalVisible(true); // Show the modal
        const message = currentWeather ? 
          `Perfect for ${currentWeather.temperature}°F and ${currentWeather.description}! 🌤️` :
          (styleDNA ? "AI-generated outfit created on YOUR style! 🎨✨" : "AI-generated outfit created! 📸");
        alert(message);
      } else {
        throw new Error("Failed to generate outfit image");
      }
      
    } catch (error) {
      console.error('Error generating outfit:', error);
      alert("Failed to generate AI outfit. Please try again.");
    } finally {
      setGeneratingOutfit(false);
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
        console.log("✅ Parsed Style DNA:", parsed);
        alert("Style DNA analyzed! 🧬✨ Your personal style profile is ready!");
      } catch (parseErr) {
        console.error("❌ Style DNA JSON Parse error:", parseErr);
        console.error("🔍 Attempted to parse:", cleanResult);
        
        // Fallback: create a basic style DNA object
        const fallbackDNA = {
          appearance: {
            hair_color: "not specified",
            hair_style: "not specified", 
            build: "average",
            complexion: "medium",
            facial_features: "general",
            approximate_age_range: "20s-30s"
          },
          style_preferences: {
            current_style_visible: "casual",
            preferred_styles: ["casual", "contemporary"],
            color_palette: ["neutral", "versatile"],
            fit_preferences: "comfortable"
          },
          outfit_generation_notes: "General style preferences",
          personalization_prompt: "A stylish person with a contemporary casual aesthetic"
        };
        
        setStyleDNA(fallbackDNA);
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
      
      // Automatically analyze the profile
      await analyzeProfileImage(imageUri);
    }
  };

  // Function to fetch weather data based on location
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      // Use environment variable for API key
      const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      
      if (!API_KEY) {
        throw new Error('Weather API key not found in environment variables');
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

  // Function to select weather-appropriate items based on current weather
  // This function will categorize items and filter them based on the weather conditions
  const selectWeatherAppropriateItems = (items: any[], weather: any) => {
    const temp = weather.temperature;
    const isRaining = weather.description.includes('rain');
    const isSnowing = weather.description.includes('snow');
    
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
    
    // Filter by weather appropriateness within each category
    const filterByWeather = (categoryItems) => {
      return categoryItems.filter(item => {
        const tags = item.tags || [];
        const material = item.material?.toLowerCase() || '';
        const style = item.style?.toLowerCase() || '';
        
        // Cold weather (under 50°F)
        if (temp < 50) {
          return tags.some(tag => 
            ['warm', 'winter', 'long-sleeve', 'pants', 'jeans', 'boots', 'coat', 'jacket', 'sweater'].includes(tag.toLowerCase())
          ) || ['wool', 'fleece', 'down', 'cashmere', 'denim'].includes(material) ||
             style.includes('long') || style.includes('jeans') || style.includes('pants');
        }
        
        // Mild weather (50-70°F)
        if (temp >= 50 && temp <= 70) {
          return tags.some(tag => 
            ['light', 'layer', 'jeans', 'pants', 'long-sleeve', 'short-sleeve'].includes(tag.toLowerCase())
          ) || style.includes('jeans') || style.includes('pants') || !style.includes('shorts');
        }
        
        // Warm weather (over 70°F)
        if (temp > 70) {
          return tags.some(tag => 
            ['summer', 'light', 'short', 'shorts', 'skirt', 'dress', 't-shirt', 'tank', 'sandals'].includes(tag.toLowerCase())
          ) || ['cotton', 'linen', 'silk'].includes(material) ||
             style.includes('short') || style.includes('skirt') || style.includes('dress') || style.includes('t-shirt');
        }
        
        return true; // Include if no specific weather rules
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
    
    // Add outerwear for cold weather or if available slots
    if (temp < 60 && weatherOuterwear.length > 0) {
      selectedItems.push(weatherOuterwear[0]);
    } else if (selectedItems.length < 3 && categorizedItems.outerwear.length > 0) {
      selectedItems.push(categorizedItems.outerwear[0]);
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
    setSelectedSlot(slotKey);
    setSlotSelectionModalVisible(true);
  };

  // Function to assign item to gear slot
  const assignItemToSlot = (slotKey: string, item: any) => {
    setGearSlots(prev => ({
      ...prev,
      [slotKey]: {
        itemId: item.image,
        itemImage: item.image,
        itemTitle: item.title || 'Untitled Item',
      }
    }));
    setSlotSelectionModalVisible(false);
    setSelectedSlot(null);
  };

  // Function to clear gear slot
  const clearGearSlot = (slotKey: string) => {
    setGearSlots(prev => ({
      ...prev,
      [slotKey]: {
        itemId: null,
        itemImage: null,
        itemTitle: null,
      }
    }));
  };

  // Function to get all equipped items for outfit generation
  const getEquippedItems = () => {
    const equippedItems = [];
    for (const [slotKey, slotData] of Object.entries(gearSlots)) {
      if (slotData.itemId) {
        const item = savedItems.find(savedItem => savedItem.image === slotData.itemId);
        if (item) {
          equippedItems.push(item);
        }
      }
    }
    return equippedItems;
  };

  // Function to automatically categorize clothing items
  const categorizeItem = (item: any): string => {
    const tags = item.tags || [];
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const style = (item.style || '').toLowerCase();
    
    // Check for top items
    if (tags.some(tag => ['top', 't-shirt', 'shirt', 'blouse', 'tank', 'crop', 'sweater'].includes(tag.toLowerCase())) ||
        title.includes('shirt') || title.includes('top') || title.includes('blouse') || title.includes('t-shirt') ||
        description.includes('shirt') || description.includes('top') || description.includes('blouse') ||
        style.includes('shirt') || style.includes('top') || style.includes('blouse')) {
      return 'top';
    }
    
    // Check for bottom items
    if (tags.some(tag => ['bottom', 'pants', 'jeans', 'shorts', 'skirt', 'trousers'].includes(tag.toLowerCase())) ||
        title.includes('pants') || title.includes('jeans') || title.includes('shorts') || title.includes('skirt') ||
        description.includes('pants') || description.includes('jeans') || description.includes('shorts') ||
        style.includes('pants') || style.includes('jeans') || style.includes('shorts') || style.includes('skirt')) {
      return 'bottom';
    }
    
    // Check for shoes
    if (tags.some(tag => ['shoes', 'boots', 'sandals', 'sneakers', 'footwear'].includes(tag.toLowerCase())) ||
        title.includes('shoes') || title.includes('boots') || title.includes('sandals') || title.includes('sneakers') ||
        description.includes('shoes') || description.includes('boots') || description.includes('sandals') ||
        style.includes('shoes') || style.includes('boots') || style.includes('sandals')) {
      return 'shoes';
    }
    
    // Check for jacket/outerwear
    if (tags.some(tag => ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear'].includes(tag.toLowerCase())) ||
        title.includes('jacket') || title.includes('coat') || title.includes('blazer') || title.includes('cardigan') ||
        description.includes('jacket') || description.includes('coat') || description.includes('blazer') ||
        style.includes('jacket') || style.includes('coat') || style.includes('blazer')) {
      return 'jacket';
    }
    
    // Check for hat/headwear
    if (tags.some(tag => ['hat', 'cap', 'beanie', 'headwear'].includes(tag.toLowerCase())) ||
        title.includes('hat') || title.includes('cap') || title.includes('beanie') ||
        description.includes('hat') || description.includes('cap') || description.includes('beanie') ||
        style.includes('hat') || style.includes('cap') || style.includes('beanie')) {
      return 'hat';
    }
    
    // Check for accessories
    if (tags.some(tag => ['accessories', 'jewelry', 'bag', 'scarf', 'belt', 'watch'].includes(tag.toLowerCase())) ||
        title.includes('accessories') || title.includes('jewelry') || title.includes('bag') || title.includes('scarf') ||
        description.includes('accessories') || description.includes('jewelry') || description.includes('bag') ||
        style.includes('accessories') || style.includes('jewelry') || style.includes('bag')) {
      return 'accessories';
    }
    
    // Default to top if no clear category found
    return 'top';
  };

  // Function to get items filtered by category
  const getItemsByCategory = (category: string) => {
    return savedItems.filter(item => {
      const itemCategory = categorizeItem(item);
      return itemCategory === category;
    });
  };

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
    
    setSavedItems(prev => prev.map(item => 
      item.image === editingItem.image 
        ? { ...item, title: editItemTitle, tags: editItemTags }
        : item
    ));
    
    setEditingItem(null);
    setEditItemTitle("");
    setEditItemTags([]);
    setEditItemNewTag("");
  };

  // Function to delete wardrobe item
  const deleteWardrobeItem = (itemToDelete: any) => {
    setSavedItems(prev => prev.filter(item => item.image !== itemToDelete.image));
    if (editingItem && editingItem.image === itemToDelete.image) {
      setEditingItem(null);
      setEditItemTitle("");
      setEditItemTags([]);
      setEditItemNewTag("");
    }
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
    if (!generatedOutfit) return;
    
    const equippedItems = getEquippedItems();
    
    const newLovedOutfit = {
      id: Date.now().toString(),
      image: generatedOutfit,
      weatherData: weatherData || null,
      styleDNA: styleDNA || null,
      selectedItems: equippedItems.map(item => item.image),
      gender: selectedGender || null,
      createdAt: new Date(),
    };
    
    setLovedOutfits(prev => [newLovedOutfit, ...prev]); // Add to beginning of array
    alert("Outfit saved to your Loved collection! ❤️");
  };

  // Function to remove outfit from loved collection
  const removeLovedOutfit = (outfitId: string) => {
    setLovedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
    alert("Outfit removed from Loved collection");
  };

  // Function to view loved outfit in modal
  const viewLovedOutfit = (outfit: any) => {
    setGeneratedOutfit(outfit.image);
    resetOutfitTransform();
    setOutfitModalVisible(true);
  };

  // View for the Wardrobe Upload Screen 
  // This is the main component that renders the wardrobe upload screen
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>

{/* Style DNA Profile Section */}
<View style={{ marginBottom: 20, alignItems: 'center' }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
    Your Style DNA 🧬
  </Text>
  
  {profileImage ? (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity 
        onPress={pickProfileImage}
        disabled={analyzingProfile}
        activeOpacity={0.7}
        style={{
          marginTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Image 
          source={{ uri: profileImage }} 
          style={{ 
            width: 80, 
            height: 80, 
            borderRadius: 40, 
            borderWidth: 3, 
            borderColor: styleDNA ? '#4CAF50' : '#FFC107',
          }} 
        />
        {!analyzingProfile && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: '#007AFF',
            borderRadius: 12,
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'white',
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✏️</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Style DNA Status */}
      {styleDNA && (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: 'bold' }}>
            ✅ Style DNA Ready
          </Text>
          <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', maxWidth: 200 }}>
            {styleDNA.appearance?.hair_color} hair, {styleDNA.appearance?.build} build
          </Text>
        </View>
      )}
    </View>
  ) : (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity 
        onPress={pickProfileImage}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <Text style={{ fontSize: 24 }}>📸</Text>
        <Text style={{ fontSize: 10, color: '#007AFF' }}>Add Photo</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', maxWidth: 250 }}>
        Upload your photo to get personalized outfit generation!
      </Text>
    </View>
  )}
  
  {analyzingProfile && (
    <View style={{ marginTop: 10, alignItems: 'center' }}>
      <Text style={{ color: '#007AFF', fontSize: 12 }}>
        Analyzing your style DNA... 🧬
      </Text>
    </View>
  )}
</View>

{/* Gender Selector Section */}
<View style={{ marginBottom: 20, alignItems: 'center' }}>
  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
    Gender Identity for Outfit Generation
  </Text>
  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
    <TouchableOpacity
      onPress={() => setSelectedGender('male')}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: selectedGender === 'male' ? '#007AFF' : '#f0f0f0',
        borderWidth: 2,
        borderColor: selectedGender === 'male' ? '#007AFF' : '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selectedGender === 'male' ? 0.2 : 0.1,
        shadowRadius: 4,
        elevation: selectedGender === 'male' ? 3 : 1,
      }}
    >
      <Text style={{ 
        fontSize: 16, 
        fontWeight: 'bold',
        color: selectedGender === 'male' ? 'white' : '#666'
      }}>
        👨 Male
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => setSelectedGender('female')}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: selectedGender === 'female' ? '#FF69B4' : '#f0f0f0',
        borderWidth: 2,
        borderColor: selectedGender === 'female' ? '#FF69B4' : '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selectedGender === 'female' ? 0.2 : 0.1,
        shadowRadius: 4,
        elevation: selectedGender === 'female' ? 3 : 1,
      }}
    >
      <Text style={{ 
        fontSize: 16, 
        fontWeight: 'bold',
        color: selectedGender === 'female' ? 'white' : '#666'
      }}>
        👩 Female
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => setSelectedGender('nonbinary')}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: selectedGender === 'nonbinary' ? '#9B59B6' : '#f0f0f0',
        borderWidth: 2,
        borderColor: selectedGender === 'nonbinary' ? '#9B59B6' : '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selectedGender === 'nonbinary' ? 0.2 : 0.1,
        shadowRadius: 4,
        elevation: selectedGender === 'nonbinary' ? 3 : 1,
      }}
    >
      <Text style={{ 
        fontSize: 16, 
        fontWeight: 'bold',
        color: selectedGender === 'nonbinary' ? 'white' : '#666'
      }}>
        🌈 Non-Binary
      </Text>
    </TouchableOpacity>
  </View>
  
  {selectedGender && (
    <View style={{ 
      backgroundColor: selectedGender === 'male' ? '#E3F2FD' : 
                     selectedGender === 'female' ? '#FCE4EC' : '#F3E5F5',
      padding: 8,
      borderRadius: 8,
      marginTop: 10,
    }}>
      <Text style={{ 
        fontSize: 12, 
        color: selectedGender === 'male' ? '#1976D2' : 
               selectedGender === 'female' ? '#C2185B' : '#7B1FA2',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        ✅ Outfits will be generated for {selectedGender === 'male' ? 'masculine' : 
                                        selectedGender === 'female' ? 'feminine' : 'non-binary'} style
      </Text>
    </View>
  )}
</View>

{/* Spinning animation and loading text */}
{generatingOutfit && (
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
        setGeneratingOutfit(false);
        stopSpinAnimation();
        setIsSelectionMode(true);
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



      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalContent}>
            {selectedItem && (
              <>
                <Button title="Delete Item" color="#ff5c5c" onPress={() => handleDeleteItem()} />

                <Image
                  source={{ uri: selectedItem.image }}
                  style={{ width: '100%', height: 250, borderRadius: 10 }}
                  resizeMode="cover"
                />

                <Button
                  title="Save Changes"
                  onPress={() => {
                    if (!selectedItem) return;
                    const updated = savedItems.map((item) =>
                      item.image === selectedItem.image
                        ? {
                            ...item,
                            title: editTitle,
                            tags: editTags,
                          }
                        : item
                    );
                    setSavedItems(updated);
                    setModalVisible(false);
                  }}
                />

                <Text style={{ fontWeight: 'bold', fontSize: 14, marginTop: 12 }}>Edit Title:</Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={{
                    borderColor: '#ccc',
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 6,
                    marginTop: 6,
                    marginBottom: 12,
                    width: '100%',
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <TextInput
                    placeholder="Add new tag..."
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    style={{
                      flex: 1,
                      borderColor: '#ccc',
                      borderWidth: 1,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 6,
                    }}
                  />
                  <Button
                    title="Add"
                    onPress={() => {
                      if (newTagInput.trim() !== "") {
                        setEditTags([...editTags, newTagInput.trim()]);
                        setNewTagInput("");
                      }
                    }}
                  />
                </View>

                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Edit Tags:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
                  {editTags.map((tag, index) => (
                    <Pressable
                      key={index}
                      onLongPress={() => {
                        const updated = [...editTags];
                        updated.splice(index, 1);
                        setEditTags(updated);
                      }}
                      style={{
                        backgroundColor: '#eee',
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        margin: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={{ marginTop: 10 }}>{selectedItem.description}</Text>

                <Button title="Close" onPress={() => setModalVisible(false)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
                {generatedOutfit ? (
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
                              <Image
                                source={{ uri: generatedOutfit }}
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
                    <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>generatedOutfit: {generatedOutfit || 'null'}</Text>
                  </View>
                )}
              </View>

              {/* Original Items Section */}
              {selectedItemsForOutfit.length > 0 && (
                <View style={styles.originalItemsContainer}>
                  <Text style={styles.originalItemsTitle}>Based on these items:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.originalItemsScroll}
                  >
                    {selectedItemsForOutfit.map((imageUri, index) => (
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
                  onPress={saveOutfitToLoved}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>❤️ Love It!</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    setOutfitModalVisible(false);
                    setGeneratedOutfit(null);
                    setSelectedItemsForOutfit([]);
                    setIsSelectionMode(true);
                  }}
                  style={[styles.actionButton, styles.generateNewButton]}
                >
                  <Text style={styles.actionButtonText}>🔄 Close and Select New</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Slot Selection Modal */}
      <Modal
        visible={slotSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSlotSelectionModalVisible(false)}
      >
        <Pressable
          onPress={() => setSlotSelectionModalVisible(false)}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.slotSelectionModalContent}>
            <Text style={styles.slotSelectionTitle}>
              Select {selectedSlot?.toUpperCase()} Item
            </Text>
            <Text style={styles.slotSelectionSubtitle}>
              Showing {getItemsByCategory(selectedSlot || '').length} {selectedSlot} items
            </Text>
            
            <ScrollView style={styles.slotSelectionScroll}>
              {getItemsByCategory(selectedSlot || '').map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => assignItemToSlot(selectedSlot!, item)}
                  style={styles.slotSelectionItem}
                >
                  <Image
                    source={{ uri: item.image }}
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
                  </View>
                </TouchableOpacity>
              ))}
              
              {getItemsByCategory(selectedSlot || '').length === 0 && (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>
                    No {selectedSlot} items found
                  </Text>
                  <Text style={styles.noItemsSubtext}>
                    Add some {selectedSlot} items to your wardrobe first!
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setSlotSelectionModalVisible(false)}
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
            
            <ScrollView style={styles.editItemModalScroll}>
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
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/*  SCROLLABLE VIEW FOR WARDROBE ITEMS */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 20, backgroundColor: '#f8f8f8', borderRadius: 12 }}>
        






{/* Wardrobe Items List */}
{/* Display generated outfit button if available */}
{generatedOutfit && (
  <View style={{ marginTop: 20, paddingHorizontal: 10, alignItems: 'center' }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
      {weatherData && styleDNA ? "Your Personalized Weather Outfit! 🧬🌤️" : 
       weatherData ? "Perfect Weather Outfit! 🌤️" :
       styleDNA ? "Your Personalized AI Outfit! 🧬✨" : "AI-Generated Outfit Ready!"}
    </Text>
    
    {/* Weather-specific styling indicator */}
    {weatherData && (
      <View style={{ 
        backgroundColor: '#E8F5E8', 
        padding: 8, 
        borderRadius: 8, 
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: 'bold' }}>
          🌡️ Perfect for {weatherData.temperature}°F • {weatherData.description}
        </Text>
      </View>
    )}
    
    {/* Show your profile photo if DNA exists */}
    {styleDNA && profileImage && (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Image 
          source={{ uri: profileImage }} 
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} 
        />
        <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: 'bold' }}>
          Generated based on your Style DNA
        </Text>
      </View>
    )}
    
    {/* Button to view the outfit in modal */}
    <TouchableOpacity
      onPress={() => {
        console.log('Opening modal, generatedOutfit:', generatedOutfit);
        setOutfitModalVisible(true);
      }}
      style={{
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
        👗 View Your Outfit
      </Text>
    </TouchableOpacity>
    
    {/* Show DNA insights if available */}
    {styleDNA && (
      <View style={{ 
        backgroundColor: '#f0f8f0', 
        padding: 10, 
        borderRadius: 10, 
        marginBottom: 10,
        maxWidth: 280 
      }}>
        <Text style={{ fontSize: 12, color: '#2E7D32', textAlign: 'center' }}>
          🎯 Tailored for your {styleDNA.appearance?.build} build and {styleDNA.style_preferences?.preferred_styles?.join(', ')} style
        </Text>
      </View>
    )}
    
    {/* Show original selected items as reference */}
    <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>Based on these items:</Text>
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 15,
    }}>
      {selectedItemsForOutfit.map((imageUri, index) => (
        <Image 
          key={index}
          source={{ uri: imageUri }} 
          style={{ 
            width: 60, 
            height: 60, 
            borderRadius: 8,
            margin: 3,
            borderWidth: 1,
            borderColor: '#ddd',
          }}
          resizeMode="cover"
        />
      ))}
    </View>
    
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '80%' }}>
      <Button 
        title="Love It!" 
        onPress={saveOutfitToLoved}
      />
      <Button 
        title="Close and Select New" 
        onPress={() => {
          setGeneratedOutfit(null);
          setSelectedItemsForOutfit([]);
          setIsSelectionMode(true);
        }}
      />
    </View>
  </View>
)}



{/* Weather display */}
{weatherData && (
  <View style={{
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 20,
    alignItems: 'center'
  }}>
    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1976D2' }}>
      📍 {weatherData.city}
    </Text>
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1976D2' }}>
      {weatherData.temperature}°F • {weatherData.description}
    </Text>
    <Text style={{ fontSize: 12, color: '#666' }}>
      Feels like {weatherData.feels_like}°F • Humidity {weatherData.humidity}%
    </Text>
  </View>
)}





{/* Image upload section */}
 <Button 
    title="📸 Add Multiple Items" 
    onPress={pickMultipleImages}
    disabled={bulkUploading}
  />
  
  {/* Progress indicator during bulk upload */}
  {bulkUploading && (
    <View style={{ marginTop: 10, alignItems: 'center' }}>
      <Text>Processing images... ✨</Text>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007AFF' }}>
        {bulkProgress.current} of {bulkProgress.total}
      </Text>
      <View style={{
        width: 200,
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        marginTop: 5,
      }}>
        <View style={{
          width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
          height: '100%',
          backgroundColor: '#007AFF',
          borderRadius: 3,
        }} />
      </View>
    </View>
  )}

{/* Demo button to add sample items */}
<Button 
  title="🚀 Quick Demo (Add Sample Items)" 
  onPress={() => {
    // Add some demo items for testing with proper categorization
    const demoItems = [
      {
        image: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+T-Shirt',
        title: 'Classic White T-Shirt',
        description: 'Essential white cotton crew neck t-shirt with relaxed fit',
        tags: ['white', 'cotton', 'casual', 'basic', 'top', 't-shirt'],
        color: 'white',
        material: 'cotton',
        style: 'crew neck t-shirt',
        fit: 'relaxed'
      },
      {
        image: 'https://via.placeholder.com/300x400/000080/FFFFFF?text=Dark+Jeans', 
        title: 'Dark Wash Jeans',
        description: 'High-waisted dark indigo denim jeans with straight leg cut',
        tags: ['dark blue', 'denim', 'casual', 'jeans', 'bottom', 'pants'],
        color: 'dark indigo',
        material: 'denim',
        style: 'high-waisted jeans',
        fit: 'straight leg'
      },
      {
        image: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+Sneakers',
        title: 'White Sneakers',
        description: 'Classic white canvas sneakers with rubber sole',
        tags: ['white', 'canvas', 'casual', 'sneakers', 'shoes', 'footwear'],
        color: 'white',
        material: 'canvas',
        style: 'sneakers',
        fit: 'regular'
      },
      {
        image: 'https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Denim+Jacket',
        title: 'Denim Jacket',
        description: 'Classic blue denim jacket with button closure',
        tags: ['blue', 'denim', 'casual', 'jacket', 'outerwear'],
        color: 'blue',
        material: 'denim',
        style: 'denim jacket',
        fit: 'regular'
      },
      {
        image: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Baseball+Cap',
        title: 'Baseball Cap',
        description: 'Classic baseball cap with adjustable strap',
        tags: ['black', 'cotton', 'casual', 'hat', 'cap', 'headwear'],
        color: 'black',
        material: 'cotton',
        style: 'baseball cap',
        fit: 'adjustable'
      },
      {
        image: 'https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Leather+Watch',
        title: 'Leather Watch',
        description: 'Classic leather strap watch with silver case',
        tags: ['brown', 'leather', 'accessories', 'jewelry', 'watch'],
        color: 'brown',
        material: 'leather',
        style: 'watch',
        fit: 'adjustable'
      }
    ];
    
    setSavedItems(prev => [...prev, ...demoItems]);
    alert("Demo items added for testing! 🎮 Each item is properly categorized.");
  }}
/>

{/* Wardrobe Inventory Button */}
{/* Removed - inventory now displayed directly in main screen */}

{loading && <Text>Analyzing with AI...</Text>}




{/* Weather-Based Outfit Button */}
<Button 
  title={loadingWeather ? "Getting Weather..." : "🌤️ Weather-Based Outfit"}
  onPress={async () => {
    if (savedItems.length < 1) {
      alert("Add at least one clothing item to generate weather-based outfits!");
      return;
    }
    
    // Get weather and auto-select best items
    const weather = await getLocationAndWeather();
    if (weather) {
      // Auto-select weather-appropriate items
      const weatherAppropriateItems = selectWeatherAppropriateItems(savedItems, weather);
      setSelectedItemsForOutfit(weatherAppropriateItems);
      setIsSelectionMode(true);
      
      alert(`Weather: ${weather.temperature}°F, ${weather.description}. Selected ${weatherAppropriateItems.length} weather-appropriate items!`);
    }
  }}
  disabled={loadingWeather}
/>



{/* Outfit Builder */}
        {savedItems.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
              🎮 Outfit Builder
            </Text>
            
            {/* Gear Slot Grid */}
            <View style={styles.gearSlotGrid}>
              {/* First Row */}
              <View style={styles.gearRow}>
                <TouchableOpacity
                  onPress={() => openSlotSelection('top')}
                  style={[styles.gearSlot, gearSlots.top.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.top.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.top.itemImage }} style={styles.gearSlotImage} />
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
                    TOP {gearSlots.top.itemImage && `(${getItemsByCategory('top').length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openSlotSelection('bottom')}
                  style={[styles.gearSlot, gearSlots.bottom.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.bottom.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.bottom.itemImage }} style={styles.gearSlotImage} />
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
                    BOTTOM {gearSlots.bottom.itemImage && `(${getItemsByCategory('bottom').length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openSlotSelection('shoes')}
                  style={[styles.gearSlot, gearSlots.shoes.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.shoes.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.shoes.itemImage }} style={styles.gearSlotImage} />
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
                    SHOES {gearSlots.shoes.itemImage && `(${getItemsByCategory('shoes').length})`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Second Row */}
              <View style={styles.gearRow}>
                <TouchableOpacity
                  onPress={() => openSlotSelection('jacket')}
                  style={[styles.gearSlot, gearSlots.jacket.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.jacket.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.jacket.itemImage }} style={styles.gearSlotImage} />
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
                    JACKET {gearSlots.jacket.itemImage && `(${getItemsByCategory('jacket').length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openSlotSelection('hat')}
                  style={[styles.gearSlot, gearSlots.hat.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.hat.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.hat.itemImage }} style={styles.gearSlotImage} />
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
                    HAT {gearSlots.hat.itemImage && `(${getItemsByCategory('hat').length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openSlotSelection('accessories')}
                  style={[styles.gearSlot, gearSlots.accessories.itemImage && styles.gearSlotFilled]}
                >
                  {gearSlots.accessories.itemImage ? (
                    <>
                      <Image source={{ uri: gearSlots.accessories.itemImage }} style={styles.gearSlotImage} />
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
                    ACCESSORIES {gearSlots.accessories.itemImage && `(${getItemsByCategory('accessories').length})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Generate Outfit Button */}
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleGenerateOutfit}
                disabled={generatingOutfit || getEquippedItems().length < 1}
                style={[
                  styles.generateOutfitButton,
                  (generatingOutfit || getEquippedItems().length < 1) && styles.generateOutfitButtonDisabled
                ]}
              >
                <Text style={styles.generateOutfitButtonText}>
                  {generatingOutfit ? '🎮 Generating...' : '🎮 Generate Outfit'}
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
                  setGearSlots({
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

        {/* Loved Outfits Section */}
        {lovedOutfits.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 20 }}>
              ❤️ Loved Outfits ({lovedOutfits.length}):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingLeft: 20 }}
            >
              {lovedOutfits.map((outfit, index) => (
                <TouchableOpacity
                  key={outfit.id}
                  onPress={() => viewLovedOutfit(outfit)}
                  style={{
                    marginRight: 20,
                    width: 200,
                    backgroundColor: '#fff5f5',
                    borderRadius: 12,
                    padding: 10,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#ff6b6b',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* Remove button */}
                  <TouchableOpacity
                    onPress={() => removeLovedOutfit(outfit.id)}
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#ff6b6b',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>

                  {/* Outfit image */}
                  <Image
                    source={{ uri: outfit.image }}
                    style={{ width: 180, height: 140, borderRadius: 8, marginBottom: 8 }}
                    resizeMode="cover"
                  />

                  {/* Weather info if available */}
                  {outfit.weatherData && (
                    <View style={{
                      backgroundColor: '#E8F5E8',
                      padding: 4,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 10, color: '#2E7D32', fontWeight: 'bold' }}>
                        🌡️ {outfit.weatherData.temperature}°F
                      </Text>
                    </View>
                  )}

                  {/* Style DNA indicator */}
                  {outfit.styleDNA && (
                    <View style={{
                      backgroundColor: '#f0f8f0',
                      padding: 4,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: 'bold' }}>
                        🧬 Personalized
                      </Text>
                    </View>
                  )}

                  {/* Gender indicator */}
                  {outfit.gender && (
                    <View style={{
                      backgroundColor: outfit.gender === 'male' ? '#E3F2FD' : 
                                       outfit.gender === 'female' ? '#FCE4EC' : '#F3E5F5',
                      padding: 4,
                      borderRadius: 6,
                      marginBottom: 6,
                    }}>
                      <Text style={{ 
                        fontSize: 10, 
                        color: outfit.gender === 'male' ? '#1976D2' : 
                               outfit.gender === 'female' ? '#C2185B' : '#7B1FA2',
                        fontWeight: 'bold' 
                      }}>
                        {outfit.gender === 'male' ? '👨' : 
                         outfit.gender === 'female' ? '👩' : '🌈'} {outfit.gender}
                      </Text>
                    </View>
                  )}

                  {/* Date */}
                  <Text style={{ fontSize: 10, color: '#666', fontStyle: 'italic' }}>
                    {outfit.createdAt.toLocaleDateString()}
                  </Text>

                  {/* Items used */}
                  <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                    {outfit.selectedItems.length} items used
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Wardrobe Inventory Section */}
        {savedItems.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, paddingHorizontal: 20, textAlign: 'center' }}>
              👔 Wardrobe Inventory ({savedItems.length} items)
            </Text>
            
            <View style={styles.wardrobeInventoryGrid}>
              {savedItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => editWardrobeItem(item)}
                  style={styles.wardrobeInventoryItem}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.wardrobeInventoryItemImage}
                    resizeMode="cover"
                  />
                  
                  <View style={styles.wardrobeInventoryItemInfo}>
                    <Text style={styles.wardrobeInventoryItemTitle}>
                      {item.title || 'Untitled Item'}
                    </Text>
                    
                    <View style={styles.wardrobeInventoryItemTags}>
                      {item.tags?.slice(0, 3).map((tag, tagIndex) => (
                        <View key={tagIndex} style={styles.wardrobeInventoryItemTag}>
                          <Text style={styles.wardrobeInventoryItemTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {categorizeItem(item).toUpperCase()}
                      </Text>
                    </View>
                    
                    {/* Edit indicator */}
                    <View style={styles.editIndicator}>
                      <Text style={styles.editIndicatorText}>✏️ Tap to edit</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Export the WardrobeUploadScreen component
export default WardrobeUploadScreen;

// Styles for the Wardrobe Upload Screen
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 8,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  placeholder: {
    fontSize: 16,
    color: '#aaa',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  outfitModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  outfitModalContent: {
    width: '95%',
    height: '95%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  outfitModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  outfitModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherInfo: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  weatherText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  imageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
  },
  zoomableImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  outfitImageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitModalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  controlButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  outfitModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  generateNewButton: {
    backgroundColor: '#ff6b6b',
  },
  instructionsContainer: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  instructionsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  originalItemsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  originalItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  originalItemsScroll: {
    paddingHorizontal: 5,
  },
  originalItemCard: {
    marginRight: 12,
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  originalItemImage: {
    width: '100%',
    height: '100%',
  },
  originalItemNumber: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  gearSlotGrid: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  gearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gearSlot: {
    width: '30%',
    height: 100,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  gearSlotFilled: {
    backgroundColor: '#f0f8f0',
    borderColor: '#4CAF50',
  },
  gearSlotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  clearSlotButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  clearSlotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  gearSlotIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  gearSlotLabel: {
    position: 'absolute',
    bottom: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  generateOutfitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateOutfitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateOutfitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  equippedCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  slotSelectionModalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  slotSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slotSelectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  slotSelectionScroll: {
    maxHeight: '70%',
    marginBottom: 15,
  },
  slotSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  slotSelectionItemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 10,
  },
  slotSelectionItemInfo: {
    flex: 1,
  },
  slotSelectionItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  slotSelectionItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  slotSelectionItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  slotSelectionItemTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    padding: 4,
    margin: 2,
  },
  slotSelectionItemTagText: {
    fontSize: 10,
    color: '#666',
  },
  slotSelectionCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  slotSelectionCloseButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noItemsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 4,
    marginTop: 5,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  wardrobeInventoryModalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  wardrobeInventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  wardrobeInventoryTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeInventoryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeInventoryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  wardrobeInventoryScroll: {
    maxHeight: '70%',
    marginBottom: 15,
  },
  wardrobeInventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wardrobeInventoryItem: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  wardrobeInventoryItemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  wardrobeInventoryItemInfo: {
    width: '100%',
    alignItems: 'center',
  },
  wardrobeInventoryItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  wardrobeInventoryItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 5,
  },
  wardrobeInventoryItemTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    padding: 2,
    margin: 1,
  },
  wardrobeInventoryItemTagText: {
    fontSize: 8,
    color: '#666',
  },
  wardrobeInventoryItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  editItemButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editItemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteItemButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ff6b6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteItemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  editItemModalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  editItemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  editItemLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  editItemInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginBottom: 12,
    width: '100%',
  },
  editItemTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  editItemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  editItemTagText: {
    fontSize: 12,
    color: '#666',
  },
  removeTagButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginLeft: 5,
  },
  removeTagButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addTagInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  addTagButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  editItemModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  saveEditButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveEditButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelEditButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  editItemModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editItemModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeEditButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  editItemModalScroll: {
    maxHeight: '70%',
    marginBottom: 15,
  },
  editItemForm: {
    marginBottom: 15,
  },
  editItemField: {
    marginBottom: 10,
  },
  categoryDisplay: {
    backgroundColor: '#f0f8f0',
    borderRadius: 4,
    padding: 4,
    marginBottom: 5,
  },
  categoryDisplayText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  deleteEditButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ff6b6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteEditButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  editIndicator: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    padding: 4,
    marginTop: 5,
  },
  editIndicatorText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  clearAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
});