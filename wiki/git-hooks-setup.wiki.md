# Git Hooks Setup with Husky + Lint-Staged

## Overview

This project uses **Husky** and **Lint-Staged** to automatically run code quality checks before commits and pushes.

## Setup

### 1. Installation

```bash
pnpm add -D husky lint-staged
npx husky init
```

### 2. Configuration

#### Package.json

```json
{
  "lint-staged": {
    "*.{js,jsx,mjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

#### Husky Hooks

**Pre-commit Hook** (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Pre-push Hook** (`.husky/pre-push`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm test
```

## How It Works

### Pre-commit Hook

- ✅ Runs on `git commit`
- ✅ Only processes **staged files**
- ✅ Runs ESLint with auto-fix
- ✅ Runs Prettier formatting
- ✅ Prevents commit if linting fails

### Pre-push Hook

- ✅ Runs on `git push`
- ✅ Runs all tests (`npm test`)
- ✅ Prevents push if tests fail

## File Types Processed

### JavaScript Files (`*.{js,jsx,mjs}`)

1. **ESLint** - Code quality & security checks
2. **Prettier** - Code formatting

### Other Files (`*.{json,md}`)

1. **Prettier** - Formatting only

## Commands

```bash
# Manual lint-staged run
npx lint-staged

# Test hooks manually
git add .
git commit -m "test: testing hooks"

# Skip hooks (emergency)
git commit -m "feat: emergency fix" --no-verify
git push --no-verify
```

## Benefits

### ✅ **Code Quality**

- Automatic linting before commit
- Consistent formatting across team
- Security checks with ESLint plugins

### ✅ **Team Collaboration**

- No more "format on save" discussions
- Consistent code style in repository
- Prevents bad code from being committed

### ✅ **CI/CD Integration**

- Tests run before push
- Early failure detection
- Reduces CI pipeline failures

## Troubleshooting

### Hook Not Running

```bash
# Check if hooks are executable
ls -la .husky/

# Reinstall hooks
npx husky install
```

### Lint-Staged Issues

```bash
# Debug lint-staged
npx lint-staged --debug

# Run specific file
npx lint-staged --include="src/utils/type-check.util.js"
```

### Skip Hooks Temporarily

```bash
# Skip pre-commit
git commit -m "feat: skip hooks" --no-verify

# Skip pre-push
git push --no-verify
```

## Configuration Files

### `.husky/pre-commit`

- Runs lint-staged on staged files
- Processes JS files with ESLint + Prettier
- Processes other files with Prettier only

### `.husky/pre-push`

- Runs full test suite
- Ensures code quality before push
- Prevents broken code in remote

### `package.json` lint-staged config

- Defines which files to process
- Specifies commands for each file type
- Optimized for performance (only staged files)
