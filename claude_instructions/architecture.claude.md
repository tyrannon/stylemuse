# StyleMuse Architecture Guide

## Project Structure
```
stylemuse/
├── hooks/                    # Custom React hooks
│   ├── useWardrobeData.ts   # Main data management
│   ├── useOutfitGeneration.ts # Outfit generation logic
│   ├── useNavigationState.ts # Navigation state
│   └── useImageHandling.ts  # Image operations
├── screens/                 # Screen components
│   ├── WardrobeUploadScreen.tsx # Main screen
│   └── OutfitsPage.tsx      # Outfits display
├── services/                # External services
│   └── StorageService.ts    # AsyncStorage wrapper
├── utils/                   # Utility functions
│   ├── openai.ts           # OpenAI integration
│   └── dateUtils.ts        # Date utilities
└── claude_instructions/     # AI assistant guides
```

## Key Patterns

### 1. Custom Hooks Pattern
All business logic is encapsulated in custom hooks:
- `useWardrobeData` - Manages all wardrobe state and operations
- `useOutfitGeneration` - Handles outfit creation and suggestions
- `useNavigationState` - Manages navigation and UI state
- `useImageHandling` - Handles image operations and generation

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