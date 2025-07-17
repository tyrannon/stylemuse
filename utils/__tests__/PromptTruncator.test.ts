import { PromptTruncator, truncatePrompt, PROMPT_LIMITS } from '../PromptTruncator';

describe('PromptTruncator', () => {
  describe('truncate', () => {
    it('should return original text if under limit', () => {
      const shortText = 'This is a short prompt';
      const result = PromptTruncator.truncate(shortText, 100);
      expect(result).toBe(shortText);
    });

    it('should truncate at word boundary by default', () => {
      const text = 'This is a very long sentence that needs to be truncated at a word boundary';
      const result = PromptTruncator.truncate(text, 30);
      expect(result).toBe('This is a very long...');
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('should truncate at sentence boundary when possible', () => {
      const text = 'First sentence. Second sentence. Third sentence that is very long.';
      const result = PromptTruncator.truncate(text, 35);
      expect(result).toBe('First sentence. Second sentence...');
    });

    it('should handle multiple sentence endings', () => {
      const text = 'Question? Exclamation! Statement. Another one.';
      const result = PromptTruncator.truncate(text, 25);
      expect(result).toBe('Question? Exclamation!...');
    });

    it('should not add ellipsis when disabled', () => {
      const text = 'This is a long text that needs truncation';
      const result = PromptTruncator.truncate(text, 20, { addEllipsis: false });
      expect(result).toBe('This is a long text');
      expect(result.endsWith('...')).toBe(false);
    });

    it('should use custom ellipsis', () => {
      const text = 'This is a long text that needs truncation';
      const result = PromptTruncator.truncate(text, 25, { customEllipsis: '…' });
      expect(result.endsWith('…')).toBe(true);
    });

    it('should handle text with no spaces', () => {
      const text = 'Verylongtextwithoutanyspacesthatexceedsthelimit';
      const result = PromptTruncator.truncate(text, 20);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should preserve priority sections', () => {
      const text = 'Normal text [IMPORTANT]Critical information[/IMPORTANT] more text [CONTEXT]Background info[/CONTEXT] end';
      const result = PromptTruncator.truncate(text, 60, {
        priorityMarkers: ['IMPORTANT', 'CONTEXT']
      });
      expect(result).toContain('[IMPORTANT]Critical information[/IMPORTANT]');
    });

    it('should handle punctuation boundaries', () => {
      const text = 'item1,item2,item3,item4,item5,item6,item7';
      const result = PromptTruncator.truncate(text, 20);
      expect(result).toBe('item1,item2,item3,...');
    });

    it('should handle edge cases', () => {
      expect(PromptTruncator.truncate('', 10)).toBe('');
      expect(PromptTruncator.truncate('Hello', 10)).toBe('Hello');
      expect(PromptTruncator.truncate('Hello', 0)).toBe('...');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count for simple text', () => {
      const text = 'This is a simple test';
      const tokens = PromptTruncator.estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should handle longer text', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      const tokens = PromptTruncator.estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(50);
    });
  });

  describe('truncateByTokens', () => {
    it('should truncate based on token estimation', () => {
      const text = 'This is a very long text that contains many words and should be truncated based on token count estimation';
      const result = PromptTruncator.truncateByTokens(text, 10);
      expect(result.length).toBeLessThan(text.length);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('truncatePrompt helper', () => {
    it('should use predefined limits', () => {
      const longText = 'a'.repeat(5000);
      const result = truncatePrompt(longText, 'OUTFIT_GENERATION');
      expect(result.length).toBeLessThanOrEqual(PROMPT_LIMITS.OUTFIT_GENERATION);
    });

    it('should handle different scenarios', () => {
      const text = 'Test prompt for image analysis';
      const result1 = truncatePrompt(text, 'IMAGE_ANALYSIS');
      const result2 = truncatePrompt(text, 'QUICK_SUGGESTION');
      
      expect(result1).toBe(text); // Under limit
      expect(result2).toBe(text); // Still under limit
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle outfit generation prompts', () => {
      const prompt = `
        Generate an outfit for a user with the following preferences:
        - Style: Casual, comfortable, modern
        - Colors: Earth tones, navy blue, white
        - Occasion: Weekend brunch with friends
        - Weather: Mild spring day, 70°F
        - Body type: Athletic build
        - Budget: Mid-range
        
        The user has the following items in their wardrobe:
        ${Array(100).fill('- Blue jeans, white t-shirt, sneakers').join('\n')}
        
        Please suggest a complete outfit including:
        - Top
        - Bottom
        - Shoes
        - Accessories
        - Outerwear (if needed)
      `;
      
      const truncated = truncatePrompt(prompt, 'OUTFIT_GENERATION');
      expect(truncated.length).toBeLessThanOrEqual(PROMPT_LIMITS.OUTFIT_GENERATION);
      expect(truncated).toContain('Generate an outfit');
      expect(truncated).toContain('...');
    });

    it('should preserve outfit context when truncating', () => {
      const prompt = `
        [CONTEXT]User preferences: casual, comfortable[/CONTEXT]
        
        Long wardrobe list here...
        ${Array(200).fill('Item description').join(' ')}
        
        [IMPORTANT]Generate a business casual outfit[/IMPORTANT]
      `;
      
      const truncated = PromptTruncator.truncate(prompt, 500, {
        priorityMarkers: ['IMPORTANT', 'CONTEXT']
      });
      
      expect(truncated).toContain('[CONTEXT]User preferences');
      expect(truncated).toContain('[IMPORTANT]Generate a business casual outfit[/IMPORTANT]');
    });
  });
});

// Example usage documentation
describe('Usage examples', () => {
  it('should demonstrate basic usage', () => {
    const userInput = "Create an outfit for me based on my style preferences...";
    const truncated = PromptTruncator.truncate(userInput, 50);
    console.log('Basic usage:', truncated);
  });

  it('should demonstrate advanced usage', () => {
    const complexPrompt = `
      [STYLE]Modern minimalist[/STYLE]
      
      User's extensive wardrobe collection includes many items...
      ${Array(50).fill('Various clothing items').join(', ')}
      
      [REQUEST]Create a date night outfit[/REQUEST]
    `;
    
    const truncated = PromptTruncator.truncate(complexPrompt, 200, {
      priorityMarkers: ['REQUEST', 'STYLE'],
      preserveSentences: true
    });
    
    console.log('Advanced usage:', truncated);
  });
});