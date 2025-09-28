#!/usr/bin/env bash
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
# Check if package.json exists and exposes a test:unit script
if [[ ! -f "package.json" ]] || ! node -e 'try { const { scripts } = require("./package.json"); process.exit(scripts && Object.prototype.hasOwnProperty.call(scripts, "test:unit") ? 0 : 1); } catch (err) { process.exit(1); }'; then
    echo "Error: test:unit script not found in package.json" >&2
    exit 1
fi

# Use pnpm to run the test command with filtered arguments
exec pnpm test:unit -- "${FILTERED_ARGS[@]}"