# Example: Updating a Test File to Use generateAsyncValue

## Original Test File (Before)
**File:** `/app/__tests__/listings-slug-page.test.tsx` (lines 40, 56, 69, 104, 136)

```typescript
// Line 40 - BEFORE ❌
const element = await ListingPage({ params: { slug: 'banyan-tree-phuket' } });

// Line 56 - BEFORE ❌
await expect(ListingPage({ params: { slug: 'missing-slug' } })).rejects.toThrow('NEXT_NOT_FOUND');

// Line 69 - BEFORE ❌
const element = await ListingPage({ params: { slug: 'eco-stay-retreat' } });

// Line 104 - BEFORE ❌
const metadata = await pageModule.generateMetadata({
  params: { slug: 'meta-listing' },
} as any);

// Line 136 - BEFORE ❌
const metadata = await pageModule.generateMetadata({
  params: { slug: 'broken-listing' },
} as any);
```

## Updated Test File (After)
**File:** `/app/__tests__/listings-slug-page.test.tsx`

```typescript
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers'; // ← ADD THIS IMPORT

const notFoundMock = jest.fn(() => {
  const error = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
  error.digest = 'NEXT_NOT_FOUND';
  throw error;
});

jest.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

const listingContentMock = jest.fn(({ slug }: { slug: string }) => (
  <div data-testid="listing-content-stub">listing:{slug}</div>
));

jest.mock('../listings/[slug]/ListingContent', () => ({
  __esModule: true,
  default: (props: { slug: string }) => listingContentMock(props),
}));

const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

afterEach(() => {
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
  jest.clearAllMocks();
});

describe('ListingPage (wiring)', () => {
  it('renders the ListingContent stub for E2E fixtures', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    // Line 40 - AFTER ✅
    const element = await ListingPage({ 
      params: generateAsyncValue({ slug: 'banyan-tree-phuket' })
    });
    render(element);

    expect(screen.getByTestId('listing-content-stub')).toHaveTextContent('banyan-tree-phuket');
    expect(listingContentMock).toHaveBeenCalledWith({ slug: 'banyan-tree-phuket' });
  });

  it('bubbles notFound when ListingContent triggers it', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    listingContentMock.mockImplementationOnce(() => notFoundMock());

    const { default: ListingPage } = await import('../listings/[slug]/page');

    // Line 56 - AFTER ✅
    await expect(
      ListingPage({ params: generateAsyncValue({ slug: 'missing-slug' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('passes through non-E2E slugs to ListingContent', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    // Line 69 - AFTER ✅
    const element = await ListingPage({ 
      params: generateAsyncValue({ slug: 'eco-stay-retreat' })
    });
    render(element);

    expect(screen.getByTestId('listing-content-stub')).toHaveTextContent('eco-stay-retreat');
    expect(listingContentMock).toHaveBeenCalledWith({ slug: 'eco-stay-retreat' });
  });
});

describe('ListingPage metadata', () => {
  it('generates metadata for a listing', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, clientModule, transformerModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce({ _id: 'raw-listing' });
    transformToDetailDTO.mockReturnValue({
      id: 'listing-meta',
      name: 'Meta Listing',
      shortDescription: 'A great place to stay',
      longDescription: 'Long description about the listing',
      imageUrl: '/primary.jpg',
      galleryImages: ['/primary.jpg'],
      city: null,
    });

    // Line 104 - AFTER ✅
    const metadata = await pageModule.generateMetadata({
      params: generateAsyncValue({ slug: 'meta-listing' }),
    } as any);

    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Meta Listing',
        description: 'A great place to stay',
        openGraph: expect.objectContaining({ images: ['/primary.jpg'] }),
      })
    );
  });

  it('returns fallback metadata when listing transformation fails', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, clientModule, transformerModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce({ _id: 'raw-listing' });
    transformToDetailDTO.mockImplementation(() => {
      throw new Error('transform failure');
    });

    // Line 136 - AFTER ✅
    const metadata = await pageModule.generateMetadata({
      params: generateAsyncValue({ slug: 'broken-listing' }),
    } as any);

    expect(metadata).toEqual({ title: 'Listing not found' });
  });
});
```

## Summary of Changes

### 1. Added Import (Line 3)
```typescript
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';
```

### 2. Updated 5 Test Cases

| Line | Before | After |
|------|--------|-------|
| 40 | `params: { slug: 'banyan-tree-phuket' }` | `params: generateAsyncValue({ slug: 'banyan-tree-phuket' })` |
| 56 | `params: { slug: 'missing-slug' }` | `params: generateAsyncValue({ slug: 'missing-slug' })` |
| 69 | `params: { slug: 'eco-stay-retreat' }` | `params: generateAsyncValue({ slug: 'eco-stay-retreat' })` |
| 104 | `params: { slug: 'meta-listing' }` | `params: generateAsyncValue({ slug: 'meta-listing' })` |
| 136 | `params: { slug: 'broken-listing' }` | `params: generateAsyncValue({ slug: 'broken-listing' })` |

## Verification

After making these changes, run the test file:

```bash
npm test -- app/__tests__/listings-slug-page.test.tsx
```

Expected result: All tests should pass ✅

## Benefits of This Update

1. ✅ **Matches Next.js 16 Contract:** Tests now properly simulate async params
2. ✅ **Type Safety:** Full TypeScript support with generic type inference
3. ✅ **Consistency:** Same pattern used across all test files
4. ✅ **Readability:** Clear intent that params are asynchronous
5. ✅ **Future-Proof:** Prepared for Next.js 16+ requirements

## Next Files to Update

Using this same pattern, update:
1. `/app/listings/[slug]/__tests__/page.test.tsx` (9 occurrences)
2. `/app/cities/[slug]/page.test.tsx` (multiple occurrences)
3. `/app/__tests__/blog-slug-page.test.tsx` (multiple occurrences)
4. `/app/__tests__/cities-slug-page.test.tsx` (multiple occurrences)
5. And all other files listed in `ASYNC_MOCK_HELPERS_IMPLEMENTATION_GUIDE.md`
