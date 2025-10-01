# Scripts Directory

This directory contains utility scripts for maintaining and troubleshooting the project.

## Available Scripts

### clean-build-artifacts.sh

**Purpose**: Remove corrupted or conflicting build artifacts that can cause Next.js worker module errors and WSL disconnection issues.

**Usage**:
```bash
# From project root
bash ./scripts/clean-build-artifacts.sh

# Or use npm script
npm run clean

# From app-next-directory
npm run clean
```

**What it does**:
- Removes `.next/` directory (Next.js build cache)
- Removes `dist/server/` directory (server-side worker modules)
- Removes `dist/client/` directory (client-side build artifacts)
- Removes `.turbo/` directory (Turbopack cache)
- Removes `node_modules/.cache/` directory (various tool caches)
- **Preserves** `dist/types/` directory (TypeScript type definitions)

**When to use**:
- When dev server crashes with worker module errors
- When WSL disconnects during development
- After switching branches with significant changes
- After upgrading Next.js or major dependencies
- When experiencing build or compilation issues

**Safe to run**: Yes, this script only removes cache and build artifacts. Your source code and configuration files are never touched.

## Related Documentation

- **WSL Disconnection Fix Guide**: `../WSL_DISCONNECTION_FIX_GUIDE.md` - Complete troubleshooting guide
- **Next.js Config**: `../app-next-directory/next.config.mjs` - Next.js configuration
- **Package Scripts**: Check `package.json` files for additional cleanup and development scripts

## Adding New Scripts

When adding new utility scripts to this directory:

1. **Make it executable**: `chmod +x scripts/your-script.sh`
2. **Add usage documentation**: Update this README with script details
3. **Add npm scripts**: Add convenience shortcuts to `package.json` if appropriate
4. **Test thoroughly**: Ensure scripts work in both development and CI environments
5. **Follow naming conventions**: Use kebab-case for script names

## Script Standards

All scripts in this directory should:
- Include a header comment explaining purpose and usage
- Use `#!/bin/bash` shebang for shell scripts
- Have error handling (check for required files/directories)
- Provide clear output messages
- Exit with appropriate exit codes (0 for success, non-zero for errors)
- Be safe to run multiple times (idempotent)
