import { useState, useCallback, useRef } from 'react';

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

  const showLoading = useCallback((config: LoadingConfig) => {
    startTimeRef.current = Date.now();
    setLoadingConfig(config);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    const hideWithDelay = () => {
      setIsLoading(false);
      setLoadingConfig(null);
      startTimeRef.current = null;
    };

    // Ensure minimum display duration if specified
    if (startTimeRef.current && loadingConfig?.minimumDuration) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = loadingConfig.minimumDuration - elapsed;
      
      if (remaining > 0) {
        setTimeout(hideWithDelay, remaining);
      } else {
        hideWithDelay();
      }
    } else {
      hideWithDelay();
    }
  }, [loadingConfig?.minimumDuration]);

  const updateSteps = useCallback((steps: LoadingStep[]) => {
    setLoadingConfig(prev => prev ? { ...prev, steps } : null);
  }, []);

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
  
  MULTI_ITEM_DETECTION: {
    title: '🔍 Detecting Multiple Items...',
    subtitle: 'Analyzing your photo...',
    style: 'analysis' as const,
    steps: [
      { icon: '📸', text: 'Processing image' },
      { icon: '👔', text: 'Identifying clothing items' },
      { icon: '📐', text: 'Drawing bounding boxes' },
    ],
    minimumDuration: 1000,
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