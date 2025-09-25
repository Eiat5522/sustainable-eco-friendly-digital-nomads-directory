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

# Use npm to run the test command with filtered arguments
exec npm run test:unit -- "${FILTERED_ARGS[@]}"