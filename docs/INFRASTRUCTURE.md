# Infrastructure Requirements

This document outlines all infrastructure dependencies for running Postiz.

## Overview

| Service | Required | Purpose | Recommended Provider |
|---------|----------|---------|---------------------|
| PostgreSQL | Yes | Main database | Supabase, Neon, Railway |
| Redis | Yes | Caching & queuing | Upstash (use `rediss://` for TLS) |
| Temporal | Yes | Workflow orchestration | Self-hosted or Temporal Cloud |
| Firebase Auth | No | Google Sign-in | Firebase (free tier) |
| Object Storage | No | Media uploads | Cloudflare R2, S3 |
| Email | No | Notifications | Resend, SMTP |

---

## Required Services

### 1. PostgreSQL

**Purpose:** Main application database (users, organizations, posts, integrations)

**Version:** 17+ recommended

**Environment Variable:**
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**Recommended Providers:**
- **Supabase** - Free tier available, generous limits
- **Neon** - Serverless, scales to zero
- **Railway** - Simple pricing
- **Self-hosted** - Docker or VM

---

### 2. Redis

**Purpose:** Caching, session management, job queuing

**Version:** 7.2+

**Environment Variable:**
```env
# For Upstash or any TLS-enabled Redis, use rediss:// (double 's')
REDIS_URL="rediss://default:password@host:6379"

# For local/non-TLS Redis
REDIS_URL="redis://localhost:6379"
```

**Recommended Providers:**
- **Upstash** - Serverless, pay-per-request, requires TLS (`rediss://`)
- **Redis Cloud** - Managed Redis
- **Self-hosted** - Docker

**Local Development:**
```bash
docker run -d --name redis -p 6379:6379 redis:7.2-alpine
```

---

### 3. Temporal (Workflow Engine)

**Purpose:** Orchestrates scheduled posts, email delivery, token refresh, and other async workflows.

**Why Temporal?** The app uses 6 workflows:
- `postWorkflowV101` - Scheduled post publishing with retries
- `autoPostWorkflow` - RSS feed auto-posting
- `missingPostWorkflow` - Reschedule failed posts
- `digestEmailWorkflow` - Batch email notifications
- `sendEmailWorkflow` - Transactional emails
- `refreshTokenWorkflow` - OAuth token refresh

**Environment Variables:**
```env
TEMPORAL_ADDRESS="localhost:7233"  # or your Temporal server
TEMPORAL_NAMESPACE="default"
```

### Temporal Deployment Options

#### Option A: Local Development (Recommended for dev)

Single container with SQLite (no external DB needed):

```bash
docker run -d \
  --name temporal \
  -p 7233:7233 \
  -p 8233:8233 \
  temporalio/temporal:latest \
  server start-dev --ip 0.0.0.0
```

- **Port 7233**: gRPC API (app connects here)
- **Port 8233**: Web UI (view workflows at http://localhost:8233)

#### Option B: Self-Hosted Production

For production, Temporal needs a persistent database.

**Docker Compose (with PostgreSQL):**

```yaml
version: '3.8'
services:
  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=temporal-postgres
      - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
    depends_on:
      - temporal-postgres

  temporal-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: temporal
      POSTGRES_PASSWORD: temporal
    volumes:
      - temporal-postgres-data:/var/lib/postgresql/data

  temporal-ui:
    image: temporalio/ui:latest
    ports:
      - "8080:8080"
    environment:
      - TEMPORAL_ADDRESS=temporal:7233

volumes:
  temporal-postgres-data:
```

#### Option C: Temporal Cloud (Managed)

For hassle-free production:
1. Sign up at https://cloud.temporal.io
2. Create a namespace
3. Get connection details

```env
TEMPORAL_ADDRESS="your-namespace.tmprl.cloud:7233"
TEMPORAL_NAMESPACE="your-namespace"
# May need mTLS certificates
```

**Pricing:** Starts ~$200/month for production workloads

#### Option D: Cloud Run / Fly.io (Cost-Effective)

Run the dev server container on a small instance:

**Fly.io example:**
```bash
# fly.toml
[build]
  image = "temporalio/temporal:latest"

[env]
  # Uses built-in SQLite, data persists on volume

[[services]]
  internal_port = 7233
  protocol = "tcp"

[[mounts]]
  source = "temporal_data"
  destination = "/data"
```

**Estimated cost:** $5-15/month on small instance

---

## Optional Services

### 4. Object Storage (Cloudflare R2)

**Purpose:** Store uploaded media (images, videos)

**Environment Variables:**
```env
STORAGE_PROVIDER="cloudflare"
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_ACCESS_KEY="your-access-key"
CLOUDFLARE_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_BUCKETNAME="your-bucket"
CLOUDFLARE_BUCKET_URL="https://your-bucket.r2.cloudflarestorage.com"
CLOUDFLARE_REGION="auto"
```

**Fallback:** Local storage via `UPLOAD_DIRECTORY` env var

### 5. Email Service

**Purpose:** Send transactional emails and notifications

**Supported Providers:**

**Resend:**
```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your App"
```

**NodeMailer (SMTP):**
```env
EMAIL_PROVIDER="nodemailer"
# Configure SMTP settings
```

### 6. Firebase Authentication (Google Sign-in)

**Purpose:** Enable Google Sign-in via Firebase Authentication

**Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Authentication > Sign-in method > Google
4. Go to Project Settings > Service Accounts > Generate new private key (for backend)
5. Go to Project Settings > General > Your apps > Add web app (for frontend config)

**Backend Environment Variables:**
```env
# From Firebase Admin SDK service account JSON
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Frontend Environment Variables:**
```env
# From Firebase web app config
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

**Note:** When `NEXT_PUBLIC_FIREBASE_API_KEY` is set, Firebase Google Sign-in replaces the default OAuth providers.

### 7. Stripe (Payments)

```env
STRIPE_SECRET_KEY="sk_xxxxx"
STRIPE_PUBLISHABLE_KEY="pk_xxxxx"
STRIPE_SIGNING_KEY="whsec_xxxxx"
```

### 8. OpenAI (AI Features)

```env
OPENAI_API_KEY="sk-xxxxx"
```

---

## Social Media API Keys

At least one is needed for the app to be useful:

```env
# Twitter/X
X_API_KEY=""
X_API_SECRET=""

# LinkedIn
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""

# Facebook/Instagram
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""

# And more: Reddit, GitHub, YouTube, TikTok, Pinterest, Discord, Slack, Mastodon...
```

---

## Quick Start (Local Development)

1. **Start PostgreSQL** (or use Supabase):
   ```bash
   docker run -d --name postgres -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres \
     postgres:17-alpine
   ```

2. **Start Redis**:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7.2-alpine
   ```

3. **Start Temporal**:
   ```bash
   docker run -d --name temporal -p 7233:7233 -p 8233:8233 \
     temporalio/temporal:latest server start-dev --ip 0.0.0.0
   ```

4. **Configure `.env`**:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
   REDIS_URL="redis://localhost:6379"
   TEMPORAL_ADDRESS="localhost:7233"
   ```

5. **Run migrations and start**:
   ```bash
   pnpm prisma:migrate
   pnpm dev
   ```

---

## Production Checklist

- [ ] PostgreSQL with backups enabled
- [ ] Redis with TLS (use `rediss://`)
- [ ] Temporal with persistent storage
- [ ] Object storage for media
- [ ] Email provider configured
- [ ] All secrets in environment variables (not committed)
- [ ] SSL/TLS on all connections

---

## Cost Estimates (Monthly)

| Setup | PostgreSQL | Redis | Temporal | Total |
|-------|-----------|-------|----------|-------|
| **Free Tier** | Supabase Free | Upstash Free | Self-hosted (Fly $5) | ~$5 |
| **Small Prod** | Supabase Pro ($25) | Upstash ($10) | Self-hosted ($10) | ~$45 |
| **Managed** | Supabase Pro ($25) | Upstash ($20) | Temporal Cloud ($200) | ~$245 |

---

## Application Hosting Options

The application consists of 3 deployable services:

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 4200 | Next.js web app |
| **Backend** | 3000 | NestJS API server |
| **Orchestrator** | - | Temporal worker (no HTTP port) |

### Hosting Providers Comparison

| Provider | Pros | Cons | Est. Cost |
|----------|------|------|-----------|
| **Fly.io** | Easy Docker deploy, global regions, persistent volumes | Learning curve | $5-20/mo |
| **Railway** | Simple UI, auto-deploy from Git, good DX | Can get pricey at scale | $5-25/mo |
| **Render** | Free tier, easy setup | Cold starts on free tier | $0-25/mo |
| **Cloud Run** | Pay-per-request, scales to zero | Complex IAM, cold starts | $5-30/mo |
| **Vercel** | Best for Next.js frontend | Backend needs separate host | $0-20/mo |
| **DigitalOcean App Platform** | Simple, predictable pricing | Less flexible | $12-25/mo |
| **Self-hosted VPS** | Full control, cheapest at scale | More ops work | $5-20/mo |

### Recommended Stack (Cost-Effective)

| Component | Provider | Cost |
|-----------|----------|------|
| Frontend | Vercel (free tier) | $0 |
| Backend | Railway or Fly.io | $5-10/mo |
| Orchestrator | Railway or Fly.io | $5-10/mo |
| Temporal | Fly.io (dev server) | $5-10/mo |
| PostgreSQL | Supabase (free tier) | $0 |
| Redis | Upstash (free tier) | $0 |
| **Total** | | **~$15-30/mo** |

### Deployment Commands

**Fly.io:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd apps/backend
fly launch --name postiz-backend
fly deploy

# Deploy frontend
cd apps/frontend
fly launch --name postiz-frontend
fly deploy
```

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Cloud Run:**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/postiz-backend
gcloud run deploy postiz-backend --image gcr.io/PROJECT_ID/postiz-backend --platform managed
```

---

## Architecture Diagram

```
                    ┌─────────────────┐
                    │   Frontend      │
                    │   (Next.js)     │
                    │   Port: 4200    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Backend      │
                    │   (NestJS)      │
                    │   Port: 3000    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐   ┌──────▼──────┐
│  PostgreSQL   │   │     Redis       │   │  Temporal   │
│  (Main DB)    │   │  (Cache/Queue)  │   │ (Workflows) │
│  Port: 5432   │   │  Port: 6379     │   │ Port: 7233  │
└───────────────┘   └─────────────────┘   └──────┬──────┘
                                                 │
                                          ┌──────▼──────┐
                                          │ Orchestrator│
                                          │  (Workers)  │
                                          └─────────────┘
```

---

## Local Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| Temporal UI | http://localhost:8233 |
