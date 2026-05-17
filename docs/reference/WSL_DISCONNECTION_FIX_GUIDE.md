# WSL Disconnection Fix Guide - Worker Module Error in Next.js Dev Server

## Problem Overview

**Issue**: Next.js 15.5.0 development server crashes with worker thread errors, causing WSL to disconnect from VS Code.

**Error Messages**:
```
[Error: Cannot find module '/home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/dist/server/vendor-chunks/lib/worker.js']
⨯ uncaughtException: [Error: the worker thread exited]
```

**Root Cause**: Corrupted or conflicting build artifacts in `.next/`, `dist/server/`, and `dist/client/` directories. These artifacts cause worker threads to look for modules in non-existent locations, leading to crashes.

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

## Turborepo Resource Guard Rails (New)

Turborepo parallelises tasks aggressively. On constrained WSL instances this can exhaust CPU/RAM,
causing VS Code to drop the WSL connection when you run `dev` alongside `build`, `lint`, or test
suites. Use the new helper script to enforce lightweight defaults whenever you need to run Turborepo
commands locally.

### 1. Run Turborepo with WSL-friendly defaults

```bash
# Example: run all build tasks with conservative settings
scripts/turbo-wsl-safe-run.sh build

# Example: run lint + unit tests sequentially in the app workspace
scripts/turbo-wsl-safe-run.sh lint test --filter=app-next-directory
```

The wrapper does the following automatically:

- Disables the Turborepo daemon (`TURBO_NO_DAEMON=1`) so no orphan workers keep consuming WSL resources.
- Caps concurrency to 1–2 tasks (override with `export TURBO_CONCURRENCY=<n>` if you have more headroom).
- Disables telemetry/background reporting to reduce extra subprocesses.
- Prefers local execution (`pnpm turbo run …`) and falls back to `npx turbo` when pnpm is unavailable.

Set `TURBO_WSL_HELPER_SILENT=1` if you want to hide the informational banner after you become familiar
with the helper.

### 2. Combine with external terminals or tmux

You can pipe the helper through `tmux` or an external Windows Terminal session to isolate crashes even
further:

```bash
tmux new -s turbo-build 'scripts/turbo-wsl-safe-run.sh build'
```

### 3. Override defaults when resources allow

If you upgrade your WSL allocation (see "Monitor Disk Space" and Windows `.wslconfig` tuning below), you
can opt into higher parallelism:

```bash
export TURBO_CONCURRENCY=4
scripts/turbo-wsl-safe-run.sh build lint
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

## Alternative Solutions (If Primary Fix Fails)

### Option A: Disable Worker Threads

If the issue persists, you can disable parallel worker threads in Next.js.

Edit `app-next-directory/next.config.ts`:

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
1. Use external terminal or tmux (see "Starting the Dev Server Safely")
2. Check WSL configuration: `wsl --status`
3. Update WSL: `wsl --update`
4. Check Windows system resources

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

---

## Additional Resources

### Related Configuration Files

- **Next.js Config**: `app-next-directory/next.config.ts` - Main Next.js configuration
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
