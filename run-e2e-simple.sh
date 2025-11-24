#!/bin/bash
# Simple E2E Test Runner - No Docker Build Required
# Uses existing MongoDB container

set -e

echo "🚀 Running E2E Tests (Simple Mode)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check MongoDB container
echo "📦 Checking MongoDB..."
unset DOCKER_HOST
if ! docker ps | grep -q mongodb-e2e; then
    echo -e "${YELLOW}⚠${NC} MongoDB container not running. Starting it..."
    docker start mongodb-e2e 2>/dev/null || docker run -d --name mongodb-e2e -p 27017:27017 mongo:7.0
    sleep 3
fi
echo -e "${GREEN}✓${NC} MongoDB is running"

# Setup database
echo ""
echo "🌱 Setting up test database..."
cd app-next-directory
MONGODB_URI=mongodb://127.0.0.1:27017/e2e_test node tests/setup-e2e-db.mjs

# Build app if needed
if [ ! -d ".next" ]; then
    echo ""
    echo "🔨 Building Next.js app..."
    pnpm build
else
    echo ""
    echo -e "${GREEN}✓${NC} Build exists (using cached .next)"
fi

# Run tests
echo ""
echo "🧪 Running E2E tests..."
echo ""
pnpm test:e2e

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Tests completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed (exit code: $EXIT_CODE)${NC}"
fi

echo ""
echo "📊 View test report:"
echo "   cd app-next-directory && pnpm exec playwright show-report"
echo ""

exit $EXIT_CODE
