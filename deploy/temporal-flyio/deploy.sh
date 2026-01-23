#!/bin/bash
# =============================================================================
# Deploy Temporal to Fly.io
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load deployment configuration
source "${SCRIPT_DIR}/../deploy.env"

echo ""
echo "=== Deploying Temporal to Fly.io ==="
echo "  App: ${FLY_APP_NAME}"
echo "  Region: ${FLY_REGION}"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "ERROR: Fly CLI not installed. Install with: brew install flyctl"
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "Not logged in to Fly.io. Running 'fly auth login'..."
    fly auth login
fi

# Navigate to fly.toml directory
cd "${SCRIPT_DIR}"

# Create app if it doesn't exist
echo "Creating app if it doesn't exist..."
fly apps create "${FLY_APP_NAME}" --machines 2>&1 || echo "App may already exist, continuing..."

# Deploy
echo ""
echo "Deploying Temporal server..."
fly deploy --ha=false

# Allocate IPv4 if not already allocated
echo ""
echo "Checking IPv4 allocation..."
if ! fly ips list | grep -q "v4"; then
    echo "Allocating IPv4 address..."
    fly ips allocate-v4 --yes
fi

# Show status
echo ""
echo "=== Temporal Deployed Successfully ==="
fly status

echo ""
echo "Temporal Address: ${TEMPORAL_ADDRESS}"
echo ""
echo "Note: Make sure auto_stop_machines is 'off' in fly.toml to keep Temporal running"
