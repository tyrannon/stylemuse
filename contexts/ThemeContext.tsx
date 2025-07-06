import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Primary colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // UI colors
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  
  // Borders & Dividers
  border: string;
  divider: string;
  
  // Overlays
  overlay: string;
  modalBackdrop: string;
  
  // Loading overlay
  loadingOverlay: string;
  loadingCard: string;
}

interface ThemeShadows {
  small: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  large: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  shadows: ThemeShadows;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const LIGHT_THEME: Theme = {
  mode: 'light',
  colors: {
    // Primary colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    
    // Text colors
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    // UI colors
    primary: '#007AFF',
    secondary: '#8E8E93',
    accent: '#FF6B35',
    error: '#FF3B30',
    success: '#4CAF50',
    warning: '#FF9500',
    
    // Borders & Dividers
    border: '#E0E0E0',
    divider: '#EEEEEE',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackdrop: 'rgba(0, 0, 0, 0.6)',
    
    // Loading overlay
    loadingOverlay: 'rgba(255, 255, 255, 0.95)',
    loadingCard: '#FFFFFF',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

const DARK_THEME: Theme = {
  mode: 'dark',
  colors: {
    // Primary colors
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textMuted: '#636366',
    
    // UI colors
    primary: '#0A84FF', // Brighter blue for dark mode
    secondary: '#8E8E93',
    accent: '#FF6B35', // Warmer accent for contrast
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    
    // Borders & Dividers
    border: '#38383A',
    divider: '#38383A',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.8)',
    modalBackdrop: 'rgba(0, 0, 0, 0.85)',
    
    // Loading overlay
    loadingOverlay: 'rgba(0, 0, 0, 0.85)',
    loadingCard: '#1C1C1E',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@stylemuse_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  // Determine actual theme based on mode and system preference
  const getActualTheme = (mode: ThemeMode): Theme => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
    }
    return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
  };

  const [theme, setTheme] = useState<Theme>(getActualTheme(themeMode));
  const isDark = theme.mode === 'dark';

  // Load saved theme mode on startup
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error);
      }
    };
    loadThemeMode();
  }, []);

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // Update theme when mode or system preference changes
  useEffect(() => {
    setTheme(getActualTheme(themeMode));
  }, [themeMode, systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
      // Still update the state even if storage fails
      setThemeModeState(mode);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hook for accessing theme colors directly
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Utility hook for accessing theme shadows directly
export const useThemeShadows = () => {
  const { theme } = useTheme();
  return theme.shadows;
};