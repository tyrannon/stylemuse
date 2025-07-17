/**
 * Examples of using the PromptTruncator utility in StyleMuse
 */

import { PromptTruncator, truncatePrompt, PROMPT_LIMITS } from './PromptTruncator';

// Example 1: Basic truncation for outfit generation
export function truncateOutfitPrompt(userRequest: string, wardrobeItems: string[]): string {
  const fullPrompt = `
    Generate an outfit based on the following request:
    ${userRequest}
    
    Available wardrobe items:
    ${wardrobeItems.join('\n')}
  `;
  
  // Simple truncation with default settings
  return truncatePrompt(fullPrompt, 'OUTFIT_GENERATION');
}

// Example 2: Truncation with priority sections
export function truncateWithPriorities(prompt: string): string {
  const structuredPrompt = `
    [CONTEXT]User preferences and style profile[/CONTEXT]
    ${prompt}
    [IMPORTANT]Generate exactly 3 outfit combinations[/IMPORTANT]
  `;
  
  return PromptTruncator.truncate(structuredPrompt, 3000, {
    priorityMarkers: ['IMPORTANT', 'CONTEXT'],
    preserveSentences: true
  });
}

// Example 3: Dynamic wardrobe truncation
export function truncateLargeWardrobe(items: Array<{title: string, description: string}>): string {
  // Build prompt with wardrobe items
  let prompt = "Analyze the following wardrobe:\n\n";
  
  // Add items one by one until we approach the limit
  const maxLength = PROMPT_LIMITS.OUTFIT_GENERATION - 500; // Leave room for instructions
  
  for (const item of items) {
    const itemText = `- ${item.title}: ${item.description}\n`;
    
    // Check if adding this item would exceed our limit
    if (prompt.length + itemText.length > maxLength) {
      prompt += "\n[... additional items truncated ...]";
      break;
    }
    
    prompt += itemText;
  }
  
  prompt += "\n\nSuggest outfits using these items.";
  
  return prompt;
}

// Example 4: Token-based truncation
export function truncateByTokenEstimate(prompt: string): string {
  // Estimate tokens and truncate if needed
  const estimatedTokens = PromptTruncator.estimateTokenCount(prompt);
  
  if (estimatedTokens > 1000) {
    return PromptTruncator.truncateByTokens(prompt, 900, {
      addEllipsis: true,
      preserveWords: true
    });
  }
  
  return prompt;
}

// Example 5: Smart truncation for image analysis
export function truncateImageAnalysisPrompt(instructions: string): string {
  return PromptTruncator.truncate(instructions, PROMPT_LIMITS.IMAGE_ANALYSIS, {
    preserveSentences: true,
    preserveWords: true,
    customEllipsis: '\n\n[Additional instructions omitted for brevity...]'
  });
}

// Example 6: Handling user-generated content
export function truncateUserDescription(description: string): string {
  // User descriptions might be very long and rambling
  return PromptTruncator.truncate(description, 500, {
    preserveSentences: true,
    preserveWords: true,
    addEllipsis: true
  });
}

// Example 7: Integration with OpenAI calls
export async function makeOpenAIRequest(prompt: string) {
  // Always truncate before sending to API
  const safePrompt = truncatePrompt(prompt, 'OUTFIT_GENERATION');
  
  // Log if truncation occurred
  if (safePrompt !== prompt) {
    console.log(`Prompt truncated from ${prompt.length} to ${safePrompt.length} characters`);
  }
  
  // Make API call with truncated prompt
  // ... API call logic here
}

// Example 8: Building safe prompts from user input
export function buildSafePrompt(
  baseInstructions: string,
  userInput: string,
  context: string
): string {
  // Combine all parts
  const fullPrompt = `
    ${baseInstructions}
    
    User Request: ${userInput}
    
    Context: ${context}
  `;
  
  // Truncate with priorities
  return PromptTruncator.truncate(fullPrompt, 4000, {
    priorityMarkers: ['User Request'],
    preserveSentences: true,
    addEllipsis: true
  });
}