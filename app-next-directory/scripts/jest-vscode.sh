#!/bin/bash
# VS Code Jest Extension Wrapper Script
# This script filters out temporary files and reporter arguments that the VS Code extension passes

# Filter out VS Code extension specific arguments
FILTERED_ARGS=()
for arg in "$@"; do
    case "$arg" in
        # Skip temporary files
        /tmp/jest_runner_*.json) ;;
        # Skip VS Code reporter paths
        */reporter.js) ;;
        # Skip 'default' argument
        default) ;;
        # Keep everything else
        *) FILTERED_ARGS+=("$arg") ;;
    esac
done
# Validate that pnpm and test:unit script exist
if ! command -v pnpm >/dev/null 2>&1; then
    echo "Error: pnpm is not installed or not in PATH" >&2
    exit 1
fi

# Check if package.json exists and has test:unit script
if [[ ! -f "package.json" ]] || ! pnpm run | grep -q "test:unit"; then
    echo "Error: test:unit script not found in package.json" >&2
    exit 1
fi

# Use npm to run the test command with filtered arguments
exec pnpm test:unit -- "${FILTERED_ARGS[@]}"