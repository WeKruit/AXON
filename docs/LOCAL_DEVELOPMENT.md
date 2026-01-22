# Local Development Setup

This guide will help you set up Postiz for local development.

## Prerequisites

- **Node.js** 20+ (recommended: 22.x)
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** and Docker Compose

## Quick Start

Run the setup script:

```bash
./scripts/setup.sh
```

This will:
1. Start PostgreSQL and Redis via Docker
2. Create `.env` from `.env.example`
3. Install dependencies
4. Generate Prisma client
5. Push database schema

Then start the dev servers:

```bash
pnpm run dev
```

## Manual Setup

### 1. Start Infrastructure

```bash
# Start PostgreSQL, Redis, pgAdmin, Redis Insight
pnpm run dev:docker
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update:
- `DATABASE_URL` - Should match docker-compose credentials:
  ```
  postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local
  ```
- `JWT_SECRET` - Generate a random string
- Add any API keys you need (social media integrations, etc.)

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm run prisma-generate

# Push schema to database
pnpm run prisma-db-push
```

### 5. Start Development Servers

```bash
# Start all services (frontend, backend, orchestrator, extension)
pnpm run dev

# Or start individually:
pnpm run dev:frontend   # http://localhost:4200
pnpm run dev:backend    # http://localhost:3000
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start all dev servers with hot reload |
| `pnpm run dev:frontend` | Start frontend only |
| `pnpm run dev:backend` | Start backend only |
| `pnpm run dev:docker` | Start Docker services (DB, Redis) |
| `pnpm run build` | Build all apps for production |
| `pnpm run prisma-generate` | Regenerate Prisma client |
| `pnpm run prisma-db-push` | Push schema changes to DB |
| `pnpm run prisma-db-pull` | Pull schema from DB |

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| pgAdmin | http://localhost:8081 |
| Redis Insight | http://localhost:5540 |

**pgAdmin credentials:** `admin@admin.com` / `admin`

## Hot Reload

Both frontend (Next.js) and backend (NestJS) have hot reload enabled by default:
- Save a file → changes reflect automatically
- No need to restart servers

## Firebase Authentication (Optional)

To enable Google Sign-in via Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project or use an existing one
3. Enable Google Sign-in: Authentication → Sign-in method → Google
4. Get Web SDK config: Project Settings → General → Your apps → Web app
5. Generate service account key: Project Settings → Service accounts → Generate new private key

Add to `.env`:

```bash
# Frontend (from Firebase Web SDK config)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Backend (from service account JSON)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

## Troubleshooting

### Port already in use

```bash
# Find and kill process on port
lsof -i :4200  # or :3000
kill -9 <PID>
```

### Database connection issues

```bash
# Check if Docker services are running
docker ps

# Restart Docker services
docker compose -f docker-compose.dev.yaml down
docker compose -f docker-compose.dev.yaml up -d
```

### Prisma issues

```bash
# Reset database (WARNING: deletes all data)
pnpm run prisma-reset

# Regenerate client after schema changes
pnpm run prisma-generate
```

### Node modules issues

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libraries/*/node_modules
pnpm install
```
