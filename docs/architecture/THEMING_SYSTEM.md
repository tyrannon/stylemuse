# Color Scheming System

> **Related Documentation**: 
> - [Main Documentation](../../CLAUDE.md) - Core development guide
> - [Theme Context Implementation](../../contexts/ThemeContext.tsx)
> - [Performance Guide](../PERFORMANCE.md) - Theme optimization techniques

## Theme Architecture

StyleMuse uses a comprehensive theming system built with React Context that supports:
- **Light Mode**: Default bright theme
- **Dark Mode**: Dark theme with proper contrast ratios
- **System Mode**: Auto-follows device appearance settings

## Theme Context Location
- **Main Implementation**: `/contexts/ThemeContext.tsx`
- **Usage Hook**: `useTheme()` - provides theme colors, mode, and controls
- **Additional Hooks**: `useThemeColors()`, `useThemeShadows()`

## Color Palette Structure

Each theme includes 17 color properties:

```typescript
interface ThemeColors {
  // Primary colors
  background: string;    // Main background color
  surface: string;       // Card/surface backgrounds
  card: string;          // Individual card backgrounds
  
  // Text colors
  text: string;          // Primary text
  textSecondary: string; // Secondary text
  textMuted: string;     // Muted text
  
  // UI colors
  primary: string;       // Primary brand color
  secondary: string;     // Secondary UI elements
  accent: string;        // Accent highlights
  error: string;         // Error states
  success: string;       // Success states
  warning: string;       // Warning states
  
  // Borders & Dividers
  border: string;        // Border lines
  divider: string;       // Section dividers
  
  // Overlays
  overlay: string;       // Modal overlays
  modalBackdrop: string; // Modal backgrounds
  
  // Loading overlays
  loadingOverlay: string; // Loading screen backgrounds
  loadingCard: string;    // Loading card backgrounds
}
```

## Color Values

### Light Mode Colors
- Background: `#FFFFFF`
- Surface: `#F8F9FA`
- Card: `#FFFFFF`
- Text: `#000000`
- Text Secondary: `#666666`
- Text Muted: `#999999`
- Primary: `#007AFF`
- Error: `#FF3B30`
- Success: `#4CAF50`
- Warning: `#FF9500`
- Border: `#E0E0E0`

### Dark Mode Colors
- Background: `#000000`
- Surface: `#1C1C1E`
- Card: `#2C2C2E`
- Text: `#FFFFFF`
- Text Secondary: `#8E8E93`
- Text Muted: `#636366`
- Primary: `#0A84FF` (brighter for dark mode)
- Error: `#FF453A`
- Success: `#30D158`
- Warning: `#FF9F0A`
- Border: `#38383A`

## Shadow System

The theming system includes pre-configured shadow styles:
- **Small**: Subtle elevation (buttons, small cards)
- **Medium**: Standard elevation (cards, modals)
- **Large**: High elevation (floating elements)

Dark mode shadows have higher opacity for better visibility.

## Usage Patterns

### 1. Static Styles → Dynamic Styles Conversion

**Before (Static):**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
});
```

**After (Dynamic):**
```typescript
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
});

// In component:
const { theme } = useTheme();
const styles = createStyles(theme);
```

### 2. Component Implementation

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, setThemeMode } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Content
      </Text>
    </View>
  );
};
```

### 3. Inline Style Theming

For simple cases, use theme colors directly:
```typescript
<View style={{ backgroundColor: theme.colors.surface }}>
  <Text style={{ color: theme.colors.textSecondary }}>Text</Text>
</View>
```

## Components Using Theme System

**Fully Implemented:**
- ✅ ProfilePage.tsx
- ✅ BuilderPage.tsx  
- ✅ WardrobePage.tsx
- ✅ AIOutfitAssistant.tsx
- ✅ SmartSuggestionsModal.tsx
- ✅ UnifiedLoadingOverlay.tsx
- ✅ BottomNavigation.tsx

**Recently Completed:**
- ✅ ItemDetailView.tsx (hardcoded colors converted to theme system)
- ✅ WardrobeUploadScreen.styles.ts (50+ hardcoded colors converted)
- ✅ CameraScreen.tsx (18+ hardcoded colors converted)
- ✅ PhotoEditingScreen.tsx (20+ hardcoded colors converted)
- ✅ BoundingBoxOverlay.tsx (15+ hardcoded colors converted)
- ✅ All legacy components with `#` color values updated

## Testing Dark Mode

1. Navigate to Profile page
2. Use the "🌙 Dark Mode" toggle
3. Test all three modes: Light, Dark, Auto
4. Verify no hardcoded colors appear bright in dark mode
5. Check text contrast and readability

## Adding New Colors

When adding new UI elements:

1. Use existing theme colors when possible
2. If new colors needed, add to `ThemeColors` interface
3. Define values for both LIGHT_THEME and DARK_THEME
4. Ensure proper contrast ratios (WCAG AA compliance)
5. Test in both light and dark modes

## Common Issues

1. **Hardcoded Colors**: Always use `theme.colors.*` instead of hex values
2. **Text Visibility**: Use `theme.colors.text` for primary text, `textSecondary` for less important text
3. **Background Contrast**: Use `theme.colors.card` for individual cards, `surface` for larger areas
4. **Border Visibility**: Use `theme.colors.border` for subtle borders that work in both modes

## Future Enhancements

- 🎨 Tokyo color scheme (planned)
- 🎭 Additional theme variants
- 🌈 User-customizable accent colors
- 📱 Per-component theme overrides

---
> **Navigation**: [Back to Main Documentation](../../CLAUDE.md) | [Performance Guide](../PERFORMANCE.md) | [Icon System](../ICON_SYSTEM.md)