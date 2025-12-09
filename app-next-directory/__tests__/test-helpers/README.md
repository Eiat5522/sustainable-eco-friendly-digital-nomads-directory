# Testing Async Route Props in Next.js 16+

## Overview

Next.js 16 introduced a significant architectural change: `params` and `searchParams` are now **Promises** instead of plain objects. This affects how we write tests for page components.

## The Problem

In Next.js 15 and earlier:
```tsx
// ❌ Old way (Next.js 15 and earlier)
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>
}
```

In Next.js 16:
```tsx
// ✅ New way (Next.js 16+)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <h1>Post: {slug}</h1>
}
```

## Testing Pattern

### The Three-Step Pattern

When testing async page components, follow this pattern:

1. **Call the component** as an async function with Promise-wrapped mock data
2. **Await the result** to resolve the JSX
3. **Render** the resolved JSX using React Testing Library

### Example Test

```tsx
import { render, screen } from '@testing-library/react';
import UserProfilePage from '../app/users/[userId]/page';

describe('UserProfilePage', () => {
  it('renders the user profile with the correct ID', async () => {
    // 1. Call the component with Promise-wrapped mock data
    const element = await UserProfilePage({ 
      params: Promise.resolve({ userId: '456' }) 
    });

    // 2. Render the resolved JSX
    render(element);

    // 3. Assert
    expect(screen.getByRole('heading', { name: /User Profile for ID: 456/i }))
      .toBeInTheDocument();
  });
});
```

## Helper Functions

Use the helpers in `async-params.ts`:

```tsx
import { asyncParams, asyncSearchParams } from '@/__tests__/test-helpers/async-params';

// For params
const element = await MyPage({ params: asyncParams({ slug: 'test' }) });

// For searchParams
const element = await MyPage({ 
  searchParams: asyncSearchParams({ query: 'search term' }) 
});
```

## Common Patterns

### Testing with Both Params and SearchParams

```tsx
it('handles params and searchParams correctly', async () => {
  const element = await BlogPage({
    params: Promise.resolve({ slug: 'my-post' }),
    searchParams: Promise.resolve({ sort: 'desc', page: '2' })
  });
  
  render(element);
  
  expect(screen.getByText(/my-post/i)).toBeInTheDocument();
});
```

### Testing generateMetadata

```tsx
it('returns correct metadata', async () => {
  const metadata = await generateMetadata({
    params: Promise.resolve({ slug: 'test-post' })
  });
  
  expect(metadata).toEqual({
    title: 'Test Post',
    description: 'A test post'
  });
});
```

### Testing Client Components with React.use()

For client components that can't be async, use React's `use()` hook:

```tsx
'use client'
import { use } from 'react'

export default function ClientPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = use(params)
  return <h1>{slug}</h1>
}
```

## Migration Checklist

When updating tests for Next.js 16:

- [ ] Wrap `params` in `Promise.resolve()`
- [ ] Wrap `searchParams` in `Promise.resolve()`
- [ ] Await the page component call
- [ ] Render the awaited result
- [ ] Update `generateMetadata` tests similarly
- [ ] Test both authenticated and unauthenticated states if applicable

## Documentation References

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js Page Convention](https://nextjs.org/docs/app/api-reference/file-conventions/page)
- [React.use() Hook](https://react.dev/reference/react/use)
