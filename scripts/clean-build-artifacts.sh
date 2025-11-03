#!/bin/bash

# Clean Build Artifacts Script
# Purpose: Remove corrupted or conflicting build artifacts that can cause worker module errors
# in Next.js 15.5.0 development server
#
# Usage: 
#   ./scripts/clean-build-artifacts.sh
#   or
#   bash scripts/clean-build-artifacts.sh

# Don't use set -e because we want to continue even if some directories don't exist
# set -e would exit on the first failed rm command

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${PROJECT_ROOT}/app-next-directory"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next.js Build Artifacts Cleanup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to safely remove directory
safe_remove() {
    local dir_path="$1"
    local dir_name="$(basename "$dir_path")"
    
    if [ -d "$dir_path" ]; then
        echo -e "${YELLOW}Removing: ${dir_path}${NC}"
        rm -rf "$dir_path"
        echo -e "${GREEN}✓ Removed ${dir_name}${NC}"
        return 0
    else
        echo -e "  ${dir_name} not found (already clean)"
        return 1
    fi
}

# Track what was cleaned
CLEANED_COUNT=0

echo "Cleaning build artifacts in: ${APP_DIR}"
echo ""

# Navigate to app directory
cd "${APP_DIR}"

# Remove .next directory (Next.js build output)
echo -e "${BLUE}1. Checking .next directory...${NC}"
if safe_remove ".next"; then
    ((CLEANED_COUNT++))
fi
echo ""

# Remove dist/server directory (custom build output with worker modules)
echo -e "${BLUE}2. Checking dist/server directory...${NC}"
if safe_remove "dist/server"; then
    ((CLEANED_COUNT++))
fi
echo ""

# Remove dist/client directory (custom client build output)
echo -e "${BLUE}3. Checking dist/client directory...${NC}"
if safe_remove "dist/client"; then
    ((CLEANED_COUNT++))
fi
echo ""

# Remove .turbo directory (Turbopack cache)
echo -e "${BLUE}4. Checking .turbo directory...${NC}"
if safe_remove ".turbo"; then
    ((CLEANED_COUNT++))
fi
echo ""

# Remove node_modules/.cache (various tool caches)
echo -e "${BLUE}5. Checking node_modules/.cache directory...${NC}"
if safe_remove "node_modules/.cache"; then
    ((CLEANED_COUNT++))
fi
echo ""

# Keep dist/types as it's needed for TypeScript type generation
echo -e "${BLUE}6. Preserving dist/types directory...${NC}"
if [ -d "dist/types" ]; then
    echo -e "${GREEN}✓ dist/types preserved (needed for TypeScript)${NC}"
else
    echo -e "  dist/types not found"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cleanup Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $CLEANED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Cleaned ${CLEANED_COUNT} artifact(s)${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Start the dev server: npm run dev (or pnpm dev)"
    echo "  2. Monitor for worker module errors"
    echo "  3. If issues persist, try alternative solutions in docs/reference/WSL_DISCONNECTION_FIX_GUIDE.md"
else
    echo -e "${GREEN}✓ No artifacts to clean - environment is already clean${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"

exit 0
