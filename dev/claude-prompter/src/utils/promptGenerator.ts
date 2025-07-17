interface PromptOptions {
  message?: string;
  context?: string;
  temperature?: string;
  maxTokens?: string;
}

/**
 * Generate a Claude-style prompt based on user input
 */
export async function generateClaudePrompt(options: PromptOptions): Promise<string> {
  const { message, context } = options;
  
  if (!message) {
    throw new Error('Message is required. Use -m or --message to provide one.');
  }
  
  // Build the prompt
  let prompt = message;
  
  if (context) {
    prompt = `Context: ${context}\n\n${prompt}`;
  }
  
  return prompt;
}

/**
 * Format a prompt for specific use cases
 */
export function formatPromptForUseCase(prompt: string, useCase: string): string {
  switch (useCase) {
    case 'code':
      return `Please help me with the following programming task:\n\n${prompt}\n\nProvide clean, well-commented code with explanations.`;
    
    case 'analysis':
      return `Please analyze the following:\n\n${prompt}\n\nProvide a detailed analysis with key insights and recommendations.`;
    
    case 'creative':
      return `Please help me with this creative task:\n\n${prompt}\n\nBe creative and provide multiple options if applicable.`;
    
    case 'summary':
      return `Please summarize the following:\n\n${prompt}\n\nProvide a clear, concise summary with the main points.`;
    
    default:
      return prompt;
  }
}

/**
 * Build a conversation-style prompt
 */
export function buildConversationPrompt(messages: Array<{role: string, content: string}>): string {
  return messages
    .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
}