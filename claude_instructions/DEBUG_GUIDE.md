# StyleMuse Debug Guide 🔧

## 🎯 Quick Debug Reference

### Most Common Issues & Solutions

#### 1. **Features Suddenly Stop Working**
```bash
# First check - are we on the right branch?
git branch
# Should be on main-stable or main-stable-backup

# Check if anything broke the main container
git status
git diff

# If confused, reset to known good state
git checkout main-stable-backup
```

#### 2. **StyleDNA Not Working**
- **Check**: `/screens/ProfilePage.tsx` - StyleDNA section should be present
- **Check**: OpenAI API key in environment
- **Check**: Profile image upload functionality
- **File**: Look for `EnhancedStyleDNA` types and `analyzePersonalStyle()` function

#### 3. **Laundry Analytics Missing**
- **Check**: `/screens/components/LaundryAnalytics.tsx` exists
- **Check**: Component is imported in `WardrobePage.tsx`
- **Look for**: Laundry status data in wardrobe items

#### 4. **Navigation Broken**
- **Check**: `useNavigationState.ts` hook is working
- **Check**: `BottomNavigation.tsx` is rendering
- **Verify**: Boolean states in navigation hook

#### 5. **AI Features Not Working**
- **Check**: OpenAI API key is set in environment
- **Check**: `/utils/openai.ts` file is present and functional
- **Look for**: Console errors related to API calls

## 🔍 Debugging Workflow

### Step 1: Identify the Scope
```typescript
// Is it a specific feature or the whole app?
// Check console for errors first
console.log('🔍 Debug checkpoint - feature X');
```

### Step 2: Check File Integrity
```bash
# Verify key files exist
ls src/screens/WardrobeUploadScreen.tsx  # Main container
ls src/hooks/useWardrobeData.ts          # Core data
ls src/utils/openai.ts                   # AI functions
ls src/services/StorageService.ts        # Storage
```

### Step 3: Verify Hook Dependencies
```typescript
// In the problematic component, add debug logs
const wardrobeData = useWardrobeData();
const navigation = useNavigationState();
console.log('🔍 Hook data:', { wardrobeData, navigation });
```

### Step 4: Check Storage
```typescript
// Verify data persistence
import { StorageService } from '../services/StorageService';

const debugStorage = async () => {
  const items = await StorageService.getWardrobeItems();
  const outfits = await StorageService.getLovedOutfits();
  console.log('🔍 Storage check:', { items: items?.length, outfits: outfits?.length });
};
```

## 🚨 Emergency Recovery Procedures

### If App Won't Start
```bash
# Clean reset
npm install
expo start --clear

# If still broken, reset to stable
git checkout main-stable-backup
npm install
expo start --clear
```

### If Features Are Missing
```bash
# Check what changed
git status
git diff HEAD~1

# If unsure, reset to last known good
git reset --hard HEAD~1
```

### If Data Is Lost
```bash
# Check if backup exists in ProfilePage
# Look for backup/restore functionality
# Data is stored in AsyncStorage with these keys:
# - stylemuse_wardrobe_items
# - stylemuse_loved_outfits  
# - stylemuse_style_dna
```

## 📊 Debug Logging Strategy

### Add Debug Logging
```typescript
// For hooks
console.log('🎣 Hook:', hookName, 'State:', currentState);

// For components
console.log('🧩 Component:', componentName, 'Props:', props);

// For services  
console.log('🔧 Service:', serviceName, 'Input:', input, 'Output:', output);

// For AI functions
console.log('🤖 AI Function:', functionName, 'Result:', result);
```

### Key Debug Points
1. **App Launch**: `App.js` and `WardrobeUploadScreen.tsx`
2. **Navigation**: `useNavigationState.ts` state changes
3. **Data Loading**: `useWardrobeData.ts` initialization
4. **AI Calls**: `openai.ts` function calls and responses
5. **Storage**: `StorageService.ts` read/write operations

## 🔧 Common Fix Patterns

### Missing Component Fix
```typescript
// If component suddenly missing, check import
import { MissingComponent } from '../path/to/component';

// Verify it's being rendered conditionally
{showComponent && <MissingComponent />}
```

### Hook Not Working Fix
```typescript
// Check hook dependencies
useEffect(() => {
  // Debug what triggered the effect
  console.log('🔄 Effect triggered:', dependencies);
}, [dependencies]);
```

### AI Function Fix
```typescript
// Check API key and error handling
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API Key');
  return fallbackResult;
}
```

## 📱 Device-Specific Issues

### iOS Issues
- **Camera permissions**: Check `Info.plist` for camera usage description
- **Storage issues**: AsyncStorage path problems
- **Navigation**: Safe area handling

### Android Issues
- **Camera**: Different permission model
- **Storage**: Different file system paths
- **Back button**: Android back button handling

## 🎯 Performance Debug

### Slow Performance
```typescript
// Add performance timing
const startTime = Date.now();
// ... operation
console.log('⏱️ Operation took:', Date.now() - startTime, 'ms');
```

### Memory Issues
```typescript
// Check for memory leaks in hooks
useEffect(() => {
  return () => {
    // Cleanup code
    console.log('🧹 Cleanup triggered');
  };
}, []);
```

## 🔍 Specific Feature Debug

### StyleDNA Debug
```typescript
// Check ProfilePage.tsx for StyleDNA section
// Verify these functions exist:
// - analyzePersonalStyle()
// - Style DNA display components
// - Avatar generation functionality
```

### Laundry Analytics Debug
```typescript
// Check LaundryAnalytics.tsx exists and is imported
// Verify wardrobe items have laundryStatus field
// Check for clean/dirty/washing status tracking
```

### Camera Debug
```typescript
// Check CameraScreen.tsx and PhotoEditingScreen.tsx
// Verify camera permissions
// Check image handling hooks
```

## 📋 Debug Checklist

### Before Making Changes
- [ ] Commit current working state
- [ ] Create backup branch
- [ ] Test current functionality
- [ ] Document what you're trying to fix

### After Making Changes
- [ ] Test the specific fix
- [ ] Test that existing features still work
- [ ] Check console for new errors
- [ ] Test on actual device, not just simulator
- [ ] Commit with descriptive message

### If Something Breaks
- [ ] Check git status and diff
- [ ] Look at console errors
- [ ] Try reverting last change
- [ ] If still broken, reset to stable branch
- [ ] Document what happened for future reference

---

**Remember**: The goal is always to maintain a working app. If you're not sure about a fix, create a backup branch first!

**Emergency Contact**: Reset to `main-stable-backup` branch and start over
**Last Updated**: After successful recovery to stable state