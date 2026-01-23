# AXON Deployment Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel - FREE)                             │
│                     https://axon-wecrew.vercel.app                       │
│                     Next.js SSR                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  BACKEND API (Cloud Run - Pay per request)               │
│                  https://axon-backend-wecrew-axon.us-west1.run.app       │
│                  NestJS REST API                                         │
│                  - Handles auth, API requests                            │
│                  - Connects to Temporal to schedule jobs                 │
│                  - Scales to zero when idle                              │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                   ┌───────────────┼───────────────┐
                   ▼               ▼               ▼
┌──────────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│  PostgreSQL          │  │  Redis          │  │  Temporal Server        │
│  (Supabase - FREE)   │  │  (Upstash-FREE) │  │  (Fly.io ~$10/month)    │
│  db.lwpywijwzqsuhswy │  │                 │  │  wecrew-temporal.fly.dev│
│  bcbm.supabase.co    │  │                 │  │  :7233                  │
└──────────────────────┘  └─────────────────┘  └─────────────────────────┘
                                                         │
                                                         ▼
                                   ┌─────────────────────────────────────┐
                                   │  ORCHESTRATOR (Cloud Run ~$5-10/mo) │
                                   │  Temporal Worker                    │
                                   │  - Listens for scheduled jobs       │
                                   │  - Executes social media posts      │
                                   │  - min-instances: 1 (always on)     │
                                   └─────────────────────────────────────┘
```

## Services & Estimated Costs

| Service | Platform | Cost | Notes |
|---------|----------|------|-------|
| Frontend | Vercel | FREE | Next.js, auto-deploy from Git |
| Backend API | Cloud Run | ~$0-5/mo | Scales to zero, pay per request |
| Orchestrator | Cloud Run | ~$5-10/mo | min-instances: 1 (must stay on) |
| Temporal | Fly.io | ~$10/mo | Always-on workflow engine with PostgreSQL |
| PostgreSQL | Supabase | FREE | 500MB free tier |
| Redis | Upstash | FREE | 10K commands/day free |
| **TOTAL** | | **~$15-25/mo** | |

## Deployment Files Structure

```
deploy/
├── deploy.env              # Central configuration (edit this!)
├── deploy-all.sh           # Master script (deploys everything)
├── temporal-flyio/
│   ├── fly.toml            # Fly.io configuration
│   └── deploy.sh           # Deploy Temporal
├── backend-cloudrun/
│   ├── Dockerfile          # Backend Docker image
│   └── deploy.sh           # Deploy Backend
├── orchestrator-cloudrun/
│   ├── Dockerfile          # Orchestrator Docker image
│   └── deploy.sh           # Deploy Orchestrator
└── frontend-vercel/
    ├── vercel.json         # Vercel configuration
    └── deploy.sh           # Deploy Frontend
```

## Quick Start Deployment

### Prerequisites
1. Fly.io CLI installed (`brew install flyctl`)
2. Google Cloud CLI installed (`brew install google-cloud-sdk`)
3. Vercel CLI installed (`npm install -g vercel`)
4. All CLIs authenticated

### Deploy Everything
```bash
cd deploy
./deploy-all.sh
```

### Deploy Individual Services
```bash
./deploy/temporal-flyio/deploy.sh      # Deploy Temporal
./deploy/backend-cloudrun/deploy.sh     # Deploy Backend
./deploy/orchestrator-cloudrun/deploy.sh # Deploy Orchestrator
./deploy/frontend-vercel/deploy.sh      # Deploy Frontend
```

## Configuration

All deployment settings are centralized in `deploy/deploy.env`:

```bash
# GCP Settings
GCP_PROJECT_ID="wecrew-axon"
GCP_REGION="us-west1"

# Service Names
BACKEND_SERVICE_NAME="axon-backend"
ORCHESTRATOR_SERVICE_NAME="axon-orchestrator"

# Fly.io Settings
FLY_APP_NAME="wecrew-temporal"
FLY_REGION="lax"

# Vercel Settings
VERCEL_PROJECT_NAME="axon-wecrew"

# Auto-generated URLs
BACKEND_URL="https://${BACKEND_SERVICE_NAME}-${GCP_PROJECT_ID}.${GCP_REGION}.run.app"
FRONTEND_URL="https://${VERCEL_PROJECT_NAME}.vercel.app"
TEMPORAL_ADDRESS="${FLY_APP_NAME}.fly.dev:7233"
```

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | https://axon-wecrew.vercel.app |
| Backend API | https://axon-backend-wecrew-axon.us-west1.run.app |
| Orchestrator | https://axon-orchestrator-wecrew-axon.us-west1.run.app |
| Temporal | wecrew-temporal.fly.dev:7233 |

## Environment Variables by Service

### Frontend (Vercel)
Set in `deploy/frontend-vercel/deploy.sh` or Vercel dashboard:
```env
NEXT_PUBLIC_BACKEND_URL=https://axon-backend-wecrew-axon.us-west1.run.app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBnv1WU2SVdUUJyDX0t72CYgPesbEGahig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wecrew-axon.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wecrew-axon
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wecrew-axon.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=939141842975
NEXT_PUBLIC_FIREBASE_APP_ID=1:939141842975:web:fd19d669f6ac4833a82d2a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-MS7YJW16NG
```

### Backend (Cloud Run)
Set via `deploy/backend-cloudrun/deploy.sh`, reads from `.env`:
```env
DATABASE_URL=postgresql://postgres:xxx@db.lwpywijwzqsuhswybcbm.supabase.co:5432/postgres
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://axon-wecrew.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://axon-backend-wecrew-axon.us-west1.run.app
BACKEND_INTERNAL_URL=https://axon-backend-wecrew-axon.us-west1.run.app
TEMPORAL_ADDRESS=wecrew-temporal.fly.dev:7233
FIREBASE_PROJECT_ID=wecrew-axon
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@wecrew-axon.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Orchestrator (Cloud Run)
Set via `deploy/orchestrator-cloudrun/deploy.sh`, reads from `.env`:
```env
DATABASE_URL=postgresql://postgres:xxx@db.lwpywijwzqsuhswybcbm.supabase.co:5432/postgres
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
TEMPORAL_ADDRESS=wecrew-temporal.fly.dev:7233
```

### Temporal (Fly.io)
Configured in `deploy/temporal-flyio/fly.toml`:
```env
DB=postgres12
POSTGRES_SEEDS=db.lwpywijwzqsuhswybcbm.supabase.co
DBNAME=postgres
VISIBILITY_DBNAME=postgres
POSTGRES_USER=postgres
# POSTGRES_PWD set as Fly secret
```

## Firebase Auth Flow

```
1. User clicks "Sign in with Google" on Frontend (Vercel)
2. Firebase Web SDK handles OAuth popup
3. Frontend receives Firebase ID token
4. Frontend sends token to Backend API
5. Backend verifies token with Firebase Admin SDK
6. Backend creates/updates user in PostgreSQL
7. Backend returns JWT session token
8. Frontend stores JWT for API calls
```

## Scheduled Post Flow

```
1. User creates scheduled post via Frontend
2. Backend receives request, validates, stores in PostgreSQL
3. Backend creates Temporal workflow for scheduled time
4. Temporal server stores workflow, waits until scheduled time
5. At scheduled time, Temporal triggers Orchestrator worker
6. Orchestrator executes the post to social media API
7. Orchestrator updates post status in PostgreSQL
```

## Database Safety (CRITICAL)

### ⚠️ NEVER Auto-Migrate on Startup

**Rule: Database schema changes must NEVER run automatically on container startup.**

Why:
- `prisma db push` can DROP tables if schema differs from database
- Auto-migrations in production can cause data loss
- Multiple containers starting simultaneously can cause race conditions
- Rollbacks become impossible if schema changes on startup

### Best Practices

1. **Development**:
   - Run `pnpm run prisma-db-push` manually after reviewing changes
   - Never use `--accept-data-loss` without understanding consequences

2. **Production**:
   - Use `prisma migrate deploy` for controlled migrations
   - Run migrations as a **separate step** before deploying containers
   - Always backup database before migrations
   - Test migrations on staging first

3. **Container Startup**:
   - Containers should ONLY start the application
   - No database modifications on startup
   - Schema must already be synced before deployment

### Migration Commands

```bash
# Development - sync schema (can drop tables!)
pnpm run prisma-db-push

# Production - apply migrations safely
pnpm dlx prisma migrate deploy --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma

# Create a new migration
pnpm dlx prisma migrate dev --name your_migration_name --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma
```

### Shared Database Warning

Temporal and the application share the same PostgreSQL database (Supabase). Temporal creates its own tables. Running `prisma db push` without care will try to DROP Temporal's tables. Always ensure Prisma schema only manages application tables.

---

## Troubleshooting

### Temporal Not Starting
- Check logs: `fly logs -a wecrew-temporal`
- Verify PostgreSQL connection with TLS enabled
- Ensure POSTGRES_PWD secret is set: `fly secrets list`

### Backend Deployment Fails
- Check GCP project is set: `gcloud config get-value project`
- Verify Cloud Run API enabled
- Check .env file exists with required variables

### Orchestrator Not Processing Jobs
- Ensure min-instances=1 in deploy script
- Verify TEMPORAL_ADDRESS is correct
- Check logs: `gcloud logs read --project wecrew-axon`

### Frontend Not Connecting
- Verify NEXT_PUBLIC_BACKEND_URL is correct
- Check CORS settings on Backend
- Ensure Firebase credentials are correct
