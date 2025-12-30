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

# Wait for MongoDB to be ready (poll health status)
echo ""
echo "⏳ Waiting for MongoDB to be ready..."
MAX_WAIT=60
WAITED=0
while true; do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' e2e-mongodb 2>/dev/null || true)
    if [[ "$STATUS" == '"healthy"' ]]; then
        echo "✓ MongoDB is healthy"
        break
    fi
    if [[ $WAITED -ge $MAX_WAIT ]]; then
        echo "⚠ MongoDB did not become healthy after ${MAX_WAIT}s — continuing but tests may fail"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

# Setup database
echo ""
echo "📦 Setting up test database..."
docker-compose -f docker-compose.e2e.yml run --rm app-e2e node tests/setup-e2e-db.mjs

# Verify seed completed (exit non-zero if seed not found)
echo ""
echo "🔬 Verifying DB seed..."
docker-compose -f docker-compose.e2e.yml run --rm app-e2e node tests/check-e2e-seed.mjs || {
    echo -e "${YELLOW}Seed verification failed. See app-next-directory/test-results for details.${NC}"
    docker-compose -f docker-compose.e2e.yml down
    exit 2
}

# Verify built static assets exist inside image (helps catch missing assets early)
echo ""
echo "🔎 Verifying built static assets inside image..."
mkdir -p app-next-directory/test-results
docker-compose -f docker-compose.e2e.yml run --rm app-e2e sh -c "ls -la /app/app-next-directory/.next/static/chunks > /app/app-next-directory/test-results/static-listing.txt || true"

# Start the Next server inside the container (capture logs) and run Playwright against it.
echo ""
echo "🧪 Starting server and running E2E tests (capturing server logs)..."
docker-compose -f docker-compose.e2e.yml run --rm app-e2e sh -c 'pnpm build && \
        mkdir -p /app/app-next-directory/test-results && \
        E2E=1 NEXT_PUBLIC_E2E=1 pnpm start > /app/app-next-directory/test-results/server-start.log 2>&1 & \
        SERVER_PID=$!; \
        # wait for server to respond
        for i in $(seq 1 30); do \
            if curl -sSf http://localhost:3000/ > /dev/null 2>&1; then \
                echo "Server is responding"; break; \
            fi; sleep 1; \
        done; \
        pnpm exec playwright test --config=playwright.config.ts; EXIT_CODE=$?; kill -TERM $SERVER_PID || true; \
        mkdir -p /app/app-next-directory/playwright-report; \
        rm -rf /app/app-next-directory/playwright-report/*; \
        if [ -d /app/app-next-directory/tmp/playwright-report ]; then \
            cp -R /app/app-next-directory/tmp/playwright-report/. /app/app-next-directory/playwright-report/; \
        fi; \
        exit $EXIT_CODE' 2>&1 | tee app-next-directory/test-results/test-e2e-output.log

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
