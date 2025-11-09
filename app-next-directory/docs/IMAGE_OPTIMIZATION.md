# Image Optimisation Overview

## Summary

Image performance is now handled entirely within the JavaScript stack:

- **Sanity CDN** automatically transforms assets that are uploaded through Sanity
  Studio or the Upload API.
- **Next.js `next/image`** components consume the optimised CDN assets at render
  time, giving responsive sizing, modern formats, and lazy loading out of the box.
- **No Python tooling** is required. The legacy migration scripts have been
  removed and the upload pipeline now behaves as a lightweight pass-through.

## Runtime Components

1. **`src/lib/image-optimizer.ts`**
   - Maintains the historical interface that the upload route expects.
   - Reports the original file size for observability and signals that no extra
     optimisation was performed.
   - Keeps the system extensible if server-side processing is reintroduced in
     the future.

2. **`app/api/upload/route.ts`**
   - Authenticates venue owners and accepts multipart uploads.
  - Relies on Sanity's CDN to deliver optimised assets, defaulting to the
    original file when no transformations are applied.
  - Returns optimisation metadata (currently indicating that optimisation was
    skipped) for client-side visibility.

## Removing Legacy Tooling

All Python utilities that previously wrapped Pillow (e.g.
`batch_optimize_images.py`, migration helpers, and their associated tests) have
been deleted. The project no longer ships a `requirements.txt` because there are
no Python dependencies to install.

If you encounter references to the old tooling in archived documentation,
consider them historical notes rather than actionable instructions.

## Testing

Use the existing JavaScript tooling to validate the upload pipeline:

```bash
pnpm test:unit -- src/lib/__tests__/image-optimizer
pnpm test:unit -- app/api/upload
```

Both suites mock Sanity interactions and confirm that the upload route handles
optimisation metadata gracefully when no transformation occurs.
