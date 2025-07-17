# Claude Prompter CLI

A clean, professional CLI tool for generating and sending prompts to OpenAI's GPT-4o model.

## Features

- 🚀 Send prompts directly to GPT-4o
- 📝 Generate and preview prompts without sending
- 💡 **Claude Integration**: Generate intelligent prompt suggestions based on conversation context
- 🎨 Beautiful formatted responses with colors and boxes
- ⏳ Loading spinner while waiting for API response
- 🔧 Configurable system prompts and parameters
- 🔐 Secure API key management via .env file
- ❌ Graceful error handling
- 🤖 **Designed for Claude**: Special integration for Claude to suggest follow-up prompts

## Installation

```bash
# Clone and navigate to the project
cd dev/claude-prompter

# Install dependencies
npm install

# Build the project
npm run build

# Copy .env.example to .env and add your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

## Usage

### Basic Commands

```bash
# Check configuration
node dist/cli.js config

# Generate a prompt (preview only)
node dist/cli.js prompt -m "Write a haiku about programming"

# Send a prompt to GPT-4o
node dist/cli.js prompt -m "Write a haiku about programming" --send

# Add context to your prompt
node dist/cli.js prompt -m "Explain this code" -c "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }" --send

# Use custom system prompt
node dist/cli.js prompt -m "Hello!" -s "You are a pirate. Respond in pirate speak." --send

# Show the prompt that was sent
node dist/cli.js prompt -m "Tell me a joke" --send --show-prompt
```

### Development Mode

```bash
# Run without building (using ts-node)
npm run dev -- prompt -m "Hello, GPT-4o!" --send
```

### Command Options

#### `prompt` command
- `-m, --message <message>` - The main message or question (required)
- `-c, --context <context>` - Additional context for the prompt
- `-s, --system <system>` - System prompt (default: "You are Claude, a helpful AI assistant.")
- `--send` - Send the prompt to GPT-4o instead of just printing it
- `--show-prompt` - Show the prompt that was sent (when using --send)
- `-t, --temperature <temp>` - Temperature for GPT-4o (0-2, default: 0.7)
- `--max-tokens <tokens>` - Max tokens for response (default: 4000)

#### `suggest` command (Claude Integration)
- `-t, --topic <topic>` - The topic or task you're working on (required)
- `-c, --code` - Generate suggestions for code-related tasks
- `-l, --language <language>` - Programming language (if code-related)
- `--complexity <level>` - Task complexity: simple, moderate, or complex
- `--task-type <type>` - Type of task: api-integration, ui-component, cli-tool, etc.
- `--claude-analysis` - Generate suggestions as if Claude analyzed the output

## Examples

### Code Review
```bash
node dist/cli.js prompt -m "Review this TypeScript code for best practices" \
  -c "async function getData() { const res = await fetch('/api/data'); return await res.json(); }" \
  --send
```

### Creative Writing
```bash
node dist/cli.js prompt -m "Write a short story about a robot learning to paint" \
  -s "You are a creative writing assistant. Write engaging and imaginative stories." \
  --send
```

### Technical Explanation
```bash
node dist/cli.js prompt -m "Explain how React hooks work" \
  -c "Focus on useState and useEffect" \
  --send
```

### Claude Integration - Prompt Suggestions

#### Generate suggestions for a topic
```bash
node dist/cli.js suggest -t "React component optimization"
```

#### Generate code-specific suggestions
```bash
node dist/cli.js suggest -t "API error handling" --code -l typescript --complexity moderate
```

#### Claude-style analysis suggestions
```bash
node dist/cli.js suggest -t "OpenAI integration" --claude-analysis --task-type cli-tool -l typescript
```

## Claude Integration Architecture

This tool is designed with a special integration for Claude (Anthropic's AI assistant). When Claude helps you with coding tasks, it can invoke this tool to generate intelligent follow-up prompt suggestions based on what was just created or discussed.

### How It Works

1. **Claude analyzes the conversation context** - Understanding what was built, the technology stack, and complexity
2. **Claude invokes the suggest command** - Using parameters that match the context
3. **You see categorized prompt suggestions** - Organized by type (follow-up, clarification, deep-dive, etc.)
4. **Pick a suggestion and send it** - Copy the prompt and use `--send` to continue the conversation

### Suggestion Categories

- 🔄 **Follow-up Questions** - Build on what was just discussed
- ❓ **Clarification** - Better understand concepts and decisions
- 🔍 **Deep Dive** - Explore advanced topics and optimizations
- 🔀 **Alternative Approaches** - Consider different implementations
- 🛠️ **Implementation Help** - Get practical coding assistance

### Example Claude Workflow

1. Claude helps you build a CLI tool
2. Claude runs: `node dist/cli.js suggest -t "CLI tool" --claude-analysis --code -l typescript`
3. You see suggestions like:
   - "Add comprehensive error handling..."
   - "Write unit tests for the CLI tool..."
   - "What additional commands would be useful..."
4. You pick one and run: `node dist/cli.js prompt -m "Write unit tests for the CLI tool" --send`

## API Configuration

The tool uses the following OpenAI configuration:
- **Model**: gpt-4o
- **Endpoint**: https://api.openai.com/v1/chat/completions
- **Default Temperature**: 0.7
- **Default Max Tokens**: 4000

## Error Handling

The tool provides detailed error messages for common issues:
- Missing API key
- Invalid API key
- Rate limits
- Network errors
- API errors with full details

## Project Structure

```
claude-prompter/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   └── utils/
│       ├── openaiClient.ts # OpenAI API integration
│       └── promptGenerator.ts # Prompt generation utilities
├── dist/                   # Compiled JavaScript (generated)
├── .env                    # Your API key (create from .env.example)
├── .env.example           # Example environment file
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Development

### Adding New Features

1. The `openaiClient.ts` exports both regular and streaming functions
2. The CLI uses Commander.js for parsing arguments
3. Chalk and Boxen are used for formatting
4. Ora provides the loading spinner

### Building

```bash
npm run build    # Compile TypeScript to JavaScript
npm run clean    # Remove dist directory
```

## Real-World Workflows

### Workflow 1: Building a Feature with Claude + GPT-4o

1. **Initial Request to Claude**:
   "Help me build a user authentication system"

2. **Claude Creates Code** and runs:
   ```bash
   node dist/cli.js suggest -t "JWT authentication system" --code -l nodejs --task-type authentication --claude-analysis
   ```

3. **You See Suggestions**:
   - Add password hashing and salting
   - Implement refresh token rotation
   - Add rate limiting for login attempts
   - Write authentication middleware tests

4. **Continue with GPT-4o**:
   ```bash
   node dist/cli.js prompt -m "Implement refresh token rotation for the JWT auth system" --send
   ```

### Workflow 2: Debugging and Optimization

1. **After Claude Helps Fix a Bug**:
   ```bash
   node dist/cli.js suggest -t "React performance optimization" --code -l react --complexity complex --claude-analysis
   ```

2. **Get Targeted Suggestions**:
   - Add React.memo to prevent re-renders
   - Implement virtualization for long lists
   - Use code splitting for faster loads
   - Profile with React DevTools

### Workflow 3: Learning New Concepts

1. **Exploring a New Technology**:
   ```bash
   node dist/cli.js suggest -t "GraphQL API basics" --complexity simple
   ```

2. **Progressive Learning Path**:
   - Explain GraphQL vs REST differences
   - Show basic query examples
   - Demonstrate mutations
   - Add subscription support

## Advanced Usage

### Combining with Other Tools

```bash
# Generate suggestion, pick one, then enhance with context
node dist/cli.js suggest -t "Docker deployment" --task-type backend-service --claude-analysis
node dist/cli.js prompt -m "Create a multi-stage Dockerfile for Node.js app" -c "Using Express, TypeScript, and PostgreSQL" --send
```

### Custom System Prompts for Different Personas

```bash
# Get suggestions then use different AI personas
node dist/cli.js prompt -m "Review this code for security issues" -s "You are a security expert specializing in web applications" --send

node dist/cli.js prompt -m "Explain this to a beginner" -s "You are a patient teacher who uses simple analogies" --send
```

### Batch Processing Ideas

```bash
# Generate multiple related prompts
node dist/cli.js suggest -t "E-commerce platform" --code -l react --complexity complex --claude-analysis
# Then systematically work through each suggestion
```

## Tips for Maximum Productivity

1. **Be Specific with Topics**: More detail = better suggestions
2. **Use the Right Flags**: --code, --complexity, and --task-type refine suggestions
3. **Chain Conversations**: Use GPT-4o responses to inform next Claude interactions
4. **Save Good Prompts**: Keep a library of effective prompts for reuse
5. **Experiment with Temperature**: Lower for consistency, higher for creativity

## Troubleshooting

### Common Issues

1. **"Topic is required" error**:
   - Always include `-t "your topic"` in suggest commands

2. **Generic suggestions**:
   - Add more context with --code, --language, --complexity flags

3. **API rate limits**:
   - Add delays between requests or upgrade OpenAI plan

4. **Long responses cut off**:
   - Increase --max-tokens parameter (up to model limits)

## Contributing

Feel free to extend the suggestion templates in `src/utils/promptSuggestions.ts` for your specific use cases!

## License

MIT