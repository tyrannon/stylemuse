import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'default' | 'tokyo';

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
  colorScheme: ColorScheme;
  colors: ThemeColors;
  shadows: ThemeShadows;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
}

const LIGHT_THEME: Theme = {
  mode: 'light',
  colorScheme: 'default',
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
  colorScheme: 'default',
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

// Tokyo Color Scheme - Kawaii peach-inspired Japanese aesthetics
const LIGHT_TOKYO_THEME: Theme = {
  mode: 'light',
  colorScheme: 'tokyo',
  colors: {
    // Primary colors - Soft peachy-pink with warm surfaces
    background: '#FFF8F6', // Soft cream (like mochi)
    surface: '#FFF0ED', // Peach cream (sakura petals)
    card: '#FFFFFF', // Pure white (like fresh rice paper)
    
    // Text colors
    text: '#2D1810', // Dark brown (like soy sauce)
    textSecondary: '#8B4513', // Medium brown (like miso)
    textMuted: '#CD853F', // Light brown (like tan)
    
    // UI colors - Kawaii Tokyo-inspired palette
    primary: '#FF69B4', // Hot pink (Tokyo street fashion)
    secondary: '#FFA500', // Orange (like taiyaki filling)
    accent: '#FFB6C1', // Light pink (sakura blossoms)
    error: '#FF4757', // Bright red (like shrine gates)
    success: '#32CD32', // Lime green (like matcha)
    warning: '#FFD700', // Gold (like temple decorations)
    
    // Borders & Dividers
    border: '#F4C2A1', // Peach border
    divider: '#F8D7DA', // Soft pink divider
    
    // Overlays
    overlay: 'rgba(255, 105, 180, 0.2)', // Pink overlay
    modalBackdrop: 'rgba(255, 182, 193, 0.7)', // Light pink backdrop
    
    // Loading overlay
    loadingOverlay: 'rgba(255, 248, 246, 0.95)',
    loadingCard: '#FFFFFF',
  },
  shadows: {
    small: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    medium: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    large: {
      shadowColor: '#FF69B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
  },
};

const DARK_TOKYO_THEME: Theme = {
  mode: 'dark',
  colorScheme: 'tokyo',
  colors: {
    // Primary colors - Deep night with neon cyber vibes
    background: '#0F0314', // Deep purple-black (Tokyo night sky)
    surface: '#1A0B2E', // Dark purple (neon-lit streets)
    card: '#2D1B47', // Medium purple (glowing windows)
    
    // Text colors
    text: '#F8F8FF', // Ghost white (bright neon text)
    textSecondary: '#E6E6FA', // Lavender (secondary neon)
    textMuted: '#DDA0DD', // Plum (muted neon)
    
    // UI colors - Electric cyber Tokyo palette
    primary: '#FF1493', // Deep pink (neon signs)
    secondary: '#00FFFF', // Cyan (electric blue)
    accent: '#FF6347', // Tomato (warm neon)
    error: '#FF0080', // Bright magenta (danger neon)
    success: '#00FF7F', // Spring green (success neon)
    warning: '#FF8C00', // Dark orange (warning neon)
    
    // Borders & Dividers
    border: '#8A2BE2', // Blue violet (neon borders)
    divider: '#9932CC', // Dark orchid (glowing dividers)
    
    // Overlays
    overlay: 'rgba(255, 20, 147, 0.3)', // Deep pink overlay
    modalBackdrop: 'rgba(15, 3, 20, 0.95)', // Dark purple backdrop
    
    // Loading overlay
    loadingOverlay: 'rgba(15, 3, 20, 0.95)',
    loadingCard: '#2D1B47',
  },
  shadows: {
    small: {
      shadowColor: '#FF1493',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 6,
    },
    medium: {
      shadowColor: '#FF1493',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    },
    large: {
      shadowColor: '#FF1493',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7,
      shadowRadius: 20,
      elevation: 15,
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@stylemuse_theme_mode';
const COLOR_SCHEME_STORAGE_KEY = '@stylemuse_color_scheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('default');
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  // Determine actual theme based on mode, color scheme, and system preference
  const getActualTheme = (mode: ThemeMode, scheme: ColorScheme): Theme => {
    const isDarkMode = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    
    if (scheme === 'tokyo') {
      return isDarkMode ? DARK_TOKYO_THEME : LIGHT_TOKYO_THEME;
    }
    
    // Default scheme
    return isDarkMode ? DARK_THEME : LIGHT_THEME;
  };

  const [theme, setTheme] = useState<Theme>(getActualTheme(themeMode, colorScheme));
  const isDark = theme.mode === 'dark';

  // Load saved preferences on startup
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const [savedMode, savedScheme] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(COLOR_SCHEME_STORAGE_KEY),
        ]);
        
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
        
        if (savedScheme && ['default', 'tokyo'].includes(savedScheme)) {
          setColorSchemeState(savedScheme as ColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      }
    };
    loadThemePreferences();
  }, []);

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // Update theme when mode, color scheme, or system preference changes
  useEffect(() => {
    setTheme(getActualTheme(themeMode, colorScheme));
  }, [themeMode, colorScheme, systemColorScheme]);

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

  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
      setColorSchemeState(scheme);
    } catch (error) {
      console.error('Failed to save color scheme:', error);
      // Still update the state even if storage fails
      setColorSchemeState(scheme);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    colorScheme,
    isDark,
    setThemeMode,
    setColorScheme,
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