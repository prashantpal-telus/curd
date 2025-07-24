# AI Commit Message Generator

A CLI tool that generates conventional commit messages using Fuelix API's Claude model by analyzing your git diffs.

## Features

- Generates semantic commit messages following conventional commit format
- Analyzes staged changes using git diff
- Supports automatic commit with generated message
- Uses Fuelix API's Claude model for intelligent message generation

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file with your Fuelix API key and model name:
```bash
FUELIX_API_KEY=your_fuelix_api_key_here
FUELIX_MODEL=claude-3-5-sonnet
```

## Usage

1. Stage your changes using git add:
```bash
git add .  # or specific files
```

2. Generate a commit message:
```bash
node index.js
```

3. Generate and automatically commit:
```bash
node index.js --auto-commit
```

## Commit Message Format

The tool generates messages following the conventional commit format:

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, chore
```

## Integration with package.json

Add this to your package.json scripts to use it as your commit command:

```json
{
  "scripts": {
    "commit": "node commit-message-generator/index.js --auto-commit"
  }
}
```

Then use:
```bash
npm run commit
```

## Requirements

- Node.js >= 18
- Git
- Fuelix API key
