# Temporal Server on Fly.io

Deploy Temporal Server to Fly.io for ~$5-10/month.

## Prerequisites

1. Install Fly CLI: https://fly.io/docs/flyctl/install/
2. Sign up for Fly.io: `fly auth signup` or `fly auth login`

## Deploy

```bash
cd temporal-flyio

# First time: Create the app
fly apps create wecrew-temporal

# Deploy
fly deploy

# Allocate a dedicated IPv4 (required for TCP connections)
fly ips allocate-v4

# Check status
fly status
```

## Get Your Temporal Address

After deployment, your Temporal address will be:
```
wecrew-temporal.fly.dev:7233
```

## Update Your AXON .env

Add this to your `.env` or `.env.cloudrun.local`:
```
TEMPORAL_ADDRESS=wecrew-temporal.fly.dev:7233
```

## Costs

- Shared CPU (1x): ~$1.94/month
- 512MB RAM: ~$3.88/month
- Dedicated IPv4: ~$2/month
- **Total: ~$8/month**

## Notes

- Uses SQLite for simplicity (sufficient for low-medium traffic)
- For high traffic, consider PostgreSQL backend
- Auto-starts but never auto-stops to maintain connection
