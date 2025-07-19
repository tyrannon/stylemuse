export interface ConversationEntry {
  prompt: string;
  response: string;
  timestamp: Date;
  source: 'claude' | 'gpt-4o' | 'user';
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
    [key: string]: any;
  };
}

export interface SessionMetadata {
  sessionId: string;
  createdDate: Date;
  lastAccessed: Date;
  projectName: string;
  description?: string;
  tags?: string[];
  status: 'active' | 'archived' | 'completed';
}

export interface Session {
  metadata: SessionMetadata;
  history: ConversationEntry[];
  context: {
    currentTopic?: string;
    variables?: Record<string, any>;
    decisions?: Decision[];
    trackedIssues?: TrackedIssue[];
  };
}

export interface Decision {
  id: string;
  decision: string;
  rationale: string;
  timestamp: Date;
  relatedFiles?: string[];
}

export interface TrackedIssue {
  id: string;
  title: string;
  status: 'planning' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  dependencies?: string[];
}

export interface SessionSummary {
  sessionId: string;
  projectName: string;
  createdDate: Date;
  lastAccessed: Date;
  conversationCount: number;
  status: string;
  tags?: string[];
}