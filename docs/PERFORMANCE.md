# Performance Optimization Guide
<!-- Last edited: 2025-07-19 by Claude Code -->
<!-- Change: Extracted from CLAUDE.md during optimization -->

## Zero-Flicker Navigation (2025-07-13)

### Problem Solved
Speed dial icons in the Outfit Builder were "trickling in" and flickering each time users navigated back to the page, creating a poor user experience with visible loading delays.

### Root Causes Identified
1. **Component Unmounting**: Navigation used conditional rendering (`{showOutfitBuilder && <Component />}`) which completely unmounted components when navigating away
2. **Lack of Memoization**: `RandomOutfitButtons` component was recreating on every parent render
3. **No Asset Preloading**: PNG images weren't explicitly preloaded, causing React Native to load them asynchronously on each mount

### Solution Implemented

#### 1. Display-Based Navigation
Changed from unmounting components to hiding them with CSS:
```typescript
// Before: Components unmount when navigating away
{showOutfitBuilder && (
  <View style={{ marginTop: 20 }}>
    {/* Outfit Builder content */}
  </View>
)}

// After: Components stay mounted, just hidden
<View style={{ 
  marginTop: 20, 
  display: showOutfitBuilder ? 'flex' : 'none' 
}}>
  {/* Outfit Builder content */}
</View>
```

#### 2. Component Memoization
Wrapped `RandomOutfitButtons` in `React.memo()` with custom comparison:
```typescript
export const RandomOutfitButtons = React.memo(({ ... }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.isGenerating === nextProps.isGenerating &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onGenerate === nextProps.onGenerate &&
    prevProps.onAIGenerate === nextProps.onAIGenerate
  );
});
```

#### 3. Image Preloading
Added explicit preloading of speed dial icons on screen mount:
```typescript
useEffect(() => {
  const speedDialImages = [
    require('../assets/surprise.png'),
    require('../assets/casual.png'),
    // ... all 8 speed dial icons
  ];
  
  const promises = speedDialImages.map(source => 
    Image.prefetch(Image.resolveAssetSource(source).uri)
  );
  Promise.all(promises);
}, []); // Only run once on mount
```

#### 4. Performance Monitoring
Added console logging to verify mount/unmount behavior:
```typescript
useEffect(() => {
  console.log('[PERFORMANCE] RandomOutfitButtons mounted');
  return () => {
    console.log('[PERFORMANCE] RandomOutfitButtons unmounted');
  };
}, []);
```

### Outcome
- **Instant Rendering**: Speed dial icons now appear immediately with zero delay
- **Persistent Memory**: Components remain in memory, preventing reload cycles
- **Smooth Navigation**: Tab switching is now buttery smooth with no visual artifacts
- **Improved UX**: Users experience a professional, native-like interface

### Key Takeaways for Developers
1. **Prefer CSS hiding over unmounting** for frequently accessed screens
2. **Use React.memo() strategically** for components with expensive renders
3. **Preload critical assets** that users will definitely see
4. **Monitor performance** with console logs during development
5. **Match patterns from working screens** (Outfits/Wardrobe pages already used this approach)

This optimization pattern should be applied to any screen with:
- Heavy image content
- Frequent navigation patterns
- Complex component trees
- Performance-critical user interactions