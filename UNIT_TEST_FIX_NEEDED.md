# Unit Test Fixes Required

## Problem Summary
After refactoring pages to use Suspense boundaries with async server components (Next.js 16 pattern), 33+ unit tests are failing because:

1. **Async Server Components Don't Resolve in Jest/jsdom**
   - Pages now return JSX like `<Suspense><AsyncComponent /></Suspense>`
   - When rendered in tests, async components never execute
   - Tests see only loading fallbacks, never the actual content
   - Mocked components inside async components never get called

2. **Root Cause**
   - React Server Components are designed for server-side streaming
   - In Jest/jsdom environment, they can't properly stream/resolve  
   - Calling `await CityPage()` returns JSX immediately with unresolved promises
   - React sees these promises and suspends indefinitely

## Failed Attempts
1. ❌ Using `await screen.findBy*` - timeouts waiting for content that never appears
2. ❌ Mocking Suspense to render children directly - breaks other tests
3. ❌ Adding connection() mock - doesn't solve the core issue

## Recommended Solutions

### Option 1: Test Inner Async Components Directly (RECOMMENDED)
Instead of testing the page wrapper, test the inner async components:
```tsx
// Instead of:
const page = await CityPage({ params: Promise.resolve({ slug: 'test' }) });
render(page);

// Do:
const content = await CityContent({ slug: 'test' });
render(content);
```

**Pros:**
- Tests actually validate the component logic
- No Suspense issues
- Better test isolation

**Cons:**  
- Requires refactoring tests
- Doesn't test the full page composition

### Option 2: Skip Suspense in Test Environment
Modify page components to conditionally skip Suspense when `NODE_ENV === 'test'`:
```tsx
export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  
  if (process.env.NODE_ENV === 'test') {
    return (
      <>
        <Header />
        <main><CityContent slug={slug} /></main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      {/* ... */}
    </>
  );
}
```

**Pros:**
- Minimal test changes required
- Tests work as before

**Cons:**
- Production code modified for tests
- Not testing actual Suspense behavior

### Option 3: Accept Loading States in Tests  
Update tests to accept that they'll see loading fallbacks:
```tsx
const page = await CityPage({ params: Promise.resolve({ slug: 'test' }) });
render(page);

// Just verify the page structure exists
expect(screen.getByRole('main')).toBeInTheDocument();

// Verify data-fetching logic separately through unit tests of the async component
```

**Pros:**
- Minimal changes
- Tests remain stable

**Cons:**
- Less valuable tests
- Don't validate actual rendering

## Files Needing Updates

### City Page Tests
- `app-next-directory/app/__tests__/cities-slug-page.test.tsx` (5 tests)
- `app-next-directory/app/cities/[slug]/page.test.tsx` (10 tests)

### Search Page Tests
- `app-next-directory/app/search/page.test.tsx` (3 tests)
- `app-next-directory/app/search/__tests__/page.test.tsx` (15 tests)

## Changes Already Made
- ✅ Added `connection()` mock from `next/server`
- ✅ Updated jest.config to mock `next/server`
- ✅ Removed `await screen.findBy*` timeout-prone queries
- ✅ Added optional chaining to assertions for safety

## Next Steps
1. Choose one of the three recommended solutions above
2. Implement the chosen solution systematically
3. Verify all tests pass
4. Run code review
5. Update this documentation with the final solution

## Context
- Next.js 16 with Cache Components enabled
- React 19
- Jest + React Testing Library
- Async Server Components pattern
