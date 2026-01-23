#!/bin/bash
# =============================================================================
# Master deployment script for AXON
# Deploys all services in the correct order
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load deployment configuration
source "${SCRIPT_DIR}/deploy.env"

echo ""
echo "============================================"
echo "       AXON Full Deployment Script         "
echo "============================================"
echo ""
echo "Configuration:"
echo "  GCP Project:  ${GCP_PROJECT_ID}"
echo "  GCP Region:   ${GCP_REGION}"
echo "  Fly App:      ${FLY_APP_NAME}"
echo "  Vercel:       ${VERCEL_PROJECT_NAME}"
echo ""
echo "Services to deploy:"
echo "  1. Temporal     -> Fly.io"
echo "  2. Backend      -> Cloud Run"
echo "  3. Orchestrator -> Cloud Run"
echo "  4. Frontend     -> Vercel"
echo ""

# Prompt for confirmation
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Step 1: Deploy Temporal to Fly.io
echo ""
echo "Step 1/4: Deploying Temporal to Fly.io..."
echo "-------------------------------------------"
cd "${SCRIPT_DIR}/temporal-flyio"
chmod +x deploy.sh
./deploy.sh
echo ""

# Step 2: Deploy Backend to Cloud Run
echo ""
echo "Step 2/4: Deploying Backend to Cloud Run..."
echo "-------------------------------------------"
cd "${SCRIPT_DIR}/backend-cloudrun"
chmod +x deploy.sh
./deploy.sh
echo ""

# Step 3: Deploy Orchestrator to Cloud Run
echo ""
echo "Step 3/4: Deploying Orchestrator to Cloud Run..."
echo "-------------------------------------------"
cd "${SCRIPT_DIR}/orchestrator-cloudrun"
chmod +x deploy.sh
./deploy.sh
echo ""

# Step 4: Deploy Frontend to Vercel
echo ""
echo "Step 4/4: Deploying Frontend to Vercel..."
echo "-------------------------------------------"
cd "${SCRIPT_DIR}/frontend-vercel"
chmod +x deploy.sh
./deploy.sh
echo ""

echo "============================================"
echo "       Deployment Complete!                "
echo "============================================"
echo ""
echo "Services deployed:"
echo "  - Temporal:     ${TEMPORAL_ADDRESS}"
echo "  - Backend:      ${BACKEND_URL}"
echo "  - Orchestrator: https://${ORCHESTRATOR_SERVICE_NAME}-${GCP_PROJECT_ID}.${GCP_REGION}.run.app"
echo "  - Frontend:     ${FRONTEND_URL}"
echo ""
echo "To modify deployment configuration, edit:"
echo "  ${SCRIPT_DIR}/deploy.env"
echo ""
