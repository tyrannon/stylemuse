/**
 * Utility for intelligently truncating prompts to fit within character limits
 * while preserving meaning and readability.
 */

export class PromptTruncator {
  private static readonly DEFAULT_MAX_LENGTH = 4000;
  private static readonly ELLIPSIS = '...';
  private static readonly SAFETY_MARGIN = 50; // Extra buffer for safety

  /**
   * Truncates a prompt to the specified maximum length while preserving meaning
   * @param prompt The original prompt text
   * @param maxLength Maximum allowed characters (default: 4000)
   * @param options Truncation options
   * @returns Truncated prompt with ellipsis if needed
   */
  static truncate(
    prompt: string,
    maxLength: number = this.DEFAULT_MAX_LENGTH,
    options: TruncationOptions = {}
  ): string {
    // Return original if within limits
    if (prompt.length <= maxLength) {
      return prompt;
    }

    const {
      preserveSentences = true,
      preserveWords = true,
      addEllipsis = true,
      customEllipsis = this.ELLIPSIS,
      priorityMarkers = [],
    } = options;

    // Calculate target length accounting for ellipsis
    const ellipsisLength = addEllipsis ? customEllipsis.length : 0;
    const targetLength = maxLength - ellipsisLength - this.SAFETY_MARGIN;

    // If priority markers are provided, try to preserve important sections
    if (priorityMarkers.length > 0) {
      const truncated = this.truncateWithPriority(prompt, targetLength, priorityMarkers);
      return addEllipsis ? truncated + customEllipsis : truncated;
    }

    // Try sentence-aware truncation first
    if (preserveSentences) {
      const sentenceTruncated = this.truncateAtSentenceBoundary(prompt, targetLength);
      if (sentenceTruncated.length > targetLength * 0.7) { // If we preserved at least 70%
        return addEllipsis ? sentenceTruncated + customEllipsis : sentenceTruncated;
      }
    }

    // Fall back to word-aware truncation
    if (preserveWords) {
      const wordTruncated = this.truncateAtWordBoundary(prompt, targetLength);
      return addEllipsis ? wordTruncated + customEllipsis : wordTruncated;
    }

    // Last resort: hard truncation
    const hardTruncated = prompt.substring(0, targetLength);
    return addEllipsis ? hardTruncated + customEllipsis : hardTruncated;
  }

  /**
   * Truncates at the nearest sentence boundary
   */
  private static truncateAtSentenceBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    // Find sentence endings before the limit
    const sentenceEndings = /[.!?]\s+/g;
    let lastSentenceEnd = 0;
    let match;

    while ((match = sentenceEndings.exec(text)) !== null) {
      if (match.index + match[0].length > maxLength) break;
      lastSentenceEnd = match.index + match[0].length;
    }

    // If we found a good sentence boundary, use it
    if (lastSentenceEnd > maxLength * 0.5) {
      return text.substring(0, lastSentenceEnd).trim();
    }

    // Otherwise fall back to word boundary
    return this.truncateAtWordBoundary(text, maxLength);
  }

  /**
   * Truncates at the nearest word boundary
   */
  private static truncateAtWordBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    // Find the last space before the limit
    let lastSpace = text.lastIndexOf(' ', maxLength);
    
    // If no space found or it's too far back, look for other word boundaries
    if (lastSpace < maxLength * 0.8) {
      // Look for punctuation that might indicate word boundaries
      const boundaryChars = [',', ';', ':', '-', '/', '\\', '(', ')', '[', ']'];
      for (const char of boundaryChars) {
        const pos = text.lastIndexOf(char, maxLength);
        if (pos > lastSpace) {
          lastSpace = pos;
        }
      }
    }

    // If still no good boundary, just cut at maxLength
    if (lastSpace < maxLength * 0.5) {
      return text.substring(0, maxLength).trim();
    }

    return text.substring(0, lastSpace).trim();
  }

  /**
   * Truncates while trying to preserve priority sections
   */
  private static truncateWithPriority(
    text: string,
    maxLength: number,
    priorityMarkers: string[]
  ): string {
    // Find all priority sections
    const prioritySections: Array<{start: number; end: number; marker: string}> = [];
    
    for (const marker of priorityMarkers) {
      const startMarker = `[${marker}]`;
      const endMarker = `[/${marker}]`;
      let startIndex = 0;
      
      while ((startIndex = text.indexOf(startMarker, startIndex)) !== -1) {
        const endIndex = text.indexOf(endMarker, startIndex);
        if (endIndex !== -1) {
          prioritySections.push({
            start: startIndex,
            end: endIndex + endMarker.length,
            marker
          });
          startIndex = endIndex;
        } else {
          startIndex += startMarker.length;
        }
      }
    }

    // Sort sections by priority (first in array = highest priority)
    prioritySections.sort((a, b) => {
      const aPriority = priorityMarkers.indexOf(a.marker);
      const bPriority = priorityMarkers.indexOf(b.marker);
      return aPriority - bPriority;
    });

    // Build truncated text preserving priority sections
    let result = '';
    let currentLength = 0;
    let lastEnd = 0;

    for (const section of prioritySections) {
      const sectionLength = section.end - section.start;
      
      if (currentLength + sectionLength > maxLength) break;
      
      // Add text before this section
      const beforeText = text.substring(lastEnd, section.start);
      const beforeTruncated = this.truncateAtWordBoundary(
        beforeText,
        maxLength - currentLength - sectionLength
      );
      
      result += beforeTruncated;
      currentLength += beforeTruncated.length;
      
      // Add the priority section
      result += text.substring(section.start, section.end);
      currentLength += sectionLength;
      
      lastEnd = section.end;
    }

    // Add any remaining text that fits
    if (lastEnd < text.length && currentLength < maxLength) {
      const remaining = text.substring(lastEnd);
      const remainingTruncated = this.truncateAtWordBoundary(
        remaining,
        maxLength - currentLength
      );
      result += remainingTruncated;
    }

    return result;
  }

  /**
   * Estimates token count for OpenAI models (rough approximation)
   * @param text The text to estimate
   * @returns Approximate token count
   */
  static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token on average
    // This is a simplified approach; for production, consider using tiktoken
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Use a weighted average of word and character count
    return Math.ceil((wordCount * 1.3 + charCount / 4) / 2);
  }

  /**
   * Truncates based on estimated token count
   */
  static truncateByTokens(
    prompt: string,
    maxTokens: number = 1000,
    options: TruncationOptions = {}
  ): string {
    const estimatedTokens = this.estimateTokenCount(prompt);
    
    if (estimatedTokens <= maxTokens) {
      return prompt;
    }

    // Estimate character count for target tokens
    const ratio = maxTokens / estimatedTokens;
    const targetLength = Math.floor(prompt.length * ratio);
    
    return this.truncate(prompt, targetLength, options);
  }
}

/**
 * Options for controlling truncation behavior
 */
export interface TruncationOptions {
  /**
   * Whether to preserve complete sentences when possible
   */
  preserveSentences?: boolean;
  
  /**
   * Whether to avoid cutting words in the middle
   */
  preserveWords?: boolean;
  
  /**
   * Whether to add ellipsis at the end
   */
  addEllipsis?: boolean;
  
  /**
   * Custom ellipsis string (default: "...")
   */
  customEllipsis?: string;
  
  /**
   * Priority markers for sections that should be preserved
   * Example: ['IMPORTANT', 'CONTEXT'] will preserve [IMPORTANT]...[/IMPORTANT] sections
   */
  priorityMarkers?: string[];
}

/**
 * Common prompt templates with length limits
 */
export const PROMPT_LIMITS = {
  OUTFIT_GENERATION: 3000,
  IMAGE_ANALYSIS: 3500, // Increased from 2000 to preserve JSON format instructions
  STYLE_DESCRIPTION: 1500,
  QUICK_SUGGESTION: 500,
  DALLE_IMAGE: 3900, // DALL-E has a 4000 char limit, leave buffer
} as const;

/**
 * Helper function for common use cases
 */
export function truncatePrompt(
  prompt: string,
  scenario: keyof typeof PROMPT_LIMITS = 'OUTFIT_GENERATION'
): string {
  return PromptTruncator.truncate(prompt, PROMPT_LIMITS[scenario], {
    preserveSentences: true,
    preserveWords: true,
    addEllipsis: true,
  });
}