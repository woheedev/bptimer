# Contributing to BPTimer

Thank you for your interest in contributing to BPTimer! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Bun (for Svelte frontend)
- Docker (for containerized Pocketbase backend)

### Development Setup

1. **Clone the repository after forking**

   ```bash
   git clone https://github.com/your-username/bptimer.git
   cd bptimer
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**
   - Copy `apps/web/.env.example` to `apps/web/.env`
   - Fill in the required values

4. **Start the development servers**

   All together

   ```bash
   bun run dev
   ```

   Or separately

   ```bash
   # Start PocketBase
   cd apps/pocketbase
   docker compose up

   # In another terminal, start the web app
   cd apps/web
   bun run dev
   ```

## Development Workflow

1. Create a new branch for your feature/fix
2. Make your changes
3. Run formatter, linter, and type check

```bash
   # Run in root directory
   bun run format
   bun run lint
   bun run check
```

4. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow the existing code style
- Write meaningful yet minimal commit messages

## Reporting Issues

Please use the issue templates when reporting bugs or requesting features.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
