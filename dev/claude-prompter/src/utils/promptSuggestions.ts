export interface PromptSuggestion {
  id: string;
  title: string;
  prompt: string;
  context?: string;
  category: 'follow-up' | 'clarification' | 'deep-dive' | 'alternative' | 'implementation';
  rationale: string;
}

export interface ConversationContext {
  topic: string;
  lastResponse?: string;
  techStack?: string[];
  currentTask?: string;
  userGoal?: string;
}

/**
 * Generate intelligent prompt suggestions based on conversation context
 */
export function generatePromptSuggestions(context: ConversationContext): PromptSuggestion[] {
  const suggestions: PromptSuggestion[] = [];
  
  // Follow-up suggestions
  if (context.lastResponse) {
    suggestions.push({
      id: 'follow-1',
      title: 'Request Implementation Details',
      prompt: `Can you provide the complete implementation for the ${context.topic} we just discussed?`,
      category: 'follow-up',
      rationale: 'Get practical code implementation'
    });
    
    suggestions.push({
      id: 'follow-2',
      title: 'Ask for Error Handling',
      prompt: `How should I handle errors and edge cases in this ${context.topic} implementation?`,
      category: 'follow-up',
      rationale: 'Ensure robust error handling'
    });
  }
  
  // Clarification suggestions
  suggestions.push({
    id: 'clarify-1',
    title: 'Explain Technical Concepts',
    prompt: `Can you explain the key concepts behind ${context.topic} in simpler terms?`,
    category: 'clarification',
    rationale: 'Better understand the fundamentals'
  });
  
  suggestions.push({
    id: 'clarify-2',
    title: 'Compare Alternatives',
    prompt: `What are the pros and cons of this approach vs alternative solutions for ${context.topic}?`,
    category: 'clarification',
    rationale: 'Evaluate different approaches'
  });
  
  // Deep-dive suggestions
  if (context.techStack && context.techStack.length > 0) {
    suggestions.push({
      id: 'deep-1',
      title: 'Performance Optimization',
      prompt: `How can I optimize the performance of this ${context.topic} implementation using ${context.techStack.join(', ')}?`,
      category: 'deep-dive',
      rationale: 'Improve performance and efficiency'
    });
    
    suggestions.push({
      id: 'deep-2',
      title: 'Best Practices Guide',
      prompt: `What are the best practices for implementing ${context.topic} with ${context.techStack[0]}?`,
      category: 'deep-dive',
      rationale: 'Follow industry standards'
    });
  }
  
  // Alternative approach suggestions
  suggestions.push({
    id: 'alt-1',
    title: 'Different Implementation',
    prompt: `Can you show me a different way to implement ${context.topic}?`,
    category: 'alternative',
    rationale: 'Explore alternative solutions'
  });
  
  // Implementation suggestions
  if (context.currentTask) {
    suggestions.push({
      id: 'impl-1',
      title: 'Step-by-Step Guide',
      prompt: `Can you provide a step-by-step guide to implement ${context.currentTask}?`,
      category: 'implementation',
      rationale: 'Get detailed implementation steps'
    });
    
    suggestions.push({
      id: 'impl-2',
      title: 'Testing Strategy',
      prompt: `What tests should I write for ${context.currentTask}?`,
      category: 'implementation',
      rationale: 'Ensure code quality with tests'
    });
  }
  
  return suggestions;
}

/**
 * Generate prompt suggestions for specific code output
 */
export function generateCodePromptSuggestions(
  codeType: string,
  language: string,
  features: string[]
): PromptSuggestion[] {
  return [
    {
      id: 'code-1',
      title: 'Add Error Handling',
      prompt: `Add comprehensive error handling to the ${codeType} code, including try-catch blocks and user-friendly error messages`,
      category: 'implementation',
      rationale: 'Make the code production-ready'
    },
    {
      id: 'code-2',
      title: 'Write Unit Tests',
      prompt: `Write unit tests for the ${codeType} using ${language === 'typescript' ? 'Jest' : 'appropriate testing framework'}`,
      category: 'implementation',
      rationale: 'Ensure code reliability'
    },
    {
      id: 'code-3',
      title: 'Add Documentation',
      prompt: `Add comprehensive JSDoc/comments to the ${codeType} code explaining each function and its parameters`,
      category: 'implementation',
      rationale: 'Improve code maintainability'
    },
    {
      id: 'code-4',
      title: 'Optimize Performance',
      prompt: `Optimize the ${codeType} for better performance, focusing on ${features.join(', ')}`,
      category: 'deep-dive',
      rationale: 'Improve efficiency'
    },
    {
      id: 'code-5',
      title: 'Add Type Safety',
      prompt: `Enhance type safety in the ${codeType} with stricter TypeScript types and runtime validation`,
      category: 'implementation',
      rationale: 'Prevent runtime errors'
    }
  ];
}

/**
 * Format suggestions for CLI display
 */
export function formatSuggestionsForCLI(suggestions: PromptSuggestion[]): string {
  const grouped = suggestions.reduce((acc, sug) => {
    if (!acc[sug.category]) acc[sug.category] = [];
    acc[sug.category].push(sug);
    return acc;
  }, {} as Record<string, PromptSuggestion[]>);
  
  let output = '';
  
  const categoryEmojis = {
    'follow-up': '🔄',
    'clarification': '❓',
    'deep-dive': '🔍',
    'alternative': '🔀',
    'implementation': '🛠️'
  };
  
  const categoryTitles = {
    'follow-up': 'Follow-up Questions',
    'clarification': 'Clarification',
    'deep-dive': 'Deep Dive',
    'alternative': 'Alternative Approaches',
    'implementation': 'Implementation Help'
  };
  
  Object.entries(grouped).forEach(([category, sugs]) => {
    const emoji = categoryEmojis[category as keyof typeof categoryEmojis];
    const title = categoryTitles[category as keyof typeof categoryTitles];
    
    output += `\n${emoji} ${title}\n${'─'.repeat(40)}\n`;
    
    sugs.forEach((sug, index) => {
      output += `${index + 1}. ${sug.title}\n`;
      output += `   ${sug.prompt}\n`;
      output += `   💡 ${sug.rationale}\n\n`;
    });
  });
  
  return output;
}

/**
 * Generate prompt suggestions based on Claude's analysis
 */
export function generateClaudePromptSuggestions(
  topic: string,
  analysis: {
    codeGenerated?: boolean;
    language?: string;
    features?: string[];
    complexity?: 'simple' | 'moderate' | 'complex';
    taskType?: string;
  }
): PromptSuggestion[] {
  const suggestions: PromptSuggestion[] = [];
  
  // If code was generated
  if (analysis.codeGenerated && analysis.language) {
    suggestions.push(...generateCodePromptSuggestions(
      topic,
      analysis.language,
      analysis.features || []
    ));
  }
  
  // Based on complexity
  if (analysis.complexity === 'complex') {
    suggestions.push({
      id: 'complex-1',
      title: 'Break Down Complexity',
      prompt: `Can you break down the ${topic} into smaller, manageable components?`,
      category: 'clarification',
      rationale: 'Simplify complex implementation'
    });
    
    suggestions.push({
      id: 'complex-2',
      title: 'Architecture Diagram',
      prompt: `Can you create an architecture diagram or flow chart for the ${topic} implementation?`,
      category: 'clarification',
      rationale: 'Visualize the system design'
    });
  }
  
  // Task-specific suggestions
  if (analysis.taskType) {
    switch (analysis.taskType) {
      case 'api-integration':
        suggestions.push({
          id: 'api-1',
          title: 'API Error Handling',
          prompt: `How should I handle API rate limits and network errors in the ${topic}?`,
          category: 'implementation',
          rationale: 'Build resilient API integration'
        });
        break;
        
      case 'ui-component':
        suggestions.push({
          id: 'ui-1',
          title: 'Accessibility Features',
          prompt: `How can I make the ${topic} component accessible (ARIA labels, keyboard navigation)?`,
          category: 'implementation',
          rationale: 'Ensure accessibility compliance'
        });
        break;
        
      case 'cli-tool':
        suggestions.push({
          id: 'cli-1',
          title: 'Add More Commands',
          prompt: `What additional commands would be useful for the ${topic} CLI tool?`,
          category: 'alternative',
          rationale: 'Expand CLI functionality'
        });
        break;
    }
  }
  
  // Always include these universal suggestions
  suggestions.push({
    id: 'universal-1',
    title: 'Real-World Example',
    prompt: `Can you show me a real-world example of ${topic} in production use?`,
    category: 'deep-dive',
    rationale: 'See practical applications'
  });
  
  suggestions.push({
    id: 'universal-2',
    title: 'Common Pitfalls',
    prompt: `What are common mistakes to avoid when implementing ${topic}?`,
    category: 'clarification',
    rationale: 'Avoid common errors'
  });
  
  return suggestions;
}