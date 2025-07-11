import React, { useState, useCallback, useRef } from 'react';

// Global counter to track multiple hook instances
let hookInstanceCounter = 0;

interface LoadingStep {
  icon: string;
  text: string;
  completed?: boolean;
}

interface LoadingConfig {
  title: string;
  subtitle?: string;
  steps?: LoadingStep[];
  icon?: string;
  style?: 'outfit' | 'analysis' | 'save' | 'fetch' | 'generate';
  minimumDuration?: number; // Minimum display time in ms
}

interface UseUnifiedLoadingReturn {
  isLoading: boolean;
  loadingConfig: LoadingConfig | null;
  showLoading: (config: LoadingConfig) => void;
  hideLoading: () => void;
  updateSteps: (steps: LoadingStep[]) => void;
}

export const useUnifiedLoading = (): UseUnifiedLoadingReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState<LoadingConfig | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const instanceIdRef = useRef<number>(++hookInstanceCounter);

  // Log instance creation (simplified)
  React.useEffect(() => {
    console.log('🟢 [UnifiedLoading] Hook instance created:', instanceIdRef.current);
    return () => {
      console.log('🟢 [UnifiedLoading] Hook instance destroyed:', instanceIdRef.current);
    };
  }, []);

  const showLoading = useCallback((config: LoadingConfig) => {
    const timestamp = Date.now();
    startTimeRef.current = timestamp;
    setLoadingConfig(config);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    const hideTimestamp = Date.now();
    const startTime = startTimeRef.current;
    const elapsed = startTime ? hideTimestamp - startTime : 0;
    const minimumDuration = loadingConfig?.minimumDuration || 0;
    const remaining = minimumDuration - elapsed;

    const hideWithDelay = () => {
      setIsLoading(false);
      setLoadingConfig(null);
      startTimeRef.current = null;
    };

    // Ensure minimum display duration if specified
    if (startTimeRef.current && loadingConfig?.minimumDuration && remaining > 0) {
      setTimeout(hideWithDelay, remaining);
    } else {
      hideWithDelay();
    }
  }, [loadingConfig?.minimumDuration]);

  const updateSteps = useCallback((steps: LoadingStep[]) => {
    setLoadingConfig(prev => prev ? { ...prev, steps } : null);
  }, []);

  // Track state changes (reduced logging)
  React.useEffect(() => {
    if (isLoading) {
      console.log('🟢 [UnifiedLoading] Loading started:', loadingConfig?.title || 'Unknown');
    } else {
      console.log('🟢 [UnifiedLoading] Loading stopped');
    }
  }, [isLoading, loadingConfig?.title]);

  // Track long-running operations
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn('🟢 [UnifiedLoading] WARNING: Loading active for 10+ seconds:', loadingConfig?.title || 'Unknown');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingConfig?.title]);

  return {
    isLoading,
    loadingConfig,
    showLoading,
    hideLoading,
    updateSteps,
  };
};

// Predefined loading configurations for common operations
export const LOADING_CONFIGS = {
  OUTFIT_GENERATION: {
    title: '🎨 Creating Your Perfect Outfit...',
    subtitle: 'Building around your selected item...',
    style: 'outfit' as const,
    steps: [
      { icon: '✨', text: 'AI analyzing item combinations' },
      { icon: '🧠', text: 'Generating complementary pieces' },
      { icon: '🎯', text: 'Filling your gear slots' },
    ],
    minimumDuration: 800,
  },
  
  STYLE_DNA_ANALYSIS: {
    title: '🧬 Analyzing Your Style DNA...',
    subtitle: 'Processing your photo...',
    style: 'analysis' as const,
    steps: [
      { icon: '👤', text: 'Identifying personal attributes' },
      { icon: '🎨', text: 'Analyzing style preferences' },
      { icon: '✨', text: 'Creating your fashion profile' },
    ],
    minimumDuration: 1000,
  },
  
  ITEM_ANALYSIS: {
    title: '👔 Analyzing Clothing Item...',
    subtitle: 'Processing image...',
    style: 'analysis' as const,
    steps: [
      { icon: '🔍', text: 'Detecting item details' },
      { icon: '🏷️', text: 'Categorizing clothing type' },
      { icon: '📝', text: 'Generating description' },
    ],
    minimumDuration: 800,
  },
  
  IMAGE_ANALYSIS: {
    title: '🔍 Analyzing Your Image...',
    subtitle: 'AI is examining your clothing item...',
    style: 'analysis' as const,
    steps: [
      { icon: '📸', text: 'Processing image' },
      { icon: '🏷️', text: 'Identifying clothing type' },
      { icon: '📝', text: 'Creating description' },
    ],
    minimumDuration: 800,
  },
  
  MULTI_ITEM_DETECTION: {
    title: '🎯 AI Multi-Item Detection',
    subtitle: 'Advanced computer vision scanning your closet...',
    style: 'analysis' as const,
    steps: [
      { icon: '📸', text: 'Loading high-resolution image data' },
      { icon: '🧠', text: 'Initializing neural networks' },
      { icon: '👁️', text: 'Scanning for clothing objects' },
      { icon: '🏷️', text: 'Classifying detected items (shoes, tops, etc.)' },
      { icon: '📏', text: 'Calculating precise boundaries' },
      { icon: '👟', text: 'Detecting and pairing shoe sets' },
      { icon: '🎨', text: 'Analyzing colors and patterns' },
      { icon: '📦', text: 'Preparing cropping coordinates' },
      { icon: '✨', text: 'Finalizing cyberpunk bounding boxes' },
    ],
    minimumDuration: 2000, // Increased for better experience
  },
  
  SAVING_ITEMS: {
    title: '💾 Saving to Wardrobe...',
    subtitle: 'Processing items...',
    style: 'save' as const,
    steps: [
      { icon: '📦', text: 'Preparing items' },
      { icon: '💾', text: 'Saving to storage' },
      { icon: '✅', text: 'Adding to wardrobe' },
    ],
    minimumDuration: 600,
  },
  
  MULTI_ITEM_SAVE: {
    title: '🚀 Saving All Detected Items',
    subtitle: 'AI cropping and organizing your wardrobe...',
    style: 'save' as const,
    steps: [
      { icon: '✂️', text: 'Cropping each item with precision' },
      { icon: '🎨', text: 'Enhancing image quality' },
      { icon: '🏷️', text: 'Auto-categorizing by type' },
      { icon: '💾', text: 'Saving to permanent storage' },
      { icon: '📁', text: 'Adding to your wardrobe' },
      { icon: '✨', text: 'Generating thumbnails' },
    ],
    minimumDuration: 1500,
  },

  BULK_UPLOAD: {
    title: '📦 Saving Multiple Items...',
    subtitle: 'Processing cropped items...',
    style: 'save' as const,
    steps: [
      { icon: '✂️', text: 'Processing cropped items' },
      { icon: '📝', text: 'Generating descriptions' },
      { icon: '💾', text: 'Saving to wardrobe' },
    ],
    minimumDuration: 800,
  },
  
  WEATHER_FETCH: {
    title: '🌤️ Fetching Weather Data...',
    subtitle: 'Getting your location...',
    style: 'fetch' as const,
    steps: [
      { icon: '📍', text: 'Location found' },
      { icon: '🌡️', text: 'Retrieving conditions' },
      { icon: '✅', text: 'Weather data ready' },
    ],
    minimumDuration: 500,
  },
  
  WEATHER_OUTFIT_GENERATION: {
    title: '🌤️ Creating Weather-Perfect Outfit...',
    subtitle: 'Analyzing current conditions and your wardrobe',
    style: 'outfit' as const,
    steps: [
      { icon: '🌡️', text: 'Checking weather conditions' },
      { icon: '👔', text: 'Selecting appropriate items' },
      { icon: '✨', text: 'Creating perfect outfit' },
    ],
    minimumDuration: 1000,
  },
  
  GENERATING_SUGGESTIONS: {
    title: '✨ Generating Smart Suggestions...',
    subtitle: 'AI is analyzing your wardrobe...',
    style: 'generate' as const,
    steps: [
      { icon: '🧠', text: 'Analyzing style preferences' },
      { icon: '🔍', text: 'Finding wardrobe gaps' },
      { icon: '💡', text: 'Creating recommendations' },
    ],
    minimumDuration: 800,
  },
};