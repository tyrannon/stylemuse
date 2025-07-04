# StyleMuse Testing Guide

## Manual Testing Checklist

### 1. Basic Functionality
- [ ] App launches without errors
- [ ] Navigation between screens works
- [ ] Image upload and capture works
- [ ] Wardrobe items can be added/edited/deleted
- [ ] Outfit generation works

### 2. Performance Testing
- [ ] No infinite loops or memory leaks
- [ ] Smooth animations and transitions
- [ ] Loading states display properly
- [ ] App responds quickly to user interactions

### 3. Edge Cases
- [ ] Empty wardrobe handling
- [ ] Network connectivity issues
- [ ] Storage permission handling
- [ ] Large number of items performance

### 4. Device Testing
- [ ] iOS simulator testing
- [ ] Android emulator testing
- [ ] Physical device testing
- [ ] Different screen sizes

## Common Test Scenarios

### Wardrobe Management
1. Add item with photo
2. Edit item details
3. Delete item
4. Bulk operations
5. Category filtering

### Outfit Generation
1. Generate outfit from existing items
2. Handle empty wardrobe
3. Save and love outfits
4. View outfit history

### Error Handling
1. Network failures
2. Storage errors
3. Invalid data scenarios
4. Permission denials

## Debug Commands
```bash
# Run with debugging
npx react-native start --verbose

# Clear all caches
npx react-native start --reset-cache

# Type checking
npx tsc --noEmit

# Bundle analysis
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios-bundle.js --verbose
```