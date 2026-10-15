# yikes!

yikes! is a mobile app (iOS and Android) where introverts practise conversations with AI characters, get coaching, and prepare for real events.

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Verification Checks

```bash
pnpm check
```

This runs linting, typechecking across all packages, and test suites.

### 3. Run Gateway Service

```bash
pnpm --filter @yikes/gateway dev
```

Health endpoint is available at `http://localhost:3000/health`.

### 4. Run Mobile App

```bash
# Run with Expo
pnpm --filter @yikes/mobile start

# Run in Web browser
pnpm --filter @yikes/mobile web
```

## Workspaces Structure

- `apps/mobile`: Expo React Native mobile application (`@yikes/mobile`)
- `services/gateway`: Fastify Node.js API service (`@yikes/gateway`)
- `packages/shared`: Shared schemas, contracts, tokens, and utilities (`@yikes/shared`)
- `packages/db`: Database models, migrations, and generated types (`@yikes/db`)
- `packages/content`: Scenario packs, character cards, curriculum content (`@yikes/content`)
- `packages/ai-prompts`: AI system prompts and templates (`@yikes/ai-prompts`)
