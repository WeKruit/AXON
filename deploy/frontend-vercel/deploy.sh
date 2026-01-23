#!/bin/bash
# =============================================================================
# Deploy Frontend to Vercel
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Load deployment configuration
source "${SCRIPT_DIR}/../deploy.env"

echo ""
echo "=== Deploying Frontend to Vercel ==="
echo "  Project: ${VERCEL_PROJECT_NAME}"
echo "  Backend URL: ${BACKEND_URL}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to project root
cd "${PROJECT_ROOT}"

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod \
    -e NEXT_PUBLIC_BACKEND_URL="${BACKEND_URL}" \
    -e NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY}" \
    -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
    -e NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}" \
    -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}" \
    -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" \
    -e NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID}" \
    -e NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"

echo ""
echo "=== Frontend Deployed Successfully ==="
echo "Your Vercel URL will be shown above"
echo ""
echo "Expected URL: ${FRONTEND_URL}"
