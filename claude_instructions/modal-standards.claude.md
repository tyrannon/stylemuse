# StyleMuse Modal Standards & Best Practices

## Core Principles

### 1. **Modal Minimalism**
- **Prefer inline controls over modals** for sorting, filtering, and simple selections
- **Reserve modals for**: Complex forms, full-screen experiences, critical confirmations
- **Avoid nested modals** - use navigation stack or single modal with multiple views

### 2. **Gesture Harmony**
- **Single scroll direction** per modal when possible
- **Clear gesture boundaries** - no competing scroll areas
- **Respect system gestures** - don't override back/swipe behaviors

### 3. **Processing Awareness**
- **Lock modals during critical operations** (AI processing, network requests)
- **Provide clear feedback** when dismissal is temporarily blocked
- **Implement graceful interruption** handling

## Implementation Standards

### ✅ **Preferred Patterns**

#### **Inline Expandable Controls**
```tsx
// ✅ Good: Inline sorting (like our BuilderPage fix)
const [showSortOptions, setShowSortOptions] = useState(false);

<TouchableOpacity onPress={() => setShowSortOptions(!showSortOptions)}>
  <Text>Sort: {currentSort} {showSortOptions ? '▲' : '▼'}</Text>
</TouchableOpacity>
{showSortOptions && (
  <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
    <SortOptionsInline />
  </Animated.View>
)}
```

#### **Single Modal with Navigation**
```tsx
// ✅ Good: Single modal with internal navigation
<Modal visible={visible}>
  <View style={styles.modalContainer}>
    <ModalHeader />
    {currentView === 'main' && <MainView />}
    {currentView === 'detail' && <DetailView />}
  </View>
</Modal>
```

#### **Processing-Aware Modals**
```tsx
// ✅ Good: Locked during processing
<Modal 
  visible={visible}
  onRequestClose={() => {
    if (isProcessing) {
      Alert.alert('Processing', 'Please wait for completion...');
    } else {
      onClose();
    }
  }}
>
```

### ❌ **Avoid These Patterns**

#### **Nested Modals**
```tsx
// ❌ Bad: Modal within modal
<Modal visible={outerVisible}>
  <Modal visible={innerVisible}>  // This causes iOS conflicts
    <Content />
  </Modal>
</Modal>
```

#### **Competing Scroll Areas**
```tsx
// ❌ Bad: Multiple scroll directions
<Modal>
  <ScrollView>  // Vertical scroll
    <ScrollView horizontal>  // Horizontal scroll - conflict!
      <Content />
    </ScrollView>
  </ScrollView>
</Modal>
```

#### **Uncontrolled Dismissal**
```tsx
// ❌ Bad: Can be dismissed during critical operations
<Modal visible={visible} onRequestClose={onClose}>
  {/* AI processing without protection */}
</Modal>
```

## Modal Architecture Guidelines

### **Modal Hierarchy**
```
Level 1: Page-level modals (full-screen experiences)
├── SmartSuggestionsModal
├── MultiItemProgressModal
└── TextItemEntryModal

Level 2: Component-level modals (focused interactions)
├── ItemDetailView
├── MarkAsWornModal
└── CategoryDropdown

Level 3: Inline controls (preferred for simple interactions)
├── Sort options
├── Filter controls
└── Quick selections
```

### **State Management**
```tsx
// Centralized modal state using useModalState hook
const {
  showCamera,
  showPhotoEditing, 
  showSortFilter,
  toggleModal,
  closeAllModals
} = useModalState();
```

## Testing Checklist

### **Per-Modal Testing**
- [ ] Opens/closes correctly
- [ ] Handles rapid tapping
- [ ] Scrolls smoothly
- [ ] Respects system gestures
- [ ] Works across screen sizes
- [ ] Handles processing states
- [ ] Accessible to screen readers

### **Integration Testing**
- [ ] No modal conflicts
- [ ] Navigation compatibility
- [ ] Performance under load
- [ ] Memory management
- [ ] Orientation changes
- [ ] Background/foreground cycles

## Common Issues & Solutions

### **Issue: Modal doesn't dismiss**
**Solution**: Check for processing locks, ensure `onRequestClose` is implemented

### **Issue: Scroll conflicts**
**Solution**: Redesign as inline controls or single scroll direction

### **Issue: Navigation breaks**
**Solution**: Implement proper modal state management, avoid nested modals

### **Issue: Performance problems**
**Solution**: Lazy load modal content, implement proper unmounting

## Migration Strategy

### **Phase 1: Quick Wins**
1. Replace simple modals with inline controls
2. Fix nested modal architecture
3. Add processing guards

### **Phase 2: Systematic Refactor**
1. Implement base modal component
2. Standardize presentation styles
3. Add comprehensive testing

### **Phase 3: Advanced Features**
1. Modal analytics
2. Performance monitoring
3. Accessibility enhancements

## Base Modal Component

```tsx
// BaseModal.tsx - Standardized modal foundation
interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  processingLock?: boolean;
  processingMessage?: string;
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen';
  children: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  processingLock = false,
  processingMessage = 'Processing...',
  presentationStyle = 'pageSheet',
  children
}) => {
  const handleClose = useCallback(() => {
    if (processingLock) {
      Alert.alert('Please Wait', processingMessage);
      return;
    }
    onClose();
  }, [processingLock, processingMessage, onClose]);

  return (
    <Modal
      visible={visible}
      presentationStyle={presentationStyle}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {children}
      </SafeAreaView>
    </Modal>
  );
};
```

## Success Metrics

### **Quantitative**
- **Modal-related crashes**: Target 0
- **User abandonment in modals**: <5%
- **Modal performance**: <100ms open/close
- **Navigation failures**: <1% of sessions

### **Qualitative**  
- **Smooth interactions**: No gesture conflicts
- **Consistent behavior**: Predictable across app
- **Accessible experience**: Screen reader friendly
- **Professional polish**: Smooth animations

## Future Considerations

### **React Native Updates**
- Monitor new modal APIs
- Leverage platform improvements
- Maintain compatibility

### **User Feedback**
- Track modal interaction patterns
- Identify pain points
- Iterate based on usage data

### **Performance Monitoring**
- Modal open/close times
- Memory usage patterns
- Gesture responsiveness
- Battery impact

---

*This document should be updated as new modal patterns emerge and React Native evolves.*