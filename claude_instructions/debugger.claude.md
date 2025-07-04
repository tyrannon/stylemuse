# StyleMuse Debugging Guide

## Common Issues and Solutions

### 1. Infinite Loop Errors
**Error**: "Maximum update depth exceeded"
**Common Causes**:
- useEffect with missing or incorrect dependencies
- Objects in dependency arrays that recreate on every render
- Circular dependencies between useCallback functions

**Solution Checklist**:
- [ ] Remove unstable objects from useEffect dependencies
- [ ] Use useCallback for functions that are dependencies
- [ ] Ensure primitive values or stable references in dependency arrays
- [ ] Check for circular function dependencies

### 2. Hook Dependency Issues
**Error**: "useCallback/useMemo dependencies recreating on every render"
**Solution**:
- Use useCallback for functions that are passed as props
- Use useMemo for expensive calculations
- Ensure dependency arrays contain only primitive values or stable references

### 3. State Management Issues
**Error**: "Cannot read property of undefined" or "ReferenceError"
**Solution**:
- Add proper null checks and default values
- Use optional chaining (?.) for object properties
- Initialize state with proper default values

### 4. React Native Specific Issues
**Error**: "Cannot resolve module" or "Metro bundler errors"
**Solution**:
- Clear Metro cache: `npx react-native start --reset-cache`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check import paths are correct

## Debug Commands
```bash
# Clear all caches
npx react-native start --reset-cache

# Check TypeScript errors
npx tsc --noEmit

# Run with verbose logging
npx react-native start --verbose
```

## Key Files to Check for Issues
- `hooks/useWardrobeData.ts` - Main data management
- `hooks/useOutfitGeneration.ts` - Outfit generation logic
- `screens/WardrobeUploadScreen.tsx` - Main screen component
- `hooks/useNavigationState.ts` - Navigation state management