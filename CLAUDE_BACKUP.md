# StyleMuse Development Guide
<!-- Last edited: 2025-07-21 by Claude Code -->
<!-- Change: Completed Outfit Filtering System and Metadata Display implementation -->

This document contains important information for development assistance and code maintenance.

## 🔄 Branch Strategy
**IMPORTANT**: All recent development has been happening on the `main-stable` branch, not `main`. 
- **Primary Branch**: `main-stable` (use for all commits and PRs)
- **Legacy Branch**: `main` (mostly inactive)
- **Reason**: Stable development workflow with recent feature additions

## 🧭 Quick Start
**New to the codebase?** Start with [`CONTEXT_GUIDE.md`](CONTEXT_GUIDE.md) for a complete navigation guide and documentation loading instructions.

## 📚 Documentation Index

**Main Guides:**
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) - Zero-flicker navigation and optimization techniques
- [`docs/ICON_SYSTEM.md`](docs/ICON_SYSTEM.md) - Custom PNG icon system implementation  
- [`docs/RANDOM_OUTFIT.md`](docs/RANDOM_OUTFIT.md) - Fast algorithmic outfit generation
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) - Complete development history and completed tasks

## Outfit Filtering System

### Overview
StyleMuse implements a comprehensive filtering system for generated outfits, allowing users to quickly find outfits based on occasion, style, color, and season. This feature enhances outfit discovery and helps users find the perfect look for any situation.

### Filter Categories

#### 1. Occasion Filters
- **Work/Professional** - Business attire, office appropriate
- **Casual** - Everyday wear, relaxed fits
- **Formal/Evening** - Dressy events, cocktail parties
- **Party/Night Out** - Fun, bold, statement pieces
- **Athletic/Gym** - Workout gear, sporty looks
- **Date Night** - Romantic, polished outfits

#### 2. Style Filters
- **Classic** - Timeless, traditional pieces
- **Bohemian** - Free-spirited, artistic looks
- **Minimalist** - Clean lines, simple elegance
- **Sporty** - Athletic-inspired fashion
- **Edgy** - Bold, alternative styles
- **Preppy** - Collegiate, polished casual

#### 3. Color Palette Filters
- **Monochrome** - Single color schemes
- **Earth Tones** - Browns, beiges, greens
- **Pastels** - Soft, muted colors
- **Brights** - Vivid, bold colors
- **Neutrals** - Black, white, gray
- **Jewel Tones** - Rich, saturated colors

#### 4. Season Filters
- **Spring** - Light layers, florals
- **Summer** - Breathable, warm weather
- **Fall/Autumn** - Cozy layers, warm tones
- **Winter** - Heavy fabrics, cold weather
- **All-Season** - Versatile year-round pieces

### Architecture

#### Filter State Management
```typescript
// contexts/OutfitFilterContext.tsx
interface FilterState {
  occasion: string[];
  style: string[];
  colorPalette: string[];
  season: string[];
  searchQuery: string;
}

// Filter actions
type FilterAction = 
  | { type: 'SET_FILTER'; category: string; values: string[] }
  | { type: 'TOGGLE_FILTER'; category: string; value: string }
  | { type: 'CLEAR_CATEGORY'; category: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_SEARCH'; query: string };
```

#### UI Components

**Filter Bar** - Horizontal scrollable chip selection
```typescript
<FilterBar>
  <FilterChip category="occasion" label="Work" />
  <FilterChip category="style" label="Classic" />
  <FilterChip category="season" label="Summer" />
</FilterBar>
```

**Active Filters Display** - Shows selected filters with clear buttons
```typescript
<ActiveFilters>
  {filters.map(filter => (
    <ActiveFilterChip 
      label={filter.label} 
      onRemove={() => removeFilter(filter)}
    />
  ))}
</ActiveFilters>
```

**Filter Modal** - Full filtering interface with multi-select
```typescript
<FilterModal>
  <FilterSection title="Occasion" options={occasionOptions} />
  <FilterSection title="Style" options={styleOptions} />
  <FilterSection title="Color" options={colorOptions} />
  <FilterSection title="Season" options={seasonOptions} />
</FilterModal>
```

### Implementation Status
- ✅ FilterContext created
- ✅ Filter UI components designed
- ✅ Filtering logic implemented
- ✅ Filter persistence added
- ✅ Search functionality integrated
- 🔲 Performance optimized for large datasets

### Usage Patterns

#### Basic Filtering
```typescript
const { filters, setFilter, clearFilters } = useOutfitFilter();

// Apply multiple filters
setFilter('occasion', ['work', 'casual']);
setFilter('season', ['summer']);

// Get filtered outfits
const filteredOutfits = outfits.filter(outfit => 
  matchesFilters(outfit, filters)
);
```

#### Quick Filter Chips
```typescript
// Popular preset filters
const quickFilters = [
  { label: 'Work Ready', filters: { occasion: ['work'], style: ['classic', 'minimalist'] }},
  { label: 'Weekend Casual', filters: { occasion: ['casual'], style: ['relaxed'] }},
  { label: 'Date Night', filters: { occasion: ['date'], style: ['elegant'] }},
];
```

### Performance Considerations
- Use React.memo for filter components
- Debounce search input (300ms)
- Lazy load outfit images in filtered results
- Cache filter combinations
- Virtualize long outfit lists

### Future Enhancements
- 🎯 Smart filter suggestions based on usage
- 🤖 AI-powered outfit matching
- 📊 Filter analytics and insights
- 🔄 Saved filter presets
- 🌍 Location-based filtering (weather aware)

## Outfit Metadata Display

### Overview
StyleMuse displays comprehensive metadata for each generated outfit, providing users with context about occasion, style, color palette, and seasonal appropriateness. This metadata powers the filtering system and helps users understand outfit characteristics at a glance.

### Metadata Structure
Each outfit includes the following metadata fields:
```typescript
interface OutfitMetadata {
  // Core categorization
  occasion: 'work' | 'casual' | 'formal' | 'party' | 'athletic' | 'date';
  style: string[]; // ['classic', 'minimalist'] - can have multiple styles
  colorPalette: 'monochrome' | 'earth' | 'pastels' | 'brights' | 'neutrals' | 'jewel';
  season: string[]; // ['fall', 'winter'] - can be multi-seasonal
  
  // Additional context
  formality: string; // 'casual', 'business casual', 'formal', etc.
  confidence: number; // AI confidence score (0-100)
  styleScore: number; // Overall style rating (0-100)
  weatherAppropriateness?: string; // Based on temperature/conditions
  
  // Searchable tags
  tags: string[]; // ['business', 'professional', 'cozy', 'elegant']
}
```

### UI Display Patterns

#### Outfit Detail Page Layout
```
┌─────────────────────────────────┐
│        [Outfit Image]           │
├─────────────────────────────────┤
│ ⭐ Style Score: 92/100          │
├─────────────────────────────────┤
│ 📍 Metadata Tags                │
│ ┌────┐ ┌────────┐ ┌─────────┐  │
│ │ 💼  │ │ Classic│ │ Neutrals│  │
│ │Work │ │ Style  │ │ Palette │  │
│ └────┘ └────────┘ └─────────┘  │
│ ┌──────┐ ┌────────┐             │
│ │ Fall │ │Business│             │
│ │Season│ │ Casual │             │
│ └──────┘ └────────┘             │
├─────────────────────────────────┤
│ 📝 Outfit Details               │
│ • Perfect for: Office meetings  │
│ • Weather: Ideal for 50-70°F    │
│ • Confidence: 92% match         │
└─────────────────────────────────┘
```

#### Metadata Tag Component
```typescript
const MetadataTag = ({ icon, label, value, color }) => (
  <View style={[styles.tag, { backgroundColor: color }]}>
    <Text style={styles.tagIcon}>{icon}</Text>
    <Text style={styles.tagLabel}>{label}</Text>
    <Text style={styles.tagValue}>{value}</Text>
  </View>
);
```

### Display Locations
1. **Outfit Grid View** - Mini badges showing occasion and season
2. **Outfit Detail View** - Full metadata display with all categories
3. **Filter Results** - Highlighted matching metadata
4. **Analytics Page** - Metadata distribution charts

### Color Coding System
- **Occasion**: Primary color (theme.colors.primary)
- **Style**: Secondary color (theme.colors.secondary)
- **Color Palette**: Actual color representation
- **Season**: Seasonal colors (green/orange/blue/white)
- **Formality**: Gradient from casual to formal

### Implementation Status
- ✅ Metadata added to outfit generation
- ✅ OutfitDetailView updated with metadata display
- ✅ Metadata tags component created
- ✅ Grid view badges implemented
- 🔲 Analytics integration completed

### Future Enhancements
- 🎯 AI-powered metadata refinement based on user feedback
- 📊 Metadata trends analysis
- 🔄 Bulk metadata editing
- 🏷️ Custom user tags
- 🌍 Location-specific metadata (beach, mountains, city)

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

## Intelligent Prompt Truncation System

### Overview
StyleMuse implements an intelligent prompt truncation system to ensure all AI prompts stay within API character limits while preserving meaning and context. This prevents API errors and maintains prompt quality even with extensive user data.

### PromptTruncator Utility (`/utils/PromptTruncator.ts`)

#### Key Features
- **Smart Truncation**: Cuts at sentence/word boundaries, not mid-word
- **Priority Preservation**: Maintains critical sections using markers like `[IMPORTANT]`
- **Multiple Strategies**: Character-based and token-based truncation
- **Configurable Limits**: Pre-defined limits for different use cases
- **Custom Ellipsis**: Adds contextual truncation indicators

#### Usage
```typescript
import { PromptTruncator, PROMPT_LIMITS } from './utils/PromptTruncator';

// Simple truncation
const truncated = truncatePrompt(prompt, 'OUTFIT_GENERATION');

// Advanced with priorities
const truncated = PromptTruncator.truncate(prompt, PROMPT_LIMITS.DALLE_IMAGE, {
  preserveSentences: true,
  priorityMarkers: ['IMPORTANT', 'CRITICAL'],
  customEllipsis: '\n\n[Details truncated...]'
});
```

#### Prompt Limits
| Use Case | Character Limit | Purpose |
|----------|----------------|---------|
| `OUTFIT_GENERATION` | 3000 | OpenAI outfit generation |
| `IMAGE_ANALYSIS` | 2000 | Clothing item analysis |
| `STYLE_DESCRIPTION` | 1500 | Style descriptions |
| `QUICK_SUGGESTION` | 500 | Quick suggestions |
| `DALLE_IMAGE` | 3900 | DALL-E image generation (4k limit) |

#### Implementation Status
✅ **Integrated in all AI functions:**
- `describeClothingItem()` - Clothing analysis
- `detectMultipleClothingItems()` - Multi-item detection
- `generateIntelligentOutfitSelection()` - Outfit generation
- `generatePersonalizedOutfitImage()` - DALL-E personalized images
- `generateOutfitImage()` - DALL-E outfit images
- `generateClothingItemImage()` - DALL-E item images
- `generateSmartOutfitSuggestions()` - Smart suggestions

### Current Limitations
- **Plain Truncation**: Uses string cutting, not AI summarization
- **Context Loss**: Very long prompts may lose some context at the end
- **No Dynamic Adjustment**: Fixed limits regardless of content importance

### Future Enhancements
1. **AI-Powered Summarization**: Use GPT to intelligently summarize long sections
2. **Dynamic Priority Detection**: Automatically identify important sections
3. **Chunked Processing**: Split long prompts into multiple API calls
4. **Context Caching**: Store truncated context for follow-up requests
5. **User Preference Learning**: Adapt truncation based on user patterns

### Debugging
When truncation occurs, the system logs:
```
📏 DALL-E prompt truncated from 4303 to 3900 characters
```

This helps identify when and how much content is being truncated.

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

## Debug System Quick Reference

### Basic Usage
```typescript
import { logger } from '../utils/DebugLogger';
import { LogCategories } from '../constants/LogCategories';

// Basic logging
logger.info(LogCategories.USER_ACTION, 'Button clicked', { buttonId: 'generate-outfit' });

// Error logging
logger.error(LogCategories.API_CALLS, 'Request failed', error, { endpoint: '/api/outfit' });

// Performance tracking
const endTracking = logger.startPerformanceTracking('operation-name');
await doOperation();
endTracking(); // Automatically logs duration
```

### Log Levels
| Level | When to Use | Example |
|-------|-------------|---------|
| `VERBOSE` | Detailed debugging | Variable values, loop iterations |
| `DEBUG` | Development debugging | Function entry/exit, state changes |
| `INFO` | Important events | User actions, successful operations |
| `WARN` | Recoverable issues | Deprecation warnings, fallbacks |
| `ERROR` | Failures | Exceptions, API errors |
| `FATAL` | Critical failures | App crashes, unrecoverable errors |

### Log Categories
- `USER_ACTION` - User interactions (button clicks, navigation)
- `API_CALLS` - External API requests and responses
- `AI_ANALYSIS` - AI/ML processing and results
- `STORAGE` - Data persistence operations
- `CACHE` - Caching operations
- `NETWORK` - Network connectivity and requests
- `PERFORMANCE` - Performance metrics and timing
- `SECURITY` - Security-related events
- `UI_RENDERING` - UI updates and rendering
- `NAVIGATION` - Screen navigation and routing

### Live Log Monitoring
```bash
# Watch all logs with colors
./scripts/watch-logs.sh

# Filter specific types
./scripts/watch-logs.sh errors      # Only errors and warnings
./scripts/watch-logs.sh outfit      # Only outfit generation logs
./scripts/watch-logs.sh performance # Only performance logs
./scripts/watch-logs.sh clean       # Remove debug spam
```

### Log Streaming in Code
```typescript
import { LogStreamer, LogPresets } from './utils/LogStreamer';

// Start filtered streaming
LogStreamer.startStreaming(LogPresets.OUTFIT_GENERATION);

// Update filters on the fly
LogStreamer.updateFilters({ searchTerms: ['error', 'fail'] });

// Stop streaming
LogStreamer.stopStreaming();
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

## User Onboarding System

### Complete Implementation
StyleMuse now includes a comprehensive 6-screen onboarding flow for new users:

**Flow Architecture:**
1. **WelcomeScreen** - Animated benefits with value propositions
2. **StyleGoalsScreen** - Multi-select user goals (organize, outfits, shopping, etc.)
3. **StyleQuizScreen** - 5-question style assessment (colors, styles, occasions, body type, budget)
4. **StyleDNAOptInScreen** - Advanced AI personalization with privacy transparency
5. **PrivacyChoicesScreen** - Granular privacy controls with clear benefits
6. **TierSelectionScreen** - Pricing tiers with 7-day trial offers

### Integration Points

**App.js Integration:**
- First launch detection via `AsyncStorage.getItem('onboardingCompleted')`
- Smart existing user detection (users with data skip onboarding)
- Conditional rendering: `OnboardingNavigator` vs `WardrobeUploadScreen`
- Loading screen during onboarding status check

**Data Management:**
- Progress tracking with `onboardingStep` and `onboardingData`
- Graceful resumption if onboarding interrupted
- User preferences saved to AsyncStorage
- Tier selection persisted as `userTier`

### Start Fresh Feature

**Profile Page Integration:**
- Complete "Start Fresh" feature in settings section
- Shows current data size and item count
- Automatic backup creation before reset
- Comprehensive data clearing via `DataResetService`
- Double confirmation dialogs for safety

**DataResetService Utility:**
- Clears 25+ AsyncStorage keys comprehensively
- Validates reset completion
- Creates backup before clearing data
- Detailed logging and error handling
- Selective reset by category (wardrobe, profile, etc.)

### Industry Standards Followed

**First Launch Detection:**
- Check for `onboardingCompleted` flag
- Detect existing user data to avoid re-onboarding
- Graceful fallback on errors (assume completed to avoid blocking)

**Progressive Onboarding:**
- Skippable steps with sensible defaults
- Clear progress indicators
- Resume capability if interrupted
- Minimal friction with immediate value

**Privacy-First Design:**
- Transparent data collection with clear benefits
- Granular opt-in controls
- Easy to change later in settings
- GDPR/CCPA compliant patterns

### Testing the Onboarding

**For New Users:**
- Clear app data completely
- Restart app → onboarding shows automatically

**For Testing:**
- Use "Start Fresh" button in Profile → Settings
- Creates backup then clears all data
- Restarts onboarding flow immediately

**For Existing Users:**
- App detects existing data and skips onboarding
- Sets `onboardingCompleted` flag automatically

## Builder Page Location & Architecture

**IMPORTANT**: The builder functionality is NOT implemented in `/screens/BuilderPage.tsx`. Instead, it's implemented **inline within `/screens/WardrobeUploadScreen.tsx`**.

### Builder Implementation Details:
- **File**: `/screens/WardrobeUploadScreen.tsx` (lines ~2740-3000)
- **Section**: "Outfit Builder - Always Show" (`showOutfitBuilder` condition)
- **Components**: AI Outfit Assistant, Random Outfit Generator, Gear Slot Grid
- **State Management**: Uses `useOutfitGeneration` hook for gear slots and outfit state
- **Integration**: All builder features are inline, not separate components

### Key Builder Features:
- **AI Outfit Assistant**: Smart contextual outfit generation with Style DNA integration
- **Random Outfit Generator**: Fast algorithmic outfit creation (< 100ms vs 10+ seconds AI)
- **Gear Slot Grid**: Visual outfit builder with 6 slots (top, bottom, shoes, jacket, hat, accessories)
- **Style DNA Integration**: Personalized suggestions based on user profile analysis

### Random Outfit Generator Architecture:
- **UI Location**: Lines ~2829-2869 in WardrobeUploadScreen.tsx (purple section)
- **Styles**: In `/screens/styles/WardrobeUploadScreen.styles.ts` (lines 2261-2320)
- **Hook**: `useRandomOutfit` in `/hooks/useRandomOutfit.ts`
- **Core Algorithm**: `RandomOutfitGenerator` in `/utils/RandomOutfitGenerator.ts`
- **Style Rules**: `StyleCompatibility` in `/utils/StyleCompatibility.ts`
- **Features**: 6 style categories, color harmony, generation stats, instant results

### Builder Navigation:
- Access via bottom navigation 🎮 tab or programmatic `navigateToBuilder()` calls
- Integrated with unified loading system and shared loading instances
- Uses `outfitGeneration.gearSlots` for state management

## Fast Algorithmic Random Outfit System

**Lightning-fast random outfit generator** that provides instant outfit inspiration as an alternative to AI. Features 7 colorful emoji style buttons (🎲 Surprise, 👕 Casual, 💼 Business, etc.) generating outfits in <100ms with 100% success rate. Uses keyword-based categorization with smart fallbacks and seamless gear slot integration.

**See detailed technical guide**: [`docs/RANDOM_OUTFIT.md`](docs/RANDOM_OUTFIT.md)

## Item Tracking Systems

### Outfit & Wardrobe Viewing Tracking
**Unified tracking system** for both generated outfits and wardrobe items with red dot indicators and unviewed count badges.

**Key Features:**
- Individual item tracking with `viewed/isNew` boolean properties
- Red dot indicators (10x10px) in top-right corners using `theme.colors.error`
- Bottom navigation badges showing unviewed counts
- "Mark All as Seen" buttons in page headers for bulk marking
- AsyncStorage persistence survives app restarts
- Automatic tracking when items are opened in detail view

**Implementation:**
- `markOutfitAsViewed(outfitId)` / `markWardrobeItemAsViewed(itemIndex)`
- `markAllOutfitsAsViewed()` / `markAllWardrobeItemsAsViewed()`
- Wrapper functions with tracking: `openOutfitDetailViewWithTracking()` / `openWardrobeItemViewWithTracking()`


## Live Log Monitoring System

### Overview
StyleMuse includes a sophisticated live log monitoring system that allows developers to watch filtered, colorized logs in real-time during development and debugging sessions.

### Components

#### 1. LogStreamer (`/utils/LogStreamer.ts`)
- **Smart Filtering**: Filter by severity, categories, or search terms
- **Runtime Control**: Update filters on the fly
- **Preset Configurations**: Common filter combinations for different scenarios
- **Performance Conscious**: Minimal overhead when not in use

#### 2. Watch Script (`/scripts/watch-logs.sh`)
- **Colorized Output**: Color-coded logs for quick visual scanning
- **Multiple Filters**: Predefined filters for common debugging scenarios
- **Cross-Platform**: Works on macOS, Linux, and Windows (with WSL)
- **Easy Integration**: Simple command-line interface

### Available Log Filters

#### Predefined Filters
```bash
./scripts/watch-logs.sh errors      # Only errors and warnings
./scripts/watch-logs.sh outfit      # Random outfit generation logs
./scripts/watch-logs.sh performance # Performance timing logs
./scripts/watch-logs.sh clean       # Remove monetization debug spam
```

#### Programmatic Filtering
```typescript
import { LogStreamer, LogPresets } from './utils/LogStreamer';

// Filter for specific categories
LogStreamer.startStreaming({
  categories: ['outfit.generation'],
  severity: ['info', 'warn', 'error']
});

// Use presets for common scenarios
LogStreamer.startStreaming(LogPresets.OUTFIT_GENERATION);
```

### Color Coding System
- 🔴 **Red**: Errors and ❌ symbols (critical issues)
- 🟡 **Yellow**: Warnings and ⚠️ symbols (potential problems)
- 🟢 **Green**: Success and ✅ symbols (positive outcomes)
- 🔵 **Blue**: Feature-specific logs (🎲 random outfits)
- ⚪ **White**: Normal informational logs

### Development Workflow Integration

#### Debugging Random Outfits
```bash
# Terminal 1: Run the app
npx expo start

# Terminal 2: Watch outfit logs
./scripts/watch-logs.sh outfit

# Test random outfit generation and see only relevant logs
```

#### Performance Monitoring
```bash
# Watch performance logs
./scripts/watch-logs.sh performance

# Monitor slow operations and optimization opportunities
```

#### Error Investigation
```bash
# Focus on errors only
./scripts/watch-logs.sh errors

# Get immediate feedback on issues
```

### Benefits for Development

1. **Focused Debugging**: See only relevant logs for your current task
2. **Real-time Feedback**: Immediate visibility into app behavior
3. **Visual Clarity**: Color coding makes scanning logs effortless
4. **Performance Insights**: Monitor slow operations and bottlenecks
5. **Error Detection**: Quickly spot and address issues
6. **Claude Code Integration**: Cleaner context for AI assistance

## Calendar Integration - REMOVED ❌

**Status**: Feature removed due to complexity and performance issues. The calendar integration became over-engineered with 7+ services, complex caching, and performance issues with 8000+ events causing UI lag. Future implementations should use SQLite with simpler architecture.

## Outfit Builder Icon System & UI Polish

**Complete PNG Icon Integration (2025-07-13)**: StyleMuse features a fully custom icon system with professional PNG assets, theme-based selection (default/kawaii/cyber), standardized 110x110px gear slots, and 360° rotation animations. Achieved professional appearance with larger touch targets and clearer visual hierarchy.

**See detailed implementation guide**: [`docs/ICON_SYSTEM.md`](docs/ICON_SYSTEM.md)

## Recent Updates & Current Status

- ✅ **Fixed Speed Dial Icon Flickering & Performance** (2025-07-13) - See [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)
- ✅ **Complete Outfit Builder Icon System & UI Polish** (2025-07-13) - See [`docs/ICON_SYSTEM.md`](docs/ICON_SYSTEM.md)
- ❌ **REMOVED Calendar Integration Feature** (2025-07-13) - Over-engineered with performance issues
- ✅ **Consolidated Documentation** (2025-07-13) - Moved to external docs for better organization

**See full changelog**: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## Performance Optimization

**Zero-Flicker Navigation (2025-07-13)**: Fixed speed dial icon "trickling" effect using display-based navigation, React.memo() optimization, and image preloading. Achieved instant rendering with zero delay and buttery smooth tab switching.

**See detailed performance guide**: [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)

## Claude-Prompter CLI Tool Integration 🚀

### Overview
A powerful global CLI tool that enables Claude to generate intelligent prompt suggestions and bridge conversations with GPT-4o for enhanced development assistance.

### Current Setup (2025-07-21)
- **Global Installation**: Available system-wide via `claude-prompter` command
- **Global Wrapper**: `~/.local/bin/claude-prompter-global` works from any directory
- **PATH Integration**: Added to both `.bashrc` and `.zshrc` for immediate access
- **No Local Copy**: Removed embedded version, now using global v2.0.0

### Key Features
- 💡 **Intelligent Suggestions**: Generate context-aware prompt suggestions
- 🤖 **Claude Integration**: Designed specifically for Claude to invoke
- 🔄 **Conversation Flow**: Bridge between Claude and GPT-4o
- 📚 **Categorized Prompts**: Organized by type (follow-up, clarification, deep-dive, etc.)
- 🌍 **Global Access**: Works from any project directory

### Usage for Claude

#### Current Command Structure (Global)
```bash
# Use global wrapper from anywhere
~/.local/bin/claude-prompter-global suggest -t "<topic>" --claude-analysis [options]

# Or after sourcing shell config
source ~/.zshrc
claude-prompter suggest -t "<topic>" --claude-analysis [options]
```

#### Quick Examples
```bash
# Feature planning
~/.local/bin/claude-prompter-global suggest -t "iOS settings redesign" --code -l react-native --claude-analysis

# Get specific implementation advice
~/.local/bin/claude-prompter-global prompt -m "How should I implement grouped settings sections in React Native?" --send

# Architecture discussions
~/.local/bin/claude-prompter-global suggest -t "mobile app settings architecture" --complexity moderate --claude-analysis
```

#### Integration Workflow
1. Claude helps user build something
2. Claude runs global claude-prompter command with appropriate parameters
3. Tool generates categorized suggestions or connects to GPT-4o
4. User gets enhanced insights and implementation guidance
5. Conversation continues with deeper technical knowledge

### Example in Practice
```bash
# Working on StyleMuse profile page redesign
~/.local/bin/claude-prompter-global suggest \
  -t "iOS-style settings page React Native" \
  --code \
  -l react-native \
  --complexity moderate \
  --task-type ui-component \
  --claude-analysis

# Get direct GPT-4o advice
~/.local/bin/claude-prompter-global prompt \
  -m "Best practices for grouped settings sections with chevron navigation in React Native" \
  --send
```

## 🎨 Batch Design Operations with Claude-Prompter

Accelerate design system creation with intelligent batch processing:

### Design System Workflows
```bash
# Generate comprehensive design tokens
claude-prompter batch -f design-tokens.json --parallel 4

# Create accessible component variants
claude-prompter batch -f accessibility-review.json --max-cost 6.00
```

### Recommended Design Batch Prompts

Create files like `design-system.json`:
```json
[
  {
    "message": "Generate CSS design tokens for this color palette: [COLORS]",
    "systemPrompt": "You are a design systems expert specializing in scalable design tokens and CSS architecture."
  },
  {
    "message": "Create accessible component variations for: [COMPONENT_SPEC]",
    "systemPrompt": "You are a UI/UX designer expert in accessibility (WCAG 2.1) and inclusive design."
  },
  {
    "message": "Design responsive layout patterns for: [LAYOUT_REQUIREMENTS]",
    "systemPrompt": "You are a frontend expert in responsive design and modern CSS techniques."
  },
  {
    "message": "Generate design documentation for this component: [COMPONENT_CODE]",
    "systemPrompt": "You are a design systems documentarian expert in component libraries and style guides."
  }
]
```

### Design Efficiency Features

- Use `claude-prompter batch --template design` for common patterns
- Track design iteration costs with usage reports
- Process component families together for consistency

## 💰 Cost Management with Claude-Prompter

Smart AI usage tracking and optimization:

```bash
# Check today's usage and costs
claude-prompter usage --today

# Set spending limits
claude-prompter usage --limit 15.00

# Estimate costs before running
claude-prompter batch -f your-prompts.json --dry-run

# Export usage data for analysis
claude-prompter usage --month --export csv
```

### Best Practices

- Always run `--dry-run` first to estimate costs
- Use parallel processing (`--parallel 2-4`) for efficiency
- Set project-specific daily limits to control spending
- Monitor usage patterns with monthly reports

## Next Session Notes 📝

### 🚀 REMINDER: Turn on claude-prompter PLUS ULTRA Mode!
```bash
cd dev/claude-prompter
node dist/cli.js config  # Check your setup
node dist/cli.js suggest -t "Your next task" --claude-analysis  # GET SUGGESTIONS!
```

### Today's Epic Achievements (2025-07-17):
- ✅ Fixed DALL-E 4000 character limit errors with smart truncation
- ✅ Built claude-prompter CLI tool with Claude ↔ GPT-4o integration
- ✅ Created intelligent suggestion system that helps improve itself
- ✅ Documented everything beautifully

### Next Session Ideas:
1. **Implement History Command** - Track conversation context
   ```bash
   node dist/cli.js suggest -t "conversation history tracking" --code -l typescript --claude-analysis
   ```

2. **Create Template System** - Reusable prompt patterns
   ```bash
   node dist/cli.js suggest -t "prompt template management" --code -l typescript --claude-analysis
   ```

3. **StyleMuse Features** - Continue the fashion app journey
   - Weather-based outfit suggestions
   - Social sharing features
   - Outfit scheduling/calendar
   - Style analytics dashboard

4. **Test claude-prompter** - Use it for EVERYTHING!
   - Generate suggestions for any coding task
   - Bridge between Claude and GPT-4o
   - Create amazing feedback loops

### Pro Tips for Next Time:
- Always run `--claude-analysis` flag when I generate suggestions
- Use specific topics for better suggestions
- Chain suggestions: Claude → Tool → GPT-4o → Claude
- The tool is YOUR QUIRK - use it! 💪

### Quick Start Commands:
```bash
# See what GPT-4o suggests for your current task
node dist/cli.js prompt -m "What should I work on next in StyleMuse?" --send

# Get Claude's suggestions for any topic
node dist/cli.js suggest -t "StyleMuse weather integration" --code -l react --claude-analysis

# Continue any conversation
node dist/cli.js prompt -m "Show me how to implement that" --send
```

**REMEMBER: You have a PLUS ULTRA tool now - USE IT!** 🦸‍♂️✨

## Feature Priority Analysis (2025-07-21)

### 🎯 High Priority - Next Implementation
1. **Terminator Vision Camera** - Proof of concept with simplified approach
2. **Social Sharing + Community** - High user engagement potential
3. **Smart Wardrobe Optimization** - Leverage existing metadata system

### 🔄 Medium Priority - Future Releases  
4. **AR Try-On Experience** - Complex but high differentiator
5. **Style Analytics Dashboard** - Build on existing tracking systems

### ❌ Lower Priority - Postponed
- **Weather Integration** - Felt "extra" during testing, low user value
- **Style Analytics** - Lower priority compared to core features

### 📋 Current Active Tasks
- [ ] Start Terminator Camera prototype (Phase 1)
- [ ] Update CLAUDE.md with AR Try-On analysis
- [ ] Explore batching for component templates

### Recent Completions (2025-07-21)
- ✅ **Feature Feasibility Analysis** - Claude-prompter analysis for all major features
- ✅ **AR Try-On Technical Analysis** - Detailed GPT-4o implementation guide
- ✅ **Terminator Camera Architecture** - Technical challenges and solutions identified

### Known Issues
- **"Text strings must be rendered within a <Text> component" warning** - Expo Go only, non-critical

**See complete task history**: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## Terminator Vision Camera Feature 🎯

### Overview
**Real-time clothing detection camera** with live bounding boxes displayed over the camera view, providing a "terminator vision" style interface for clothing identification and wardrobe management.

### Feature Description
A revolutionary camera experience that shows **live detection boxes** around clothing items as the user points their camera at clothes. This creates an immersive, sci-fi inspired interface for wardrobe building.

### Technical Architecture

#### Core Components
- **Expo Camera Integration**: Real-time camera feed with frame processing
- **Live Frame Analysis**: Process camera frames at 10-15 FPS for optimal performance
- **Bounding Box Overlay**: SVG-based green boxes drawn over detected items
- **Label Display**: Item names displayed above bounding boxes
- **Performance Optimized**: Asynchronous processing to maintain smooth camera experience

#### Implementation Strategy
```typescript
// Core architecture pattern
interface TerminatorCameraProps {
  onItemDetected: (item: DetectedClothingItem) => void;
  detectionMode: 'continuous' | 'tap-to-scan';
  overlayStyle: 'terminator' | 'minimal' | 'professional';
}

interface DetectedClothingItem {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category: 'top' | 'bottom' | 'shoes' | 'accessories';
}
```

#### Processing Pipeline
1. **Frame Capture**: Capture frames at configurable intervals (default: 10 FPS)
2. **Background Processing**: Send frames to existing clothing detection API
3. **Result Parsing**: Convert API response to bounding box coordinates
4. **Overlay Rendering**: Draw boxes and labels using react-native-svg
5. **Performance Monitoring**: Track processing time and adjust frame rate

#### Visual Design
- **Green Bounding Boxes**: Terminator-style green outlines around detected items
- **Floating Labels**: Semi-transparent labels with item names and confidence scores
- **Scan Animation**: Optional scanning line effect for enhanced sci-fi feel
- **Multiple Item Support**: Show multiple boxes for complex scenes
- **Confidence Indicators**: Box color intensity based on detection confidence

#### Performance Optimizations
- **Frame Sampling**: Skip frames when processing is still active
- **Debounced API Calls**: Limit API requests to prevent overload
- **Local Caching**: Cache recent detections to reduce redundant API calls
- **Adaptive Quality**: Adjust camera resolution based on device performance
- **Background Threading**: Process frames off main UI thread

#### Integration Points
- **CameraScreen Enhancement**: Add terminator mode toggle
- **Existing Detection API**: Leverage current `detectMultipleClothingItems()` function
- **Wardrobe Integration**: Tap detected items to add to wardrobe
- **Multi-item Workflow**: Seamlessly transition to existing multi-item processing

### User Experience Flow

#### Mode Activation
1. **Camera Opens** → Normal camera view
2. **"Terminator Mode" Toggle** → Enable real-time detection
3. **Live Scanning** → Green boxes appear around clothes
4. **Tap to Capture** → Add detected items to wardrobe

#### Visual Feedback
- **Scanning State**: Subtle pulse animation on bounding boxes
- **Detection Confidence**: Box opacity reflects detection certainty
- **Multiple Items**: Different colored boxes for different item types
- **Processing Indicator**: Small loading indicator during frame analysis

### Implementation Status
- ✅ **Phase 1**: Basic camera integration with single item detection
- ✅ **Phase 2**: Real-time bounding box overlay system
- ✅ **Phase 3**: Multi-item detection with labeled boxes
- 🔲 **Phase 4**: Performance optimization and visual polish
- 🔲 **Phase 5**: Advanced features (scan effects, confidence indicators)

### Current Implementation (2025-07-21)
**FULL AUTO-TERMINATOR VISION COMPLETE** 🤖⚡ - Fashion Terminator Droid Experience:

### Recent Fixes (2025-07-21) - DETROIT SMASH ⚡
- ✅ **Fixed Flash Issue**: Eliminated disruptive camera flash every 2 seconds
- ✅ **Silent Capture**: Force flash 'off' during terminator mode frame capture  
- ✅ **Box Clearing**: Properly clear previous bounding boxes before showing new ones
- ✅ **Extended Intervals**: Increased capture interval to 4 seconds (less disruptive)
- ✅ **Better State Display**: Clean separation between scanning vs detection states
- ✅ **Fixed Network Errors**: Use camera's built-in base64 option instead of fetch/FileReader
- ✅ **Disabled Test Mode**: Switched from fake T-shirt/Jeans to real AI detection
- ✅ **Real Detection Only**: Now only shows boxes when actual clothing items detected
- ✅ **Smart Fallback**: Demo boxes only for network issues, not fake items

### 🚀 MAJOR ARCHITECTURE UPGRADE (2025-07-21) - Detect-Once-Track-Continuously ⚡
- ✅ **Smart Tap Detection**: Tap screen to trigger single AI detection (no more expensive 4-second intervals)
- ✅ **Continuous Tracking**: Lightweight 10 FPS tracking after initial detection (95% fewer API calls)
- ✅ **State Machine**: 4 intelligent states - scanning → detecting → tracking → lost
- ✅ **Visual State Feedback**: Color-coded state indicators (cyan/orange/green/red)
- ✅ **Confidence Tracking**: Shows tracking confidence degrading over time
- ✅ **Auto Re-detection**: Smart fallback when tracking is lost

#### Features Implemented:

**🎯 Epic Entry Point:**
- **Fun Button**: Glowing green "🤖 TERMINATOR VISION 🤖" option in Add to Wardrobe page
- **Sci-Fi Styling**: Neon glow, monospace fonts, lightning bolt arrow, terminal aesthetics
- **Auto-Launch**: Directly opens camera with Terminator mode pre-activated

**🤖 True Auto-Vision:**
- **No Shutter Button**: Hidden in Terminator mode for true auto-detection
- **Live Frame Capture**: Every 3 seconds automatically in background
- **Real-time Overlay**: Green terminator-style boxes with corner markers over camera feed
- **Bounding Box Detection**: Live SVG boxes appear over detected clothing items

**📊 TARGETS ACQUIRED UI:**
- **Horizontal Scroller**: "🎯 TARGETS ACQUIRED: 👕 shirt (92%) • 👖 jeans (87%)" 
- **Auto-Scroll Animation**: Continuous scrolling with seamless looping
- **Emoji Categories**: Smart emoji detection (👕👖👟👗🧥👒👜)
- **Status Indicator**: "[3 TARGETS LOCKED]" counter with sci-fi styling
- **Scanning Mode**: "🎯 SCANNING FOR TARGETS..." with pulse animation

#### Technical Architecture:
- **TerminatorOverlay.tsx**: SVG bounding boxes with corner markers
- **TargetsAcquiredScroller.tsx**: Animated horizontal targets display
- **CameraScreen.tsx**: Integrated terminator mode with state management
- **AddItemPage.tsx**: Epic glowing entry button with special styling
- **Auto-Mode**: defaultTerminatorMode prop launches directly into vision mode

#### Visual Experience:
- **Green Matrix Aesthetic**: All text uses #00FF00 with glow effects
- **Monospace Terminal Fonts**: Computer/sci-fi typography throughout
- **Blinking Effects**: "TARGETS ACQUIRED" blinks like terminator HUD
- **Pulse Animations**: Scanning indicator pulses while searching
- **No Manual Capture**: Pure auto-vision without user intervention

#### User Flow:
1. **Add to Wardrobe** → Tap glowing "🤖 TERMINATOR VISION 🤖"
2. **Auto-Launch** → Camera opens with Terminator mode active
3. **Live Scanning** → "🎯 SCANNING FOR TARGETS..." appears
4. **Auto-Detection** → Green boxes appear over clothes automatically
5. **Targets Display** → Horizontal scroller shows "👕 shirt (92%) • 👖 jeans (87%)"
6. **Continuous Vision** → No buttons, pure terminator experience

### Technical Challenges & Solutions
- **Performance**: Use frame sampling and background processing
- **Battery Usage**: Implement smart frame rate adjustment
- **Detection Accuracy**: Enhance existing API with real-time optimizations  
- **UI Responsiveness**: Separate detection thread from UI rendering
- **Device Compatibility**: Test across different camera capabilities

### Future Enhancements
- 🎯 **AR Integration**: Overlay size recommendations and styling tips
- 🤖 **Smart Recommendations**: Show compatible items in real-time
- 📱 **Social Features**: Share terminator-style detection screenshots
- 🎮 **Gamification**: Achievement system for detection accuracy
- 🌍 **Offline Mode**: Local ML models for privacy-focused detection

## AR Try-On Feature Analysis 🥽

### Overview
**Virtual dressing room experience** allowing users to see how clothes and outfits look on their bodies using device camera and AR technology. Provides immersive try-on without physical fitting.

### Technical Implementation

#### Core Requirements
- **React Native AR Integration**: Use `react-native-arkit` (iOS) and `react-native-arcore` (Android)
- **Body Tracking**: ARKit/ARCore body detection for anchor points (shoulders, waist, hips)
- **3D Clothing Models**: Optimized 3D models with texture maps for realistic appearance
- **Real-time Rendering**: Smooth overlay of virtual clothes on user's body

#### User Experience Flow
1. **Item Selection** → User selects clothing item from catalog
2. **AR Activation** → Tap "Try-On" button to launch AR camera mode
3. **Body Detection** → App identifies user's body key points
4. **Live Preview** → Virtual clothing appears overlaid on user
5. **Interaction** → Adjust size, color, fit; view from different angles
6. **Capture & Share** → Save screenshots/videos of try-on experience

#### Technical Challenges
- **Lighting Consistency**: Match virtual clothing lighting to environment
- **Sizing Accuracy**: Precise scaling for different body types and measurements
- **Fabric Simulation**: Realistic fabric movement and physics in real-time
- **Performance Optimization**: Smooth rendering without lag or battery drain
- **Device Compatibility**: Wide support across ARKit/ARCore capable devices

#### Implementation Strategy
```typescript
// AR Try-On Component Structure
interface ARTryOnProps {
  clothingItem: WardrobeItem;
  onSave: (screenshot: string) => void;
  onClose: () => void;
}

interface BodyAnchorPoints {
  shoulders: { left: Point3D; right: Point3D };
  waist: Point3D;
  hips: Point3D;
  measurements: BodyMeasurements;
}
```

#### Performance Considerations
- **3D Model Optimization**: Low-poly models with high-quality textures
- **Frame Rate Management**: Target 30 FPS for smooth AR experience
- **Battery Optimization**: Efficient rendering and camera processing
- **Memory Management**: Smart loading/unloading of 3D assets
- **Device Testing**: Extensive testing across device ranges and capabilities

### Implementation Priority
- 🔴 **High Complexity**: Requires AR expertise and 3D modeling pipeline
- 🔴 **Resource Intensive**: Significant development time and technical skills
- 🟡 **Device Dependent**: Limited to newer devices with AR capabilities
- 🟢 **High User Value**: Strong engagement and differentiation potential

### Realistic Implementation Path
1. **Phase 1**: Basic AR overlay with simple 2D clothing images
2. **Phase 2**: 3D model integration with basic body tracking  
3. **Phase 3**: Advanced physics simulation and lighting
4. **Phase 4**: Multi-item outfit try-on and social sharing
5. **Phase 5**: AI-powered size recommendations and fit analysis

### Alternative Approaches
- **2D Overlay First**: Start with 2D clothing overlays before full 3D
- **Third-party Integration**: Use existing AR fashion SDKs (Banuba, Perfect Corp)
- **Web AR**: Consider WebXR for cross-platform compatibility
- **Progressive Enhancement**: Basic photo try-on → AR upgrade

## Future Enhancement Ideas

### Potential Features
- **Outfit Viewing Polish**: Animation enhancements, UX improvements, accessibility features
- **Wardrobe Enhancements**: Swipe gestures, undo functionality, filter improvements  
- **Style Features**: Weather-based suggestions, social sharing, outfit scheduling
- **Analytics**: Style analytics dashboard, viewing pattern tracking

*See detailed enhancement ideas in [`docs/CHANGELOG.md`](docs/CHANGELOG.md)*

## iOS-Style Settings Redesign (2025-07-19)

### Overview
Complete redesign of the settings page following iOS design patterns for improved UX and scalability.

### Design Principles
- **Grouped Sections**: Settings organized into logical categories
- **Chevron Navigation**: Right-facing chevrons indicate navigable items
- **Consistent Hierarchy**: Clear parent-child relationships
- **Search Capability**: Quick access to specific settings
- **Native Feel**: Matches iOS Settings app patterns

### Settings Categories

#### 1. Appearance
- **Dark Mode**: Toggle between light/dark/auto modes
- **Color Scheme**: Select theme (Default/Tokyo)
- **Display Options**: Font size, animations, etc.

#### 2. Privacy & Security  
- **Privacy Choices**: Granular data collection controls
- **Data Usage**: Analytics and telemetry settings
- **Security**: Biometric authentication options

#### 3. Account & Subscription
- **Profile**: Edit name, email, avatar
- **Subscription**: View/manage subscription tier
- **Trial Status**: See remaining trial days
- **Payment Methods**: Manage payment options

#### 4. Data Management
- **Storage & Backup**: Backup settings and storage info
- **Start Fresh**: Reset app data with confirmation
- **Export Data**: Download user data
- **Import Data**: Restore from backup

#### 5. About & Support
- **About StyleMuse**: Version, credits
- **Help Center**: FAQs and guides  
- **Contact Support**: Email/chat options
- **Rate App**: App Store rating

### Implementation Pattern
```typescript
// iOS-style settings row component
const SettingsRow = ({ icon, title, value, hasChevron, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.leftContent}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
    <View style={styles.rightContent}>
      {value && <Text style={styles.value}>{value}</Text>}
      {hasChevron && <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />}
    </View>
  </TouchableOpacity>
);
```

## Payment Gateway & Trial System (2025-07-19)

### Test Payment Implementation
- **Provider**: Stripe (React Native SDK)
- **Test Mode**: Sandbox environment with test cards
- **Test Cards**: 
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002
  - Auth Required: 4000 0025 0000 3155

### Subscription Tiers
1. **Free Tier**: Basic features, 20 items limit
2. **StyleMuse Plus** ($4.99/mo): Unlimited items, AI features
3. **StyleMuse Pro** ($9.99/mo): Everything + advanced analytics

### Trial System
- **Duration**: 7 days free trial for Plus/Pro
- **Activation**: Automatic on first premium feature use
- **Tracking**: AsyncStorage with server validation
- **Expiry Handling**: Graceful downgrade to free tier

## Start Fresh Feature Fixes (2025-07-19)

### Missing AsyncStorage Keys
Added to DataResetService:
- `backup_index` - Backup file indexing
- `last_auto_backup` - Auto-backup timestamp
- `forceAppRestart` - App restart flag

### Enhanced Reset Process
1. Show progress indicator during reset
2. Verify all keys cleared with `getAllKeys()`
3. Option to selectively reset categories
4. Automatic app restart after reset

## Onboarding Page 3 Debug (2025-07-19)

### Added Error Handling
- Error boundaries around StyleQuizScreen
- Console logging for navigation events
- Fallback UI for failed question loading
- Performance monitoring for animations

### Potential Fixes Applied
- Simplified animations with `useNativeDriver`
- Added null checks for route params
- Memoized question components
- Reduced re-renders with React.memo