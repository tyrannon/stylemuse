export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  category: string;
  tags: string[];
  examples?: TemplateExample[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating?: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
}

export interface TemplateExample {
  description: string;
  variables: Record<string, any>;
  result: string;
}

export interface TemplateCategory {
  name: string;
  description: string;
  icon?: string;
}