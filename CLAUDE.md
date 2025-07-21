# StyleMuse Development Guide
<!-- Last edited: 2025-07-21 by Claude Code -->
<!-- Change: Updated branch information - all development on main-stable branch -->

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

## Current Priority Tasks

### Active Development
- [ ] Verify onboarding flow for new users
- [ ] Review log monitoring system  
- [ ] Profile and optimize any slow operations

### Recent Completions (2025-07-17)
- ✅ **Intelligent Prompt Truncation System** - Prevents API 4000+ character errors
- ✅ **Claude-Prompter CLI Tool** - GPT-4o integration at `/dev/claude-prompter`
- ✅ **Mark All as Seen for wardrobe items** - Bulk marking functionality

### Known Issues
- **"Text strings must be rendered within a <Text> component" warning** - Expo Go only, non-critical

**See complete task history**: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

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