#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Postiz Local Development Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        echo "Please install $1 before running this script"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 found${NC}"
}

check_command "node"
check_command "pnpm"
check_command "docker"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js version 20+ required (found v$NODE_VERSION)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version is compatible${NC}"

echo ""

# Start Docker services
echo -e "${YELLOW}Starting Docker services (PostgreSQL, Redis)...${NC}"
docker compose -f docker-compose.dev.yaml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env

    # Update DATABASE_URL for docker-compose.dev.yaml credentials
    sed -i.bak 's|postgresql://postiz-user:postiz-password@localhost:5432/postiz-db-local|postgresql://postiz-local:postiz-local-pwd@localhost:5432/postiz-db-local|g' .env
    rm -f .env.bak

    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|random string for your JWT secret, make it long|$JWT_SECRET|g" .env
    rm -f .env.bak

    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Note: Review .env and add any API keys you need${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install

echo ""

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
pnpm run prisma-generate

echo ""

# Push database schema
echo -e "${YELLOW}Pushing database schema...${NC}"
pnpm run prisma-db-push

echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To start development servers, run:"
echo -e "  ${BLUE}pnpm run dev${NC}           - Start all services"
echo -e "  ${BLUE}pnpm run dev:frontend${NC}  - Frontend only (http://localhost:4200)"
echo -e "  ${BLUE}pnpm run dev:backend${NC}   - Backend only (http://localhost:3000)"
echo ""
echo -e "Other useful commands:"
echo -e "  ${BLUE}pnpm run build${NC}         - Build all apps"
echo -e "  ${BLUE}pnpm run dev:docker${NC}    - Start Docker services only"
echo ""
echo -e "${YELLOW}Admin tools:${NC}"
echo -e "  pgAdmin: http://localhost:8081 (admin@admin.com / admin)"
echo -e "  Redis Insight: http://localhost:5540"
echo ""

docker run --rm -d --name temporal -p 7233:7233 temporalio/auto-setup:latest
docker start temporal