# StyleMuse - Complete Architecture Blueprint

## 🎯 Executive Summary

StyleMuse is a React Native fashion app built with a **Single-Screen Container Architecture** using **Hook-Driven State Management**. The app provides AI-powered wardrobe management, outfit generation, and style analysis through a seamless, unified interface.

---

## 📱 Page Flow & Navigation Architecture

### Entry Point
```
App.js → WardrobeUploadScreen.tsx (Main Container)
```

### Navigation Pattern
**Single-Screen Container Model**: All pages are managed as conditional renders within one main screen, controlled by boolean states in `useNavigationState.ts`.

```typescript
// Navigation states control page visibility
const [showOutfitBuilder, setShowOutfitBuilder] = useState(true);  // Default page
const [showWardrobe, setShowWardrobe] = useState(false);
const [showOutfitsPage, setShowOutfitsPage] = useState(false);
const [showProfilePage, setShowProfilePage] = useState(false);
const [showAvatarCustomization, setShowAvatarCustomization] = useState(false);
const [showAddItemPage, setShowAddItemPage] = useState(false);
```

### Complete Page Flow Map

```
App Launch → WardrobeUploadScreen (Main Container)
    │
    ├── Bottom Navigation Controls Page Visibility
    │
    ├── 🎮 Builder Page (Default/Landing)
    │   ├── Gender Selection Modal
    │   ├── AI Outfit Assistant
    │   ├── Weather-Based Generation
    │   └── Custom Selection Mode
    │
    ├── 👔 Wardrobe Page
    │   ├── Wardrobe Tab (Item Grid View)
    │   ├── Analytics Tab (Laundry Management)
    │   ├── AI Outfit Generator
    │   └── Item Detail Views
    │
    ├── 👗 Outfits Page
    │   ├── Generated Outfit Gallery
    │   ├── Outfit Analytics
    │   ├── Smart Suggestions
    │   └── Outfit Detail Views
    │
    ├── 🧬 Profile Page
    │   ├── Style DNA Analysis
    │   ├── Avatar Display
    │   ├── Statistics
    │   ├── Backup & Data Management
    │   └── → Avatar Customization Page
    │
    └── ➕ Add Item Modal
        ├── Camera Capture
        ├── Photo Library
        ├── Bulk Upload
        └── Text Entry
```

---

## 🗂️ Complete Screen/Page Locations

### Main Screens
| Screen | File Path | Purpose |
|--------|-----------|---------|
| **Main Container** | `/screens/WardrobeUploadScreen.tsx` | Root component, navigation orchestration |
| **Builder Page** | `/screens/BuilderPage.tsx` | Outfit generation & creation tools |
| **Wardrobe Page** | `/screens/WardrobePage.tsx` | Inventory management, analytics |
| **Outfits Page** | `/screens/OutfitsPage.tsx` | Generated outfit gallery |
| **Profile Page** | `/screens/ProfilePage.tsx` | Style DNA, stats, backup |
| **Avatar Customization** | `/screens/AvatarCustomizationPage.tsx` | Avatar personalization |
| **Add Item Page** | `/screens/AddItemPage.tsx` | Unified item input options |
| **Camera Screen** | `/screens/CameraScreen.tsx` | Photo capture interface |
| **Photo Editing** | `/screens/PhotoEditingScreen.tsx` | Image editing tools |

### Navigation Components
| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Bottom Navigation** | `/screens/components/shared/BottomNavigation.tsx` | Main navigation bar |
| **Navigation Hook** | `/hooks/useNavigationState.ts` | Page visibility management |

### Key Page Components
| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Item Detail View** | `/screens/components/ItemDetailView.tsx` | Wardrobe item detail modal |
| **Outfit Detail View** | `/screens/components/OutfitDetailView.tsx` | Outfit detail modal |
| **Laundry Analytics** | `/screens/components/LaundryAnalytics.tsx` | Laundry tracking dashboard |
| **Smart Suggestions** | `/screens/components/SmartOutfitSuggestions.tsx` | AI recommendation panel |
| **AI Outfit Assistant** | `/components/AIOutfitAssistant.tsx` | Unified AI outfit generator |

---

## 💾 Storage Architecture

### Storage Strategy
**Primary**: AsyncStorage with persistent backup system
**Pattern**: Hook-driven data management with service layer abstraction

### Storage Keys & Structure
```typescript
// Core storage entities
STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',        // WardrobeItem[]
  LOVED_OUTFITS: 'stylemuse_loved_outfits',          // LovedOutfit[]
  STYLE_DNA: 'stylemuse_style_dna',                  // EnhancedStyleDNA
  SELECTED_GENDER: 'stylemuse_selected_gender',      // 'male'|'female'|'nonbinary'
  PROFILE_IMAGE: 'stylemuse_profile_image',          // string (URI)
  WISHLIST_ITEMS: 'stylemuse_wishlist_items',        // WishlistItem[]
  SUGGESTED_ITEMS: 'stylemuse_suggested_items'       // SuggestedItem[]
}
```

### Data Models
```typescript
// Wardrobe Item Structure
interface WardrobeItem {
  image: string;                    // Image URI or 'text-only'
  title?: string;                   // User-defined name
  description: string;              // AI-generated description
  tags?: string[];                  // Searchable tags
  color?: string;                   // Precise color analysis
  material?: string;                // Fabric identification
  style?: string;                   // Style category
  fit?: string;                     // Fit description
  category?: string;                // Auto-categorized
  
  // Laundry Management
  laundryStatus?: LaundryStatus;    // Current cleanliness state
  laundryHistory?: LaundryRecord[]; // Wash history
  lastWashed?: Date;                // Last wash date
  timesWashed?: number;             // Wash count
  washFrequency?: number;           // Days between washes
  needsSpecialCare?: boolean;       // Special care flag
}

// Outfit Structure  
interface LovedOutfit {
  id: string;                       // Unique identifier
  image: string;                    // Generated outfit image
  weatherData?: any;                // Weather context
  styleDNA?: any;                   // Style preferences
  selectedItems: string[];          // Item image URIs
  gender: string | null;            // Target gender
  createdAt: Date;                  // Creation timestamp
  isLoved?: boolean;                // User favorite
  
  // Wear Tracking
  wearHistory: WearRecord[];        // Wear events
  lastWorn?: Date;                  // Last worn date
  timesWorn: number;                // Wear count
  suggestedForReWear?: boolean;     // Re-wear suggestion
  nextSuggestedDate?: Date;         // Next suggestion date
}

// Style DNA Structure
interface EnhancedStyleDNA {
  appearance: {
    hair_color: string;
    build: string;
    complexion: string;
    approximate_age_range: string;
  };
  style_preferences: {
    current_style_visible: string;
    preferred_styles: string[];
    color_palette: string[];
    fit_preferences: string;
  };
  outfit_generation_notes: string;
  avatar_image_url?: string;
}
```

### Backup & Restore System
**Service**: `/services/PersistenceService.ts`

```typescript
// Backup Structure
interface StyleMuseBackup {
  version: string;                  // Backup format version
  timestamp: string;                // Backup creation time
  data: {
    wardrobeItems: WardrobeItem[];
    lovedOutfits: LovedOutfit[];
    styleDNA: EnhancedStyleDNA | null;
    profileImage: string | null;
    selectedGender: 'male' | 'female' | 'nonbinary' | null;
    wishlistItems: WishlistItem[];
    suggestedItems: SuggestedItem[];
  };
}
```

**Features**:
- ✅ Complete data export to JSON
- ✅ Platform-specific persistent storage (iOS: iCloud, Android: external storage)
- ✅ Import with validation and confirmation
- ✅ Automatic weekly backups
- ✅ Backup status monitoring

### Data Persistence Patterns
```typescript
// Service Layer Pattern
StorageService.setItem(key, data)     // Save to AsyncStorage
StorageService.getItem(key)           // Retrieve from AsyncStorage
StorageService.removeItem(key)        // Delete from AsyncStorage

// Hook Pattern
const { savedItems, setSavedItems } = useWardrobeData();
```

---

## 🎣 State Management Flow

### Hook-Driven Architecture
**Pattern**: Custom hooks encapsulate all business logic and state management

### Primary State Hooks
| Hook | File Path | Purpose | Key State |
|------|-----------|---------|-----------|
| **useWardrobeData** | `/hooks/useWardrobeData.ts` | Core data management | Items, outfits, profile data |
| **useNavigationState** | `/hooks/useNavigationState.ts` | Page visibility | Navigation states, detail views |
| **useOutfitGeneration** | `/hooks/useOutfitGeneration.ts` | AI outfit creation | Generation state, gear slots |
| **useSmartSuggestions** | `/hooks/useSmartSuggestions.ts` | AI recommendations | Suggestion state, context |
| **useImageHandling** | `/hooks/useImageHandling.ts` | Image operations | Upload, processing, editing |
| **useCameraControls** | `/hooks/useCameraControls.ts` | Camera management | Capture settings, permissions |
| **useModalState** | `/hooks/useModalState.ts` | Modal management | Modal visibility states |

### Data Flow Pattern
```
User Interaction → Component → Hook → Service → Storage/API
                                ↓
UI Re-render ← Component ← Hook ← Service ← Response
```

### State Sharing Pattern
**All hooks are instantiated in the main container** (`WardrobeUploadScreen.tsx`) and **passed down as props** to child components. This ensures:
- ✅ Single source of truth
- ✅ Consistent state across all pages
- ✅ No prop drilling complexity
- ✅ Easy state debugging

---

## 🎯 Complete Feature Map

### 🔥 Core Features (Fully Functional)

#### 1. Wardrobe Management
**Files**: 
- `/screens/WardrobePage.tsx` - Main wardrobe interface
- `/hooks/useWardrobeData.ts` - Data management
- `/services/StorageService.ts` - Persistence layer

**Features**:
- ✅ Item grid display with photos and text items
- ✅ Category-based filtering and sorting
- ✅ Laundry status tracking with 6 states
- ✅ Item editing and deletion
- ✅ Bulk operations
- ✅ Search and filter capabilities

#### 2. Style DNA Analysis
**Files**:
- `/screens/ProfilePage.tsx` - Style analysis interface  
- `/screens/AvatarCustomizationPage.tsx` - Avatar creation
- `/types/Avatar.ts` - Type definitions
- `/utils/openai.ts` - AI analysis service

**Features**:
- ✅ Photo-based style analysis
- ✅ Appearance detection (hair, build, complexion)
- ✅ Style preference identification
- ✅ Avatar generation and customization
- ✅ Detailed style DNA reports

#### 3. AI Outfit Generation  
**Files**:
- `/components/AIOutfitAssistant.tsx` - Unified AI interface
- `/hooks/useOutfitGeneration.ts` - Generation logic
- `/utils/openai.ts` - AI service integration

**Features**:
- ✅ Context-aware outfit suggestions
- ✅ Weather-based recommendations
- ✅ Style DNA-guided generation
- ✅ Gear slot system for outfit assembly
- ✅ Smart item combination algorithms

#### 4. Laundry Analytics
**Files**:
- `/screens/components/LaundryAnalytics.tsx` - Analytics dashboard
- `/hooks/useWardrobeData.ts` - Laundry data management

**Features**:
- ✅ Status tracking (clean, dirty, washing, drying, needs ironing, stored)
- ✅ Wash frequency analysis
- ✅ Smart wash suggestions
- ✅ Laundry history tracking
- ✅ Visual statistics and charts

#### 5. Camera & Photo Processing
**Files**:
- `/screens/CameraScreen.tsx` - Camera interface
- `/screens/PhotoEditingScreen.tsx` - Photo editing
- `/hooks/useCameraControls.ts` - Camera controls
- `/hooks/useImageHandling.ts` - Image processing

**Features**:
- ✅ In-app camera with professional controls
- ✅ Photo editing tools (crop, rotate, filters)
- ✅ Background removal integration
- ✅ Photo quality assessment
- ✅ Multiple capture modes

#### 6. Data Backup & Persistence
**Files**:
- `/services/PersistenceService.ts` - Backup service
- `/screens/ProfilePage.tsx` - Backup UI

**Features**:
- ✅ Complete data export/import
- ✅ Platform-specific persistent storage
- ✅ Automatic weekly backups
- ✅ Backup validation and restore
- ✅ Data integrity checking

#### 7. Outfit Gallery & Analytics
**Files**:
- `/screens/OutfitsPage.tsx` - Outfit gallery
- `/screens/components/OutfitAnalytics.tsx` - Wear tracking

**Features**:
- ✅ Generated outfit gallery
- ✅ Wear history tracking
- ✅ Outfit rating system
- ✅ Re-wear suggestions
- ✅ Style analytics

### 🚀 Advanced Features

#### Smart Suggestions System
**Files**:
- `/hooks/useSmartSuggestions.ts` - Suggestion logic
- `/components/SmartSuggestionsModal.tsx` - UI interface

**Features**:
- ✅ Context-aware AI recommendations
- ✅ Shopping suggestions integration
- ✅ Outfit completion suggestions
- ✅ Style-based recommendations

#### Text-Only Item Support
**Files**:
- `/components/TextItemCard.tsx` - Text item display
- `/components/TextItemEntryModal.tsx` - Text entry interface

**Features**:
- ✅ Non-photo wardrobe items
- ✅ Text-based descriptions
- ✅ Category auto-classification
- ✅ Integration with photo items

---

## 🔌 Integration Points

### AI Services Integration
**Primary Service**: `/utils/openai.ts`

```typescript
// Core AI Functions
describeClothingItem(base64Image: string)           // Clothing analysis
generateOutfitImage(...)                            // Visual outfit generation  
analyzePersonalStyle(base64Image: string)           // Style DNA analysis
generateIntelligentOutfitSelection(...)             // Smart outfit assembly
generateWeatherBasedOutfit(...)                     // Weather-appropriate outfits
```

### External API Integrations
- **OpenAI GPT-4 Vision**: Clothing analysis and outfit generation
- **OpenAI DALL-E**: Visual outfit image generation  
- **Weather API**: Weather-based outfit recommendations
- **Remove.bg API**: Background removal for product photos

### Inter-Component Communication
```typescript
// Hook-to-Hook Communication Pattern
const wardrobeData = useWardrobeData();
const outfitGeneration = useOutfitGeneration();
const smartSuggestions = useSmartSuggestions();

// Pass wardrobe items to outfit generation
outfitGeneration.generateOutfit(wardrobeData.savedItems);

// Pass generated outfits to suggestions
smartSuggestions.analyzeSuggestions(outfitGeneration.generatedOutfits);
```

---

## 🔧 Dependencies Between Features

### Feature Dependency Map
```
Style DNA Analysis
    ↓ (feeds into)
AI Outfit Generation
    ↓ (creates)  
Outfit Gallery
    ↓ (tracks)
Outfit Analytics

Wardrobe Management
    ↓ (provides items to)
AI Outfit Generation
    ↓ (suggests)
Smart Suggestions
    ↓ (adds to)
Wardrobe Management

Camera System
    ↓ (captures)
Photo Processing
    ↓ (analyzes)
AI Item Analysis
    ↓ (adds to)
Wardrobe Management
```

### Critical Integration Points
1. **Wardrobe Items** → **Outfit Generation**: Items must be loaded before generating outfits
2. **Style DNA** → **AI Recommendations**: Style preferences guide AI suggestions
3. **Outfit History** → **Analytics**: Wear tracking requires outfit data
4. **Camera/Photos** → **AI Analysis**: Photo quality affects AI accuracy
5. **Navigation State** → **All Pages**: Page visibility controls component mounting

---

## ⚡ Performance Considerations

### Optimization Strategies
- ✅ **Hook Memoization**: useCallback for functions, useMemo for expensive calculations
- ✅ **Image Optimization**: Compressed storage, lazy loading, caching
- ✅ **State Minimization**: Only essential state in hooks, derived state in components  
- ✅ **API Efficiency**: Batched requests, response caching, retry logic
- ✅ **Storage Optimization**: JSON compression, selective loading

### Performance Bottlenecks
- 🚨 **AI API Calls**: High latency, token costs
- 🚨 **Image Processing**: Memory intensive, CPU heavy
- 🚨 **Large Wardrobes**: Rendering hundreds of items
- 🚨 **Background Removal**: External API dependency

### Caching Strategy
```typescript
// Image caching
const imageCache = new Map<string, string>();

// AI response caching  
const aiResponseCache = new Map<string, any>();

// Wardrobe data lazy loading
const loadWardrobeChunk = (offset: number, limit: number) => {...};
```

---

## 🎨 UI/UX Architecture

### Design System
**Principle**: Native iOS/Android feel with custom StyleMuse branding

### Component Hierarchy
```
WardrobeUploadScreen (Root Container)
├── SafeAreaView (Platform safety)
├── ScrollView (Main content area)
│   ├── Conditional Page Renders
│   │   ├── BuilderPage
│   │   ├── WardrobePage  
│   │   ├── OutfitsPage
│   │   └── ProfilePage
│   └── Modal Components
│       ├── Item Detail Modal
│       ├── Outfit Detail Modal
│       ├── Smart Suggestions Modal
│       └── Various Input Modals
└── BottomNavigation (Fixed navigation)
```

### Styling Strategy
- **Inline Styles**: Simple components with direct styling
- **StyleSheet**: Complex components with organized style objects
- **Shared Styles**: Common patterns in `/screens/styles/` directory
- **Platform Adaptation**: iOS/Android specific adjustments

---

## 🚨 Critical Architecture Rules

### DO NOT MODIFY (Core Stability)
1. **Single-screen container pattern** in `WardrobeUploadScreen.tsx`
2. **Hook-based state management** system
3. **Boolean navigation state** approach  
4. **Shared state context** through props
5. **AsyncStorage persistence** pattern

### SAFE TO MODIFY (Extension Points)
1. Individual page components and their styling
2. New feature hooks (following existing patterns)
3. Additional AI functions in `/utils/openai.ts`
4. New modal components
5. Enhanced UI components

### EXTENSION GUIDELINES
1. **New Features**: Create new hooks following existing patterns
2. **New Pages**: Add to navigation state hook and main container
3. **New AI Functions**: Add to `/utils/openai.ts` with proper error handling
4. **New Storage**: Use StorageService wrapper and add to STORAGE_KEYS
5. **New Components**: Follow established prop patterns and TypeScript typing

---

## 📊 Technical Specifications

### Platform Support
- **iOS**: React Native 0.72+, iOS 12+
- **Android**: React Native 0.72+, Android API 21+
- **Dependencies**: Expo SDK 49+

### Key Technologies
- **Frontend**: React Native, TypeScript, Expo
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: AsyncStorage with JSON serialization
- **AI Integration**: OpenAI GPT-4 Vision, DALL-E 3
- **Image Processing**: Expo ImagePicker, Remove.bg API
- **Navigation**: Custom boolean-state navigation (no react-navigation)

### Bundle Size Considerations
- **Large Dependencies**: OpenAI client, image processing libraries
- **Optimization**: Tree shaking, code splitting for non-critical features
- **Asset Management**: Compressed images, lazy loading

---

## 📈 Monitoring & Analytics

### Error Tracking
- **Pattern**: Try/catch blocks in all async operations
- **Logging**: Console logging for development, structured logging for production
- **User Feedback**: Error alerts with actionable messages

### Performance Monitoring
- **Metrics**: Load times, API response times, memory usage
- **Optimization**: Image loading performance, AI response caching
- **User Experience**: Smooth animations, responsive interactions

---

## 🔮 Future Architecture Considerations

### Scalability Roadmap
1. **Enhanced AI**: More sophisticated style analysis and recommendations
2. **Social Features**: Outfit sharing, style communities
3. **E-commerce Integration**: Direct shopping integration
4. **Cloud Sync**: Cross-device synchronization
5. **Offline Support**: Robust offline functionality

### Architecture Evolution
- **Maintain**: Single-screen container benefits
- **Enhance**: Hook system with additional capabilities  
- **Optimize**: Performance improvements and caching
- **Extend**: New features following established patterns

---

**Last Updated**: 2024-12-08  
**Status**: ✅ FULLY DOCUMENTED  
**Architecture Version**: 2.0 Stable