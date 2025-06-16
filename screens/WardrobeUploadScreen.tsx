import { View, Button, Image, StyleSheet, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Pressable, TextInput, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { describeClothingItem } from '../utils/openai';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { generateOutfitImage, analyzePersonalStyle, generatePersonalizedOutfitImage, generateWeatherBasedOutfit } from '../utils/openai';
import * as Location from 'expo-location';


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

  // Animated value for spin effect
  // This can be used for any animated effects you want to add later
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
      alert("Item analyzed and saved to wardrobe!");
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
  if (selectedItemsForOutfit.length < 2) {
    alert("Please select at least 2 items to generate an outfit!");
    return;
  }

  setGeneratingOutfit(true);
  startSpinAnimation();
  
  try {
    const selectedItems = savedItems.filter(item => 
      selectedItemsForOutfit.includes(item.image)
    );
    
    // Get weather data if we have it, otherwise use regular generation
    const currentWeather = weatherData || await getLocationAndWeather();
    
    // Generate weather-appropriate outfit if we have weather data
    const generatedImageUrl = currentWeather ? 
      await generateWeatherBasedOutfit(selectedItems, styleDNA, currentWeather) :
      await generatePersonalizedOutfitImage(selectedItems, styleDNA);
    
    if (generatedImageUrl) {
      setGeneratedOutfit(generatedImageUrl);
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
    setIsSelectionMode(false);
  }
};










// Function to start the spinning animation:
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

// Function to stop the spinning animation:
const stopSpinAnimation = () => {
  spinValue.stopAnimation();
  spinValue.setValue(0);
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
      <Image 
        source={{ uri: profileImage }} 
        style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          borderWidth: 3, 
          borderColor: styleDNA ? '#4CAF50' : '#FFC107',
          marginBottom: 10 
        }} 
      />
      {styleDNA && (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: 'bold' }}>
            ✅ Style DNA Ready
          </Text>
          <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', maxWidth: 200 }}>
            {styleDNA.appearance?.hair_color} hair, {styleDNA.appearance?.build} build
          </Text>
        </View>
      )}
      <Button 
        title="Update My Photo" 
        onPress={pickProfileImage}
        disabled={analyzingProfile}
      />
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

 

{/* Weather display */}
{weatherData && (
  <View style={{
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
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
    // Add some demo items for testing
    const demoItems = [
      {
        image: 'demo1',
        title: 'Classic White T-Shirt',
        description: 'Essential white cotton crew neck t-shirt with relaxed fit',
        tags: ['white', 'cotton', 'casual', 'basic'],
        color: 'white',
        material: 'cotton',
        style: 'crew neck t-shirt',
        fit: 'relaxed'
      },
      {
        image: 'demo2', 
        title: 'Dark Wash Jeans',
        description: 'High-waisted dark indigo denim jeans with straight leg cut',
        tags: ['dark blue', 'denim', 'casual', 'jeans'],
        color: 'dark indigo',
        material: 'denim',
        style: 'high-waisted jeans',
        fit: 'straight leg'
      }
    ];
    
    setSavedItems(prev => [...prev, ...demoItems]);
    alert("Demo items added for testing!");
  }}
/>


{/* Weather-Based Outfit Button */}
<Button 
  title={loadingWeather ? "Getting Weather..." : "🌤️ Weather-Based Outfit"}
  onPress={async () => {
    if (savedItems.length < 2) {
      alert("Add more clothing items to generate weather-based outfits!");
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



{loading && <Text>Analyzing with AI...</Text>}

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

      {/*  SCROLLABLE VIEW FOR WARDROBE ITEMS */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 20, backgroundColor: '#f8f8f8', borderRadius: 12 }}>
        

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




{/* Wardrobe Items List */}
{/* // Display generated outfit if available */}
{generatedOutfit && (
  <View style={{ marginTop: 20, paddingHorizontal: 10, alignItems: 'center' }}>
    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
      {weatherData && styleDNA ? "Your Personalized Weather Outfit! 🧬🌤️" : 
       weatherData ? "Perfect Weather Outfit! 🌤️" :
       styleDNA ? "Your Personalized AI Outfit! 🧬✨" : "AI-Generated Outfit:"}
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
    
    {/* Show your profile photo next to the generated outfit if DNA exists */}
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
    
    {/* Rest of your existing generated outfit display... */}
    <Image 
      source={{ uri: generatedOutfit }} 
      style={{ 
        width: 300, 
        height: 400, 
        borderRadius: 15,
        borderWidth: 2,
        borderColor: weatherData ? '#4CAF50' : (styleDNA ? '#4CAF50' : '#007AFF'),
        marginBottom: 10,
      }}
      resizeMode="cover"
    />
    
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
        onPress={() => {
          alert("AI outfit saved to favorites! ❤️");
        }}
      />
      <Button 
        title="Generate New" 
        onPress={() => {
          setGeneratedOutfit(null);
          setSelectedItemsForOutfit([]);
          setIsSelectionMode(true);
        }}
      />
    </View>
  </View>
)}




{/* // Selection mode for outfit generation */}
{savedItems.length > 1 && (
  <View style={{ marginTop: 10, paddingHorizontal: 10, alignItems: 'center' }}>
    <Button 
      title={styleDNA ? 
        `${isSelectionMode ? "Cancel Selection" : "Generate Outfit On Me! 🧬"}` : 
        `${isSelectionMode ? "Cancel Selection" : "Generate Outfit"}`
      } 
      onPress={() => {
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedItemsForOutfit([]);
        } else {
          setIsSelectionMode(true);
        }
      }}
    />
    
    {isSelectionMode && (
      <View style={{ marginTop: 10 }}>
        <Text>Select items to combine (Selected: {selectedItemsForOutfit.length})</Text>
        <Button 
          title="Create Outfit" 
          onPress={handleGenerateOutfit}
          disabled={generatingOutfit || selectedItemsForOutfit.length < 2}
        />
      </View>
    )}
  </View>
)}

        {savedItems.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 20 }}>
              Saved Wardrobe Items:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingLeft: 20 }}
            >
              {savedItems.map((item, index) => (
                  <Pressable
  key={index}
  onPress={() => {
    if (isSelectionMode) {
      handleItemSelection(item.image);
    } else {
      setSelectedItem(item);
      setEditTitle(item.title || "");
      setEditTags(item.tags || []);
      setModalVisible(true);
    }
  }}
  style={{
    marginRight: 20,
    width: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    // Add selection styling
    borderWidth: isSelectionMode && selectedItemsForOutfit.includes(item.image) ? 3 : 0,
    borderColor: '#007AFF',
  }}
>
  {/* Add selection indicator */}
  {isSelectionMode && (
    <View style={{
      position: 'absolute',
      top: 5,
      right: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: selectedItemsForOutfit.includes(item.image) ? '#007AFF' : '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    }}>
      {selectedItemsForOutfit.includes(item.image) && (
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
      )}
    </View>
  )}
  
  <Image
    source={{ uri: item.image }}
    style={{ width: 180, height: 140, borderRadius: 8, marginBottom: 8 }}
    resizeMode="cover"
  />
                  <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                    {item.title}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
                    {item.tags?.map((tag, tagIndex) => (
                      <View
                        key={tagIndex}
                        style={{
                          backgroundColor: '#e0e0e0',
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          margin: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10 }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
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
});