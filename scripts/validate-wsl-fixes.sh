#!/bin/bash

# Validate WSL Fixes Script
# Purpose: Verify all WSL disconnection fixes are properly configured
# Usage: bash scripts/validate-wsl-fixes.sh

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WSL Fixes Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PASSED=0
FAILED=0

# Test 1: Check turbo.json exists and is valid
echo -e "${BLUE}Test 1: Validating turbo.json...${NC}"
if [ -f "turbo.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('turbo.json','utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓ turbo.json exists and is valid JSON${NC}"
        
        # Check for specific optimizations
        if grep -q '"daemon": false' turbo.json; then
            echo -e "${GREEN}  ✓ Daemon disabled${NC}"
        else
            echo -e "${YELLOW}  ⚠ Daemon not disabled${NC}"
        fi
        
        if grep -q '"ui": "stream"' turbo.json; then
            echo -e "${GREEN}  ✓ Stream UI configured${NC}"
        else
            echo -e "${YELLOW}  ⚠ Stream UI not configured${NC}"
        fi
        
        ((PASSED++))
    else
        echo -e "${RED}✗ turbo.json is invalid JSON${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ turbo.json not found${NC}"
    ((FAILED++))
fi
echo ""

# Test 2: Check .vscode/settings.json exists and is valid
echo -e "${BLUE}Test 2: Validating .vscode/settings.json...${NC}"
if [ -f ".vscode/settings.json" ]; then
    # Remove comments and validate JSON
    if node -e "const fs=require('fs'); const content=fs.readFileSync('.vscode/settings.json','utf8'); JSON.parse(content.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//gm,''))" 2>/dev/null; then
        echo -e "${GREEN}✓ .vscode/settings.json exists and is valid${NC}"
        
        # Check for specific optimizations
        if grep -q '"files.watcherExclude"' .vscode/settings.json; then
            echo -e "${GREEN}  ✓ File watcher exclusions configured${NC}"
        fi
        
        if grep -q '"git.autorefresh": false' .vscode/settings.json; then
            echo -e "${GREEN}  ✓ Git auto-refresh disabled${NC}"
        fi
        
        ((PASSED++))
    else
        echo -e "${RED}✗ .vscode/settings.json is invalid${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ .vscode/settings.json not found${NC}"
    ((FAILED++))
fi
echo ""

# Test 3: Check .wslconfig.recommended exists
echo -e "${BLUE}Test 3: Checking .wslconfig.recommended...${NC}"
if [ -f ".wslconfig.recommended" ]; then
    echo -e "${GREEN}✓ .wslconfig.recommended exists${NC}"
    
    # Check for key sections
    if grep -q '\[wsl2\]' .wslconfig.recommended; then
        echo -e "${GREEN}  ✓ [wsl2] section present${NC}"
    fi
    
    if grep -q 'memory=' .wslconfig.recommended; then
        echo -e "${GREEN}  ✓ Memory configuration present${NC}"
    fi
    
    if grep -q 'processors=' .wslconfig.recommended; then
        echo -e "${GREEN}  ✓ Processor configuration present${NC}"
    fi
    
    ((PASSED++))
else
    echo -e "${RED}✗ .wslconfig.recommended not found${NC}"
    ((FAILED++))
fi
echo ""

# Test 4: Check check-wsl-resources.sh exists and is executable
echo -e "${BLUE}Test 4: Checking check-wsl-resources.sh...${NC}"
if [ -f "scripts/check-wsl-resources.sh" ]; then
    if [ -x "scripts/check-wsl-resources.sh" ]; then
        echo -e "${GREEN}✓ scripts/check-wsl-resources.sh exists and is executable${NC}"
        
        # Validate script syntax
        if bash -n scripts/check-wsl-resources.sh 2>/dev/null; then
            echo -e "${GREEN}  ✓ Script syntax is valid${NC}"
        else
            echo -e "${RED}  ✗ Script has syntax errors${NC}"
            ((FAILED++))
        fi
        
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ scripts/check-wsl-resources.sh exists but is not executable${NC}"
        echo -e "${YELLOW}  Run: chmod +x scripts/check-wsl-resources.sh${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ scripts/check-wsl-resources.sh not found${NC}"
    ((FAILED++))
fi
echo ""

# Test 5: Check documentation files exist
echo -e "${BLUE}Test 5: Checking documentation files...${NC}"
DOC_PASSED=0
DOC_TOTAL=3

if [ -f "WSL_SETUP_GUIDE.md" ]; then
    echo -e "${GREEN}✓ WSL_SETUP_GUIDE.md exists${NC}"
    ((DOC_PASSED++))
else
    echo -e "${RED}✗ WSL_SETUP_GUIDE.md not found${NC}"
fi

if [ -f "WSL_DISCONNECTION_FIX_GUIDE.md" ]; then
    echo -e "${GREEN}✓ WSL_DISCONNECTION_FIX_GUIDE.md exists${NC}"
    
    # Check for Turborepo-specific content
    if grep -q "Turborepo" WSL_DISCONNECTION_FIX_GUIDE.md; then
        echo -e "${GREEN}  ✓ Contains Turborepo-specific fixes${NC}"
    fi
    
    ((DOC_PASSED++))
else
    echo -e "${RED}✗ WSL_DISCONNECTION_FIX_GUIDE.md not found${NC}"
fi

if [ -f "README.md" ]; then
    if grep -q "WSL_SETUP_GUIDE.md" README.md; then
        echo -e "${GREEN}✓ README.md references WSL_SETUP_GUIDE.md${NC}"
        ((DOC_PASSED++))
    else
        echo -e "${YELLOW}⚠ README.md doesn't reference WSL_SETUP_GUIDE.md${NC}"
    fi
else
    echo -e "${RED}✗ README.md not found${NC}"
fi

if [ $DOC_PASSED -eq $DOC_TOTAL ]; then
    ((PASSED++))
else
    ((FAILED++))
fi
echo ""

# Test 6: Check package.json scripts
echo -e "${BLUE}Test 6: Checking package.json scripts...${NC}"
if [ -f "package.json" ]; then
    if grep -q '"check:wsl"' package.json; then
        echo -e "${GREEN}✓ check:wsl script exists in package.json${NC}"
    else
        echo -e "${RED}✗ check:wsl script not found in package.json${NC}"
        ((FAILED++))
    fi
    
    if grep -q '"build:sequential"' package.json; then
        echo -e "${GREEN}✓ build:sequential script exists in package.json${NC}"
    else
        echo -e "${YELLOW}⚠ build:sequential script not found in package.json${NC}"
    fi
    
    ((PASSED++))
else
    echo -e "${RED}✗ package.json not found${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"

TOTAL=$((PASSED + FAILED))
echo -e "Tests Passed: ${GREEN}${PASSED}${NC} / ${TOTAL}"
echo -e "Tests Failed: ${RED}${FAILED}${NC} / ${TOTAL}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All WSL fixes are properly configured!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Follow WSL_SETUP_GUIDE.md to configure your Windows host"
    echo "  2. Run: bash scripts/check-wsl-resources.sh"
    echo "  3. Test with: pnpm run build:sequential"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
