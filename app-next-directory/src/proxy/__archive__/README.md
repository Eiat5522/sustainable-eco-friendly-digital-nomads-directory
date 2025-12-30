# Archived Proxy Files

This directory contains archived proxy-related files that were consolidated during the Next.js 16 migration.

## What was consolidated?

During the Next.js 16 upgrade, we had duplicate proxy implementations:
- Root `/proxy.ts` - Active, up-to-date implementation with tokenVersion validation
- `/src/proxy.ts` - Wrapper that re-exported from `./proxy/index.ts`
- `/src/proxy/index.ts` - Alternative implementation using ACCESS_CONTROL_MATRIX

## Why were files archived?

According to Next.js 16 documentation:
> The proxy file must exist at the project root OR inside src (not both)
> When both exist, Next.js uses the root proxy.ts

Since we had both, and the root implementation was actively used and more up-to-date, we:
1. Kept `/proxy.ts` as the single source of truth
2. Archived the unused `src/proxy/index.ts` and wrapper `src/proxy.ts`
3. Archived the test file that was testing the unused implementation

## What remains active?

- **Active Proxy:** `/proxy.ts` (root level)
- **Utility Functions:** Files in `/src/proxy/` directory:
  - `authCallbackHandler.ts` - Auth callback URL decoder
  - `cache.ts` - Cache middleware utilities  
  - `server-timing.ts` - Server timing metrics
  - `session.ts` - Session middleware

## Files in this archive:

- `index.ts.backup` - Alternative proxy implementation (unused)
- `main-middleware.test.ts.backup` - Tests for the archived implementation

## Date Archived

December 30, 2025

## Related Issue

Consolidation of duplicate proxy files after Next.js 16 upgrade.
