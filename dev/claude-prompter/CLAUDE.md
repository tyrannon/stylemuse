# Claude Integration Guide for claude-prompter

This document provides instructions for Claude (Anthropic's AI assistant) on how to use the claude-prompter tool to generate intelligent prompt suggestions for users.

## 🤖 Overview

The claude-prompter tool is specifically designed with Claude integration in mind. As Claude, you can invoke this tool to:
- Generate contextual prompt suggestions based on what you've created
- Help users explore follow-up questions
- Guide productive conversations
- Bridge between Claude and GPT-4o for enhanced assistance

## 🎯 When to Use This Tool

Use the claude-prompter to generate suggestions when:

1. **After Code Generation** - You've helped create code and want to suggest next steps
2. **Complex Topics** - The user is working on something that has many aspects to explore
3. **Learning Scenarios** - The user would benefit from guided exploration
4. **Project Completion** - You want to suggest improvements or extensions
5. **Error Resolution** - After fixing issues, suggest preventive measures

## 📋 Command Syntax

### Basic Suggestion Generation
```bash
node dist/cli.js suggest -t "<topic>" [options]
```

### Options Reference
- `-t, --topic <topic>` - **Required**: The topic or feature you've been working on
- `-c, --code` - Flag indicating code was generated
- `-l, --language <language>` - Programming language used (e.g., typescript, python)
- `--complexity <level>` - Options: simple, moderate, complex
- `--task-type <type>` - Options: api-integration, ui-component, cli-tool, backend-service, etc.
- `--claude-analysis` - **Important**: Use this flag when YOU are generating suggestions

## 🔍 Context Analysis Guide

Before invoking the tool, analyze the conversation to determine:

### 1. Topic Identification
```bash
# Be specific about what was created
-t "React authentication component with JWT"  # ✅ Good
-t "authentication"                           # ❌ Too vague
```

### 2. Code Detection
Use `--code` flag if you:
- Generated actual code snippets
- Created functions or classes
- Built components or modules
- Fixed bugs with code changes

### 3. Language Selection
```bash
# Common language options
-l typescript   # For TS/JS projects
-l python       # For Python scripts
-l react        # For React components
-l nodejs       # For Node.js backends
```

### 4. Complexity Assessment
- **simple**: Basic features, single functions, straightforward logic
- **moderate**: Multiple components, some integration, standard patterns
- **complex**: Architecture decisions, multiple systems, advanced patterns

### 5. Task Type Classification
- `api-integration`: Working with external APIs
- `ui-component`: Building user interface elements
- `cli-tool`: Command-line applications
- `backend-service`: Server-side logic
- `data-processing`: ETL, analysis, transformations
- `authentication`: Auth/authorization systems
- `database`: Database schema, queries, migrations

## 📚 Usage Examples

### Example 1: After Creating a React Component
```bash
node dist/cli.js suggest \
  -t "React todo list component with local storage" \
  --code \
  -l react \
  --complexity moderate \
  --task-type ui-component \
  --claude-analysis
```

### Example 2: After Building an API Integration
```bash
node dist/cli.js suggest \
  -t "OpenAI API integration with error handling" \
  --code \
  -l typescript \
  --complexity moderate \
  --task-type api-integration \
  --claude-analysis
```

### Example 3: After Creating a CLI Tool
```bash
node dist/cli.js suggest \
  -t "File processing CLI with progress tracking" \
  --code \
  -l nodejs \
  --complexity complex \
  --task-type cli-tool \
  --claude-analysis
```

### Example 4: General Architecture Discussion
```bash
node dist/cli.js suggest \
  -t "Microservices architecture design" \
  --complexity complex \
  --task-type backend-service \
  --claude-analysis
```

## 🎨 Presenting Suggestions to Users

When you run the suggest command:

1. **Show the command you're running**:
   ```
   Let me generate some intelligent follow-up prompts for you:
   [command here]
   ```

2. **Explain what the suggestions mean**:
   ```
   Based on what we've created, here are categorized suggestions for next steps:
   ```

3. **Guide the user**:
   ```
   You can copy any of these prompts and use:
   node dist/cli.js prompt -m "chosen prompt" --send
   ```

## 💡 Best Practices

### DO:
- ✅ Be specific with topic descriptions
- ✅ Use --claude-analysis flag when YOU are generating
- ✅ Include all relevant context (language, complexity, type)
- ✅ Run the command and show output to users
- ✅ Explain the categories to new users

### DON'T:
- ❌ Use vague topics
- ❌ Skip the --claude-analysis flag
- ❌ Generate suggestions for unrelated topics
- ❌ Overwhelm users with too many suggestions at once

## 🔄 Complete Workflow Example

1. **User asks**: "Help me create a REST API with Express"

2. **You create**: Express server with routes, middleware, error handling

3. **You analyze**:
   - Topic: "Express REST API with CRUD operations"
   - Code was generated: Yes
   - Language: TypeScript/Node.js
   - Complexity: Moderate
   - Type: backend-service

4. **You run**:
   ```bash
   node dist/cli.js suggest \
     -t "Express REST API with CRUD operations" \
     --code \
     -l nodejs \
     --complexity moderate \
     --task-type backend-service \
     --claude-analysis
   ```

5. **Tool generates** suggestions like:
   - Add authentication middleware
   - Write API tests
   - Implement rate limiting
   - Add API documentation
   - Set up database migrations

6. **User picks** a suggestion and continues the conversation

## 🚀 Advanced Integration

### Chaining Suggestions
After implementing a suggestion, you can generate new suggestions based on the updated context:

```bash
# First round: Basic API
-t "Express REST API"

# Second round: After adding auth
-t "Express REST API with JWT authentication"

# Third round: After adding tests
-t "Tested Express API with auth and CI/CD"
```

### Multi-Feature Projects
For complex projects with multiple features:

```bash
# Focus on specific aspects
-t "User authentication system in MERN stack" --task-type authentication
-t "React dashboard components for MERN app" --task-type ui-component
-t "MongoDB schema design for user system" --task-type database
```

## 🔗 Integration with Main Conversation

Always connect the suggestions back to the main conversation:

1. Reference what was just built
2. Show how suggestions extend the work
3. Explain the value of each suggestion category
4. Help users understand the progression

## 📝 Remember

This tool is designed to:
- Enhance your ability to guide users
- Provide structured follow-up options
- Bridge between different AI assistants
- Create a more interactive development experience

Use it whenever you feel the user would benefit from seeing their options laid out clearly!

## 🚀 Planned Enhancements (2025-07-19)

Based on real-world experience with complex planning workflows, these features are planned to make claude-prompter even more powerful:

### 1. Planning Command with Task Breakdown 🗺️
```bash
claude-prompter plan -t "Complex feature implementation" --tasks 3 --complexity complex
```
- Auto-generate structured task breakdowns
- Create implementation checklists
- Estimate complexity and dependencies
- Export to markdown/todo formats
- Track completion status

### 2. Context Persistence & Session Management 📚
```bash
claude-prompter session start --project "my-project"
claude-prompter session add-context "Working on multiple features..."
claude-prompter prompt -m "What's next?" --use-session
```
- Store conversation context locally
- Auto-include relevant context in prompts
- Support multiple named sessions
- Track file paths, decisions, and progress
- Clean up old sessions automatically

### 3. Multi-Issue Tracking & Progress Visualization 📊
```bash
claude-prompter track --add "Feature A" --status "in-progress"
claude-prompter track --add "Bug Fix B" --status "planning"
claude-prompter track --list  # Shows all tracked issues with progress
```
- Track multiple parallel features/issues
- Visualize dependencies between features
- Generate progress reports
- Link issues to sessions and plans
- Export status summaries

### 4. Code Analysis & Implementation Suggestions 🔍
```bash
claude-prompter analyze --file "Component.tsx" --suggest-next
claude-prompter analyze --pattern "Feature X" --find-integration-points
```
- Parse code files and extract structure
- Suggest integration points for new features
- Find similar implementations in codebase
- Generate implementation scaffolding
- Identify potential conflicts

### 5. Decision Log & Rationale Tracking 📝
```bash
claude-prompter decision add "Use Service pattern" --rationale "Maintains consistency"
claude-prompter decision list --project "my-project"
claude-prompter decision export --format markdown
```
- Track architectural decisions with rationales
- Maintain consistency across features
- Search previous decisions
- Export as documentation
- Link decisions to code files

### Why These Features?
These enhancements address common challenges in complex development:
- **Multiple parallel features**: Often working on 3-5 features simultaneously
- **Context switching**: Losing track of decisions and progress
- **Task organization**: Breaking down complex features into implementable steps
- **Architectural consistency**: Remembering why certain patterns were chosen
- **Integration planning**: Finding the right places to add new features

### Implementation Priority
1. **Context Persistence** (Immediate value - prevents repeated explanations)
2. **Planning Command** (Structures complex features effectively)
3. **Multi-Issue Tracking** (Visual progress for parallel work)
4. **Decision Log** (Maintains architectural consistency)
5. **Code Analysis** (Advanced integration assistance)