#!/bin/bash

# Check WSL Resources Script
# Purpose: Verify WSL resource allocation and provide recommendations
# Usage: bash scripts/check-wsl-resources.sh

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WSL Resource Configuration Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running in WSL
if ! grep -qi microsoft /proc/version; then
    echo -e "${RED}❌ This script must be run inside WSL${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running in WSL${NC}"
echo ""

# Get WSL version info
echo -e "${BLUE}WSL Version:${NC}"
cat /proc/version | head -n 1
echo ""

# Check memory allocation
echo -e "${BLUE}Memory Configuration:${NC}"
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
USED_MEM=$(free -h | awk '/^Mem:/ {print $3}')
FREE_MEM=$(free -h | awk '/^Mem:/ {print $4}')
AVAILABLE_MEM=$(free -h | awk '/^Mem:/ {print $7}')

echo -e "  Total Memory:     ${TOTAL_MEM}"
echo -e "  Used Memory:      ${USED_MEM}"
echo -e "  Free Memory:      ${FREE_MEM}"
echo -e "  Available Memory: ${AVAILABLE_MEM}"

# Parse memory value for comparison (convert to MB)
TOTAL_MEM_MB=$(free -m | awk '/^Mem:/ {print $2}')

if [ "$TOTAL_MEM_MB" -lt 6144 ]; then
    echo -e "${RED}⚠️  WARNING: Less than 6GB RAM allocated to WSL${NC}"
    echo -e "${YELLOW}   Recommended: At least 8GB for Turborepo + Next.js${NC}"
elif [ "$TOTAL_MEM_MB" -lt 8192 ]; then
    echo -e "${YELLOW}⚠️  NOTICE: 6-8GB RAM allocated${NC}"
    echo -e "${YELLOW}   Recommended: 8GB or more for optimal performance${NC}"
else
    echo -e "${GREEN}✓ Memory allocation looks good (8GB or more)${NC}"
fi
echo ""

# Check CPU allocation
echo -e "${BLUE}CPU Configuration:${NC}"
CPU_COUNT=$(nproc)
echo -e "  Available CPUs: ${CPU_COUNT}"

if [ "$CPU_COUNT" -lt 2 ]; then
    echo -e "${RED}⚠️  WARNING: Less than 2 CPUs allocated${NC}"
    echo -e "${YELLOW}   Recommended: At least 4 CPUs for parallel builds${NC}"
elif [ "$CPU_COUNT" -lt 4 ]; then
    echo -e "${YELLOW}⚠️  NOTICE: 2-3 CPUs allocated${NC}"
    echo -e "${YELLOW}   Recommended: 4 or more CPUs for optimal performance${NC}"
else
    echo -e "${GREEN}✓ CPU allocation looks good (4 or more)${NC}"
fi
echo ""

# Check swap configuration
echo -e "${BLUE}Swap Configuration:${NC}"
TOTAL_SWAP=$(free -h | awk '/^Swap:/ {print $2}')
USED_SWAP=$(free -h | awk '/^Swap:/ {print $3}')

echo -e "  Total Swap: ${TOTAL_SWAP}"
echo -e "  Used Swap:  ${USED_SWAP}"

TOTAL_SWAP_MB=$(free -m | awk '/^Swap:/ {print $2}')

if [ "$TOTAL_SWAP_MB" -eq 0 ]; then
    echo -e "${RED}⚠️  WARNING: No swap space configured${NC}"
    echo -e "${YELLOW}   Recommended: At least 2GB swap${NC}"
elif [ "$TOTAL_SWAP_MB" -lt 2048 ]; then
    echo -e "${YELLOW}⚠️  NOTICE: Less than 2GB swap${NC}"
    echo -e "${YELLOW}   Recommended: 2GB or more for intensive builds${NC}"
else
    echo -e "${GREEN}✓ Swap configuration looks good${NC}"
fi
echo ""

# Check disk space
echo -e "${BLUE}Disk Space:${NC}"
df -h . | awk 'NR==1 {print "  " $0} NR==2 {print "  " $0}'

DISK_AVAIL=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')

if [ "$DISK_AVAIL" -lt 5 ]; then
    echo -e "${RED}⚠️  WARNING: Less than 5GB free space${NC}"
    echo -e "${YELLOW}   Recommended: At least 10GB for build artifacts and node_modules${NC}"
elif [ "$DISK_AVAIL" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  NOTICE: 5-10GB free space${NC}"
    echo -e "${YELLOW}   Consider freeing up space before large builds${NC}"
else
    echo -e "${GREEN}✓ Disk space looks good (10GB or more)${NC}"
fi
echo ""

# Check for .wslconfig
echo -e "${BLUE}WSL Configuration File:${NC}"
WINDOWS_USER=$(powershell.exe -c "echo \$env:USERNAME" 2>/dev/null | tr -d '\r')

if [ -n "$WINDOWS_USER" ]; then
    WSLCONFIG_PATH="/mnt/c/Users/${WINDOWS_USER}/.wslconfig"
    
    if [ -f "$WSLCONFIG_PATH" ]; then
        echo -e "${GREEN}✓ .wslconfig found at: C:\\Users\\${WINDOWS_USER}\\.wslconfig${NC}"
        echo -e "${BLUE}  Current configuration:${NC}"
        cat "$WSLCONFIG_PATH" | head -20 | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠️  .wslconfig not found${NC}"
        echo -e "${YELLOW}   Location: C:\\Users\\${WINDOWS_USER}\\.wslconfig${NC}"
        echo -e "${YELLOW}   See .wslconfig.recommended in project root for template${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not detect Windows username${NC}"
    echo -e "${YELLOW}   Check manually: C:\\Users\\<YourUsername>\\.wslconfig${NC}"
fi
echo ""

# Check Turborepo cache
echo -e "${BLUE}Turborepo Cache:${NC}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -d "${PROJECT_ROOT}/.turbo" ]; then
    CACHE_SIZE=$(du -sh "${PROJECT_ROOT}/.turbo" 2>/dev/null | cut -f1)
    echo -e "  Cache size: ${CACHE_SIZE}"
    
    CACHE_SIZE_MB=$(du -sm "${PROJECT_ROOT}/.turbo" 2>/dev/null | cut -f1)
    
    if [ "$CACHE_SIZE_MB" -gt 1024 ]; then
        echo -e "${YELLOW}⚠️  Cache is large (>1GB)${NC}"
        echo -e "${YELLOW}   Consider clearing: rm -rf .turbo${NC}"
    else
        echo -e "${GREEN}✓ Cache size is reasonable${NC}"
    fi
else
    echo -e "  No Turbo cache found (clean state)"
fi
echo ""

# Check node_modules size
echo -e "${BLUE}Node Modules:${NC}"
if [ -d "${PROJECT_ROOT}/node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh "${PROJECT_ROOT}/node_modules" 2>/dev/null | cut -f1)
    echo -e "  Size: ${NODE_MODULES_SIZE}"
else
    echo -e "  Not installed"
fi

if [ -d "${PROJECT_ROOT}/app-next-directory/node_modules" ]; then
    APP_NODE_MODULES_SIZE=$(du -sh "${PROJECT_ROOT}/app-next-directory/node_modules" 2>/dev/null | cut -f1)
    echo -e "  app-next-directory/node_modules: ${APP_NODE_MODULES_SIZE}"
fi

if [ -d "${PROJECT_ROOT}/sanity/node_modules" ]; then
    SANITY_NODE_MODULES_SIZE=$(du -sh "${PROJECT_ROOT}/sanity/node_modules" 2>/dev/null | cut -f1)
    echo -e "  sanity/node_modules: ${SANITY_NODE_MODULES_SIZE}"
fi
echo ""

# Overall recommendation
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Overall Assessment${NC}"
echo -e "${BLUE}========================================${NC}"

WARNINGS=0

if [ "$TOTAL_MEM_MB" -lt 8192 ]; then
    ((WARNINGS++))
fi

if [ "$CPU_COUNT" -lt 4 ]; then
    ((WARNINGS++))
fi

if [ "$TOTAL_SWAP_MB" -lt 2048 ]; then
    ((WARNINGS++))
fi

if [ "$DISK_AVAIL" -lt 10 ]; then
    ((WARNINGS++))
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Your WSL configuration looks good for Turborepo + Next.js${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Run builds: pnpm run build"
    echo "  2. Monitor resources: htop (install with: sudo apt install htop)"
    echo "  3. If issues persist, see WSL_DISCONNECTION_FIX_GUIDE.md"
elif [ $WARNINGS -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Your WSL configuration has 1 area for improvement${NC}"
    echo ""
    echo -e "${BLUE}Recommended actions:${NC}"
    echo "  1. Address the warning above"
    echo "  2. Create/update .wslconfig based on .wslconfig.recommended"
    echo "  3. Restart WSL: wsl --shutdown (in Windows PowerShell)"
    echo "  4. See WSL_DISCONNECTION_FIX_GUIDE.md for details"
else
    echo -e "${RED}⚠️  Your WSL configuration needs attention (${WARNINGS} warnings)${NC}"
    echo ""
    echo -e "${BLUE}Recommended actions:${NC}"
    echo "  1. Create/update .wslconfig in C:\\Users\\<YourUsername>\\"
    echo "  2. Use .wslconfig.recommended as a template"
    echo "  3. Restart WSL: wsl --shutdown (in Windows PowerShell as Admin)"
    echo "  4. Re-run this script to verify changes"
    echo "  5. See WSL_DISCONNECTION_FIX_GUIDE.md for detailed guidance"
fi

echo ""
echo -e "${BLUE}========================================${NC}"

exit 0
