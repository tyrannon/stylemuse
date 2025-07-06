# Complete Page Flow & Architecture Guide 🏗️

## 🎯 Executive Summary

StyleMuse uses a revolutionary **Single-Screen Container Architecture** where all pages are rendered conditionally within one main container. This provides seamless navigation, shared state, and exceptional performance.

## 🚀 App Launch Flow

### Entry Sequence
```
App.js → WardrobeUploadScreen.tsx → 
State Initialization → Page Rendering → Bottom Navigation
```

### Initialization Process
1. **App.js**: Loads the main container
2. **WardrobeUploadScreen.tsx**: Initializes all state and hooks
3. **Hook Loading**: All data hooks load their state from AsyncStorage
4. **Page Rendering**: Boolean states determine which page is visible
5. **Bottom Navigation**: Provides navigation controls

## 📍 Complete Page/Screen Locations

### Main Container
```typescript
// Primary controller for entire app
/screens/WardrobeUploadScreen.tsx
- Role: Main container managing all pages
- State: All app state and hooks
- Navigation: Controls page visibility via boolean flags
- Size: ~900 lines - the heart of the app
```

### Core Pages (All in `/screens/`)

#### 1. **Profile Page** 🧬
```typescript
/screens/ProfilePage.tsx
- Purpose: StyleDNA analysis, profile management, settings
- Features: Style analysis, avatar customization, backup/restore
- Key Sections: StyleDNA, Profile Photo, Data Management
- Navigation: showProfilePage = true
```

#### 2. **Wardrobe Page** 👔
```typescript
/screens/WardrobePage.tsx  
- Purpose: Wardrobe item management and organization
- Features: Item grid, laundry analytics, search/filter
- Key Components: LaundryAnalytics, ItemDetailView
- Navigation: showWardrobe = true
```

#### 3. **Outfit Builder Page** 🎮
```typescript
/screens/BuilderPage.tsx
- Purpose: AI-powered outfit creation with gear slots
- Features: Gear slots interface, AI suggestions, outfit assembly
- Key Components: GearSlots, AIOutfitAssistant
- Navigation: showOutfitBuilder = true (default)
```

#### 4. **Outfits Gallery Page** 👗
```typescript
/screens/OutfitsPage.tsx
- Purpose: Saved outfits gallery and management
- Features: Outfit grid, analytics, wear tracking
- Key Components: OutfitDetailView, OutfitAnalytics
- Navigation: showOutfitsPage = true
```

#### 5. **Add Item Page** ➕
```typescript
/screens/AddItemPage.tsx
- Purpose: Add new wardrobe items via various methods
- Features: Camera, text entry, bulk upload options
- Navigation: showAddItemPage = true
```

### Camera & Photo System
```typescript
/screens/CameraScreen.tsx
- Purpose: Photo capture with multiple modes
- Features: Wardrobe, profile, multi-item modes
- Integration: Feeds into PhotoEditingScreen

/screens/PhotoEditingScreen.tsx
- Purpose: Basic photo editing and confirmation
- Features: Crop, filters, save/retake options
- Integration: Feeds into AddItemPage or StyleDNA
```

### Avatar System
```typescript
/screens/AvatarCustomizationPage.tsx
- Purpose: Manual StyleDNA editing and avatar generation
- Features: Personal info editing, avatar creation
- Integration: Connected to StyleDNA system
```

## 🧭 Navigation Architecture

### Boolean-Based Navigation System
```typescript
// In WardrobeUploadScreen.tsx - Navigation State
const [showOutfitBuilder, setShowOutfitBuilder] = useState(true);   // Default
const [showWardrobe, setShowWardrobe] = useState(false);
const [showOutfitsPage, setShowOutfitsPage] = useState(false);
const [showProfilePage, setShowProfilePage] = useState(false);
const [showAddItemPage, setShowAddItemPage] = useState(false);
const [showAvatarCustomization, setShowAvatarCustomization] = useState(false);
```

### Navigation Functions
```typescript
// Navigation hook: /hooks/useNavigationState.ts
const navigateToBuilder = () => {
  setShowOutfitBuilder(true);
  setShowWardrobe(false);
  setShowOutfitsPage(false);
  setShowProfilePage(false);
  setShowAddItemPage(false);
};

const navigateToWardrobe = () => {
  setShowOutfitBuilder(false);
  setShowWardrobe(true);
  setShowOutfitsPage(false);
  setShowProfilePage(false);
  setShowAddItemPage(false);
};
```

### Bottom Navigation Component
```typescript
/screens/components/shared/BottomNavigation.tsx
- Purpose: Provides 5-tab navigation interface
- Features: Haptic feedback, active states, scroll-to-top
- Integration: Calls navigation functions from useNavigationState
```

### Page Rendering Logic
```typescript
// In WardrobeUploadScreen.tsx
return (
  <View style={styles.container}>
    {showOutfitBuilder && (
      <BuilderPage 
        wardrobeItems={wardrobeItems}
        // ... all necessary props
      />
    )}
    
    {showWardrobe && (
      <WardrobePage
        wardrobeItems={wardrobeItems}
        // ... all necessary props  
      />
    )}
    
    {showOutfitsPage && (
      <OutfitsPage
        lovedOutfits={lovedOutfits}
        // ... all necessary props
      />
    )}
    
    {showProfilePage && (
      <ProfilePage
        styleDNA={styleDNA}
        // ... all necessary props
      />
    )}

    <BottomNavigation 
      navigation={{ 
        navigateToBuilder,
        navigateToWardrobe,
        navigateToOutfits,
        navigateToProfile 
      }}
      currentPage={{
        showOutfitBuilder,
        showWardrobe, 
        showOutfitsPage,
        showProfilePage
      }}
    />
  </View>
);
```

## 💾 Complete Storage Architecture

### AsyncStorage Structure
```typescript
// All app data stored with these keys:
const STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',        // WardrobeItem[]
  LOVED_OUTFITS: 'stylemuse_loved_outfits',          // LovedOutfit[]
  STYLE_DNA: 'stylemuse_style_dna',                  // EnhancedStyleDNA
  SELECTED_GENDER: 'stylemuse_selected_gender',      // string
  PROFILE_IMAGE: 'stylemuse_profile_image',          // string (URI)
  WISHLIST_ITEMS: 'stylemuse_wishlist_items',        // WishlistItem[]
  SUGGESTED_ITEMS: 'stylemuse_suggested_items',      // SuggestedItem[]
  BACKUP_METADATA: 'stylemuse_backup_metadata'       // BackupMetadata
};
```

### Data Models & Storage
```typescript
// Core data structures stored in AsyncStorage

interface WardrobeItem {
  image: string;                    // Image URI or path
  title?: string;                   // Item name
  description: string;              // Item description
  category?: string;                // Clothing category
  laundryStatus?: LaundryStatus;    // Clean, dirty, washing, etc.
  addedAt?: Date;                   // When item was added
  lastWorn?: Date;                  // Last wear date
  timesWorn?: number;               // Wear count
  tags?: string[];                  // Searchable tags
  color?: string;                   // Primary color
  material?: string;                // Fabric type
  brand?: string;                   // Brand name
  // ... additional fields
}

interface LovedOutfit {
  id: string;                       // Unique identifier
  image: string;                    // Outfit image URI
  selectedItems: string[];          // Array of wardrobe item URIs
  createdAt: Date;                  // Creation timestamp
  lastWorn?: Date;                  // Last wear date
  timesWorn: number;                // Wear count
  wearHistory: WearRecord[];        // Detailed wear history
  notes?: string;                   // User notes
  occasion?: string;                // Occasion type
  // ... additional fields
}

interface EnhancedStyleDNA {
  personal_info?: PersonalInfo;     // User personal data
  physical_attributes?: PhysicalAttributes; // AI-analyzed appearance
  style_profile?: PersonalStyle;    // Style preferences
  ai_analysis?: any;                // Raw AI analysis
  avatar_image_url?: string;        // Generated avatar
  analyzed_at?: Date;               // Analysis timestamp
  // ... additional fields
}
```

### Storage Service Layer
```typescript
// /services/StorageService.ts - Typed AsyncStorage wrapper
class StorageService {
  // Wardrobe Items
  static async getWardrobeItems(): Promise<WardrobeItem[]>
  static async setWardrobeItems(items: WardrobeItem[]): Promise<void>
  
  // Loved Outfits  
  static async getLovedOutfits(): Promise<LovedOutfit[]>
  static async setLovedOutfits(outfits: LovedOutfit[]): Promise<void>
  
  // StyleDNA
  static async getStyleDNA(): Promise<EnhancedStyleDNA | null>
  static async setStyleDNA(styleDNA: EnhancedStyleDNA): Promise<void>
  
  // Profile & Settings
  static async getSelectedGender(): Promise<string | null>
  static async setSelectedGender(gender: string): Promise<void>
  
  static async getProfileImageUri(): Promise<string | null>
  static async setProfileImageUri(uri: string): Promise<void>
}
```

### Backup & Restore System
```typescript
// /services/PersistenceService.ts - Complete backup system
interface BackupData {
  wardrobeItems: WardrobeItem[];
  lovedOutfits: LovedOutfit[];
  styleDNA: EnhancedStyleDNA | null;
  selectedGender: string | null;
  profileImageUri: string | null;
  wishlistItems?: WishlistItem[];
  suggestedItems?: SuggestedItem[];
  backupMetadata: {
    version: string;
    createdAt: Date;
    platform: string;
    appVersion: string;
  };
}

// Export to device storage
async function exportBackup(): Promise<string>

// Import from device storage  
async function importBackup(backupUri: string): Promise<void>

// Platform-specific storage
// iOS: Documents directory with iCloud sync
// Android: Downloads directory with file system access
```

## 🎣 Hook-Driven State Management

### Primary State Hooks
```typescript
// /hooks/useWardrobeData.ts - Core data management
interface WardrobeDataHook {
  wardrobeItems: WardrobeItem[];
  addWardrobeItem: (item: WardrobeItem) => Promise<void>;
  deleteWardrobeItem: (index: number) => Promise<void>;
  updateWardrobeItem: (index: number, updates: Partial<WardrobeItem>) => Promise<void>;
  // ... 20+ wardrobe management functions
}

// /hooks/useOutfitGeneration.ts - Outfit creation
interface OutfitGenerationHook {
  gearSlots: GearSlots;
  setGearSlotItem: (slot: string, item: WardrobeItem) => void;
  clearGearSlots: () => void;
  generateOutfitImage: () => Promise<string>;
  // ... outfit generation functions
}

// /hooks/useNavigationState.ts - Page navigation  
interface NavigationHook {
  showOutfitBuilder: boolean;
  showWardrobe: boolean;
  showOutfitsPage: boolean;
  showProfilePage: boolean;
  navigateToBuilder: () => void;
  navigateToWardrobe: () => void;
  // ... navigation functions
}

// /hooks/useImageHandling.ts - Camera & photos
interface ImageHandlingHook {
  takePhoto: (mode: string) => Promise<string>;
  editPhoto: (uri: string) => Promise<string>;
  analyzeClothingImage: (uri: string) => Promise<AnalysisResult>;
  // ... image processing functions
}
```

### State Flow Pattern
```typescript
// Data flow through the app
User Action → 
Component Event → 
Hook Function → 
Service Layer → 
Storage/API → 
Hook State Update → 
Component Re-render
```

### State Sharing Strategy
```typescript
// All state managed in WardrobeUploadScreen.tsx
const wardrobeData = useWardrobeData();
const navigation = useNavigationState();
const outfitGeneration = useOutfitGeneration();

// Passed to pages via props
<BuilderPage 
  wardrobeItems={wardrobeData.wardrobeItems}
  gearSlots={outfitGeneration.gearSlots}
  navigation={navigation}
  // ... all necessary state
/>
```

## 🧩 Component Architecture

### Component Hierarchy
```
WardrobeUploadScreen (Main Container)
├── BuilderPage (Outfit Builder)
│   ├── GearSlots (Gear interface)
│   ├── AIOutfitAssistant (AI suggestions)
│   └── SmartSuggestions (Context-aware recommendations)
├── WardrobePage (Wardrobe Management)
│   ├── LaundryAnalytics (Laundry tracking)
│   ├── ItemDetailView (Item details)
│   └── WardrobeGrid (Item display)
├── OutfitsPage (Outfit Gallery)
│   ├── OutfitAnalytics (Usage statistics)
│   ├── OutfitDetailView (Outfit details)
│   └── OutfitGrid (Outfit display)
├── ProfilePage (Style & Settings)
│   ├── StyleDNA Section (Analysis results)
│   ├── AvatarCustomization (Style editing)
│   └── BackupRestore (Data management)
├── AddItemPage (Item Addition)
│   ├── CameraCapture (Photo capture)
│   ├── TextEntry (Manual entry)
│   └── BulkUpload (Multiple items)
├── CameraScreen (Photo Capture)
│   ├── CameraControls (Camera interface)
│   └── PhotoEditingScreen (Photo editing)
└── BottomNavigation (Navigation)
    ├── TabButtons (Navigation buttons)
    └── HapticFeedback (Touch feedback)
```

### Component Design Patterns
1. **Props-Based Communication**: Parent passes state and functions to children
2. **Single Responsibility**: Each component has one clear purpose
3. **Composition Over Inheritance**: Components are composed of smaller pieces
4. **Hook Integration**: Components use hooks for business logic
5. **Error Boundaries**: Graceful failure handling

## 🔗 Feature Integration Map

### Core Features & Their Files
```typescript
// 1. Wardrobe Management
Files: WardrobePage.tsx, useWardrobeData.ts, StorageService.ts
Integration: Feeds into all other features

// 2. StyleDNA Analysis  
Files: ProfilePage.tsx, WardrobeUploadScreen.tsx, openai.ts, Avatar.ts
Integration: Personalizes outfit generation and recommendations

// 3. Outfit Generation
Files: BuilderPage.tsx, useOutfitGeneration.ts, openai.ts
Integration: Uses wardrobe items and StyleDNA for AI suggestions

// 4. Laundry Analytics
Files: LaundryAnalytics.tsx (in WardrobePage)
Integration: Tracks wardrobe item status and provides insights

// 5. Camera System
Files: CameraScreen.tsx, PhotoEditingScreen.tsx, useImageHandling.ts
Integration: Feeds into wardrobe addition and StyleDNA analysis

// 6. Smart Suggestions
Files: AIOutfitAssistant.tsx, useSmartSuggestions.ts, openai.ts
Integration: Context-aware recommendations throughout app

// 7. Data Persistence
Files: StorageService.ts, PersistenceService.ts
Integration: Backs up and restores all app data
```

### Cross-Feature Dependencies
```typescript
// StyleDNA → Outfit Generation
StyleDNA provides personal style data for AI outfit suggestions

// Wardrobe → Everything
All features depend on wardrobe item data

// Camera → Wardrobe + StyleDNA  
Camera feeds into both wardrobe addition and style analysis

// Laundry → Wardrobe
Laundry analytics reads and updates wardrobe item status

// Smart Suggestions → Wardrobe + StyleDNA + Context
Uses multiple data sources for intelligent recommendations
```

## 🚀 Why This Architecture Works

### Performance Benefits
1. **No Navigation Overhead**: Single screen eliminates mounting/unmounting
2. **Shared State**: No prop drilling or complex state management needed
3. **Lazy Rendering**: Only active page components are rendered
4. **Memory Efficiency**: Consistent memory usage, no navigation stack

### User Experience Benefits
1. **Seamless Transitions**: Instant page switches with no loading
2. **Consistent State**: Data persists across page changes
3. **Smooth Animations**: No navigation stack interruptions
4. **Responsive Feel**: Immediate feedback to user actions

### Developer Benefits
1. **Single Source of Truth**: All state in one container
2. **Clear Data Flow**: Props-based communication is explicit
3. **Easy Debugging**: All state visible in one place
4. **Maintainable**: Changes are localized and predictable

### Architectural Strengths
1. **Scalable**: Easy to add new pages and features
2. **Testable**: Isolated components with clear interfaces
3. **Reliable**: Simple patterns reduce complexity and bugs
4. **Flexible**: Can adapt to new requirements without major changes

---

**Critical Success Factors**:
- Single-screen container pattern maintains performance and UX
- Hook-based state management provides clean separation of concerns
- Boolean navigation system eliminates complex routing
- Props-based communication keeps data flow explicit and traceable

**Last Updated**: Current stable version with all features working
**Status**: ✅ FULLY DOCUMENTED AND FUNCTIONAL