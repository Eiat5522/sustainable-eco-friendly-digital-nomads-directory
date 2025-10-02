# WSL Disconnection Fix Guide - Worker Module Error in Next.js Dev Server

## Problem Overview

**Issue**: VS Code disconnects from WSL when running process-intensive tasks (builds, tests, or multiple dev servers simultaneously). This issue became more pronounced after introducing Turborepo to the project.

**Common Scenarios**:
1. Running `pnpm build` causes WSL disconnection
2. Running dev server then running tests causes disconnection
3. Running multiple workspaces simultaneously (Next.js + Sanity)
4. Long-running E2E tests with Playwright

**Error Messages**:
```
[Error: Cannot find module '/home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/dist/server/vendor-chunks/lib/worker.js']
⨯ uncaughtException: [Error: the worker thread exited]
```

**Root Causes**: 
1. Corrupted or conflicting build artifacts in `.next/`, `dist/server/`, and `dist/client/` directories
2. Turborepo running multiple tasks in parallel without resource limits, overwhelming WSL
3. Insufficient WSL memory/CPU allocation for intensive build processes
4. VS Code file watcher monitoring too many files, consuming excessive resources

---

## Quick Fix (Recommended)

### Step 0: Configure WSL Resources (NEW - Required for Turborepo)

**This is the most important step to prevent disconnections!**

Turborepo can overwhelm WSL resources when running multiple tasks in parallel. Configure WSL resource limits:

1. **Create/Edit `.wslconfig` on Windows host** (not in WSL):
   ```powershell
   # Open PowerShell/CMD
   notepad C:\Users\<YourUsername>\.wslconfig
   ```

2. **Copy recommended settings** from `.wslconfig.recommended` in this repository, or use these minimal settings:
   ```ini
   [wsl2]
   memory=8GB
   processors=4
   swap=2GB
   localhostForwarding=true
   
   [experimental]
   autoMemoryReclaim=gradual
   sparseVhd=true
   ```

3. **Restart WSL** (in PowerShell as Administrator):
   ```powershell
   wsl --shutdown
   ```
   Then restart your WSL instance.

4. **Verify settings**:
   ```bash
   # In WSL
   free -h  # Check memory
   nproc    # Check CPU count
   ```

**Why this matters**: Without resource limits, Turborepo + Next.js + Playwright can easily consume 10-12GB RAM and all CPU cores, causing WSL to crash and VS Code to disconnect.

---

## Quick Fix (Recommended)

### Option 1: Using the Cleanup Script

Run the automated cleanup script:

```bash
# From project root
bash scripts/clean-build-artifacts.sh
```

This script will:
- Remove `.next/` (Next.js build output)
- Remove `dist/server/` and `dist/client/` (corrupted worker modules)
- Remove `.turbo/` (Turbopack cache)
- Remove `node_modules/.cache/` (tool caches)
- **Preserve** `dist/types/` (needed for TypeScript type generation)

### Option 2: Manual Cleanup

If you prefer manual cleanup:

```bash
cd app-next-directory

# Remove build artifacts (safe operation)
rm -rf .next dist/server dist/client .turbo node_modules/.cache

# Keep dist/types for TypeScript
# (it will be regenerated if needed)
```

---

## Environment Verification

Before starting the dev server, verify your environment:

### 1. Check Node.js Version

```bash
node --version
```

**Required**: Node.js version 20.x to 22.x (as specified in `package.json` engines)

If your version is incorrect, use nvm to switch:
```bash
nvm use 20
# or
nvm install 20
```

### 2. Verify Clean State

After cleanup, verify no corrupted artifacts remain:

```bash
cd app-next-directory
ls -la | grep -E "\.next|dist"
```

You should only see `dist/types` (if it exists).

---

## Starting the Dev Server Safely

To prevent WSL disconnection during server startup issues:

### Method 1: Use External Terminal (Recommended for WSL)

```bash
# Open a separate terminal session (not in VS Code)
cd /path/to/sustainable-eco-friendly-digital-nomads-directory
npm run dev 2>&1 | tee app-next-directory-dev.log
```

Benefits:
- Isolates crashes from VS Code WSL session
- Creates a log file for debugging
- WSL connection remains stable even if server crashes

### Method 2: Use tmux Session

```bash
# Create a new tmux session
tmux new -s nextjs-dev

# Inside tmux
cd app-next-directory
npm run dev

# Detach from tmux: Ctrl+B, then D
# Reattach later: tmux attach -t nextjs-dev
```

### Method 3: Standard Start (Use after confirming stability)

```bash
# From project root
npm run dev

# Or from app-next-directory
cd app-next-directory
npm run dev
```

---

## Validation Tests

After the dev server starts successfully, perform these validation tests:

### 1. Check Server Startup Logs

Look for these positive indicators:
```
✓ Ready in XXXXms
✓ Starting...
- Local: http://localhost:3000
```

No errors about:
- Worker threads
- Missing modules
- Vendor chunks

### 2. Test Homepage

```bash
curl http://localhost:3000
# Or open in browser: http://localhost:3000
```

### 3. Test API Endpoints

```bash
# Test auth session
curl http://localhost:3000/api/auth/session

# Test cities endpoint
curl http://localhost:3000/api/cities
```

### 4. Monitor Logs

Watch for any worker thread errors:
```bash
# If using log file
tail -f app-next-directory-dev.log | grep -i "worker\|error\|exception"
```

### 5. Verify WSL Connection

Ensure VS Code Remote-WSL connection remains stable for at least 5-10 minutes of development.

---

## Turborepo-Specific Optimizations (NEW)

Since introducing Turborepo, additional resource management is needed to prevent WSL disconnections.

### Configuration Changes Made

The project now includes optimizations in `turbo.json`:

1. **Daemon Disabled**: `"daemon": false` prevents background process resource consumption
2. **Stream UI Mode**: `"ui": "stream"` reduces memory overhead
3. **Proper Cache Configuration**: Prevents cache bloat in `.turbo/` directory
4. **Task Dependencies**: Ensures builds complete before tests run

### Using Turborepo Safely in WSL

**Option 1: Run tasks sequentially** (safest, slower):
```bash
# Instead of: pnpm run build (runs all in parallel)
pnpm run build:next
pnpm run build:sanity

# Instead of running dev + test simultaneously
pnpm run dev:next
# Wait for server to start, then in another terminal:
pnpm run test:e2e
```

**Option 2: Limit Turborepo concurrency** (requires Turbo CLI):
```bash
# Run only 1 task at a time
turbo run build --concurrency=1

# Run max 2 tasks in parallel
turbo run build --concurrency=2
```

**Option 3: Use environment variable**:
```bash
# Add to your .bashrc or .zshrc in WSL
export TURBO_FORCE=true
export TURBO_TEAM=local

# For individual commands
TURBO_TELEMETRY_DISABLED=1 pnpm run build
```

### VS Code Settings for Turborepo

The project now includes `.vscode/settings.json` with:
- File watcher exclusions for `.turbo/`, `.next/`, `dist/`
- Disabled auto-refresh for git and extensions
- Reduced search scope to essential files
- TypeScript workspace optimization

**These settings are automatically applied when you open the workspace.**

### Monitoring Turborepo Resource Usage

```bash
# Monitor memory while building
watch -n 1 free -h

# Monitor all resources
htop  # or 'top' if htop not installed

# Check Turbo cache size
du -sh .turbo

# Clear Turbo cache if it gets too large (>500MB)
rm -rf .turbo
```

### Turborepo Performance Tips

1. **Keep .turbo cache clean**: Large cache (>1GB) slows down WSL
2. **Use `--force` flag**: Skip cache when debugging: `pnpm run build --force`
3. **Run cleanup before intensive tasks**: `bash scripts/clean-build-artifacts.sh`
4. **Restart WSL weekly**: Prevents memory fragmentation: `wsl --shutdown` (on Windows)

---

## Alternative Solutions (If Primary Fix Fails)

### Option A: Disable Worker Threads

If the issue persists, you can disable parallel worker threads in Next.js.

Edit `app-next-directory/next.config.mjs`:

```javascript
const nextConfig = {
  // ... existing config ...
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  // ... rest of config ...
};
```

**Trade-offs**:
- Slower builds
- Single-threaded compilation
- More stable (no worker thread issues)

### Option B: Use Webpack Instead of Turbopack

Turbopack (the default in Next.js 15) may have worker thread issues. Switch to Webpack:

```bash
# Start with Webpack bundler
npm run dev -- --webpack
```

Or make it permanent in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --webpack"
  }
}
```

**Trade-offs**:
- Slower build times
- More mature, stable bundler
- No worker thread module issues

### Option C: Downgrade Next.js (Last Resort)

If the issue is specific to Next.js 15.5.0:

```bash
cd app-next-directory

# Downgrade to previous stable version
npm install next@15.4.4

# Or try the latest 15.4.x
npm install next@15.4
```

**Note**: This is a last resort. The cleanup script should resolve most issues.

---

## Prevention Measures

### 1. Add to .gitignore (Already Configured)

Verify these entries are in `.gitignore`:
```
.next/
dist/
.turbo/
node_modules/
```

✅ These are already present in the project's `.gitignore`.

### 2. Clean Before Switching Branches

When switching branches with significant changes:
```bash
bash scripts/clean-build-artifacts.sh
```

### 3. Regular Cleanup

If you experience frequent issues, add cleanup to your workflow:
```bash
# Add to package.json scripts
{
  "scripts": {
    "clean": "bash scripts/clean-build-artifacts.sh",
    "dev:clean": "bash scripts/clean-build-artifacts.sh && npm run dev"
  }
}
```

### 4. Monitor Disk Space

Worker module issues can occur when disk space is low:
```bash
df -h
```

Ensure you have at least 2-3 GB of free space.

---

## Troubleshooting Guide

### Issue: Script doesn't fix the problem

**Try**:
1. Run cleanup script again with manual verification
2. Check for permission issues: `ls -la app-next-directory/`
3. Verify Node.js version matches requirements
4. Try Option A (disable worker threads) or Option B (use Webpack)

### Issue: Dev server still crashes

**Check**:
1. Console logs for specific error messages
2. Available memory: `free -h`
3. Running processes: `ps aux | grep node`
4. Kill any hung processes: `pkill -f "next dev"`

### Issue: WSL keeps disconnecting

**Solutions**:
1. **Configure WSL resources** (see Step 0 above) - **Most common fix**
2. Check `.wslconfig` is properly configured: `wsl --status` (on Windows)
3. Update WSL: `wsl --update` (on Windows, requires Admin)
4. Check Windows system resources (Task Manager > Performance > WSL)
5. Use external terminal or tmux (see "Starting the Dev Server Safely")
6. Monitor Turborepo resource usage: `htop` or `top` in WSL
7. Reduce Turborepo concurrency: run tasks sequentially
8. Clear Turbo cache: `rm -rf .turbo` in project root

### Issue: TypeScript errors after cleanup

**Expected**: Some TypeScript errors are known in the codebase.

**If new errors appear**:
```bash
cd app-next-directory
npm run build:types
```

---

## Success Criteria

✅ Dev server starts without worker module errors  
✅ Worker threads initialize correctly (or are disabled)  
✅ Pages compile successfully  
✅ WSL remains connected throughout development session  
✅ API routes respond correctly  
✅ Hot reload works properly  
✅ Can run builds without WSL disconnection (NEW)  
✅ Can run tests while dev server is running (NEW)  
✅ Turborepo tasks complete successfully (NEW)  
✅ VS Code remains responsive during intensive operations (NEW)  

---

## Additional Resources

### Related Configuration Files

- **Next.js Config**: `app-next-directory/next.config.mjs` - Main Next.js configuration
- **Package Config**: `app-next-directory/package.json` - Dependencies and scripts
- **TypeScript Config**: `app-next-directory/tsconfig.json` - TypeScript settings
- **Cleanup Script**: `scripts/clean-build-artifacts.sh` - Automated cleanup tool

### Environment Details

- **Project**: Sustainable Digital Nomads Directory
- **Framework**: Next.js 15.5.0
- **Language**: TypeScript 5.9.2
- **Package Manager**: pnpm (preferred) / npm (fallback)
- **Node Version**: 20.x - 22.x
- **OS**: WSL on Windows

### Getting Help

If issues persist after trying all solutions:

1. **Check Logs**: Review `app-next-directory-dev.log` for detailed error messages
2. **GitHub Issues**: Search for similar issues in Next.js repository
3. **Community**: Ask in project discussions or Next.js Discord
4. **Documentation**: Review Next.js 15 migration guide and worker thread docs

---

## Summary

**The primary fix for worker module errors is to clean build artifacts using the provided script.**

Most issues are resolved by:
1. Running `bash scripts/clean-build-artifacts.sh`
2. Verifying Node.js version (20.x - 22.x)
3. Starting dev server safely (external terminal or tmux)
4. Validating the server starts without errors

Alternative solutions (disabling worker threads, using Webpack, or downgrading Next.js) should only be used if the primary fix doesn't resolve the issue.

---

**Last Updated**: 2025-01-01  
**Next.js Version**: 15.5.0  
**Maintained By**: Development Team
