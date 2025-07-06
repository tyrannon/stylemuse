# Multi-Item Detection Feature Implementation Plan 🎯

## 🚀 Mission: Camera Multi-Item Detection & Bounding Rectangles

**Status**: Ready for Implementation  
**Complexity**: Medium - Cross-component integration  
**Recommended Model**: Sonnet (focused implementation tasks)  
**Foundation**: ✅ `detectMultipleClothingItems` function complete in `/utils/openai.ts`

## 📋 Implementation Flight Path

### Phase 1: Camera Flow Integration (Priority: HIGH)
**File**: `/screens/CameraScreen.tsx`
**Task for Sonnet**: Add multi-item capture mode

```typescript
// Add to CameraScreen state
const [multiItemMode, setMultiItemMode] = useState(false);
const [detectedItems, setDetectedItems] = useState([]);
const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);

// New capture flow
const handleMultiItemCapture = async (imageUri) => {
  setLoading(true);
  const base64 = await convertToBase64(imageUri);
  const result = await detectMultipleClothingItems(base64);
  setDetectedItems(result.items || []);
  setShowBoundingBoxes(true);
};
```

### Phase 2: Bounding Box UI Component (Priority: HIGH)
**File**: `/components/BoundingBoxOverlay.tsx` (NEW)
**Task for Sonnet**: Create overlay component

```typescript
interface BoundingBoxOverlayProps {
  imageUri: string;
  detectedItems: DetectedItem[];
  onItemSelect: (item: DetectedItem) => void;
  visible: boolean;
}

// Component renders:
// - Background image
// - Colored rectangles over detected items
// - Touch handlers for item selection
// - Item labels with confidence scores
```

### Phase 3: Photo Editing Integration (Priority: MEDIUM)
**File**: `/screens/PhotoEditingScreen.tsx`
**Task for Sonnet**: Add multi-item processing mode

```typescript
// Add multi-item editing capabilities
const [selectedItemIndex, setSelectedItemIndex] = useState(0);
const [croppedItems, setCroppedItems] = useState([]);

// Crop each detected item automatically
const processMutlipleItems = async () => {
  for (const item of detectedItems) {
    const cropped = await cropImageWithBounds(imageUri, item.boundingBox);
    setCroppedItems(prev => [...prev, { ...item, croppedUri: cropped }]);
  }
};
```

### Phase 4: Wardrobe Integration (Priority: HIGH)
**File**: `/hooks/useWardrobeData.ts`
**Task for Sonnet**: Add bulk item processing

```typescript
// Add function to save multiple items at once
const saveBulkWardrobeItems = async (items: DetectedItem[]) => {
  const wardrobeItems = await Promise.all(
    items.map(async (item) => ({
      id: generateId(),
      imageUri: item.croppedUri,
      title: item.title,
      description: item.description,
      color: item.color,
      material: item.material,
      style: item.style,
      fit: item.fit,
      tags: item.tags,
      category: categorizeItem(item),
      dateAdded: new Date(),
    }))
  );
  
  setSavedItems(prev => [...prev, ...wardrobeItems]);
  await StorageService.saveWardrobeItems([...savedItems, ...wardrobeItems]);
};
```

## 🎯 Detailed Component Plan

### 1. CameraScreen Updates
**Sonnet Task**: Modify existing camera interface
- Add "Multi-Item" toggle button next to existing camera controls
- Integrate with existing `useCameraControls` hook
- Maintain all existing functionality
- Add loading states for AI processing

### 2. BoundingBoxOverlay Component (NEW)
**Sonnet Task**: Create reusable overlay component
- Absolute positioned over camera preview
- Converts 0-100 coordinate system to screen pixels
- Interactive rectangles with labels
- Color-coded by confidence score
- Haptic feedback on touch

### 3. PhotoEditingScreen Integration
**Sonnet Task**: Extend existing photo editing
- Add multi-item mode to existing editing flow
- Show thumbnail grid of detected items
- Individual item editing capabilities
- Batch processing options

### 4. Navigation Flow Updates
**Sonnet Task**: Update existing navigation patterns
- Multi-item mode in `useNavigationState`
- Proper flow from camera → editing → wardrobe
- Maintain existing single-item flow

## 🔧 Technical Implementation Details

### Coordinate System Conversion
```typescript
// Convert 0-100 system to screen coordinates
const convertBoundingBox = (bbox, imageWidth, imageHeight) => ({
  x: (bbox.x / 100) * imageWidth,
  y: (bbox.y / 100) * imageHeight,
  width: (bbox.width / 100) * imageWidth,
  height: (bbox.height / 100) * imageHeight,
});
```

### Image Cropping Utility
```typescript
// Crop individual items from main image
const cropImageWithBounds = async (imageUri, boundingBox) => {
  // Use expo-image-manipulator for precise cropping
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ crop: convertBoundingBox(boundingBox) }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

## 📱 User Experience Flow

### Current Single-Item Flow
Camera → Capture → Edit → Save to Wardrobe

### New Multi-Item Flow
Camera → **Multi-Item Toggle** → Capture → **Bounding Box Selection** → Edit Individual Items → **Batch Save to Wardrobe**

## 🚨 Integration Safeguards

### Preserve Existing Functionality
- ✅ Keep all existing camera modes working
- ✅ Maintain single-item capture flow
- ✅ Don't modify existing wardrobe data structures
- ✅ Keep existing navigation patterns

### Error Handling
- ✅ Fallback to single-item mode if AI fails
- ✅ User feedback for processing states
- ✅ Graceful handling of no items detected
- ✅ Network error handling

## 📊 Testing Strategy

### Core Functionality Tests
1. Multi-item toggle works in camera
2. Bounding boxes appear correctly
3. Item selection and cropping works
4. Batch save to wardrobe succeeds
5. All existing features still work

### Edge Cases
1. No items detected
2. Single item detected (should work like normal)
3. Network failures during AI processing
4. Invalid image formats
5. Very small or very large detected items

## 🎯 Sonnet Task Assignments

**This is the perfect Sonnet workflow - focused, individual file changes:**

1. **Task 1**: Add multi-item mode to CameraScreen.tsx
2. **Task 2**: Create BoundingBoxOverlay.tsx component
3. **Task 3**: Add image cropping utility function
4. **Task 4**: Extend PhotoEditingScreen.tsx for multi-item
5. **Task 5**: Add bulk save to useWardrobeData.ts
6. **Task 6**: Update navigation states
7. **Task 7**: Test and debug integration

## 🚀 Ready for Handoff to Sonnet

**Foundation Complete**: ✅ AI function ready  
**Plan Complete**: ✅ Detailed implementation path  
**Architecture Preserved**: ✅ No breaking changes  
**Safety Nets**: ✅ Error handling planned  

**Next Action**: Switch to Sonnet and begin with Task 1 (CameraScreen integration)

---

**R2-D2 Status**: 🤖 Plan computed, flight path calculated, ready for hyperspace jump to implementation!  
**Recommended for C-3PO (Sonnet)**: Focused implementation of each component in sequence