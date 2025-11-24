#!/bin/bash
# E2E Testing in Docker - Quick Start Script

set -e

echo "🚀 Starting E2E Tests in Docker..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fix Docker socket path for WSL (unset if pointing to wrong location)
if [[ "$DOCKER_HOST" == *"run/user"* ]]; then
    unset DOCKER_HOST
fi

# Check if Docker is running (works with WSL Docker Desktop)
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not accessible"
    echo "Please ensure Docker Desktop is running and WSL integration is enabled"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is accessible"

# Stop and remove existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.e2e.yml down -v 2>/dev/null || true

# Build and start services
echo ""
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.e2e.yml build

echo ""
echo "🌱 Starting services..."
docker-compose -f docker-compose.e2e.yml up -d mongodb

# Wait for MongoDB to be ready
echo ""
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Setup database
echo ""
echo "📦 Setting up test database..."
docker-compose -f docker-compose.e2e.yml run --rm app-e2e node tests/setup-e2e-db.mjs

# Run E2E tests
echo ""
echo "🧪 Running E2E tests..."
docker-compose -f docker-compose.e2e.yml run --rm app-e2e pnpm test:e2e

# Capture exit code
EXIT_CODE=$?

# Show results
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ E2E tests completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠ E2E tests failed with exit code: $EXIT_CODE${NC}"
fi

# Show report location
echo ""
echo "📊 Test reports are available at:"
echo "   - HTML Report: app-next-directory/playwright-report/index.html"
echo "   - Test Results: app-next-directory/test-results/"
echo ""
echo "To view the HTML report, run:"
echo "   cd app-next-directory && pnpm exec playwright show-report"
echo ""

# Cleanup
echo "🧹 Cleaning up containers..."
docker-compose -f docker-compose.e2e.yml down

echo ""
echo "✨ Done!"

exit $EXIT_CODE
