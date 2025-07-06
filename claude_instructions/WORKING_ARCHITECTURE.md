# StyleMuse - Working Architecture Documentation

## 🎯 Executive Summary

StyleMuse uses a **Single-Screen Container Architecture** with **Hook-Driven State Management** that provides exceptional user experience through smooth transitions and centralized state.

## 🏗️ Core Architecture Pattern

### Single-Screen Container Approach
```
App.js → WardrobeUploadScreen.tsx (Main Container)
├── Page visibility controlled by boolean states
├── Shared state context across all components
└── No traditional navigation stack overhead
```

**Why This Works:**
- ✅ Seamless page transitions
- ✅ Shared state without prop drilling
- ✅ No mounting/unmounting overhead
- ✅ Consistent UX experience

## 🔄 Navigation System

### Page Management
```typescript
// useNavigationState.ts - Controls page visibility
const [showOutfitBuilder, setShowOutfitBuilder] = useState(true);
const [showWardrobe, setShowWardrobe] = useState(false);
const [showOutfitsPage, setShowOutfitsPage] = useState(false);
const [showProfilePage, setShowProfilePage] = useState(false);
```

### Navigation Flow
```
User Action → BottomNavigation → NavigationState Hook → Page Visibility Change
```

## 🎣 Hook-Driven State Management

### Primary State Hooks
| Hook | Purpose | Key Features |
|------|---------|--------------|
| `useWardrobeData()` | Core data management | Items, outfits, persistence |
| `useNavigationState()` | Page visibility | Navigation logic |
| `useOutfitGeneration()` | AI outfit generation | Gear slots, suggestions |
| `useSmartSuggestions()` | AI recommendations | Context-aware suggestions |
| `useImageHandling()` | Camera/photo processing | Image capture, editing |
| `useModalState()` | Modal management | Modal visibility, state |

## 📁 Feature File Map

### 🔥 WORKING FEATURES & LOCATIONS

#### Wardrobe Management
- **Main Container**: `/screens/WardrobeUploadScreen.tsx`
- **Wardrobe View**: `/screens/WardrobePage.tsx`
- **Data Hook**: `/hooks/useWardrobeData.ts`
- **Storage**: `/services/StorageService.ts`

#### Style DNA (FULLY FUNCTIONAL) 🧬
- **Profile Page**: `/screens/ProfilePage.tsx`
- **Avatar Customization**: `/screens/AvatarCustomizationPage.tsx`
- **Types**: `/types/Avatar.ts`
- **Service**: Style analysis in `/utils/openai.ts`

#### Laundry Analytics (FULLY FUNCTIONAL) 🧺
- **Component**: `/screens/components/LaundryAnalytics.tsx`
- **Features**: Status tracking, wash suggestions, statistics

#### Camera & Photo Processing
- **Camera**: `/screens/CameraScreen.tsx`
- **Photo Editing**: `/screens/PhotoEditingScreen.tsx`
- **Hooks**: `/hooks/useImageHandling.ts`, `/hooks/useCameraControls.ts`

#### AI Integration
- **Service**: `/utils/openai.ts`
- **Assistant**: `/components/AIOutfitAssistant.tsx`
- **Smart Suggestions**: `/hooks/useSmartSuggestions.ts`

## 💾 Data Flow Architecture

```
User Action → Component → Hook → Service → API/Storage
     ↓
UI Update ← Component ← Hook ← Service ← Response
```

### Storage Strategy
```typescript
// Key storage entities
STORAGE_KEYS = {
  WARDROBE_ITEMS: 'stylemuse_wardrobe_items',
  LOVED_OUTFITS: 'stylemuse_loved_outfits', 
  STYLE_DNA: 'stylemuse_style_dna',
  SELECTED_GENDER: 'stylemuse_selected_gender',
  PROFILE_IMAGE: 'stylemuse_profile_image'
}
```

## 🤖 AI Integration Layer

### OpenAI Functions
- `describeClothingItem()`: Detailed clothing analysis
- `generateOutfitImage()`: Visual outfit generation
- `analyzePersonalStyle()`: Style DNA analysis
- `generateIntelligentOutfitSelection()`: Smart outfit assembly

## 🎯 Why This Architecture Works

1. **Simplicity**: Single-screen eliminates navigation complexity
2. **Performance**: No screen mounting/unmounting overhead
3. **User Experience**: Smooth transitions, consistent state
4. **Maintainability**: Clear separation through hooks
5. **Scalability**: Easy to add features without breaking existing code
6. **Type Safety**: Full TypeScript coverage
7. **AI-First**: Deep OpenAI integration throughout

## 🚨 Critical Success Factors

### DO NOT TOUCH (These Make It Work)
- Single-screen container pattern in `WardrobeUploadScreen.tsx`
- Hook-based state management system
- Boolean-based navigation state
- Shared state context approach
- OpenAI integration in `/utils/openai.ts`

### Safe to Modify
- Individual page components
- Styling and UI components
- New features as separate hooks
- Additional AI functions

## 📊 Component Hierarchy

```
WardrobeUploadScreen (Main Container)
├── BottomNavigation (Navigation)
├── BuilderPage (Outfit Builder)
├── WardrobePage (Wardrobe Management)
│   └── LaundryAnalytics ✅
├── OutfitsPage (Outfit Gallery)
├── ProfilePage (Style DNA) ✅
│   └── AvatarCustomization ✅
├── CameraScreen (Photo Capture)
└── Various Modals & Overlays
```

---

**Last Updated**: Current Stable Version
**Status**: ✅ FULLY FUNCTIONAL
**Next Steps**: Incremental improvements only!