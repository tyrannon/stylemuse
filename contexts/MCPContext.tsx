import React, { createContext, useReducer, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Define the shape of our MCP context state
export interface MCPState {
  userPreferences: {
    favoriteColors?: string[];
    preferredStyles?: string[];
    bodyType?: string;
    budget?: string;
    occasions?: string[];
    avoidColors?: string[];
    styleGoals?: string[];
  };
  styleDNA: {
    analysisResults?: any;
    fashionPrompt?: string;
    styleSummary?: string;
    personalityTraits?: string[];
    confidenceScore?: number;
    lastUpdated?: Date;
  };
  wardrobeContext: {
    totalItems?: number;
    categories?: Record<string, number>;
    recentlyAdded?: any[];
    mostWorn?: any[];
    needsAttention?: any[];
    tags?: string[];
  };
  outfitContext: {
    recentOutfits?: any[];
    favoriteOutfits?: any[];
    outfitHistory?: any[];
    generationPreferences?: any;
    lastGenerated?: Date;
    successfulCombinations?: any[];
  };
  interactionPatterns: {
    sessionCount?: number;
    featureUsage?: Record<string, number>;
    navigationPatterns?: string[];
    timeSpent?: Record<string, number>;
    lastActive?: Date;
    engagement?: {
      outfitGenerations: number;
      photoUploads: number;
      settingsChanges: number;
    };
  };
  aiModelPerformance: {
    outfitGenerationSuccess?: number;
    outfitGenerationFailure?: number;
    averageResponseTime?: number;
    userSatisfactionRating?: number;
    modelVersion?: string;
    lastPerformanceUpdate?: Date;
  };
  contextVersion: string;
  lastSaved: Date | null;
}

// Define action types
export const MCPActionTypes = {
  // User preferences
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
  UPDATE_USER_PREFERENCES: 'UPDATE_USER_PREFERENCES',
  
  // Style DNA
  SET_STYLE_DNA: 'SET_STYLE_DNA',
  UPDATE_STYLE_DNA: 'UPDATE_STYLE_DNA',
  
  // Wardrobe context
  UPDATE_WARDROBE_CONTEXT: 'UPDATE_WARDROBE_CONTEXT',
  ADD_WARDROBE_ITEM_TO_CONTEXT: 'ADD_WARDROBE_ITEM_TO_CONTEXT',
  
  // Outfit context
  SET_OUTFIT_CONTEXT: 'SET_OUTFIT_CONTEXT',
  ADD_RECENT_OUTFIT: 'ADD_RECENT_OUTFIT',
  UPDATE_OUTFIT_PREFERENCES: 'UPDATE_OUTFIT_PREFERENCES',
  
  // Interaction tracking
  LOG_INTERACTION: 'LOG_INTERACTION',
  UPDATE_ENGAGEMENT: 'UPDATE_ENGAGEMENT',
  TRACK_FEATURE_USAGE: 'TRACK_FEATURE_USAGE',
  
  // AI performance
  LOG_AI_PERFORMANCE: 'LOG_AI_PERFORMANCE',
  UPDATE_MODEL_METRICS: 'UPDATE_MODEL_METRICS',
  
  // System
  RESTORE_FROM_STORAGE: 'RESTORE_FROM_STORAGE',
  RESET_CONTEXT: 'RESET_CONTEXT',
} as const;

export type MCPAction = {
  type: keyof typeof MCPActionTypes;
  payload: any;
};

// Initial state
const initialState: MCPState = {
  userPreferences: {},
  styleDNA: {},
  wardrobeContext: {},
  outfitContext: {},
  interactionPatterns: {
    sessionCount: 0,
    featureUsage: {},
    engagement: {
      outfitGenerations: 0,
      photoUploads: 0,
      settingsChanges: 0,
    },
  },
  aiModelPerformance: {
    outfitGenerationSuccess: 0,
    outfitGenerationFailure: 0,
    averageResponseTime: 0,
    userSatisfactionRating: 0,
    modelVersion: 'gpt-4o-mini',
  },
  contextVersion: '1.0.0',
  lastSaved: null,
};

// Context reducer
const mcpReducer = (state: MCPState, action: MCPAction): MCPState => {
  const newState = (() => {
    switch (action.type) {
      case MCPActionTypes.SET_USER_PREFERENCES:
        return {
          ...state,
          userPreferences: action.payload,
        };

      case MCPActionTypes.UPDATE_USER_PREFERENCES:
        return {
          ...state,
          userPreferences: {
            ...state.userPreferences,
            ...action.payload,
          },
        };

      case MCPActionTypes.SET_STYLE_DNA:
        return {
          ...state,
          styleDNA: {
            ...action.payload,
            lastUpdated: new Date(),
          },
        };

      case MCPActionTypes.UPDATE_STYLE_DNA:
        return {
          ...state,
          styleDNA: {
            ...state.styleDNA,
            ...action.payload,
            lastUpdated: new Date(),
          },
        };

      case MCPActionTypes.UPDATE_WARDROBE_CONTEXT:
        return {
          ...state,
          wardrobeContext: {
            ...state.wardrobeContext,
            ...action.payload,
          },
        };

      case MCPActionTypes.ADD_WARDROBE_ITEM_TO_CONTEXT:
        return {
          ...state,
          wardrobeContext: {
            ...state.wardrobeContext,
            totalItems: (state.wardrobeContext.totalItems || 0) + 1,
            recentlyAdded: [
              action.payload,
              ...(state.wardrobeContext.recentlyAdded || []).slice(0, 9)
            ],
          },
        };

      case MCPActionTypes.SET_OUTFIT_CONTEXT:
        return {
          ...state,
          outfitContext: {
            ...state.outfitContext,
            ...action.payload,
          },
        };

      case MCPActionTypes.ADD_RECENT_OUTFIT:
        return {
          ...state,
          outfitContext: {
            ...state.outfitContext,
            recentOutfits: [
              action.payload,
              ...(state.outfitContext.recentOutfits || []).slice(0, 19)
            ],
            lastGenerated: new Date(),
          },
        };

      case MCPActionTypes.UPDATE_OUTFIT_PREFERENCES:
        return {
          ...state,
          outfitContext: {
            ...state.outfitContext,
            generationPreferences: {
              ...state.outfitContext.generationPreferences,
              ...action.payload,
            },
          },
        };

      case MCPActionTypes.LOG_INTERACTION:
        return {
          ...state,
          interactionPatterns: {
            ...state.interactionPatterns,
            navigationPatterns: [
              action.payload,
              ...(state.interactionPatterns.navigationPatterns || []).slice(0, 49)
            ],
            lastActive: new Date(),
          },
        };

      case MCPActionTypes.UPDATE_ENGAGEMENT:
        return {
          ...state,
          interactionPatterns: {
            ...state.interactionPatterns,
            engagement: {
              ...state.interactionPatterns.engagement,
              ...action.payload,
            },
          },
        };

      case MCPActionTypes.TRACK_FEATURE_USAGE:
        const { feature } = action.payload;
        return {
          ...state,
          interactionPatterns: {
            ...state.interactionPatterns,
            featureUsage: {
              ...state.interactionPatterns.featureUsage,
              [feature]: (state.interactionPatterns.featureUsage?.[feature] || 0) + 1,
            },
          },
        };

      case MCPActionTypes.LOG_AI_PERFORMANCE:
        const { success, responseTime, operation } = action.payload;
        return {
          ...state,
          aiModelPerformance: {
            ...state.aiModelPerformance,
            ...(operation === 'outfit_generation' && {
              outfitGenerationSuccess: success 
                ? (state.aiModelPerformance.outfitGenerationSuccess || 0) + 1
                : state.aiModelPerformance.outfitGenerationSuccess || 0,
              outfitGenerationFailure: !success 
                ? (state.aiModelPerformance.outfitGenerationFailure || 0) + 1
                : state.aiModelPerformance.outfitGenerationFailure || 0,
            }),
            averageResponseTime: responseTime 
              ? ((state.aiModelPerformance.averageResponseTime || 0) + responseTime) / 2
              : state.aiModelPerformance.averageResponseTime,
            lastPerformanceUpdate: new Date(),
          },
        };

      case MCPActionTypes.UPDATE_MODEL_METRICS:
        return {
          ...state,
          aiModelPerformance: {
            ...state.aiModelPerformance,
            ...action.payload,
          },
        };

      case MCPActionTypes.RESTORE_FROM_STORAGE:
        return {
          ...action.payload,
        };

      case MCPActionTypes.RESET_CONTEXT:
        return {
          ...initialState,
          contextVersion: state.contextVersion,
        };

      default:
        return state;
    }
  })();

  // Update lastSaved timestamp for any state change
  return {
    ...newState,
    lastSaved: new Date(),
  };
};

// Create context
const MCPContext = createContext<{
  state: MCPState;
  dispatch: React.Dispatch<MCPAction>;
  saveToStorage: () => Promise<void>;
  getAIContext: (operation: string) => any;
  trackFeature: (feature: string) => void;
  logAIPerformance: (operation: string, success: boolean, responseTime?: number) => void;
} | null>(null);

// MCP Provider component
export const MCPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(mcpReducer, initialState);

  // Save to AsyncStorage
  const saveToStorage = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem('mcp_context', JSON.stringify(state));
      logger.info(LogCategories.STORAGE, 'MCP context saved to storage');
    } catch (error) {
      logger.error(LogCategories.STORAGE, 'Failed to save MCP context', error);
    }
  };

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const storedContext = await AsyncStorage.getItem('mcp_context');
        if (storedContext) {
          const parsedContext = JSON.parse(storedContext);
          dispatch({
            type: MCPActionTypes.RESTORE_FROM_STORAGE,
            payload: parsedContext,
          });
          logger.info(LogCategories.STORAGE, 'MCP context restored from storage');
        }
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to load MCP context', error);
      }
    };

    loadFromStorage();
  }, []);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage();
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timer);
  }, [state]);

  // Helper function to get AI context for operations
  const getAIContext = (operation: string) => {
    const baseContext = {
      userPreferences: state.userPreferences,
      styleDNA: state.styleDNA,
      wardrobeStats: {
        totalItems: state.wardrobeContext.totalItems,
        categories: state.wardrobeContext.categories,
      },
    };

    switch (operation) {
      case 'outfit_generation':
        return {
          ...baseContext,
          recentOutfits: state.outfitContext.recentOutfits?.slice(0, 5),
          generationPreferences: state.outfitContext.generationPreferences,
          successfulCombinations: state.outfitContext.successfulCombinations?.slice(0, 3),
        };

      case 'style_analysis':
        return {
          ...baseContext,
          previousAnalysis: state.styleDNA.analysisResults,
          interactionHistory: state.interactionPatterns.navigationPatterns?.slice(0, 10),
        };

      case 'wardrobe_analysis':
        return {
          ...baseContext,
          wardrobeContext: state.wardrobeContext,
          wearPatterns: state.interactionPatterns.featureUsage,
        };

      default:
        return baseContext;
    }
  };

  // Helper function to track feature usage
  const trackFeature = (feature: string) => {
    dispatch({
      type: MCPActionTypes.TRACK_FEATURE_USAGE,
      payload: { feature },
    });
  };

  // Helper function to log AI performance
  const logAIPerformance = (operation: string, success: boolean, responseTime?: number) => {
    dispatch({
      type: MCPActionTypes.LOG_AI_PERFORMANCE,
      payload: { operation, success, responseTime },
    });
  };

  return (
    <MCPContext.Provider value={{
      state,
      dispatch,
      saveToStorage,
      getAIContext,
      trackFeature,
      logAIPerformance,
    }}>
      {children}
    </MCPContext.Provider>
  );
};

// Custom hook to use MCP context
export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
};

// Helper hooks for specific context areas
export const useUserPreferences = () => {
  const { state, dispatch } = useMCP();
  
  const updatePreferences = (preferences: Partial<MCPState['userPreferences']>) => {
    dispatch({
      type: MCPActionTypes.UPDATE_USER_PREFERENCES,
      payload: preferences,
    });
  };

  return {
    preferences: state.userPreferences,
    updatePreferences,
  };
};

export const useStyleDNA = () => {
  const { state, dispatch } = useMCP();
  
  const updateStyleDNA = (dna: Partial<MCPState['styleDNA']>) => {
    dispatch({
      type: MCPActionTypes.UPDATE_STYLE_DNA,
      payload: dna,
    });
  };

  return {
    styleDNA: state.styleDNA,
    updateStyleDNA,
  };
};

export const useOutfitContext = () => {
  const { state, dispatch } = useMCP();
  
  const addRecentOutfit = (outfit: any) => {
    dispatch({
      type: MCPActionTypes.ADD_RECENT_OUTFIT,
      payload: outfit,
    });
  };

  return {
    outfitContext: state.outfitContext,
    addRecentOutfit,
  };
};