import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { PromptTemplate, TemplateVariable } from '../types/template.types';

export class TemplateManager {
  private templateDirectory: string;
  private builtInTemplates: PromptTemplate[] = [];

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.templateDirectory = path.join(homeDir, '.claude-prompter', 'templates');
    this.ensureDirectoryExists();
    this.loadBuiltInTemplates();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.templateDirectory)) {
      fs.mkdirSync(this.templateDirectory, { recursive: true });
    }
  }

  private generateTemplateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private loadBuiltInTemplates(): void {
    // Built-in templates for common scenarios
    this.builtInTemplates = [
      {
        id: 'builtin-debug-error',
        name: 'Debug Error Message',
        description: 'Help debug an error message with context',
        template: 'I\'m getting this error: {{errorMessage}}\n\nContext: {{context}}\n\nThe error occurs in: {{filePath}}\n\nWhat\'s causing this and how can I fix it?',
        variables: [
          { name: 'errorMessage', description: 'The error message', type: 'string', required: true },
          { name: 'context', description: 'What you were trying to do', type: 'string', required: true },
          { name: 'filePath', description: 'File where error occurs', type: 'string', required: false }
        ],
        category: 'debugging',
        tags: ['error', 'debug', 'troubleshooting'],
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'builtin-code-review',
        name: 'Code Review Request',
        description: 'Request a thorough code review',
        template: 'Please review this {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focusAreas}}\n\nProject context: {{context}}',
        variables: [
          { name: 'language', description: 'Programming language', type: 'string', required: true },
          { name: 'code', description: 'Code to review', type: 'string', required: true },
          { name: 'focusAreas', description: 'Areas to focus on', type: 'string', required: false, defaultValue: 'performance, security, best practices' },
          { name: 'context', description: 'Project context', type: 'string', required: false }
        ],
        category: 'code-quality',
        tags: ['review', 'code', 'quality'],
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      },
      {
        id: 'builtin-feature-planning',
        name: 'Feature Planning',
        description: 'Plan implementation for a new feature',
        template: 'I need to implement {{featureName}} for {{projectName}}.\n\nRequirements:\n{{requirements}}\n\nCurrent tech stack: {{techStack}}\n\nPlease provide:\n1. Architecture overview\n2. Implementation steps\n3. Potential challenges\n4. Time estimate',
        variables: [
          { name: 'featureName', description: 'Name of the feature', type: 'string', required: true },
          { name: 'projectName', description: 'Project name', type: 'string', required: true },
          { name: 'requirements', description: 'Feature requirements', type: 'string', required: true },
          { name: 'techStack', description: 'Technology stack', type: 'string', required: true }
        ],
        category: 'planning',
        tags: ['feature', 'planning', 'architecture'],
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      }
    ];
  }

  private getTemplatePath(templateId: string): string {
    return path.join(this.templateDirectory, `${templateId}.json`);
  }

  public async createTemplate(
    name: string,
    description: string,
    template: string,
    variables: TemplateVariable[],
    category: string,
    tags: string[] = []
  ): Promise<PromptTemplate> {
    const templateId = this.generateTemplateId();
    const newTemplate: PromptTemplate = {
      id: templateId,
      name,
      description,
      template,
      variables,
      category,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    await this.saveTemplate(newTemplate);
    return newTemplate;
  }

  public async saveTemplate(template: PromptTemplate): Promise<void> {
    const templatePath = this.getTemplatePath(template.id);
    await fsPromises.writeFile(
      templatePath,
      JSON.stringify(template, null, 2)
    );
  }

  public async loadTemplate(templateId: string): Promise<PromptTemplate | null> {
    // Check built-in templates first
    const builtIn = this.builtInTemplates.find(t => t.id === templateId);
    if (builtIn) return builtIn;

    // Then check user templates
    const templatePath = this.getTemplatePath(templateId);
    try {
      const templateData = await fsPromises.readFile(templatePath, 'utf-8');
      return JSON.parse(templateData);
    } catch (error) {
      return null;
    }
  }

  public async listTemplates(category?: string): Promise<PromptTemplate[]> {
    const templates: PromptTemplate[] = [...this.builtInTemplates];

    // Load user templates
    try {
      const files = await fsPromises.readdir(this.templateDirectory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const templateId = file.replace('.json', '');
          const template = await this.loadTemplate(templateId);
          if (template && template.id !== templateId) {
            templates.push(template);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }

    // Filter by category if specified
    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  public async renderTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.loadTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        throw new Error(`Required variable '${variable.name}' is missing`);
      }
    }

    // Render the template
    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    }

    // Apply default values for missing optional variables
    for (const variable of template.variables) {
      if (!variable.required && !(variable.name in variables) && variable.defaultValue !== undefined) {
        const placeholder = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        rendered = rendered.replace(placeholder, String(variable.defaultValue));
      }
    }

    // Update usage count
    template.usageCount++;
    template.updatedAt = new Date();
    if (!template.id.startsWith('builtin-')) {
      await this.saveTemplate(template);
    }

    return rendered;
  }

  public async searchTemplates(query: string): Promise<PromptTemplate[]> {
    const allTemplates = await this.listTemplates();
    const queryLower = query.toLowerCase();

    return allTemplates.filter(template => {
      const searchable = [
        template.name,
        template.description,
        template.category,
        ...template.tags,
        template.template
      ].join(' ').toLowerCase();

      return searchable.includes(queryLower);
    });
  }

  public async getCategories(): Promise<string[]> {
    const templates = await this.listTemplates();
    const categories = new Set<string>();
    
    templates.forEach(t => categories.add(t.category));
    
    return Array.from(categories).sort();
  }

  public async addExample(
    templateId: string,
    description: string,
    variables: Record<string, any>,
    result: string
  ): Promise<void> {
    const template = await this.loadTemplate(templateId);
    if (!template || template.id.startsWith('builtin-')) {
      throw new Error(`Cannot modify template ${templateId}`);
    }

    template.examples = template.examples || [];
    template.examples.push({ description, variables, result });
    template.updatedAt = new Date();

    await this.saveTemplate(template);
  }

  public async exportTemplate(templateId: string): Promise<string> {
    const template = await this.loadTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return JSON.stringify(template, null, 2);
  }

  public async importTemplate(templateData: string): Promise<PromptTemplate> {
    const template = JSON.parse(templateData);
    template.id = this.generateTemplateId(); // Generate new ID
    template.createdAt = new Date();
    template.updatedAt = new Date();
    template.usageCount = 0;

    await this.saveTemplate(template);
    return template;
  }
}