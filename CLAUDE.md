# CLAUDE.md - Project Guide for AI Assistants

This file provides guidance for AI assistants working with this codebase.

## Project Overview

This is **Postiz** (internally named "gitroom"), an open-source AI social media scheduling tool. It's an alternative to Buffer, Hypefury, Twitter Hunter, etc. The platform allows users to schedule posts across multiple social media platforms, measure analytics, collaborate with team members, and automate workflows.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 14 (React 18) with Tailwind CSS
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis
- **Package Manager**: pnpm 10.6.1
- **Node Version**: >=22.12.0 <23.0.0 (package.json), Volta configured for 20.17.0
- **License**: AGPL-3.0

## Project Structure

```
/
├── apps/
│   ├── backend/          # NestJS API server (port 3000)
│   ├── frontend/         # Next.js web app (port 4200)
│   ├── orchestrator/     # Background job processor (Temporal workflows)
│   ├── extension/        # Browser extension (Chrome/Firefox)
│   ├── commands/         # CLI commands
│   └── sdk/              # NodeJS SDK (@postiz/node)
├── libraries/
│   ├── nestjs-libraries/ # Shared NestJS modules, services, Prisma schema
│   ├── react-shared-libraries/ # Shared React components
│   ├── firebase/         # Firebase authentication helpers
│   └── helpers/          # Utility functions
├── docker-compose.dev.yaml
├── pnpm-workspace.yaml
└── package.json
```

## Key Files & Locations

- **Prisma Schema**: `libraries/nestjs-libraries/src/database/prisma/schema.prisma`
- **Environment Config**: `.env.example` (copy to `.env`)
- **Backend Entry**: `apps/backend/src/main.ts`
- **Frontend Entry**: `apps/frontend/src/app/`
- **API Routes**: `apps/backend/src/api/routes/`

## Common Commands

```bash
# Development
pnpm run dev                    # Start all services (frontend + backend + orchestrator)
pnpm run dev:frontend           # Frontend only (http://localhost:4200)
pnpm run dev:backend            # Backend only (http://localhost:3000)
pnpm run dev:orchestrator       # Orchestrator only
pnpm run dev:docker             # Start PostgreSQL & Redis containers

# Building
pnpm run build                  # Build all apps
pnpm run build:backend          # Build backend only
pnpm run build:frontend         # Build frontend only

# Database
pnpm run prisma-generate        # Generate Prisma client
pnpm run prisma-db-push         # Push schema changes to database
pnpm run prisma-db-pull         # Pull schema from database
pnpm run prisma-reset           # Reset database (destructive!)

# Testing
pnpm run test                   # Run tests with Jest

# Local Setup
./scripts/setup.sh              # One-command setup (Docker + deps + DB)
```

## Architecture Notes

### Backend (NestJS)
- API routes in `apps/backend/src/api/routes/`
- Public API in `apps/backend/src/public-api/`
- Uses NestJS modules pattern with dependency injection
- Controllers: auth, billing, integrations, media, posts, users, etc.

### Frontend (Next.js)
- App Router structure in `src/app/`
- Route groups: `(app)` for main app, `(extension)` for extension modals
- Components in `src/components/`
- Uses Tailwind CSS for styling
- Zustand for state management
- SWR for data fetching

### Orchestrator
- Handles background jobs using Temporal workflows
- Social media post scheduling and publishing
- Runs as a separate NestJS application context

### Database
- PostgreSQL with Prisma ORM
- Key models: Organization, User, Post, Integration, Media, Tags
- Multi-tenant architecture (organizations have users)

## Social Media Integrations

Supported platforms (configured via environment variables):
- X (Twitter), LinkedIn, Reddit, Instagram, Facebook
- YouTube, TikTok, Pinterest, Threads
- Discord, Slack, Mastodon, Bluesky, Dribbble

## Authentication

- Email/password with optional email verification (Resend)
- OAuth providers: GitHub, Google
- Firebase authentication (optional)
- Generic OIDC/OAuth support (Authentik, etc.)
- Wallet-based auth (Solana)

## Environment Variables

Key variables (see `.env.example` for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL (default: http://localhost:4200)
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: http://localhost:3000)
- `CLOUDFLARE_*` - R2 storage for media uploads
- Social media API keys for each platform

## Development Tips

1. **First-time setup**: Run `./scripts/setup.sh` to start Docker containers, install deps, and push schema
2. **Hot reload**: `pnpm run dev` starts all services with hot reload
3. **Database changes**: Edit schema.prisma, then run `pnpm run prisma-db-push`
4. **Adding integrations**: Check `apps/backend/src/api/routes/integrations.controller.ts`
5. **Browser extension**: Build with `pnpm run build:extension`, manifests in `apps/extension/`

## Testing

- Jest for unit/integration tests
- Test files: `*.spec.ts` or `*.test.ts`
- Run: `pnpm run test`
- Coverage reports output to `./reports/`

## AI/LLM Features

- OpenAI integration for content generation
- CopilotKit integration (`@copilotkit/*`)
- Mastra framework for AI agents (`@mastra/*`)
- LangChain for LLM workflows (`@langchain/*`)

## Claude Code Configuration

This project uses Claude Code agents for multi-developer parallel development.

### Agents (`.claude/agents/`)

| Agent | Purpose |
|-------|---------|
| `backend-developer` | NestJS API, Prisma, infrastructure |
| `frontend-developer` | Next.js, React, Tailwind |
| `ai-developer` | OpenAI, LangChain, Mastra |
| `tdd-guide` | Test-Driven Development |
| `code-reviewer` | Code review, quality checks |

### Rules (`.claude/rules/`)

| Rule | Description |
|------|-------------|
| `agents.md` | Agent orchestration and handoff |
| `git-workflow.md` | Branch naming, commits, PRs |
| `tdd.md` | TDD requirements and patterns |
| `linear-workflow.md` | Linear ticket management |

### Commands (`.claude/commands/`)

| Command | Description |
|---------|-------------|
| `/start-ticket` | Start working on a Linear ticket |
| `/create-pr` | Create PR and update Linear |
| `/review-code` | Run code review |
| `/sync-linear` | Sync progress to Linear |

### Team Assignments

| Developer | Branch Prefix | Focus |
|-----------|--------------|-------|
| Blake | `feature/blake/` | Backend & Infrastructure |
| Casey | `feature/casey/` | Frontend |
| Alex | `feature/alex/` | Backend & AI |

### Linear Integration

- **Team**: WeCrew (WEC)
- **Status Flow**: Todo → In Progress → In Review → Done
- Update tickets at each workflow step
