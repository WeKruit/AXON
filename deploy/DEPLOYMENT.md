# WeCrew-AXON Deployment Guide

This guide covers deploying all components of the Postiz application to production.

## Quick Start

For automated deployment using scripts:

```bash
# Deploy everything
./deploy/deploy-all.sh

# Or deploy individual services
./deploy/temporal-flyio/deploy.sh     # Deploy Temporal to Fly.io
./deploy/backend-cloudrun/deploy.sh   # Deploy Backend to Cloud Run
./deploy/orchestrator-cloudrun/deploy.sh  # Deploy Orchestrator to Cloud Run
./deploy/frontend-vercel/deploy.sh    # Deploy Frontend to Vercel
```

Configuration is centralized in `deploy/deploy.env`.

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Vercel        │
                    │   (Frontend)    │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Google Cloud   │  │    Fly.io       │  │   Supabase      │
│  Run (Backend)  │──│   (Temporal)    │──│  (PostgreSQL)   │
└────────┬────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Upstash        │
│  (Redis)        │
└─────────────────┘
```

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
- Docker Desktop running
- Fly.io CLI (`flyctl`) installed
- Vercel CLI (`vercel`) installed (optional)
- Node.js 22+ and pnpm 10.6.1+

---

## Configuration Files

### `deploy/deploy.env`
Central configuration file with project IDs, regions, and service names:

```bash
# GCP Configuration
GCP_PROJECT_ID="wecrew-axon"
GCP_REGION="us-west1"

# Service Resources
BACKEND_MEMORY="2Gi"
BACKEND_CPU="2"

# Fly.io Configuration
FLY_APP_NAME="wecrew-temporal"

# Vercel Configuration
VERCEL_PROJECT_NAME="axon-7f6d"
```

### `.env` (Project Root)
Secrets and sensitive configuration (not committed to git):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `FIREBASE_*` - Firebase credentials

---

## 1. Database Setup (Supabase)

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL: `db.xxxxx.supabase.co`
3. Get the database password from Settings → Database

### Connection String
```bash
# Direct connection (port 5432) - for migrations
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# PgBouncer connection (port 6543) - for production apps
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=5"
```

### Run Migrations
```bash
pnpm run prisma-db-push
```

---

## 2. Redis Setup (Upstash)

### Create Upstash Redis
1. Go to [upstash.com](https://upstash.com) and create a new Redis database
2. Enable TLS (recommended)
3. Copy the connection URL

```bash
REDIS_URL="rediss://default:YOUR_TOKEN@xxxxx.upstash.io:6379"
```

---

## 3. Temporal Setup (Fly.io)

### Deploy Temporal Server

```bash
cd deploy/temporal-flyio

# Create the app
fly apps create wecrew-temporal

# Set secrets
fly secrets set \
  POSTGRES_USER=postgres \
  POSTGRES_PASSWORD=your-password \
  POSTGRES_DB=temporal

# Deploy
fly deploy
```

### Configuration
```bash
TEMPORAL_ADDRESS="wecrew-temporal.fly.dev:7233"
TEMPORAL_NAMESPACE="default"
TEMPORAL_TLS="false"
```

### Verify Temporal
```bash
# Check if Temporal is running
tctl --address wecrew-temporal.fly.dev:7233 cluster health
```

---

## 4. Backend Deployment (Google Cloud Run)

### 4.1 Build Docker Image

```bash
# Build for amd64 (required for Cloud Run)
docker buildx build --platform linux/amd64 -f Dockerfile.backend -t axon-backend:amd64 --load .
```

### 4.2 Push to Google Container Registry

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Tag and push
docker tag axon-backend:amd64 gcr.io/YOUR_PROJECT/axon-backend:latest
docker push gcr.io/YOUR_PROJECT/axon-backend:latest
```

### 4.3 Configure Environment Variables

Edit `deploy/backend-cloudrun/.env.yaml`:

```yaml
DATABASE_URL: "postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=5"
REDIS_URL: "rediss://default:xxx@xxx.upstash.io:6379"
JWT_SECRET: "your-long-random-secret-here"
TEMPORAL_ADDRESS: "wecrew-temporal.fly.dev:7233"
TEMPORAL_NAMESPACE: "default"
SKIP_TEMPORAL: "false"
FIREBASE_PROJECT_ID: "your-firebase-project"
FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FRONTEND_URL: "https://your-frontend.vercel.app"
NEXT_PUBLIC_BACKEND_URL: "https://your-backend-xxx.run.app"
BACKEND_INTERNAL_URL: "https://your-backend-xxx.run.app"
MAIN_URL: "https://your-backend-xxx.run.app"
STORAGE_PROVIDER: "local"
NODE_ENV: "production"
```

### 4.4 Deploy to Cloud Run

```bash
gcloud run deploy axon-backend \
  --image gcr.io/YOUR_PROJECT/axon-backend:latest \
  --region us-west1 \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --cpu-boost \
  --env-vars-file deploy/backend-cloudrun/.env.yaml
```

### 4.5 Verify Backend

```bash
curl https://your-backend-xxx.run.app
# Should return: App is running!
```

---

## 5. Frontend Deployment (Vercel)

### 5.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the `apps/frontend` directory as the root

### 5.2 Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-backend-xxx.run.app` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID |

### 5.3 Deploy

```bash
# Via CLI
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

---

## 6. Orchestrator Deployment (Google Cloud Run)

The orchestrator handles Temporal workflows for scheduling posts.

### 6.1 Build Image

```bash
docker buildx build --platform linux/amd64 -f Dockerfile.orchestrator -t axon-orchestrator:amd64 --load .
```

### 6.2 Push and Deploy

```bash
docker tag axon-orchestrator:amd64 gcr.io/YOUR_PROJECT/axon-orchestrator:latest
docker push gcr.io/YOUR_PROJECT/axon-orchestrator:latest

gcloud run deploy axon-orchestrator \
  --image gcr.io/YOUR_PROJECT/axon-orchestrator:latest \
  --region us-west1 \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 1 \
  --max-instances 5 \
  --no-allow-unauthenticated \
  --env-vars-file deploy/orchestrator-cloudrun/.env.yaml
```

---

## 7. Firebase Setup

### 7.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Enable Authentication → Sign-in method → Google

### 7.2 Add Authorized Domains
In Firebase Console → Authentication → Settings → Authorized domains:
- Add your Vercel domain: `your-app.vercel.app`
- Add your backend domain: `your-backend-xxx.run.app`

### 7.3 Get Service Account Key
1. Project Settings → Service Accounts
2. Generate new private key
3. Use the values for `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

---

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in backend matches your Vercel URL exactly
- Check that `auth` header is in `exposedHeaders` in `main.ts`

### Login Not Redirecting / Stays on Login Page
- The auth flow relies on response headers being properly exposed via CORS
- Check that `auth` and `showorg` are in the `exposedHeaders` array in `main.ts`
- Verify the backend is sending the `auth` header in all auth responses (register, login, activate, oauth)

### Database Connection Issues
- Use port 6543 (PgBouncer) for production
- Add `?pgbouncer=true&connection_limit=5` to DATABASE_URL
- If seeing "connection slots reserved for SUPERUSER", reduce pool size in PostgresStore (`max: 3`)

### Firebase Auth "Invalid provider token"
- Ensure `FIREBASE_PRIVATE_KEY` is set in Cloud Run
- Check the private key includes `\n` for newlines
- Verify the private key is from the correct Firebase service account

### Container Won't Start
- Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME --region REGION`
- Ensure image is built for `linux/amd64` platform (not arm64)
- For Apple Silicon Macs: `docker buildx build --platform linux/amd64 ...`

### Temporal Connection Errors
- Verify Temporal is running: `fly status -a wecrew-temporal`
- Check that `TEMPORAL_ADDRESS` does not include protocol prefix
- Search attribute registration errors are non-fatal and won't block startup

---

## Quick Reference Commands

```bash
# View backend logs
gcloud run services logs read axon-backend --region us-west1 --limit 50

# Update backend
docker buildx build --platform linux/amd64 -f Dockerfile.backend -t axon-backend:amd64 --load .
docker tag axon-backend:amd64 gcr.io/YOUR_PROJECT/axon-backend:latest
docker push gcr.io/YOUR_PROJECT/axon-backend:latest
gcloud run deploy axon-backend --image gcr.io/YOUR_PROJECT/axon-backend:latest --region us-west1 --env-vars-file deploy/backend-cloudrun/.env.yaml

# Check service status
gcloud run services describe axon-backend --region us-west1

# Test CORS
curl -X OPTIONS https://your-backend.run.app/auth/register \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST" -I
```

---

## Environment Variables Summary

### Backend (Cloud Run)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (use PgBouncer port 6543) |
| `REDIS_URL` | Yes | Upstash Redis URL |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `TEMPORAL_ADDRESS` | Yes | Temporal server address |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `NODE_ENV` | Yes | Set to "production" |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase Web SDK config |
