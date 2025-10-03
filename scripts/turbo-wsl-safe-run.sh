#!/bin/bash
# Turborepo helper for WSL environments
# Ensures Turborepo tasks run with conservative defaults so VS Code/WSL stays connected.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  cat <<'USAGE'
Usage: scripts/turbo-wsl-safe-run.sh <turbo arguments>

Examples:
  scripts/turbo-wsl-safe-run.sh build
  scripts/turbo-wsl-safe-run.sh lint test --filter=app-next-directory

This wrapper enforces WSL-friendly defaults:
  - Disables the Turborepo background daemon
  - Caps concurrency (defaults to 2, override with TURBO_CONCURRENCY)
  - Turns off telemetry to save resources

All additional arguments are forwarded to `turbo run`.
USAGE
  exit 1
fi

# Provide friendly notice on first run.
if [[ -z "${TURBO_WSL_HELPER_SILENT:-}" ]]; then
  echo "[turbo-wsl] Launching Turborepo with WSL-safe defaults..."
  echo "[turbo-wsl] Override defaults by exporting TURBO_CONCURRENCY or TURBO_WSL_HELPER_SILENT=1."
fi

# Disable the Turborepo daemon which can keep background processes alive and
# destabilise the VS Code <-> WSL connection when multiple tasks are running.
export TURBO_NO_DAEMON=1

# Telemetry can create additional subprocesses; disable it to keep resource usage low.
export TURBO_TELEMETRY_DISABLED=${TURBO_TELEMETRY_DISABLED:-1}

# Default concurrency to 2 (or 1 on machines with <=2 processors) unless caller overrides it.
if [[ -z "${TURBO_CONCURRENCY:-}" ]]; then
  cpu_count=2
  if command -v nproc >/dev/null 2>&1; then
    cpu_count=$(nproc)
  fi

  if (( cpu_count <= 2 )); then
    export TURBO_CONCURRENCY=1
  else
    export TURBO_CONCURRENCY=2
  fi
fi

# Instruct Turborepo to reuse local cache only to avoid remote network spikes.
export TURBO_REMOTE_ONLY=${TURBO_REMOTE_ONLY:-false}

# Ensure pnpm binary is preferred if available to share the same lockfile tooling.
if command -v pnpm >/dev/null 2>&1; then
  exec pnpm turbo run "$@"
fi

# Fallback to npx when pnpm is not available in PATH.
if command -v npx >/dev/null 2>&1; then
  exec npx turbo run "$@"
fi

echo "Error: Neither pnpm nor npx is available to execute Turborepo." >&2
exit 127
