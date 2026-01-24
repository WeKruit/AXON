#!/bin/bash
# =============================================================================
# Deploy Orchestrator to Google Cloud Run
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
echo "=== Deploying Orchestrator to Cloud Run ==="
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${GCP_REGION}"
echo "  Service: ${ORCHESTRATOR_SERVICE_NAME}"
echo "  Note: min-instances=${ORCHESTRATOR_MIN_INSTANCES} (must stay on for Temporal worker)"
echo ""

# Backup existing Dockerfile if present, copy our Dockerfile
if [ -f "${PROJECT_ROOT}/Dockerfile" ]; then
    mv "${PROJECT_ROOT}/Dockerfile" "${PROJECT_ROOT}/Dockerfile.backup"
fi
cp "${SCRIPT_DIR}/Dockerfile" "${PROJECT_ROOT}/Dockerfile"

# Create env vars file for gcloud (handles special characters properly)
ENV_FILE="${SCRIPT_DIR}/.env.yaml"
{
    printf 'DATABASE_URL: "%s"\n' "${DATABASE_URL}"
    printf 'REDIS_URL: "%s"\n' "${REDIS_URL}"
    printf 'TEMPORAL_ADDRESS: "%s"\n' "${TEMPORAL_ADDRESS}"
    printf 'TEMPORAL_NAMESPACE: "default"\n'
    printf 'NODE_ENV: "production"\n'
} > "${ENV_FILE}"

# Build image using Cloud Build
echo "Building Docker image with Cloud Build..."
gcloud builds submit "${PROJECT_ROOT}" \
    --project "${GCP_PROJECT_ID}" \
    --tag "gcr.io/${GCP_PROJECT_ID}/${ORCHESTRATOR_SERVICE_NAME}:latest" \
    --timeout=1200

# Deploy the built image
echo "Deploying to Cloud Run..."
gcloud run deploy "${ORCHESTRATOR_SERVICE_NAME}" \
    --project "${GCP_PROJECT_ID}" \
    --region "${GCP_REGION}" \
    --image "gcr.io/${GCP_PROJECT_ID}/${ORCHESTRATOR_SERVICE_NAME}:latest" \
    --allow-unauthenticated \
    --memory "${ORCHESTRATOR_MEMORY}" \
    --cpu "${ORCHESTRATOR_CPU}" \
    --min-instances "${ORCHESTRATOR_MIN_INSTANCES}" \
    --max-instances "${ORCHESTRATOR_MAX_INSTANCES}" \
    --env-vars-file "${ENV_FILE}"

# Clean up
rm -f "${ENV_FILE}"
rm -f "${PROJECT_ROOT}/Dockerfile"
if [ -f "${PROJECT_ROOT}/Dockerfile.backup" ]; then
    mv "${PROJECT_ROOT}/Dockerfile.backup" "${PROJECT_ROOT}/Dockerfile"
fi

echo ""
echo "=== Orchestrator Deployed Successfully ==="
echo "Note: Orchestrator runs with min-instances=${ORCHESTRATOR_MIN_INSTANCES} to stay always-on"
echo ""
echo "Orchestrator URL:"
gcloud run services describe "${ORCHESTRATOR_SERVICE_NAME}" \
    --region "${GCP_REGION}" \
    --format "value(status.url)"
