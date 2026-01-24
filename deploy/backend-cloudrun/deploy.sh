#!/bin/bash
# =============================================================================
# Deploy Backend to Google Cloud Run
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Load deployment configuration
source "${SCRIPT_DIR}/../deploy.env"

# Load secrets from .env file
if [ -f "${PROJECT_ROOT}/.env" ]; then
    echo "Loading secrets from .env..."
    set -a
    source "${PROJECT_ROOT}/.env"
    set +a
else
    echo "ERROR: .env file not found at ${PROJECT_ROOT}/.env"
    exit 1
fi

echo ""
echo "=== Deploying Backend to Cloud Run ==="
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${GCP_REGION}"
echo "  Service: ${BACKEND_SERVICE_NAME}"
echo ""

# Backup existing Dockerfile if present, copy our Dockerfile
if [ -f "${PROJECT_ROOT}/Dockerfile" ]; then
    mv "${PROJECT_ROOT}/Dockerfile" "${PROJECT_ROOT}/Dockerfile.backup"
fi
cp "${SCRIPT_DIR}/Dockerfile" "${PROJECT_ROOT}/Dockerfile"

# Create env vars file for gcloud using printf (handles special characters better)
# Use deploy.env FRONTEND_URL (not .env which may have localhost)
DEPLOY_FRONTEND_URL="https://${VERCEL_PROJECT_NAME}.vercel.app"

ENV_FILE="${SCRIPT_DIR}/.env.yaml"
{
    printf 'DATABASE_URL: "%s"\n' "${DATABASE_URL}"
    printf 'REDIS_URL: "%s"\n' "${REDIS_URL}"
    printf 'JWT_SECRET: "%s"\n' "${JWT_SECRET}"
    printf 'TEMPORAL_ADDRESS: "%s"\n' "${TEMPORAL_ADDRESS}"
    printf 'TEMPORAL_NAMESPACE: "default"\n'
    printf 'SKIP_TEMPORAL: "false"\n'
    printf 'FIREBASE_PROJECT_ID: "%s"\n' "${FIREBASE_PROJECT_ID}"
    printf 'FIREBASE_CLIENT_EMAIL: "%s"\n' "${FIREBASE_CLIENT_EMAIL}"
    printf 'FIREBASE_PRIVATE_KEY: "%s"\n' "${FIREBASE_PRIVATE_KEY}"
    printf 'FRONTEND_URL: "%s"\n' "${DEPLOY_FRONTEND_URL}"
    printf 'NEXT_PUBLIC_BACKEND_URL: "%s"\n' "${BACKEND_URL}"
    printf 'BACKEND_INTERNAL_URL: "%s"\n' "${BACKEND_URL}"
    printf 'MAIN_URL: "%s"\n' "${BACKEND_URL}"
    printf 'STORAGE_PROVIDER: "local"\n'
    printf 'NODE_ENV: "production"\n'
} > "${ENV_FILE}"

# Build image using Cloud Build
echo "Building Docker image with Cloud Build..."
gcloud builds submit "${PROJECT_ROOT}" \
    --project "${GCP_PROJECT_ID}" \
    --tag "gcr.io/${GCP_PROJECT_ID}/${BACKEND_SERVICE_NAME}:latest" \
    --timeout=2400

# Deploy the built image
echo "Deploying to Cloud Run..."
gcloud run deploy "${BACKEND_SERVICE_NAME}" \
    --project "${GCP_PROJECT_ID}" \
    --region "${GCP_REGION}" \
    --image "gcr.io/${GCP_PROJECT_ID}/${BACKEND_SERVICE_NAME}:latest" \
    --allow-unauthenticated \
    --memory "${BACKEND_MEMORY}" \
    --cpu "${BACKEND_CPU}" \
    --min-instances "${BACKEND_MIN_INSTANCES}" \
    --max-instances "${BACKEND_MAX_INSTANCES}" \
    --timeout=300 \
    --env-vars-file "${ENV_FILE}"

# Clean up
rm -f "${ENV_FILE}"
rm -f "${PROJECT_ROOT}/Dockerfile"
if [ -f "${PROJECT_ROOT}/Dockerfile.backup" ]; then
    mv "${PROJECT_ROOT}/Dockerfile.backup" "${PROJECT_ROOT}/Dockerfile"
fi

echo ""
echo "=== Backend Deployed Successfully ==="
echo ""
echo "Backend URL:"
gcloud run services describe "${BACKEND_SERVICE_NAME}" \
    --region "${GCP_REGION}" \
    --format "value(status.url)"
