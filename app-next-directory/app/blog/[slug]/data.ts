"use cache";
// Server helper to provide cached post data for Next.js 16 migration.
// Only async functions are exported from a `use cache` module to satisfy
// Turbopack / Next.js v16 constraints.

export async function getPostCached(slug: string) {
  // Keep cache settings internal to the async function (no exported consts).
  const CACHE_LIFE_SECONDS = 60; // adjust as needed
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';
  const url = `${base}/api/blog/${encodeURIComponent(slug)}`;

  const res = await fetch(url, {
    next: { revalidate: CACHE_LIFE_SECONDS, tags: [`post:${slug}`] },
  });

  if (res.status === 404) {
    const err: any = new Error('POST_NOT_FOUND');
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json as any;
}
