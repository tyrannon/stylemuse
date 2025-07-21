import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Filter options
export const OCCASION_OPTIONS = [
  { value: 'work', label: 'Work/Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '👕' },
  { value: 'formal', label: 'Formal/Evening', emoji: '🎩' },
  { value: 'party', label: 'Party/Night Out', emoji: '🎉' },
  { value: 'athletic', label: 'Athletic/Gym', emoji: '🏃' },
  { value: 'date', label: 'Date Night', emoji: '💕' },
];

export const STYLE_OPTIONS = [
  { value: 'classic', label: 'Classic', emoji: '🎭' },
  { value: 'bohemian', label: 'Bohemian', emoji: '🌻' },
  { value: 'minimalist', label: 'Minimalist', emoji: '⚪' },
  { value: 'sporty', label: 'Sporty', emoji: '⚡' },
  { value: 'edgy', label: 'Edgy', emoji: '🔥' },
  { value: 'preppy', label: 'Preppy', emoji: '📚' },
];

export const COLOR_OPTIONS = [
  { value: 'monochrome', label: 'Monochrome', emoji: '⚫' },
  { value: 'earth', label: 'Earth Tones', emoji: '🌍' },
  { value: 'pastels', label: 'Pastels', emoji: '🌸' },
  { value: 'brights', label: 'Brights', emoji: '🌈' },
  { value: 'neutrals', label: 'Neutrals', emoji: '⚪' },
  { value: 'jewel', label: 'Jewel Tones', emoji: '💎' },
];

export const SEASON_OPTIONS = [
  { value: 'spring', label: 'Spring', emoji: '🌷' },
  { value: 'summer', label: 'Summer', emoji: '☀️' },
  { value: 'fall', label: 'Fall/Autumn', emoji: '🍂' },
  { value: 'winter', label: 'Winter', emoji: '❄️' },
  { value: 'all', label: 'All-Season', emoji: '🌍' },
];

// Quick filter presets
export const QUICK_FILTERS = [
  { 
    id: 'work-ready',
    label: 'Work Ready',
    emoji: '💼',
    filters: { occasion: ['work'], style: ['classic', 'minimalist'] }
  },
  { 
    id: 'weekend-casual',
    label: 'Weekend Casual',
    emoji: '🏖️',
    filters: { occasion: ['casual'], style: ['bohemian', 'sporty'] }
  },
  { 
    id: 'date-night',
    label: 'Date Night',
    emoji: '💕',
    filters: { occasion: ['date', 'formal'], style: ['classic', 'edgy'] }
  },
  {
    id: 'gym-ready',
    label: 'Gym Ready',
    emoji: '💪',
    filters: { occasion: ['athletic'], style: ['sporty'] }
  },
];

// Filter state interface
export interface FilterState {
  occasion: string[];
  style: string[];
  colorPalette: string[];
  season: string[];
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'mostWorn' | 'leastWorn';
}

// Initial state
const initialState: FilterState = {
  occasion: [],
  style: [],
  colorPalette: [],
  season: [],
  searchQuery: '',
  sortBy: 'newest',
};

// Action types
type FilterAction = 
  | { type: 'SET_FILTER'; category: keyof FilterState; values: string[] }
  | { type: 'TOGGLE_FILTER'; category: keyof Omit<FilterState, 'searchQuery' | 'sortBy'>; value: string }
  | { type: 'CLEAR_CATEGORY'; category: keyof FilterState }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_SORT'; sortBy: FilterState['sortBy'] }
  | { type: 'APPLY_QUICK_FILTER'; filters: Partial<FilterState> }
  | { type: 'RESTORE_FROM_STORAGE'; state: FilterState };

// Reducer
const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        [action.category]: action.values,
      };

    case 'TOGGLE_FILTER': {
      const currentValues = state[action.category] as string[];
      const newValues = currentValues.includes(action.value)
        ? currentValues.filter(v => v !== action.value)
        : [...currentValues, action.value];
      
      return {
        ...state,
        [action.category]: newValues,
      };
    }

    case 'CLEAR_CATEGORY':
      return {
        ...state,
        [action.category]: action.category === 'searchQuery' ? '' : 
                          action.category === 'sortBy' ? 'newest' : [],
      };

    case 'CLEAR_ALL':
      return initialState;

    case 'SET_SEARCH':
      return {
        ...state,
        searchQuery: action.query,
      };

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.sortBy,
      };

    case 'APPLY_QUICK_FILTER':
      return {
        ...state,
        ...action.filters,
      };

    case 'RESTORE_FROM_STORAGE':
      return action.state;

    default:
      return state;
  }
};

// Context
interface FilterContextValue {
  filters: FilterState;
  setFilter: (category: keyof FilterState, values: string[]) => void;
  toggleFilter: (category: keyof Omit<FilterState, 'searchQuery' | 'sortBy'>, value: string) => void;
  clearCategory: (category: keyof FilterState) => void;
  clearAllFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  applyQuickFilter: (quickFilter: typeof QUICK_FILTERS[0]) => void;
  isFilterActive: () => boolean;
  getActiveFilterCount: () => number;
}

const OutfitFilterContext = createContext<FilterContextValue | null>(null);

// Provider
export const OutfitFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem('outfit_filters');
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);
          dispatch({ type: 'RESTORE_FROM_STORAGE', state: parsedFilters });
          logger.info(LogCategories.STORAGE, 'Outfit filters restored from storage');
        }
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to load outfit filters', error);
      }
    };
    loadFilters();
  }, []);

  // Save filters to storage on change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem('outfit_filters', JSON.stringify(state));
        logger.info(LogCategories.STORAGE, 'Outfit filters saved to storage');
      } catch (error) {
        logger.error(LogCategories.STORAGE, 'Failed to save outfit filters', error);
      }
    };
    
    // Debounce saves
    const timer = setTimeout(saveFilters, 500);
    return () => clearTimeout(timer);
  }, [state]);

  // Context value
  const value: FilterContextValue = {
    filters: state,
    
    setFilter: (category, values) => {
      dispatch({ type: 'SET_FILTER', category, values });
    },
    
    toggleFilter: (category, value) => {
      dispatch({ type: 'TOGGLE_FILTER', category, value });
    },
    
    clearCategory: (category) => {
      dispatch({ type: 'CLEAR_CATEGORY', category });
    },
    
    clearAllFilters: () => {
      dispatch({ type: 'CLEAR_ALL' });
    },
    
    setSearchQuery: (query) => {
      dispatch({ type: 'SET_SEARCH', query });
    },
    
    setSortBy: (sortBy) => {
      dispatch({ type: 'SET_SORT', sortBy });
    },
    
    applyQuickFilter: (quickFilter) => {
      dispatch({ type: 'APPLY_QUICK_FILTER', filters: quickFilter.filters });
    },
    
    isFilterActive: () => {
      return (
        state.occasion.length > 0 ||
        state.style.length > 0 ||
        state.colorPalette.length > 0 ||
        state.season.length > 0 ||
        state.searchQuery.length > 0
      );
    },
    
    getActiveFilterCount: () => {
      return (
        state.occasion.length +
        state.style.length +
        state.colorPalette.length +
        state.season.length +
        (state.searchQuery.length > 0 ? 1 : 0)
      );
    },
  };

  return (
    <OutfitFilterContext.Provider value={value}>
      {children}
    </OutfitFilterContext.Provider>
  );
};

// Hook
export const useOutfitFilter = () => {
  const context = useContext(OutfitFilterContext);
  if (!context) {
    throw new Error('useOutfitFilter must be used within OutfitFilterProvider');
  }
  return context;
};

// Helper function to match outfit against filters
export const matchesFilters = (outfit: any, filters: FilterState): boolean => {
  // If no filters active, show all
  if (!filters.occasion.length && 
      !filters.style.length && 
      !filters.colorPalette.length && 
      !filters.season.length && 
      !filters.searchQuery) {
    return true;
  }

  // Get metadata from outfit (handle both old and new formats)
  const metadata = outfit.metadata || {};
  
  // Debug: Log outfit metadata
  console.log("🔍 Checking outfit against filters:", {
    outfitId: outfit.id,
    hasMetadata: !!outfit.metadata,
    metadata: metadata,
    activeFilters: {
      occasion: filters.occasion,
      style: filters.style,
      colorPalette: filters.colorPalette,
      season: filters.season,
    }
  });

  // Check occasion match
  if (filters.occasion.length > 0) {
    if (!metadata.occasion || !filters.occasion.includes(metadata.occasion)) {
      return false;
    }
  }

  // Check style match
  if (filters.style.length > 0) {
    if (!metadata.style || !filters.style.some(style => metadata.style?.includes(style))) {
      return false;
    }
  }

  // Check color palette match
  if (filters.colorPalette.length > 0) {
    if (!metadata.colorPaletteType || !filters.colorPalette.includes(metadata.colorPaletteType)) {
      return false;
    }
  }

  // Check season match
  if (filters.season.length > 0) {
    if (!metadata.season || !filters.season.some(season => metadata.season?.includes(season))) {
      return false;
    }
  }

  // Check search query match
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const searchableText = [
      outfit.description,
      metadata.occasion,
      ...(metadata.style || []),
      metadata.colorPaletteType,
      ...(metadata.season || []),
      ...(metadata.tags || []),
      metadata.formality,
      metadata.weatherAppropriateness,
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (!searchableText.includes(query)) {
      return false;
    }
  }

  return true;
};