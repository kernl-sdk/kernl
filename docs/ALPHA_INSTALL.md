# Alpha Installation Guide

Welcome to the kernl alpha! This guide will help you install and get started with kernl packages from GitHub Packages.

## Prerequisites

- Node.js 18 or higher
- pnpm, npm, or yarn
- A GitHub account

## Installation Steps

### 1. Create a GitHub Personal Access Token (PAT)

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name like "kernl-alpha"
4. Check the **`read:packages`** scope
5. Click **"Generate token"**
6. **Copy the token** (it starts with `ghp_...`)

### 2. Configure npm Authentication

Login with npm:

```bash
npm login --scope=@kernl --registry=https://npm.pkg.github.com
```

When prompted:
- **Username**: Your GitHub username
- **Password**: Your PAT (the `ghp_...` token)
- **Email**: Your GitHub email

### 3. Quick Start

Install the Kernl CLI globally:

```bash
pnpm add -g @kernl/cli
# or
npm install -g @kernl/cli
```

Create a new project:

```bash
kernl init my-project
cd my-project
pnpm start
```

## Available Packages

- **`@kernl/core`**: Main framework for building AI agents
- **`@kernl/ai`**: Vercel AI SDK adapters (supports Anthropic, OpenAI, Google)
- **`@kernl/protocol`**: Core protocol definitions
- **`@kernl/cli`**: CLI for scaffolding projects

## Troubleshooting

### Authentication Issues

If you see errors like "401 Unauthorized" or "Unable to authenticate":

1. Verify your PAT has the `read:packages` scope
2. Check that your `.npmrc` is correctly configured
3. Try logging out and back in:
   ```bash
   npm logout --scope=@kernl --registry=https://npm.pkg.github.com
   npm login --scope=@kernl --registry=https://npm.pkg.github.com
   ```

## Feedback

We'd love to hear your feedback! Please share:
- What's working well
- What's confusing or broken
- Feature requests
- Use cases you're building

Thank you for being an alpha tester! 🚀
