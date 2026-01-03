import { revalidatePath, revalidateTag } from 'next/cache';

type RevalidateTagFn = typeof revalidateTag;

export type SanityWebhookPayload = {
  _type?: string;
  type?: string;
  document?: { _type?: string; slug?: { current?: string } };
  ids?: { created?: string[]; updated?: string[]; deleted?: string[] };
};

const SANITY_TAGS_BY_TYPE: Record<string, string[]> = {
  listing: ['featured-listings'],
  city: ['cities'],
  category: ['categories'],
  ecoTag: ['eco-tags'],
};

export const ALLOWED_REVALIDATION_TAGS = new Set([
  'featured-listings',
  'cities',
  'categories',
  'eco-tags',
  'home',
]);

export const TAG_PATTERN = /^[a-z0-9:-]+$/i;

export const REVALIDATE_ALL_ROUTES = ['/', '/listings', '/category', '/city'];

export const resolveSanityRevalidationTargets = (payload: SanityWebhookPayload | null) => {
  const docType = payload?._type ?? payload?.document?._type ?? payload?.type ?? null;
  const tags = new Set<string>(['home']);

  if (docType && SANITY_TAGS_BY_TYPE[docType]) {
    SANITY_TAGS_BY_TYPE[docType].forEach(tag => tags.add(tag));
    // If the payload contains a document with a slug, include a fine-grained
    // per-resource tag (e.g., `city:slug` or `category:slug`) so the webhook
    // can invalidate the specific resource without touching unrelated tags.
    const docSlug = payload?.document?.slug?.current;
    if (typeof docSlug === 'string' && docSlug.length > 0) {
     if (!TAG_PATTERN.test(`${docType}:${docSlug}`)) {
       // Skip invalid slugs or log a warning
       return;
     }
      if (docType === 'city') tags.add(`city:${docSlug}`);
      if (docType === 'category') tags.add(`category:${docSlug}`);
    }
  }

  const listingSlugs: string[] = [];
  if (docType === 'listing') {
    const docSlug = payload?.document?.slug?.current;
    if (typeof docSlug === 'string' && docSlug.length > 0) listingSlugs.push(docSlug);
    const ids = [
      ...(payload?.ids?.created ?? []),
      ...(payload?.ids?.updated ?? []),
      ...(payload?.ids?.deleted ?? []),
    ];
    for (const idOrSlug of ids) {
      if (typeof idOrSlug === 'string' && idOrSlug.length > 0) listingSlugs.push(idOrSlug);
    }
  }

  return {
    docType,
    tags: Array.from(tags),
    listingSlugs: Array.from(new Set(listingSlugs)),
  };
};

export const revalidateTags = (
  tags: string[],
  listingSlugs: string[],
  revalidateTagFn: RevalidateTagFn = revalidateTag
) => {
  tags.forEach(tag => revalidateTagFn(tag, 'max'));
  for (const slug of listingSlugs) {
    try {
      revalidateTagFn(`listing-${slug}`, 'max');
    } catch {}
  }
};

export const revalidatePaths = (
  paths: string[],
  revalidatePathFn: (path: string) => void = revalidatePath
) => {
  for (const path of paths) {
    revalidatePathFn(path);
  }
};
