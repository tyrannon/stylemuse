/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useOutfitGeneration } from '../hooks/useOutfitGeneration';
import { WardrobeItem } from '../hooks/useWardrobeData';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock sample wardrobe items for testing
const mockWardrobeItems: WardrobeItem[] = [
  {
    image: 'shirt1.jpg',
    title: 'Blue Cotton Shirt',
    description: 'Casual blue cotton shirt',
    color: 'blue',
    material: 'cotton',
    style: 'casual',
    fit: 'regular',
    category: 'top',
    tags: ['casual', 'everyday'],
  },
  {
    image: 'jeans1.jpg',
    title: 'Dark Blue Jeans',
    description: 'Classic dark blue jeans',
    color: 'blue',
    material: 'denim',
    style: 'casual',
    fit: 'slim',
    category: 'bottom',
    tags: ['casual', 'denim'],
  },
  {
    image: 'sneakers1.jpg',
    title: 'White Sneakers',
    description: 'Comfortable white sneakers',
    color: 'white',
    material: 'leather',
    style: 'casual',
    fit: 'regular',
    category: 'shoes',
    tags: ['casual', 'comfortable'],
  },
  {
    image: 'jacket1.jpg',
    title: 'Black Leather Jacket',
    description: 'Stylish black leather jacket',
    color: 'black',
    material: 'leather',
    style: 'casual',
    fit: 'regular',
    category: 'jacket',
    tags: ['edgy', 'leather'],
  },
  {
    image: 'hat1.jpg',
    title: 'Baseball Cap',
    description: 'Classic baseball cap',
    color: 'black',
    material: 'cotton',
    style: 'casual',
    fit: 'adjustable',
    category: 'hat',
    tags: ['casual', 'sport'],
  },
  {
    image: 'watch1.jpg',
    title: 'Silver Watch',
    description: 'Elegant silver watch',
    color: 'silver',
    material: 'metal',
    style: 'formal',
    fit: 'adjustable',
    category: 'accessories',
    tags: ['formal', 'elegant'],
  },
];

// Mock categorizeItem function
const mockCategorizeItem = jest.fn((item: WardrobeItem) => {
  // Return the category from the item, or categorize based on common patterns
  if (item.category) {
    return item.category;
  }
  
  const title = item.title?.toLowerCase() || '';
  const description = item.description?.toLowerCase() || '';
  
  if (title.includes('shirt') || title.includes('blouse') || title.includes('top')) {
    return 'top';
  }
  if (title.includes('jean') || title.includes('pants') || title.includes('bottom')) {
    return 'bottom';
  }
  if (title.includes('shoe') || title.includes('sneaker') || title.includes('boot')) {
    return 'shoes';
  }
  if (title.includes('jacket') || title.includes('coat') || title.includes('blazer')) {
    return 'jacket';
  }
  if (title.includes('hat') || title.includes('cap') || title.includes('beanie')) {
    return 'hat';
  }
  if (title.includes('watch') || title.includes('necklace') || title.includes('bracelet')) {
    return 'accessories';
  }
  
  return 'top'; // Default fallback
});

describe('useOutfitGeneration Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock function implementation
    mockCategorizeItem.mockImplementation((item: WardrobeItem) => {
      if (item.category) {
        return item.category;
      }
      
      const title = item.title?.toLowerCase() || '';
      
      if (title.includes('shirt') || title.includes('blouse') || title.includes('top')) {
        return 'top';
      }
      if (title.includes('jean') || title.includes('pants') || title.includes('bottom')) {
        return 'bottom';
      }
      if (title.includes('shoe') || title.includes('sneaker') || title.includes('boot')) {
        return 'shoes';
      }
      if (title.includes('jacket') || title.includes('coat') || title.includes('blazer')) {
        return 'jacket';
      }
      if (title.includes('hat') || title.includes('cap') || title.includes('beanie')) {
        return 'hat';
      }
      if (title.includes('watch') || title.includes('necklace') || title.includes('bracelet')) {
        return 'accessories';
      }
      
      return 'top'; // Default fallback
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with all expected properties', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      // Test that all expected properties are present and defined
      expect(result.current.generatedOutfit).toBeDefined();
      expect(result.current.setGeneratedOutfit).toBeDefined();
      expect(result.current.generatingOutfit).toBeDefined();
      expect(result.current.setGeneratingOutfit).toBeDefined();
      expect(result.current.isSelectionMode).toBeDefined();
      expect(result.current.setIsSelectionMode).toBeDefined();
      expect(result.current.selectedItemsForOutfit).toBeDefined();
      expect(result.current.setSelectedItemsForOutfit).toBeDefined();
      expect(result.current.gearSlots).toBeDefined();
      expect(result.current.setGearSlots).toBeDefined();
      expect(result.current.generateOutfitSuggestions).toBeDefined();
      expect(result.current.clearGearSlots).toBeDefined();
      expect(result.current.setGearSlotItem).toBeDefined();
    });

    it('should initialize with proper default values', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      // Test initial state values
      expect(result.current.generatedOutfit).toBeNull();
      expect(result.current.generatingOutfit).toBe(false);
      expect(result.current.isSelectionMode).toBe(false);
      expect(result.current.selectedItemsForOutfit).toEqual([]);
      
      // Test that gearSlots is properly initialized
      expect(result.current.gearSlots).toEqual({
        top: { itemId: null, itemImage: null, itemTitle: null },
        bottom: { itemId: null, itemImage: null, itemTitle: null },
        shoes: { itemId: null, itemImage: null, itemTitle: null },
        jacket: { itemId: null, itemImage: null, itemTitle: null },
        hat: { itemId: null, itemImage: null, itemTitle: null },
        accessories: { itemId: null, itemImage: null, itemTitle: null },
      });
    });

    it('should ensure no undefined properties that could cause ReferenceErrors', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      // Test that all properties are not undefined
      const hookResult = result.current;
      Object.keys(hookResult).forEach(key => {
        expect(hookResult[key as keyof typeof hookResult]).not.toBeUndefined();
      });

      // Test that functions are callable
      expect(typeof hookResult.generateOutfitSuggestions).toBe('function');
      expect(typeof hookResult.clearGearSlots).toBe('function');
      expect(typeof hookResult.setGearSlotItem).toBe('function');
      expect(typeof hookResult.setGeneratedOutfit).toBe('function');
      expect(typeof hookResult.setGeneratingOutfit).toBe('function');
      expect(typeof hookResult.setIsSelectionMode).toBe('function');
      expect(typeof hookResult.setSelectedItemsForOutfit).toBe('function');
      expect(typeof hookResult.setGearSlots).toBe('function');
    });
  });

  describe('State Management', () => {
    it('should update generatingOutfit state', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      act(() => {
        result.current.setGeneratingOutfit(true);
      });

      expect(result.current.generatingOutfit).toBe(true);
    });

    it('should update isSelectionMode state', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      act(() => {
        result.current.setIsSelectionMode(true);
      });

      expect(result.current.isSelectionMode).toBe(true);
    });

    it('should update selectedItemsForOutfit state', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItems = ['item1', 'item2'];
      act(() => {
        result.current.setSelectedItemsForOutfit(testItems);
      });

      expect(result.current.selectedItemsForOutfit).toEqual(testItems);
    });

    it('should update generatedOutfit state', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testOutfit = 'casual-outfit-1';
      act(() => {
        result.current.setGeneratedOutfit(testOutfit);
      });

      expect(result.current.generatedOutfit).toBe(testOutfit);
    });
  });

  describe('Gear Slots Management', () => {
    it('should clear all gear slots', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      // First, set some items in gear slots
      act(() => {
        result.current.setGearSlots({
          top: { itemId: 'test1', itemImage: 'test1.jpg', itemTitle: 'Test Item 1' },
          bottom: { itemId: 'test2', itemImage: 'test2.jpg', itemTitle: 'Test Item 2' },
          shoes: { itemId: null, itemImage: null, itemTitle: null },
          jacket: { itemId: null, itemImage: null, itemTitle: null },
          hat: { itemId: null, itemImage: null, itemTitle: null },
          accessories: { itemId: null, itemImage: null, itemTitle: null },
        });
      });

      // Then clear all gear slots
      act(() => {
        result.current.clearGearSlots();
      });

      expect(result.current.gearSlots).toEqual({
        top: { itemId: null, itemImage: null, itemTitle: null },
        bottom: { itemId: null, itemImage: null, itemTitle: null },
        shoes: { itemId: null, itemImage: null, itemTitle: null },
        jacket: { itemId: null, itemImage: null, itemTitle: null },
        hat: { itemId: null, itemImage: null, itemTitle: null },
        accessories: { itemId: null, itemImage: null, itemTitle: null },
      });
    });

    it('should set item for specific gear slot', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0]; // Blue Cotton Shirt
      act(() => {
        result.current.setGearSlotItem('top', testItem);
      });

      expect(result.current.gearSlots.top).toEqual({
        itemId: testItem.image,
        itemImage: testItem.image,
        itemTitle: testItem.title,
      });
    });

    it('should clear specific gear slot when setting null item', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      // First set an item
      act(() => {
        result.current.setGearSlotItem('top', testItem);
      });

      // Then clear it
      act(() => {
        result.current.setGearSlotItem('top', null);
      });

      expect(result.current.gearSlots.top).toEqual({
        itemId: null,
        itemImage: null,
        itemTitle: null,
      });
    });

    it('should handle item without title gracefully', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const itemWithoutTitle: WardrobeItem = {
        image: 'no-title.jpg',
        description: 'Item without title',
        color: 'red',
      };

      act(() => {
        result.current.setGearSlotItem('top', itemWithoutTitle);
      });

      expect(result.current.gearSlots.top).toEqual({
        itemId: itemWithoutTitle.image,
        itemImage: itemWithoutTitle.image,
        itemTitle: 'Untitled Item',
      });
    });
  });

  describe('Outfit Generation', () => {
    it('should have generateOutfitSuggestions function available', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      expect(typeof result.current.generateOutfitSuggestions).toBe('function');
    });

    it('should set generatingOutfit to true when generating outfit', async () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      
      // Start generating outfit
      act(() => {
        result.current.generateOutfitSuggestions(testItem);
      });

      expect(result.current.generatingOutfit).toBe(true);
    });

    it('should call categorizeItem function with selected item', async () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      
      await act(async () => {
        await result.current.generateOutfitSuggestions(testItem);
      });

      expect(mockCategorizeItem).toHaveBeenCalledWith(testItem);
    });

    it('should trigger haptic feedback when generating outfit', async () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      
      await act(async () => {
        await result.current.generateOutfitSuggestions(testItem);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should show alert when outfit generation is complete', async () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      
      await act(async () => {
        await result.current.generateOutfitSuggestions(testItem);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        '✨ Outfit Suggestion Ready!',
        expect.stringContaining('I\'ve created an outfit')
      );
    });

    it('should set generatingOutfit to false after completion', async () => {
      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, mockCategorizeItem)
      );

      const testItem = mockWardrobeItems[0];
      
      await act(async () => {
        await result.current.generateOutfitSuggestions(testItem);
      });

      expect(result.current.generatingOutfit).toBe(false);
    });

    it('should handle error gracefully and show error alert', async () => {
      // Mock categorizeItem to throw an error
      const errorMock = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, errorMock)
      );

      const testItem = mockWardrobeItems[0];
      
      await act(async () => {
        await result.current.generateOutfitSuggestions(testItem);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Failed to generate outfit suggestions. Please try again.'
      );
      expect(result.current.generatingOutfit).toBe(false);
    });
  });

  describe('Hook Robustness', () => {
    it('should handle empty savedItems array', () => {
      const { result } = renderHook(() =>
        useOutfitGeneration([], mockCategorizeItem)
      );

      expect(result.current).toBeDefined();
      expect(result.current.gearSlots).toBeDefined();
      expect(typeof result.current.generateOutfitSuggestions).toBe('function');
    });

    it('should handle undefined values in wardrobe items', () => {
      const itemsWithUndefined: WardrobeItem[] = [
        {
          image: 'test.jpg',
          description: 'Test item',
          // Missing optional properties
        },
      ];

      const { result } = renderHook(() =>
        useOutfitGeneration(itemsWithUndefined, mockCategorizeItem)
      );

      expect(() => {
        result.current.generateOutfitSuggestions(itemsWithUndefined[0]);
      }).not.toThrow();
    });

    it('should not crash when categorizeItem returns unexpected values', () => {
      const unpredictableCategorizeItem = jest.fn().mockReturnValue('unknown-category');

      const { result } = renderHook(() =>
        useOutfitGeneration(mockWardrobeItems, unpredictableCategorizeItem)
      );

      expect(() => {
        result.current.generateOutfitSuggestions(mockWardrobeItems[0]);
      }).not.toThrow();
    });
  });
});