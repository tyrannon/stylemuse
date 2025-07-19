import { EventEmitter } from 'events';
import { SessionManager } from './SessionManager';
import { TemplateManager } from './TemplateManager';
import { 
  BridgeMessage, 
  BridgeContext, 
  PromptPattern, 
  CommandExecution,
  LearningEntry
} from '../types/bridge.types';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export class CommunicationBridge extends EventEmitter {
  private sessionManager: SessionManager;
  private context: BridgeContext;
  private patternsDirectory: string;
  private learningDirectory: string;
  private patterns: Map<string, PromptPattern> = new Map();

  constructor(sessionManager: SessionManager, _templateManager: TemplateManager) {
    super();
    this.sessionManager = sessionManager;
    
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.patternsDirectory = path.join(homeDir, '.claude-prompter', 'patterns');
    this.learningDirectory = path.join(homeDir, '.claude-prompter', 'learning');
    
    this.ensureDirectoriesExist();
    this.loadPatterns();
    
    this.context = {
      sessionId: '',
      messages: [],
      variables: {},
      activeCommands: [],
      learningEnabled: true
    };
  }

  private ensureDirectoriesExist(): void {
    [this.patternsDirectory, this.learningDirectory].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async loadPatterns(): Promise<void> {
    try {
      const files = await fsPromises.readdir(this.patternsDirectory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fsPromises.readFile(
            path.join(this.patternsDirectory, file), 
            'utf-8'
          );
          const pattern = JSON.parse(content);
          this.patterns.set(pattern.id, pattern);
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }

  public async initializeSession(sessionId: string): Promise<void> {
    const session = await this.sessionManager.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    this.context.sessionId = sessionId;
    this.context.messages = [];
    this.context.currentTopic = session.context.currentTopic;
    this.context.variables = session.context.variables || {};
    
    this.emit('session-initialized', sessionId);
  }

  public async sendMessage(
    content: string, 
    sender: 'claude' | 'gpt-4o' | 'user',
    metadata?: any
  ): Promise<BridgeMessage> {
    const message: BridgeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sender,
      content,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        sessionId: this.context.sessionId
      }
    };
    
    this.context.messages.push(message);
    
    // Save to session history
    if (this.context.sessionId) {
      await this.sessionManager.addConversationEntry(
        this.context.sessionId,
        content,
        '', // Response will be updated later
        sender,
        metadata
      );
    }
    
    this.emit('message-sent', message);
    
    // Learn from the interaction if enabled
    if (this.context.learningEnabled && sender === 'claude') {
      this.analyzeForPatterns(message);
    }
    
    return message;
  }

  public async executeCommand(
    commandName: string, 
    args: Record<string, any>
  ): Promise<CommandExecution> {
    const startTime = Date.now();
    
    this.context.activeCommands.push(commandName);
    this.emit('command-start', { commandName, args });
    
    try {
      // This would integrate with actual command execution
      // For now, we'll simulate it
      const result = await this.simulateCommandExecution(commandName, args);
      
      const execution: CommandExecution = {
        commandName,
        args,
        executedAt: new Date(),
        result,
        success: true,
        duration: Date.now() - startTime
      };
      
      this.emit('command-complete', execution);
      
      // Learn from successful commands
      if (this.context.learningEnabled) {
        await this.learnFromCommand(execution);
      }
      
      return execution;
    } catch (error) {
      const execution: CommandExecution = {
        commandName,
        args,
        executedAt: new Date(),
        result: error,
        success: false,
        duration: Date.now() - startTime
      };
      
      this.emit('command-error', execution);
      return execution;
    } finally {
      this.context.activeCommands = this.context.activeCommands.filter(
        cmd => cmd !== commandName
      );
    }
  }

  private async simulateCommandExecution(
    commandName: string, 
    _args: Record<string, any>
  ): Promise<any> {
    // Simulate different command executions
    switch (commandName) {
      case 'suggest':
        return {
          suggestions: [
            'Try implementing error handling',
            'Add unit tests',
            'Optimize performance'
          ]
        };
      case 'prompt':
        return {
          response: 'This is a simulated GPT-4o response'
        };
      default:
        return { result: 'Command executed successfully' };
    }
  }

  private async analyzeForPatterns(message: BridgeMessage): Promise<void> {
    // Extract potential patterns from the message
    // const words = message.content.split(/\s+/);
    
    // Look for common patterns like questions, commands, etc.
    if (message.content.includes('?')) {
      await this.recordPattern('question', message.content);
    }
    
    if (message.content.match(/help|assist|guide/i)) {
      await this.recordPattern('help-request', message.content);
    }
    
    if (message.content.match(/create|build|implement/i)) {
      await this.recordPattern('creation-request', message.content);
    }
  }

  private async recordPattern(type: string, content: string): Promise<void> {
    const patternId = `pattern-${type}-${Date.now()}`;
    const pattern: PromptPattern = {
      id: patternId,
      pattern: content,
      context: this.context.currentTopic || 'general',
      successCount: 0,
      failureCount: 0,
      averageRating: 0,
      tags: [type],
      examples: [],
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    this.patterns.set(patternId, pattern);
    await this.savePattern(pattern);
  }

  private async savePattern(pattern: PromptPattern): Promise<void> {
    const filePath = path.join(this.patternsDirectory, `${pattern.id}.json`);
    await fsPromises.writeFile(filePath, JSON.stringify(pattern, null, 2));
  }

  private async learnFromCommand(execution: CommandExecution): Promise<void> {
    const learningEntry: LearningEntry = {
      id: `learn-${Date.now()}`,
      sessionId: this.context.sessionId,
      pattern: JSON.stringify(execution),
      success: execution.success,
      rating: execution.success ? 5 : 1,
      context: this.context.currentTopic || 'general',
      timestamp: new Date(),
      metadata: {
        command: execution.commandName,
        duration: execution.duration
      }
    };
    
    await this.saveLearningEntry(learningEntry);
  }

  private async saveLearningEntry(entry: LearningEntry): Promise<void> {
    const filePath = path.join(this.learningDirectory, `${entry.id}.json`);
    await fsPromises.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  public async findSimilarPatterns(query: string, limit: number = 5): Promise<PromptPattern[]> {
    const patterns = Array.from(this.patterns.values());
    
    // Simple similarity scoring based on common words
    const scored = patterns.map(pattern => {
      const queryWords = query.toLowerCase().split(/\s+/);
      const patternWords = pattern.pattern.toLowerCase().split(/\s+/);
      const commonWords = queryWords.filter(word => patternWords.includes(word));
      
      return {
        pattern,
        score: commonWords.length / Math.max(queryWords.length, patternWords.length)
      };
    });
    
    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.pattern);
  }

  public async ratePattern(patternId: string, rating: number): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    
    if (rating >= 4) {
      pattern.successCount++;
    } else {
      pattern.failureCount++;
    }
    
    // Update average rating
    const totalRatings = pattern.successCount + pattern.failureCount;
    pattern.averageRating = (
      (pattern.averageRating * (totalRatings - 1) + rating) / totalRatings
    );
    
    pattern.lastUsed = new Date();
    await this.savePattern(pattern);
  }

  public getContext(): BridgeContext {
    return { ...this.context };
  }

  public updateContext(updates: Partial<BridgeContext>): void {
    this.context = { ...this.context, ...updates };
    this.emit('context-updated', this.context);
  }

  public async exportConversation(format: 'json' | 'markdown' = 'markdown'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        context: this.context,
        messages: this.context.messages
      }, null, 2);
    }
    
    // Markdown format
    let markdown = `# Conversation Log\n\n`;
    markdown += `**Session ID**: ${this.context.sessionId}\n`;
    markdown += `**Topic**: ${this.context.currentTopic || 'General'}\n\n`;
    
    for (const message of this.context.messages) {
      markdown += `## ${message.sender} (${message.timestamp.toLocaleString()})\n`;
      markdown += `${message.content}\n\n`;
      
      if (message.metadata?.commandInvoked) {
        markdown += `*Command: ${message.metadata.commandInvoked}*\n\n`;
      }
    }
    
    return markdown;
  }

  public async getTopPatterns(limit: number = 10): Promise<PromptPattern[]> {
    const patterns = Array.from(this.patterns.values());
    
    return patterns
      .sort((a, b) => {
        // Sort by success rate and recency
        const aScore = a.successCount / (a.successCount + a.failureCount + 1);
        const bScore = b.successCount / (b.successCount + b.failureCount + 1);
        
        if (Math.abs(aScore - bScore) < 0.1) {
          // If scores are similar, prefer more recent
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        }
        
        return bScore - aScore;
      })
      .slice(0, limit);
  }
}