import { EnhancedStyleDNA } from '../types/Avatar';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_CACHE_KEY = 'stylemuse_cached_avatar_paths';
const AVATAR_DIRECTORY = `${FileSystem.documentDirectory}avatars/`;

export const generateAvatarPrompt = (styleDNA: EnhancedStyleDNA, externalGender?: string | null): string => {
  // Extract key information
  const personalInfo = styleDNA.personal_info || {};
  const physicalAttributes = styleDNA.physical_attributes || {};
  const styleProfile = styleDNA.style_profile || {};
  const lifestyle = styleDNA.lifestyle || {};

  // Build detailed prompt components
  const ageRange = personalInfo.age_range || '25-35';
  const gender = personalInfo.gender || externalGender || 'nonbinary';
  
  // Physical attributes
  const skinTone = physicalAttributes.skin_tone || 'Medium';
  const hairColor = physicalAttributes.hair_color || 'brown';
  const hairLength = physicalAttributes.hair_length || 'Medium';
  const hairStyle = physicalAttributes.hair_style || 'Straight';
  const bodyType = physicalAttributes.body_type || 'Rectangle';
  const eyeColor = physicalAttributes.eye_color || 'brown';

  // Style preferences
  const styleArchetypes = styleProfile.style_archetypes || [];
  const favoriteColors = styleProfile.color_preferences?.favorite_colors || [];
  const fashionGoals = styleProfile.fashion_goals || [];

  // Lifestyle
  const occupation = lifestyle.occupation || '';
  const lifestyleFactors = lifestyle.lifestyle || [];

  // Build the prompt
  let prompt = `Create a high-quality, professional portrait of a ${ageRange} year old ${gender} person. `;

  // Physical description
  prompt += `They have ${skinTone.toLowerCase()} skin tone, `;
  
  // Hair description
  if (hairLength === 'Bald') {
    prompt += `a bald head, `;
  } else {
    prompt += `${hairLength.toLowerCase()} ${hairColor.toLowerCase()} hair styled in a ${hairStyle.toLowerCase()} style, `;
  }
  
  prompt += `${eyeColor} eyes, and a ${bodyType.toLowerCase()} body type. `;

  // Style and fashion
  if (styleArchetypes.length > 0) {
    const styleDesc = styleArchetypes.join(', ').toLowerCase();
    prompt += `Their fashion style is ${styleDesc}, `;
    
    // Clothing suggestions based on style
    if (styleArchetypes.includes('Classic')) {
      prompt += `wearing elegant, timeless clothing like a well-fitted blazer or button-down shirt, `;
    } else if (styleArchetypes.includes('Bohemian')) {
      prompt += `wearing flowing, artistic clothing with natural textures and earthy tones, `;
    } else if (styleArchetypes.includes('Minimalist')) {
      prompt += `wearing clean, simple clothing in neutral colors with minimal accessories, `;
    } else if (styleArchetypes.includes('Edgy')) {
      prompt += `wearing bold, contemporary clothing with interesting cuts or dark colors, `;
    } else if (styleArchetypes.includes('Romantic')) {
      prompt += `wearing soft, feminine clothing with delicate details and gentle colors, `;
    } else if (styleArchetypes.includes('Trendy')) {
      prompt += `wearing fashionable, current clothing that's on-trend and stylish, `;
    } else if (styleArchetypes.includes('Sporty')) {
      prompt += `wearing athletic-inspired clothing that's comfortable and functional, `;
    } else if (styleArchetypes.includes('Glamorous')) {
      prompt += `wearing luxurious, eye-catching clothing with elegant accessories, `;
    } else if (styleArchetypes.includes('Preppy')) {
      prompt += `wearing polished, collegiate-inspired clothing like polo shirts or cardigans, `;
    } else if (styleArchetypes.includes('Artsy')) {
      prompt += `wearing creative, unique clothing with artistic flair and interesting patterns, `;
    } else {
      prompt += `wearing stylish, well-fitted clothing, `;
    }
  }

  // Color preferences
  if (favoriteColors.length > 0) {
    const colorList = favoriteColors.slice(0, 3).join(', ').toLowerCase();
    prompt += `incorporating their favorite colors: ${colorList}. `;
  }

  // Professional context
  if (occupation) {
    prompt += `They work as a ${occupation.toLowerCase()}, so their style reflects their professional environment. `;
  }

  // Lifestyle factors
  if (lifestyleFactors.length > 0) {
    const lifestyleDesc = lifestyleFactors.join(', ').toLowerCase();
    prompt += `Their lifestyle is ${lifestyleDesc}, which influences their clothing choices. `;
  }

  // Technical specifications
  prompt += `Portrait should be shot from chest up with good lighting, professional quality, `;
  prompt += `realistic style, high resolution, sharp focus, beautiful composition. `;
  prompt += `The person should have a friendly, confident expression and be looking directly at the camera. `;
  prompt += `Background should be neutral and clean, not distracting from the subject. `;

  // Style modifiers for better results
  prompt += `Style: professional headshot, portrait photography, studio lighting, high quality, detailed, realistic.`;

  return prompt;
};

// Helper function to clear all cached avatars (useful for debugging or user refresh)
export const clearAvatarCache = async (): Promise<void> => {
  try {
    const cachedPaths = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
    if (cachedPaths) {
      const pathsMap = JSON.parse(cachedPaths);
      
      // Delete all cached files
      for (const [key, path] of Object.entries(pathsMap)) {
        try {
          await FileSystem.deleteAsync(path as string);
          console.log('🗑️ Deleted cached avatar:', path);
        } catch (error) {
          // File already deleted, ignore
        }
      }
    }
    
    // Clear the cache mapping
    await AsyncStorage.removeItem(AVATAR_CACHE_KEY);
    console.log('✅ Avatar cache cleared completely');
  } catch (error) {
    console.error('Error clearing avatar cache:', error);
  }
};

// Generate a cache key based on the avatar parameters
const generateCacheKey = (styleDNA: EnhancedStyleDNA, externalGender?: string | null): string => {
  const personalInfo = styleDNA.personal_info || {};
  const physicalAttributes = styleDNA.physical_attributes || {};
  const styleProfile = styleDNA.style_profile || {};
  
  // Create a simple hash from key attributes
  const keyData = {
    age: personalInfo.age_range,
    gender: personalInfo.gender || externalGender,
    skin: physicalAttributes.skin_tone,
    hair: `${physicalAttributes.hair_color}_${physicalAttributes.hair_length}_${physicalAttributes.hair_style}`,
    body: physicalAttributes.body_type,
    styles: styleProfile.style_archetypes?.sort().join(','),
    colors: styleProfile.color_preferences?.favorite_colors?.sort().join(','),
    version: styleDNA.version || 1
  };
  
  return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

// Ensure avatar directory exists
const ensureAvatarDirectory = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(AVATAR_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIRECTORY, { intermediates: true });
    console.log('📁 Created avatar cache directory');
  }
};

// Check if cached avatar exists
const getCachedAvatarPath = async (cacheKey: string): Promise<string | null> => {
  try {
    const cachedPaths = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
    if (!cachedPaths) return null;
    
    const pathsMap = JSON.parse(cachedPaths);
    const cachedPath = pathsMap[cacheKey];
    
    if (cachedPath) {
      // Verify file still exists
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists) {
        console.log('✅ Found cached avatar:', cachedPath);
        return cachedPath;
      } else {
        // Remove invalid cache entry
        delete pathsMap[cacheKey];
        await AsyncStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(pathsMap));
        console.log('🗑️ Removed invalid cache entry');
      }
    }
    return null;
  } catch (error) {
    console.error('Error checking cached avatar:', error);
    return null;
  }
};

// Download and cache avatar image
const downloadAndCacheAvatar = async (imageUrl: string, cacheKey: string): Promise<string | null> => {
  try {
    await ensureAvatarDirectory();
    
    const fileName = `avatar_${cacheKey}.jpg`;
    const localPath = `${AVATAR_DIRECTORY}${fileName}`;
    
    console.log('⬇️ Downloading avatar to:', localPath);
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
    
    if (downloadResult.status === 200) {
      // Update cache mapping
      const cachedPaths = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
      const pathsMap = cachedPaths ? JSON.parse(cachedPaths) : {};
      pathsMap[cacheKey] = localPath;
      await AsyncStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(pathsMap));
      
      console.log('✅ Avatar cached successfully:', localPath);
      return localPath;
    } else {
      console.error('❌ Failed to download avatar:', downloadResult.status);
      return null;
    }
  } catch (error) {
    console.error('Error downloading and caching avatar:', error);
    return null;
  }
};

// Clear old cached avatars (keep only last 5)
const cleanOldAvatars = async (): Promise<void> => {
  try {
    const cachedPaths = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
    if (!cachedPaths) return;
    
    const pathsMap = JSON.parse(cachedPaths);
    const entries = Object.entries(pathsMap);
    
    if (entries.length > 5) {
      // Sort by file modification time and keep newest 5
      const sortedEntries = [];
      for (const [key, path] of entries) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(path as string);
          if (fileInfo.exists) {
            sortedEntries.push({ key, path, modTime: fileInfo.modificationTime || 0 });
          }
        } catch (error) {
          // File doesn't exist, skip
        }
      }
      
      sortedEntries.sort((a, b) => b.modTime - a.modTime);
      const toKeep = sortedEntries.slice(0, 5);
      const toDelete = sortedEntries.slice(5);
      
      // Delete old files
      for (const item of toDelete) {
        try {
          await FileSystem.deleteAsync(item.path as string);
          console.log('🗑️ Deleted old avatar:', item.path);
        } catch (error) {
          // File already deleted, ignore
        }
      }
      
      // Update cache mapping
      const newPathsMap: { [key: string]: string } = {};
      for (const item of toKeep) {
        newPathsMap[item.key] = item.path as string;
      }
      await AsyncStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(newPathsMap));
    }
  } catch (error) {
    console.error('Error cleaning old avatars:', error);
  }
};

export const generateAvatarImage = async (styleDNA: EnhancedStyleDNA, externalGender?: string | null): Promise<string | null> => {
  try {
    const cacheKey = generateCacheKey(styleDNA, externalGender);
    
    // Check for cached avatar first
    const cachedPath = await getCachedAvatarPath(cacheKey);
    if (cachedPath) {
      console.log('🚀 Using cached avatar - instant load!');
      return cachedPath;
    }
    
    console.log('🎨 Generating new avatar...');
    const prompt = generateAvatarPrompt(styleDNA, externalGender);
    
    // Generate new avatar with DALL-E
    const imageUrl = await generateAvatarWithDALLE(prompt);
    if (!imageUrl) {
      return null;
    }
    
    // Download and cache the avatar
    const cachedPath2 = await downloadAndCacheAvatar(imageUrl, cacheKey);
    
    // Clean old avatars in background
    cleanOldAvatars();
    
    return cachedPath2 || imageUrl; // Return cached path if available, otherwise original URL
  } catch (error) {
    console.error('Error generating avatar image:', error);
    return null;
  }
};

// Direct DALL-E function for avatar generation
const generateAvatarWithDALLE = async (prompt: string): Promise<string | null> => {
  const Constants = await import('expo-constants');
  const OPENAI_API_KEY = Constants.default.expoConfig?.extra?.openAIApiKey;

  if (!OPENAI_API_KEY) {
    console.error('🚨 No OpenAI API key found for avatar generation');
    return null;
  }

  const payload = {
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  };

  try {
    console.log('🎨 Generating avatar with prompt:', prompt.substring(0, 200) + '...');
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 Avatar generation failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Avatar generated successfully');
    
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error("❌ Avatar generation error:", error);
    return null;
  }
};