# WSL Setup Guide for Development with Turborepo

This guide helps you configure Windows Subsystem for Linux (WSL) to work optimally with this project, which uses Turborepo, Next.js, and intensive build processes.

## Quick Setup (5 Minutes)

### 1. Check Your Current Configuration

```bash
# In WSL terminal
pnpm run check:wsl
```

This script will analyze your WSL setup and provide specific recommendations.

### 2. Configure WSL Resources

**On Windows (PowerShell or CMD):**

```powershell
# Create .wslconfig file
notepad C:\Users\<YourUsername>\.wslconfig
```

**Copy and paste the configuration from `.wslconfig.recommended`** in this repository, or use these minimal settings:

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

**Adjust values based on your system:**
- **16GB RAM system**: Use `memory=8GB`
- **32GB RAM system**: Use `memory=12GB` or `16GB`
- **8-core CPU**: Use `processors=4` or `6`

### 3. Restart WSL

**On Windows (PowerShell as Administrator):**

```powershell
wsl --shutdown
```

Then restart your WSL distribution from Start Menu or terminal.

### 4. Verify Configuration

```bash
# In WSL terminal
pnpm run check:wsl
```

Should show all green checks ✓ or minimal warnings.

---

## Why This Matters

### The Problem

Without proper WSL configuration, running this project can cause:

1. **VS Code Disconnections**: WSL crashes when memory/CPU is exhausted
2. **Build Failures**: Next.js builds timeout or crash
3. **Test Issues**: Playwright tests fail due to resource starvation
4. **Poor Performance**: Slow builds and hot reloading

### The Solution

Turborepo + Next.js + Playwright can consume:
- **8-12GB RAM** during parallel builds
- **All available CPU cores** for compilation
- **Multiple GB disk space** for caches and artifacts

By limiting WSL resources, you ensure:
- Windows host remains responsive
- WSL operates within safe limits
- Processes are predictable and stable

---

## Detailed Configuration

### Memory (`memory`)

**How much to allocate:**
- Leave 4-6GB for Windows
- Allocate 50-75% of remaining RAM to WSL

**Examples:**
- 16GB system: `memory=8GB` (8GB for WSL, 8GB for Windows)
- 32GB system: `memory=16GB` (16GB for WSL, 16GB for Windows)
- 64GB system: `memory=32GB` (32GB for WSL, 32GB for Windows)

**Too low:** Builds will fail or be very slow  
**Too high:** Windows will become unresponsive

### Processors (`processors`)

**How many to allocate:**
- Leave 2-4 cores for Windows
- Allocate 50-75% of cores to WSL

**Examples:**
- 4-core CPU: `processors=2`
- 8-core CPU: `processors=4` or `processors=6`
- 16-core CPU: `processors=8` or `processors=12`

**Too low:** Serial builds, very slow  
**Too high:** Windows UI lag

### Swap (`swap`)

**Recommendation:** 25-50% of memory allocation

**Examples:**
- 8GB memory: `swap=2GB` or `swap=4GB`
- 16GB memory: `swap=4GB` or `swap=8GB`

**Why it matters:** Handles memory spikes during builds

### Experimental Features

These features improve WSL performance but require recent Windows/WSL versions:

```ini
[experimental]
autoMemoryReclaim=gradual    # Prevents memory leaks
sparseVhd=true               # Reduces disk usage
```

**Check your WSL version:** `wsl --version` (requires WSL 2.0.0+)

---

## VS Code Configuration

This project includes `.vscode/settings.json` with optimizations:

### What's Configured

1. **File Watcher Exclusions**: Ignores `.next/`, `.turbo/`, `dist/`, `node_modules/`
2. **Disabled Auto-Refresh**: Reduces background CPU usage
3. **Search Optimization**: Faster file searches by excluding build artifacts
4. **TypeScript Optimization**: Uses workspace TypeScript version

### How It Helps

- **Reduces memory usage** by 200-500MB
- **Prevents file watcher storms** during builds
- **Keeps VS Code responsive** during intensive operations
- **Faster file searches** and Go to Definition

### Automatic Application

Settings are applied automatically when you:
1. Open the workspace folder in VS Code
2. Accept workspace settings prompt (if shown)

---

## Turborepo Configuration

The project's `turbo.json` is optimized for WSL:

### Key Settings

```json
{
  "daemon": false,           // Prevents background process issues
  "ui": "stream",            // Reduces memory overhead
  "globalDependencies": [...] // Proper cache invalidation
}
```

### Running Tasks Safely

**Option 1: Sequential (safest)**
```bash
pnpm run build:sequential    # Builds Next.js, then Sanity
```

**Option 2: Monitor resources**
```bash
# Terminal 1
pnpm run build

# Terminal 2
htop    # or 'top', or 'pnpm run check:wsl'
```

**Option 3: Limit concurrency (if using turbo CLI)**
```bash
turbo run build --concurrency=1
```

---

## Troubleshooting

### "VS Code still disconnects"

1. **Verify .wslconfig is applied:**
   ```powershell
   # Windows PowerShell
   wsl --shutdown
   # Then restart WSL
   ```

2. **Check file location:**
   ```powershell
   # Should be here (replace <YourUsername>)
   C:\Users\<YourUsername>\.wslconfig
   ```

3. **Increase memory:**
   ```ini
   [wsl2]
   memory=12GB    # Try increasing by 2-4GB
   ```

### "Builds are too slow"

1. **Increase processors:**
   ```ini
   [wsl2]
   processors=6    # Add 2 more cores
   ```

2. **Clear caches:**
   ```bash
   pnpm run clean
   rm -rf .turbo
   ```

3. **Run sequentially:**
   ```bash
   pnpm run build:sequential
   ```

### "Out of memory errors"

1. **Increase swap:**
   ```ini
   [wsl2]
   swap=4GB    # Double current value
   ```

2. **Close unnecessary apps:**
   - Browser tabs
   - Other VS Code windows
   - Docker containers

3. **Run one task at a time:**
   ```bash
   # Don't run dev + test simultaneously
   # Finish one before starting another
   ```

### "Disk space errors"

1. **Check available space:**
   ```bash
   df -h .
   ```

2. **Clear build artifacts:**
   ```bash
   pnpm run clean
   rm -rf .turbo
   rm -rf */node_modules/.cache
   ```

3. **Compact WSL disk (on Windows):**
   ```powershell
   # PowerShell as Administrator
   wsl --shutdown
   Optimize-VHD -Path "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited.Ubuntu_*\LocalState\ext4.vhdx" -Mode Full
   ```

### "WSL version is old"

**Update WSL (Windows PowerShell as Administrator):**

```powershell
wsl --update
wsl --version    # Verify it's 2.0.0 or higher
```

---

## Monitoring Tools

### Built-in Check Script

```bash
pnpm run check:wsl
```

Shows:
- Memory allocation and usage
- CPU allocation
- Swap configuration
- Disk space
- Turbo cache size
- Recommendations

### System Monitoring

**htop (recommended):**
```bash
# Install (if not already installed)
sudo apt install htop

# Run
htop
```

**top (built-in):**
```bash
top
```

**Watch memory:**
```bash
watch -n 1 free -h
```

**Watch disk:**
```bash
watch -n 1 df -h
```

### Windows Task Manager

**Monitor WSL from Windows:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to Performance tab
3. Look for "WSL" section
4. Watch memory, CPU, and disk usage

---

## Recommended Workflow

### Starting Development

```bash
# 1. Check WSL resources
pnpm run check:wsl

# 2. Clean if needed
pnpm run clean

# 3. Start dev server
pnpm run dev:next

# 4. In another terminal (if needed)
pnpm run dev:sanity
```

### Running Builds

```bash
# 1. Check resources first
pnpm run check:wsl

# 2. Close unnecessary terminals/apps

# 3. Build sequentially (safest)
pnpm run build:sequential

# Or monitor parallel build
pnpm run build    # Watch htop in another terminal
```

### Running Tests

```bash
# 1. Don't run tests while dev server is building

# 2. Unit tests (lightweight)
pnpm run test:unit

# 3. E2E tests (resource intensive)
pnpm run test:e2e    # Close dev server first if WSL is limited
```

---

## Advanced Configuration

### Multiple WSL Distributions

If you have multiple WSL distributions, `.wslconfig` applies to all. For per-distribution settings, use `/etc/wsl.conf` inside WSL:

```bash
sudo nano /etc/wsl.conf
```

```ini
[boot]
systemd=true

[automount]
options="metadata,umask=22,fmask=11"
```

### Custom Swap Location

```ini
[wsl2]
swap=4GB
swapFile=D:\\wsl-swap.vhdx    # Use faster drive if available
```

### Network Configuration

```ini
[wsl2]
localhostForwarding=true
networkingMode=mirrored    # Windows 11 22H2+ only
```

---

## Resources

### Documentation
- [WSL Configuration Docs](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)
- [Turborepo Configuration](https://turbo.build/repo/docs/reference/configuration)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

### Project Files
- `WSL_DISCONNECTION_FIX_GUIDE.md` - Troubleshooting disconnections
- `.wslconfig.recommended` - Configuration template
- `.vscode/settings.json` - VS Code optimizations
- `turbo.json` - Turborepo configuration

### Scripts
- `pnpm run check:wsl` - Check WSL resource configuration
- `pnpm run clean` - Clean build artifacts
- `pnpm run build:sequential` - Safe sequential builds

---

## Getting Help

If you're still experiencing issues after following this guide:

1. **Run diagnostics:**
   ```bash
   pnpm run check:wsl > wsl-diagnostics.txt
   ```

2. **Check project issues:** Search for similar issues in GitHub Issues

3. **Gather information:**
   - WSL version: `wsl --version`
   - Node version: `node --version`
   - Memory during failure: `free -h`
   - Error messages from terminal

4. **Contact team:** Include diagnostics and error messages

---

**Last Updated**: 2025-01-01  
**Applies to**: WSL 2 on Windows 10 (19041+) or Windows 11  
**Maintained by**: Development Team
