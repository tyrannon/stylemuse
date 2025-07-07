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

  // Log instance creation
  React.useEffect(() => {
    console.log('🟢 [UnifiedLoading] Hook instance created', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
    });
    return () => {
      console.log('🟢 [UnifiedLoading] Hook instance destroyed', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
      });
    };
  }, []);

  const showLoading = useCallback((config: LoadingConfig) => {
    const timestamp = Date.now();
    console.log('🟢 [UnifiedLoading] showLoading() called', {
      instanceId: instanceIdRef.current,
      timestamp,
      config: {
        title: config.title,
        subtitle: config.subtitle,
        style: config.style,
        minimumDuration: config.minimumDuration,
        stepsCount: config.steps?.length || 0,
      },
      previousLoadingState: isLoading,
    });
    
    startTimeRef.current = timestamp;
    setLoadingConfig(config);
    setIsLoading(true);
    
    console.log('🟢 [UnifiedLoading] Loading state set to true', {
      instanceId: instanceIdRef.current,
      timestamp,
      newConfig: config.title,
    });
  }, [isLoading]);

  const hideLoading = useCallback(() => {
    const hideTimestamp = Date.now();
    const startTime = startTimeRef.current;
    const elapsed = startTime ? hideTimestamp - startTime : 0;
    const minimumDuration = loadingConfig?.minimumDuration || 0;
    const remaining = minimumDuration - elapsed;
    
    console.log('🟢 [UnifiedLoading] hideLoading() called', {
      instanceId: instanceIdRef.current,
      timestamp: hideTimestamp,
      startTime,
      elapsed,
      minimumDuration,
      remaining,
      currentConfig: loadingConfig?.title || 'null',
      currentLoadingState: isLoading,
    });

    const hideWithDelay = () => {
      console.log('🟢 [UnifiedLoading] Actually hiding loading', {
        instanceId: instanceIdRef.current,
        timestamp: Date.now(),
        finalElapsed: startTime ? Date.now() - startTime : 0,
      });
      setIsLoading(false);
      setLoadingConfig(null);
      startTimeRef.current = null;
    };

    // Ensure minimum display duration if specified
    if (startTimeRef.current && loadingConfig?.minimumDuration) {
      if (remaining > 0) {
        console.log('🟢 [UnifiedLoading] Delaying hide by', remaining, 'ms', {
          instanceId: instanceIdRef.current,
        });
        setTimeout(hideWithDelay, remaining);
      } else {
        console.log('🟢 [UnifiedLoading] Minimum duration already met, hiding immediately', {
          instanceId: instanceIdRef.current,
        });
        hideWithDelay();
      }
    } else {
      console.log('🟢 [UnifiedLoading] No minimum duration, hiding immediately', {
        instanceId: instanceIdRef.current,
      });
      hideWithDelay();
    }
  }, [loadingConfig?.minimumDuration, isLoading]);

  const updateSteps = useCallback((steps: LoadingStep[]) => {
    console.log('🟢 [UnifiedLoading] updateSteps() called', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
      stepsCount: steps.length,
      currentConfig: loadingConfig?.title || 'null',
    });
    setLoadingConfig(prev => prev ? { ...prev, steps } : null);
  }, [loadingConfig?.title]);

  // Track state changes
  React.useEffect(() => {
    console.log('🟢 [UnifiedLoading] isLoading state changed', {
      instanceId: instanceIdRef.current,
      timestamp: Date.now(),
      isLoading,
      config: loadingConfig?.title || 'null',
      stackTrace: new Error().stack?.split('\n').slice(0, 5).join('\n'),
    });
  }, [isLoading, loadingConfig?.title]);

  // Track rapid show/hide cycles
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('🟢 [UnifiedLoading] WARNING: Loading has been active for 5+ seconds', {
          instanceId: instanceIdRef.current,
          timestamp: Date.now(),
          config: loadingConfig?.title || 'null',
          duration: startTimeRef.current ? Date.now() - startTimeRef.current : 'unknown',
        });
      }, 5000);
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