# Change: Add static homepage caching with tag revalidation

## Why
The homepage should be fully static with long-lived caching and tag-based revalidation so it
prefetches quickly while still allowing on-demand updates from CMS changes.

## What Changes
- Add static cache directives for the homepage route using `use cache` plus cache lifetime/tagging.
- Ensure the homepage remains eligible for full route cache by removing dynamic flags and APIs.
- Add a webhook-triggered revalidation handler that calls `revalidateTag('home')`.

## Impact
- Affected specs: homepage-cache
- Affected code: `app-next-directory/src/app/page.tsx`,
  `app-next-directory/src/app/api/**` or server actions for revalidation.
