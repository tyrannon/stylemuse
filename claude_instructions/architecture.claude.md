# StyleMuse Architecture Guide

## Project Structure
```
stylemuse/
├── hooks/                          # Custom React hooks
│   ├── useWardrobeData.ts         # Main data management
│   ├── useOutfitGeneration.ts     # Outfit generation logic
│   ├── useNavigationState.ts     # Navigation state
│   ├── useImageHandling.ts       # Image operations
│   └── useCameraIntegration.ts   # Camera & photo processing
├── screens/                       # Screen components
│   ├── WardrobeUploadScreen.tsx  # Main screen
│   ├── OutfitsPage.tsx          # Outfits display
│   ├── AddItemPage.tsx          # Unified item input
│   └── components/              # Screen components
├── services/                     # External services
│   └── StorageService.ts        # AsyncStorage wrapper
├── utils/                       # Utility functions
│   ├── openai.ts               # Enhanced AI integration with validation
│   ├── backgroundRemoval.ts    # Remove.bg API integration
│   ├── photoQualityAssessment.ts # Photo quality analysis
│   └── dateUtils.ts           # Date utilities
└── claude_instructions/         # AI assistant guides
    ├── architecture.claude.md
    ├── features.claude.md
    ├── image-analysis-accuracy.claude.md  # NEW: Accuracy guide
    └── testing.claude.md
```

## Key Patterns

### 1. Custom Hooks Pattern
All business logic is encapsulated in custom hooks:
- `useWardrobeData` - Manages all wardrobe state and operations
- `useOutfitGeneration` - Handles outfit creation and suggestions
- `useNavigationState` - Manages navigation and UI state
- `useImageHandling` - Handles image operations and generation
- `useCameraIntegration` - Enhanced photo processing with quality assessment and background removal

### 2. State Management
- Uses React hooks (useState, useEffect, useCallback)
- AsyncStorage for persistence
- No external state management library (Redux, Zustand)

### 3. Data Flow
1. User interacts with UI components
2. Components call hook functions
3. Hooks update state and call services
4. Services interact with storage/APIs
5. State updates trigger re-renders

### 4. TypeScript Usage
- Strict typing for all interfaces
- Proper error handling with try/catch
- Optional chaining for safe property access

## Performance Considerations
- Use useCallback for functions passed as props
- Use useMemo for expensive calculations
- Minimize objects in useEffect dependencies
- Implement proper loading states
- **Image Processing**: Background removal and quality assessment are computationally expensive
- **API Cost Management**: Enhanced AI prompts increase token usage (~50% more than basic prompts)
- **Caching Strategy**: Photo quality metrics and background removal results should be cached

## Image Analysis Architecture

### Super Accurate Analysis Pipeline
1. **Photo Quality Assessment** (`utils/photoQualityAssessment.ts`)
   - Brightness, contrast, sharpness, composition analysis
   - Multiple item detection for clothing separation
   - Actionable recommendations for photo improvement

2. **Background Removal** (`utils/backgroundRemoval.ts`)
   - Remove.bg API integration with fallback modes
   - Product-optimized settings for clothing items
   - Batch processing capabilities with rate limiting

3. **Enhanced AI Analysis** (`utils/openai.ts`)
   - Microscopic detail analysis with extreme precision
   - Multi-attempt validation with exponential backoff
   - Structured fallback responses for reliability

4. **Quality Validation**
   - JSON structure validation and type checking
   - Content quality assessment (generic term detection)
   - Field completeness verification with smart defaults

### Integration Points
- **useCameraIntegration**: Orchestrates the entire pipeline
- **Photo Processing**: Quality → Background Removal → AI Analysis
- **Error Handling**: Graceful degradation at each step
- **Cost Management**: Configurable quality thresholds and retry limits