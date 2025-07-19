import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { TokenCounter } from './tokenCounter';
import { DatabaseManager } from '../data/DatabaseManager';

// Load environment variables
dotenv.config();

// Initialize token counter and database manager
const tokenCounter = new TokenCounter();
const dbManager = new DatabaseManager();

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIError extends Error {
  constructor(public statusCode: number, public statusText: string, public details?: any) {
    super(`OpenAI API Error (${statusCode}): ${statusText}`);
    this.name = 'OpenAIError';
  }
}

/**
 * Call OpenAI's GPT-4o model with a prompt
 * @param prompt The user prompt to send
 * @param systemPrompt Optional system prompt for context
 * @param options Additional options like command name for tracking
 * @returns The assistant's response text
 */
export async function callOpenAI(
  prompt: string,
  systemPrompt: string = 'You are a helpful assistant.',
  options: { command?: string; batchId?: string; sessionId?: string } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables. Please add it to your .env file.');
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  // Count input tokens
  const inputTokens = tokenCounter.countChatTokens(messages);
  const startTime = Date.now();

  const payload = {
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 4000,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch {
        parsedError = errorData;
      }
      
      // Record failed usage
      await dbManager.recordUsage({
        command: options.command || 'prompt',
        inputTokens,
        outputTokens: 0,
        success: false,
        errorMessage: `${response.status}: ${response.statusText}`,
        durationMs: Date.now() - startTime,
        batchId: options.batchId,
        sessionId: options.sessionId
      });
      
      throw new OpenAIError(response.status, response.statusText, parsedError);
    }

    const data = (await response.json()) as OpenAIResponse;
    
    // Extract the assistant's response
    const assistantMessage = data.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No response content received from OpenAI');
    }

    // Count output tokens and record usage
    const outputTokens = tokenCounter.count(assistantMessage);
    const actualTokens = data.usage || { 
      prompt_tokens: inputTokens, 
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    };
    
    await dbManager.recordUsage({
      command: options.command || 'prompt',
      inputTokens: actualTokens.prompt_tokens,
      outputTokens: actualTokens.completion_tokens,
      success: true,
      durationMs: Date.now() - startTime,
      batchId: options.batchId,
      sessionId: options.sessionId,
      metadata: {
        model: data.model,
        finishReason: data.choices[0]?.finish_reason
      }
    });

    // Log token usage summary
    console.log(`\n💰 ${tokenCounter.getSummary(actualTokens.prompt_tokens, actualTokens.completion_tokens)}`);

    return assistantMessage.trim();
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    
    // Record error if not already recorded
    if (!(error instanceof Error && error.message?.includes('OpenAI API Error'))) {
      await dbManager.recordUsage({
        command: options.command || 'prompt',
        inputTokens,
        outputTokens: 0,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
        batchId: options.batchId,
        sessionId: options.sessionId
      });
    }
    
    throw new Error(`Failed to call OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call OpenAI with streaming support (returns an async iterator)
 */
export async function* callOpenAIStream(
  prompt: string,
  systemPrompt: string = 'You are a helpful assistant.'
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const payload = {
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: true,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new OpenAIError(response.status, response.statusText, errorData);
  }

  if (!response.body) throw new Error('No response body');
  
  // Convert node-fetch response to readable stream
  const stream = Readable.from(response.body as any);
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }
  }
}