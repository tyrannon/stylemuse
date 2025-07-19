import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export class TokenCounter {
  private encoder: any;
  private model: TiktokenModel = 'gpt-4';
  
  constructor() {
    try {
      this.encoder = encoding_for_model(this.model);
    } catch (error) {
      console.warn('Failed to load tokenizer, using fallback estimation');
      this.encoder = null;
    }
  }
  
  /**
   * Count tokens in a text string
   * Falls back to character-based estimation if tokenizer fails
   */
  count(text: string): number {
    if (!text) return 0;
    
    try {
      if (this.encoder) {
        return this.encoder.encode(text).length;
      }
    } catch (error) {
      console.warn('Token counting failed, using fallback');
    }
    
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Estimate tokens for a chat completion request
   */
  countChatTokens(messages: Array<{ role: string; content: string }>): number {
    let totalTokens = 0;
    
    // Each message has overhead tokens for formatting
    const messageOverhead = 4; // Approximate overhead per message
    
    for (const message of messages) {
      totalTokens += this.count(message.content) + messageOverhead;
      totalTokens += this.count(message.role) + 1;
    }
    
    // Add tokens for chat completion formatting
    totalTokens += 3; // Every reply is primed with <|start|>assistant<|message|>
    
    return totalTokens;
  }
  
  /**
   * Estimate cost based on token counts and model
   */
  estimateCost(inputTokens: number, outputTokens: number, model = 'gpt-4o'): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    formattedTotal: string;
  } {
    // GPT-4o pricing as of July 2025
    const rates = {
      'gpt-4o': {
        input: 2.50 / 1_000_000,   // $2.50 per 1M tokens
        output: 10.00 / 1_000_000  // $10 per 1M tokens
      },
      'gpt-4': {
        input: 30.00 / 1_000_000,   // $30 per 1M tokens
        output: 60.00 / 1_000_000   // $60 per 1M tokens
      }
    };
    
    const modelRates = rates[model as keyof typeof rates] || rates['gpt-4o'];
    
    const inputCost = inputTokens * modelRates.input;
    const outputCost = outputTokens * modelRates.output;
    const totalCost = inputCost + outputCost;
    
    return {
      inputCost,
      outputCost,
      totalCost,
      formattedTotal: `$${totalCost.toFixed(4)}`
    };
  }
  
  /**
   * Format token count with commas for readability
   */
  formatTokenCount(tokens: number): string {
    return tokens.toLocaleString();
  }
  
  /**
   * Get a human-readable summary of token usage
   */
  getSummary(inputTokens: number, outputTokens: number, model = 'gpt-4o'): string {
    const total = inputTokens + outputTokens;
    const cost = this.estimateCost(inputTokens, outputTokens, model);
    
    return `Tokens: ${this.formatTokenCount(total)} (↓${this.formatTokenCount(inputTokens)} ↑${this.formatTokenCount(outputTokens)}) • Cost: ${cost.formattedTotal}`;
  }
  
  /**
   * Clean up encoder to free memory
   */
  dispose() {
    if (this.encoder && this.encoder.free) {
      this.encoder.free();
    }
  }
}