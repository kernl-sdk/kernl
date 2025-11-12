# @kernl-sdk/cli

CLI for scaffolding and managing Kernl applications.

## Installation

```bash
npm install -g @kernl-sdk/cli
# or
pnpm add -g @kernl-sdk/cli
```

## Usage

### Create a new Kernl application

```bash
kernl init my-app
cd my-app
pnpm dev
```

This will:
- Create a new directory with your project name
- Scaffold a basic Kernl application structure
- Set up an example agent (Jarvis) with a math toolkit
- Install dependencies
- Initialize a git repository

### Options

```bash
kernl init <project-name> [options]

Options:
  -p, --package-manager <manager>  Package manager to use (pnpm, npm, yarn)
  --skip-install                   Skip dependency installation
  --skip-git                       Skip git initialization
  -h, --help                       Display help for command
```

## Project Structure

The CLI creates the following structure:

```
my-app/
├── src/
│   ├── agents/
│   │   └── jarvis.ts      # Example agent
│   ├── toolkits/
│   │   └── math.ts        # Example toolkit with math tools
│   ├── lib/
│   │   └── env.ts         # Utilities
│   └── index.ts           # Application entry point
├── package.json
├── tsconfig.json
└── .gitignore
```

## What's Included

- **Example Agent**: A pre-configured agent with access to a math toolkit
- **Math Toolkit**: Basic math operations (add, subtract, multiply, divide) as tools
- **TypeScript Configuration**: Pre-configured with path aliases (`@/*`)
- **Development Scripts**: `pnpm dev` and `pnpm start` ready to go

## Requirements

- Node.js 18+
- A package manager (pnpm, npm, or yarn)

## License

MIT
