export interface BridgeMessage {
  id: string;
  sender: 'claude' | 'gpt-4o' | 'user' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    commandInvoked?: string;
    sessionId?: string;
    parentMessageId?: string;
    [key: string]: any;
  };
}

export interface BridgeContext {
  sessionId: string;
  messages: BridgeMessage[];
  currentTopic?: string;
  variables: Record<string, any>;
  activeCommands: string[];
  learningEnabled: boolean;
}

export interface PromptPattern {
  id: string;
  pattern: string;
  context: string;
  successCount: number;
  failureCount: number;
  averageRating: number;
  tags: string[];
  examples: PatternExample[];
  createdAt: Date;
  lastUsed: Date;
}

export interface PatternExample {
  input: string;
  output: string;
  rating: number;
  metadata?: Record<string, any>;
}

export interface CommandExecution {
  commandName: string;
  args: Record<string, any>;
  executedAt: Date;
  result: any;
  success: boolean;
  duration: number;
}

export interface LearningEntry {
  id: string;
  sessionId: string;
  pattern: string;
  success: boolean;
  rating?: number;
  context: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}