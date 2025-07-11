# StyleMuse Development Guide

This document contains important information for development assistance and code maintenance.

## Color Scheming System

### Theme Architecture

StyleMuse uses a comprehensive theming system built with React Context that supports:
- **Light Mode**: Default bright theme
- **Dark Mode**: Dark theme with proper contrast ratios
- **System Mode**: Auto-follows device appearance settings

### Theme Context Location
- **Main Implementation**: `/contexts/ThemeContext.tsx`
- **Usage Hook**: `useTheme()` - provides theme colors, mode, and controls
- **Additional Hooks**: `useThemeColors()`, `useThemeShadows()`

### Color Palette Structure

Each theme includes 17 color properties:

```typescript
interface ThemeColors {
  // Primary colors
  background: string;    // Main background color
  surface: string;       // Card/surface backgrounds
  card: string;          // Individual card backgrounds
  
  // Text colors
  text: string;          // Primary text
  textSecondary: string; // Secondary text
  textMuted: string;     // Muted text
  
  // UI colors
  primary: string;       // Primary brand color
  secondary: string;     // Secondary UI elements
  accent: string;        // Accent highlights
  error: string;         // Error states
  success: string;       // Success states
  warning: string;       // Warning states
  
  // Borders & Dividers
  border: string;        // Border lines
  divider: string;       // Section dividers
  
  // Overlays
  overlay: string;       // Modal overlays
  modalBackdrop: string; // Modal backgrounds
  
  // Loading overlays
  loadingOverlay: string; // Loading screen backgrounds
  loadingCard: string;    // Loading card backgrounds
}
```

### Color Values

#### Light Mode Colors
- Background: `#FFFFFF`
- Surface: `#F8F9FA`
- Card: `#FFFFFF`
- Text: `#000000`
- Text Secondary: `#666666`
- Text Muted: `#999999`
- Primary: `#007AFF`
- Error: `#FF3B30`
- Success: `#4CAF50`
- Warning: `#FF9500`
- Border: `#E0E0E0`

#### Dark Mode Colors
- Background: `#000000`
- Surface: `#1C1C1E`
- Card: `#2C2C2E`
- Text: `#FFFFFF`
- Text Secondary: `#8E8E93`
- Text Muted: `#636366`
- Primary: `#0A84FF` (brighter for dark mode)
- Error: `#FF453A`
- Success: `#30D158`
- Warning: `#FF9F0A`
- Border: `#38383A`

### Shadow System

The theming system includes pre-configured shadow styles:
- **Small**: Subtle elevation (buttons, small cards)
- **Medium**: Standard elevation (cards, modals)
- **Large**: High elevation (floating elements)

Dark mode shadows have higher opacity for better visibility.

### Usage Patterns

#### 1. Static Styles → Dynamic Styles Conversion

**Before (Static):**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
});
```

**After (Dynamic):**
```typescript
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
});

// In component:
const { theme } = useTheme();
const styles = createStyles(theme);
```

#### 2. Component Implementation

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, setThemeMode } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Content
      </Text>
    </View>
  );
};
```

#### 3. Inline Style Theming

For simple cases, use theme colors directly:
```typescript
<View style={{ backgroundColor: theme.colors.surface }}>
  <Text style={{ color: theme.colors.textSecondary }}>Text</Text>
</View>
```

### Components Using Theme System

**Fully Implemented:**
- ✅ ProfilePage.tsx
- ✅ BuilderPage.tsx  
- ✅ WardrobePage.tsx
- ✅ AIOutfitAssistant.tsx
- ✅ SmartSuggestionsModal.tsx
- ✅ UnifiedLoadingOverlay.tsx
- ✅ BottomNavigation.tsx

**Recently Completed:**
- ✅ ItemDetailView.tsx (hardcoded colors converted to theme system)
- ✅ WardrobeUploadScreen.styles.ts (50+ hardcoded colors converted)
- ✅ CameraScreen.tsx (18+ hardcoded colors converted)
- ✅ PhotoEditingScreen.tsx (20+ hardcoded colors converted)
- ✅ BoundingBoxOverlay.tsx (15+ hardcoded colors converted)
- ✅ All legacy components with `#` color values updated

### Testing Dark Mode

1. Navigate to Profile page
2. Use the "🌙 Dark Mode" toggle
3. Test all three modes: Light, Dark, Auto
4. Verify no hardcoded colors appear bright in dark mode
5. Check text contrast and readability

### Adding New Colors

When adding new UI elements:

1. Use existing theme colors when possible
2. If new colors needed, add to `ThemeColors` interface
3. Define values for both LIGHT_THEME and DARK_THEME
4. Ensure proper contrast ratios (WCAG AA compliance)
5. Test in both light and dark modes

### Common Issues

1. **Hardcoded Colors**: Always use `theme.colors.*` instead of hex values
2. **Text Visibility**: Use `theme.colors.text` for primary text, `textSecondary` for less important text
3. **Background Contrast**: Use `theme.colors.card` for individual cards, `surface` for larger areas
4. **Border Visibility**: Use `theme.colors.border` for subtle borders that work in both modes

### Future Enhancements

- 🎨 Tokyo color scheme (planned)
- 🎭 Additional theme variants
- 🌈 User-customizable accent colors
- 📱 Per-component theme overrides

## Commands for Development

### Running Tests
```bash
npm test        # Run unit tests
npm run test:e2e # Run end-to-end tests (if available)
```

### Linting and Type Checking
```bash
npm run lint      # ESLint check
npm run typecheck # TypeScript check
```

**Important**: Always run lint and typecheck after making changes to ensure code quality.

### Building
```bash
npm run build     # Production build
npm run dev       # Development server
```

## Multi-Item Detection and Shoe Detection

### Improvements Made
- **Default Multi-Item Mode**: Multi-item detection is now enabled by default in camera
- **Enhanced UI Guidance**: Camera shows clearer instructions mentioning shoes specifically
- **Improved Feedback**: Console logging when multiple shoes are successfully detected
- **Robust Detection Logic**: AI prompt specifically instructs aggressive shoe detection

### Detection Capabilities
- Detects each shoe separately (left, right, or different pairs)
- Comprehensive shoe categories: sneakers, boots, heels, sandals, slippers
- Works for multiple clothing items in same photo
- Automatic bounding box generation for each detected item

### User Instructions
1. Position multiple items (including both shoes) in camera frame
2. Multi-item mode is enabled by default (toggle available in camera)
3. AI will automatically detect and separate each item
4. Each detected item gets its own wardrobe entry

## Unified Loading System Architecture

### Overview
StyleMuse uses a sophisticated unified loading system that provides non-blocking background processing with a simple header loading animation. This system allows users to continue navigating while long operations (like outfit generation) run in the background.

### Key Components

#### 1. useUnifiedLoading Hook (`/hooks/useUnifiedLoading.ts`)
- **Purpose**: Centralized loading state management
- **Features**: Configuration-based loading states with titles, subtitles, and steps
- **Usage**: Creates loading instances that can be shared across components

#### 2. Header Loading Animation (`WardrobeUploadScreen.tsx`)
- **Location**: Main header with spinning animation
- **Behavior**: Non-blocking, allows full navigation during operations
- **Animation**: Smooth spinning icon using `Animated.Value`

#### 3. Shared Loading Instance Pattern
- **Architecture**: Single loading instance shared across related components
- **Benefits**: Consistent loading state across component hierarchy
- **Implementation**: Pass `unifiedLoading` instance as prop to child components

### Critical Architecture Pattern: Hook Loading Instance Sharing

**Problem Solved**: Multiple `useUnifiedLoading()` calls create isolated loading states, causing loading animations to not appear when expected.

**Solution Pattern**:
```typescript
// Parent component (WardrobeUploadScreen)
const unifiedLoading = useUnifiedLoading();
const outfitGeneration = useOutfitGeneration(
  savedItems, 
  categorizeItem, 
  navigateToBuilder, 
  unifiedLoading  // Pass shared instance
);

// Hook implementation (useOutfitGeneration)
export const useOutfitGeneration = (
  savedItems: WardrobeItem[],
  categorizeItem: (item: WardrobeItem) => string,
  navigateToBuilder?: () => void,
  sharedLoading?: any  // Accept shared instance
): OutfitGenerationState => {
  const localUnifiedLoading = useUnifiedLoading();
  const unifiedLoading = sharedLoading || localUnifiedLoading; // Use shared if provided
  
  // Use unifiedLoading throughout the hook
  const generateOutfitSuggestions = async () => {
    unifiedLoading.showLoading(LOADING_CONFIGS.OUTFIT_GENERATION);
    // ... outfit generation logic
    unifiedLoading.hideLoading();
  };
};

// Child component (ItemDetailView)
<AIOutfitAssistant 
  sharedLoading={sharedLoading}  // Pass through to sub-components
  onOutfitGenerated={generateOutfitSuggestions}  // Uses shared loading
/>
```

### Loading State Flow

1. **User Action**: "Complete Outfit" button pressed in item detail
2. **AIOutfitAssistant**: Uses shared loading instance 
3. **generateOutfitSuggestions**: Called with shared loading instance
4. **Header Animation**: Triggered by shared loading state
5. **Background Processing**: Outfit generation runs without blocking UI
6. **Navigation**: User can navigate freely during operation
7. **Completion**: Loading stops, header animation stops

### Components Using Shared Loading

**Fully Implemented**:
- ✅ WardrobeUploadScreen (main loading instance)
- ✅ useOutfitGeneration hook (accepts shared instance)
- ✅ AIOutfitAssistant (uses shared loading when provided)
- ✅ ItemDetailView (passes shared loading through)

### Benefits Achieved

- **Non-Blocking UX**: Users can navigate during long operations
- **Consistent Feedback**: Single loading animation for all operations
- **Simple UI**: Clean header loading bar instead of modal overlays
- **Student-Friendly**: Intuitive loading feedback without complexity

## Debug Logging System

StyleMuse includes a comprehensive debug logging system for development and production monitoring.

### Key Features
- **🛠️ Robust Logging**: 5 log levels with file rotation and cleanup
- **🔒 Privacy Protection**: Automatic sanitization of sensitive data
- **📊 Performance Tracking**: Built-in timing helpers for operations
- **💾 File Management**: Auto-rotation at 5MB, keeps 10 files max
- **🎯 17 Log Categories**: Covering all app functionality

### Usage
```typescript
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Basic logging
logger.info(LogCategories.USER_ACTION, 'Button clicked');
logger.error(LogCategories.API_CALLS, 'Request failed', error);

// Performance tracking
const endTracking = logger.startPerformanceTracking('operation');
await doWork();
endTracking(); // Automatically logs duration
```

### Documentation
- **Full Guide**: `DEBUG_SYSTEM_DOCUMENTATION.md`
- **Quick Reference**: `DEBUG_QUICK_REFERENCE.md`

### Integration
- ✅ All API calls (OpenAI/DALL-E) logged with timing
- ✅ AI outfit generation workflow fully tracked
- ✅ Wardrobe operations (load, save, laundry) logged
- ✅ Global error handling and crash reporting

## Recent Updates

- ✅ **Implemented comprehensive debug logging system**
- ✅ **Added privacy-first data sanitization**
- ✅ **Integrated logging across all major features**
- ✅ Expanded dark mode app-wide (BuilderPage, WardrobePage, ProfilePage)
- ✅ Implemented unified loading animations across key operations
- ✅ **Fixed shared loading instance architecture for complete outfit feature**
- ✅ **Implemented non-blocking header loading system**
- ✅ Fixed AI outfit assistant button colors for dark mode
- ✅ Removed fresh outfit ideas section from wardrobe
- ✅ Updated loading screens to use unified loading overlay
- ✅ Fixed profile page cards brightness in dark mode
- ✅ Implemented Tokyo color scheme with neon aesthetics
- ✅ Enhanced multi-item detection for better shoe detection
- ✅ Created comprehensive color scheming documentation
- ✅ **Resolved loading state isolation between hook instances**
- ✅ **Complete theme system hardcoded color cleanup (100+ colors converted)**
- ✅ **All major components now fully theme-compliant**