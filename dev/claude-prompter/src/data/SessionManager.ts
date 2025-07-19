import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { 
  Session, 
  ConversationEntry, 
  SessionSummary,
  Decision,
  TrackedIssue 
} from '../types/session.types';

export class SessionManager {
  private sessionDirectory: string;
  private currentSessionId: string | null = null;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.sessionDirectory = path.join(homeDir, '.claude-prompter', 'sessions');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.sessionDirectory)) {
      fs.mkdirSync(this.sessionDirectory, { recursive: true });
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `session-${timestamp}-${random}`;
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionDirectory, `${sessionId}.json`);
  }

  public async createSession(projectName: string, description?: string): Promise<Session> {
    const sessionId = this.generateSessionId();
    const newSession: Session = {
      metadata: {
        sessionId,
        createdDate: new Date(),
        lastAccessed: new Date(),
        projectName,
        description,
        tags: [],
        status: 'active'
      },
      history: [],
      context: {
        variables: {},
        decisions: [],
        trackedIssues: []
      }
    };
    
    await this.saveSession(newSession);
    this.currentSessionId = sessionId;
    return newSession;
  }

  public async loadSession(sessionId: string): Promise<Session | null> {
    const sessionPath = this.getSessionPath(sessionId);
    
    try {
      const sessionData = await fsPromises.readFile(sessionPath, 'utf-8');
      const session: Session = JSON.parse(sessionData, (key, value) => {
        // Convert date strings back to Date objects
        if (key.includes('Date') || key === 'timestamp' || key.includes('At')) {
          return new Date(value);
        }
        return value;
      });
      
      session.metadata.lastAccessed = new Date();
      await this.saveSession(session);
      this.currentSessionId = sessionId;
      return session;
    } catch (error) {
      return null;
    }
  }

  public async saveSession(session: Session): Promise<void> {
    const sessionPath = this.getSessionPath(session.metadata.sessionId);
    await fsPromises.writeFile(
      sessionPath, 
      JSON.stringify(session, null, 2)
    );
  }

  public async addConversationEntry(
    sessionId: string, 
    prompt: string, 
    response: string,
    source: 'claude' | 'gpt-4o' | 'user' = 'user',
    metadata?: any
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const entry: ConversationEntry = {
      prompt,
      response,
      timestamp: new Date(),
      source,
      metadata
    };

    session.history.push(entry);
    session.metadata.lastAccessed = new Date();
    await this.saveSession(session);
  }

  public async listSessions(): Promise<SessionSummary[]> {
    const files = await fsPromises.readdir(this.sessionDirectory);
    const sessions: SessionSummary[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionId = file.replace('.json', '');
        const session = await this.loadSession(sessionId);
        if (session) {
          sessions.push({
            sessionId: session.metadata.sessionId,
            projectName: session.metadata.projectName,
            createdDate: session.metadata.createdDate,
            lastAccessed: session.metadata.lastAccessed,
            conversationCount: session.history.length,
            status: session.metadata.status,
            tags: session.metadata.tags
          });
        }
      }
    }

    return sessions.sort((a, b) => 
      b.lastAccessed.getTime() - a.lastAccessed.getTime()
    );
  }

  public async getCurrentSession(): Promise<Session | null> {
    if (!this.currentSessionId) {
      return null;
    }
    return this.loadSession(this.currentSessionId);
  }

  public setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  public async updateContext(
    sessionId: string, 
    context: Partial<Session['context']>
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.context = { ...session.context, ...context };
    await this.saveSession(session);
  }

  public async addDecision(
    sessionId: string,
    decision: string,
    rationale: string,
    relatedFiles?: string[]
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const newDecision: Decision = {
      id: `decision-${Date.now()}`,
      decision,
      rationale,
      timestamp: new Date(),
      relatedFiles
    };

    session.context.decisions = session.context.decisions || [];
    session.context.decisions.push(newDecision);
    await this.saveSession(session);
  }

  public async trackIssue(
    sessionId: string,
    title: string,
    status: TrackedIssue['status'] = 'planning',
    priority: TrackedIssue['priority'] = 'medium'
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const newIssue: TrackedIssue = {
      id: `issue-${Date.now()}`,
      title,
      status,
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    session.context.trackedIssues = session.context.trackedIssues || [];
    session.context.trackedIssues.push(newIssue);
    await this.saveSession(session);
  }

  public async searchSessions(query: string): Promise<SessionSummary[]> {
    const allSessions = await this.listSessions();
    const results: SessionSummary[] = [];

    for (const summary of allSessions) {
      const session = await this.loadSession(summary.sessionId);
      if (!session) continue;

      // Search in project name, description, and conversation history
      const searchable = [
        session.metadata.projectName,
        session.metadata.description || '',
        ...session.history.map(h => `${h.prompt} ${h.response}`),
        ...(session.metadata.tags || [])
      ].join(' ').toLowerCase();

      if (searchable.includes(query.toLowerCase())) {
        results.push(summary);
      }
    }

    return results;
  }

  public async exportSession(sessionId: string, format: 'json' | 'markdown' = 'json'): Promise<string> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Markdown export
    let markdown = `# ${session.metadata.projectName}\n\n`;
    markdown += `**Session ID**: ${session.metadata.sessionId}\n`;
    markdown += `**Created**: ${session.metadata.createdDate.toLocaleString()}\n`;
    markdown += `**Last Accessed**: ${session.metadata.lastAccessed.toLocaleString()}\n\n`;

    if (session.metadata.description) {
      markdown += `## Description\n${session.metadata.description}\n\n`;
    }

    markdown += `## Conversation History\n\n`;
    for (const entry of session.history) {
      markdown += `### ${entry.timestamp.toLocaleString()} (${entry.source})\n`;
      markdown += `**Prompt**: ${entry.prompt}\n\n`;
      markdown += `**Response**: ${entry.response}\n\n`;
      markdown += '---\n\n';
    }

    if (session.context.decisions && session.context.decisions.length > 0) {
      markdown += `## Decisions\n\n`;
      for (const decision of session.context.decisions) {
        markdown += `- **${decision.decision}**: ${decision.rationale}\n`;
      }
    }

    return markdown;
  }
}