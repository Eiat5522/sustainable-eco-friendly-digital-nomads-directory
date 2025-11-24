# Running E2E Tests in Docker

This guide shows you how to run E2E tests completely inside Docker containers for maximum isolation.

## Quick Start

### Option 1: Use the Automated Script (Easiest)

```bash
# Run everything in Docker
./run-e2e-docker.sh
```

This script will:
1. ✅ Start MongoDB in Docker
2. ✅ Build the app in Docker
3. ✅ Seed the test database
4. ✅ Run all E2E tests
5. ✅ Save results to your local machine
6. ✅ Clean up containers

### Option 2: Use Docker Compose Directly

```bash
# Start all services
docker-compose -f docker-compose.e2e.yml up --build

# In another terminal, view logs
docker-compose -f docker-compose.e2e.yml logs -f

# Stop services
docker-compose -f docker-compose.e2e.yml down
```

### Option 3: Run Individual Commands

```bash
# 1. Start MongoDB
docker-compose -f docker-compose.e2e.yml up -d mongodb

# 2. Setup database
docker-compose -f docker-compose.e2e.yml run --rm app-e2e node tests/setup-e2e-db.mjs

# 3. Run tests
docker-compose -f docker-compose.e2e.yml run --rm app-e2e pnpm test:e2e

# 4. View specific test
docker-compose -f docker-compose.e2e.yml run --rm app-e2e \
  pnpm exec playwright test tests/e2e/auth.spec.ts

# 5. Cleanup
docker-compose -f docker-compose.e2e.yml down
```

## Files Created

1. **Dockerfile.e2e** - Container definition for E2E testing
2. **docker-compose.e2e.yml** - Multi-container setup (app + MongoDB)
3. **run-e2e-docker.sh** - Automated test runner script

## Advantages of Docker E2E Testing

✅ **Complete Isolation**: Tests run in a clean environment every time  
✅ **Consistent Environment**: Same setup on every machine  
✅ **No Local Dependencies**: Don't need MongoDB installed locally  
✅ **CI/CD Ready**: Same setup works in GitHub Actions  
✅ **Parallel Testing**: Can run multiple test environments simultaneously  

## Viewing Test Results

After tests complete, results are saved to your local machine:

```bash
# View HTML report
cd app-next-directory
pnpm exec playwright show-report

# Or open directly
open app-next-directory/playwright-report/index.html  # macOS
xdg-open app-next-directory/playwright-report/index.html  # Linux
```

## Debugging Tests in Docker

### View Live Logs

```bash
# Watch MongoDB logs
docker-compose -f docker-compose.e2e.yml logs -f mongodb

# Watch app logs
docker-compose -f docker-compose.e2e.yml logs -f app-e2e
```

### Run Tests in Debug Mode

```bash
# Interactive shell in container
docker-compose -f docker-compose.e2e.yml run --rm app-e2e sh

# Inside container, run tests manually
pnpm test:e2e --debug
```

### Access MongoDB from Host

While tests are running:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/e2e_test

# View test data
use e2e_test
db.users.find()
```

## Customizing Docker Tests

### Change Test Timeout

Edit `docker-compose.e2e.yml`:

```yaml
environment:
  PLAYWRIGHT_TIMEOUT: 120000  # 2 minutes
```

### Run Specific Browser

```yaml
environment:
  BROWSER: firefox  # or webkit
```

### Enable Headed Mode (with VNC)

For visual debugging, you can add VNC support - ask if needed!

## Troubleshooting

### Docker Build Fails

```bash
# Clear Docker cache and rebuild
docker-compose -f docker-compose.e2e.yml build --no-cache
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is healthy
docker-compose -f docker-compose.e2e.yml ps

# Should show: e2e-mongodb healthy
```

### Port Already in Use

```bash
# Stop all E2E containers
docker-compose -f docker-compose.e2e.yml down

# Find what's using port 3000
lsof -ti:3000 | xargs kill -9
```

### Tests Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 120_000, // 2 minutes
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run E2E tests in Docker
        run: ./run-e2e-docker.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: app-next-directory/playwright-report/
```

## Cleaning Up

### Remove All E2E Containers

```bash
docker-compose -f docker-compose.e2e.yml down -v
```

### Remove Images

```bash
# Remove E2E images
docker rmi $(docker images | grep e2e | awk '{print $3}')
```

### Full Cleanup

```bash
# Stop everything
docker-compose -f docker-compose.e2e.yml down -v

# Remove containers and images
docker system prune -a
```

## Performance Tips

### Speed Up Rebuilds

Use BuildKit for faster builds:

```bash
DOCKER_BUILDKIT=1 docker-compose -f docker-compose.e2e.yml build
```

### Cache Dependencies

The Dockerfile is optimized to cache `node_modules`:
- Dependencies are installed before code is copied
- Only rebuilds when package.json changes

### Parallel Testing

Run multiple test suites in parallel:

```bash
# Terminal 1: API tests
docker-compose -f docker-compose.e2e.yml run --rm app-e2e \
  pnpm exec playwright test tests/e2e/api/

# Terminal 2: UI tests
docker-compose -f docker-compose.e2e.yml run --rm app-e2e \
  pnpm exec playwright test tests/e2e/auth.spec.ts
```

---

**Quick Command Reference:**

```bash
# Run all tests
./run-e2e-docker.sh

# Debug mode
docker-compose -f docker-compose.e2e.yml run --rm app-e2e sh

# View reports
cd app-next-directory && pnpm exec playwright show-report

# Cleanup
docker-compose -f docker-compose.e2e.yml down -v
```

**Status**: ✅ Ready to use  
**Next**: Run `./run-e2e-docker.sh`
