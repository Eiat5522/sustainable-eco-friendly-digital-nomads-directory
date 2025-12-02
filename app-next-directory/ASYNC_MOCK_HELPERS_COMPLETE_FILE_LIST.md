# Complete File List: Async Mock Helpers Implementation

This document provides a comprehensive, line-by-line breakdown of every file that needs to be updated to use the `generateAsyncValue` helper function.

## 📦 Helper Function

**Location:** `/src/test-helpers/async-mock-helpers.ts`

```typescript
export async function generateAsyncValue<T>(value: T): Promise<T> {
  return value;
}
```

**Import Statement:**
```typescript
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';
```

---

## 📋 Files Requiring Updates (Detailed)

### Category 1: Page Component Tests with `params`

#### 1.1 `/app/listings/[slug]/__tests__/page.test.tsx`

**Total Updates:** 9 occurrences

| Line | Current Code | Updated Code |
|------|--------------|--------------|
| 101 | `params: { slug: 'banyan-tree-phuket' }` | `params: generateAsyncValue({ slug: 'banyan-tree-phuket' })` |
| 120 | `params: { slug: 'unknown-fixture' }` | `params: generateAsyncValue({ slug: 'unknown-fixture' })` |
| 130 | `params: { slug: 'not-a-real-slug' }` | `params: generateAsyncValue({ slug: 'not-a-real-slug' })` |
| 191 | `params: { slug: 'eco-retreat' }` | `params: generateAsyncValue({ slug: 'eco-retreat' })` |
| 221 | `params: { slug: 'broken-listing' }` | `params: generateAsyncValue({ slug: 'broken-listing' })` |
| 233 | `params: { slug: 'missing' }` | `params: generateAsyncValue({ slug: 'missing' })` |
| 251 | `params: { slug: 'ocean-escape' }` | `params: generateAsyncValue({ slug: 'ocean-escape' })` |
| 288 | `params: { slug: 'mountain-base' }` | `params: generateAsyncValue({ slug: 'mountain-base' })` |

**Additional:** Check `generateMetadata` calls (lines 232-234, 250-252)

---

#### 1.2 `/app/__tests__/listings-slug-page.test.tsx`

**Total Updates:** 5 occurrences

| Line | Current Code | Updated Code |
|------|--------------|--------------|
| 40 | `params: { slug: 'banyan-tree-phuket' }` | `params: generateAsyncValue({ slug: 'banyan-tree-phuket' })` |
| 56 | `params: { slug: 'missing-slug' }` | `params: generateAsyncValue({ slug: 'missing-slug' })` |
| 69 | `params: { slug: 'eco-stay-retreat' }` | `params: generateAsyncValue({ slug: 'eco-stay-retreat' })` |
| 104 | `params: { slug: 'meta-listing' }` | `params: generateAsyncValue({ slug: 'meta-listing' })` |
| 136 | `params: { slug: 'broken-listing' }` | `params: generateAsyncValue({ slug: 'broken-listing' })` |

---

#### 1.3 `/app/city/[slug]/__tests__/page.test.tsx`

**Total Updates:** 1 occurrence

| Line | Current Code | Updated Code |
|------|--------------|--------------|
| 24 | `params: { slug: 'barcelona' }` | `params: generateAsyncValue({ slug: 'barcelona' })` |

---

#### 1.4 `/app/cities/[slug]/page.test.tsx`

**Action Required:** Review file to identify all occurrences of `params: { slug: ... }`

**Expected Pattern:**
```typescript
// Before
params: { slug: 'city-name' }

// After
params: generateAsyncValue({ slug: 'city-name' })
```

---

#### 1.5 `/app/__tests__/cities-slug-page.test.tsx`

**Action Required:** Review file to identify all occurrences of `params: { slug: ... }`

**Expected Pattern:**
```typescript
// Before
params: { slug: 'city-name' }

// After
params: generateAsyncValue({ slug: 'city-name' })
```

---

#### 1.6 `/app/__tests__/blog-slug-page.test.tsx`

**Action Required:** Review file to identify all occurrences of `params: { slug: ... }`

**Expected Pattern:**
```typescript
// Before
params: { slug: 'blog-post-slug' }

// After
params: generateAsyncValue({ slug: 'blog-post-slug' })
```

---

### Category 2: Page Component Tests with `searchParams`

#### 2.1 `/app/search/results/page.test.tsx`

**Total Updates:** 6+ occurrences (currently using `Promise.resolve()`)

| Line | Current Code | Updated Code |
|------|--------------|--------------|
| 78 | `searchParams: Promise.resolve({ city: 'lisbon' })` | `searchParams: generateAsyncValue({ city: 'lisbon' })` |
| 115 | `searchParams: Promise.resolve({ retry: '2' })` | `searchParams: generateAsyncValue({ retry: '2' })` |
| 144 | `searchParams: Promise.resolve({})` | `searchParams: generateAsyncValue({})` |
| 178 | `searchParams: Promise.resolve({ city: 'lisbon', tags: ['wifi', 'vegan'], page: '2', limit: '24' })` | `searchParams: generateAsyncValue({ city: 'lisbon', tags: ['wifi', 'vegan'], page: '2', limit: '24' })` |
| 252 | `searchParams: Promise.resolve({})` | `searchParams: generateAsyncValue({})` |
| 269 | `searchParams: Promise.resolve({ retry: 'invalid' })` | `searchParams: generateAsyncValue({ retry: 'invalid' })` |
| 285 | `searchParams: Promise.resolve({})` | `searchParams: generateAsyncValue({})` |

**Note:** This file already uses the async pattern with `Promise.resolve()`, just needs to switch to the helper.

---

#### 2.2 `/app/search/page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams: { ... }` or `searchParams: Promise.resolve({ ... })`

**Expected Pattern:**
```typescript
// Before (Option 1)
searchParams: { query: 'search-term' }

// Before (Option 2)
searchParams: Promise.resolve({ query: 'search-term' })

// After
searchParams: generateAsyncValue({ query: 'search-term' })
```

---

#### 2.3 `/app/search/__tests__/page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams`

**Expected Pattern:**
```typescript
// Before
searchParams: { query: 'search-term' }

// After
searchParams: generateAsyncValue({ query: 'search-term' })
```

---

#### 2.4 `/app/auth/login/__tests__/page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams`

**Expected Pattern:**
```typescript
// Before
searchParams: { callbackUrl: '/dashboard' }

// After
searchParams: generateAsyncValue({ callbackUrl: '/dashboard' })
```

---

#### 2.5 `/app/auth/signup/__tests__/page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams`

**Expected Pattern:**
```typescript
// Before
searchParams: { referral: 'email' }

// After
searchParams: generateAsyncValue({ referral: 'email' })
```

---

#### 2.6 `/app/__tests__/blog-page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams`

**Expected Pattern:**
```typescript
// Before
searchParams: { tag: 'sustainability' }

// After
searchParams: generateAsyncValue({ tag: 'sustainability' })
```

---

#### 2.7 `/app/__tests__/auth-login-page.test.tsx`

**Action Required:** Review file to identify all occurrences of `searchParams`

**Expected Pattern:**
```typescript
// Before
searchParams: { error: 'CredentialsSignin' }

// After
searchParams: generateAsyncValue({ error: 'CredentialsSignin' })
```

---

### Category 3: API Route Tests with `params`

#### 3.1 `/app/api/listings/manage/[id]/__tests__/route.test.ts`

**Total Updates:** 20+ occurrences

**Lines with `params: { id: ... }`:**
73, 109, 125, 140, 158, 174, 210, 238, 268, 292, 317, 333, 354, 379, 405, 434, 472, 490, 510, 535

**Pattern:**
```typescript
// Before
const context: RouteContext = { params: { id: 'listing-1' } };

// After
const context: RouteContext = { params: generateAsyncValue({ id: 'listing-1' }) };
```

**⚠️ Important Note:** 
- Line 43 has type definition: `params: { id: string } | Promise<{ id: string }>`
- Verify that API routes in Next.js 16 actually expect Promise-based params
- May need to update type definition to `params: Promise<{ id: string }>`

---

## 📊 Summary Statistics

| Category | Files | Estimated Updates |
|----------|-------|-------------------|
| Page Tests (params) | 6 | ~25-30 |
| Page Tests (searchParams) | 7 | ~20-25 |
| API Route Tests (params) | 1 | ~20 |
| **TOTAL** | **14** | **65-75** |

---

## 🔄 Implementation Workflow

### For Each File:

1. **Open the file**
2. **Add import at the top:**
   ```typescript
   import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';
   ```
3. **Find and replace patterns:**
   - Find: `params: { ` → Replace with: `params: generateAsyncValue({ `
   - Find: `searchParams: { ` → Replace with: `searchParams: generateAsyncValue({ `
   - Find: `searchParams: Promise.resolve({ ` → Replace with: `searchParams: generateAsyncValue({ `
4. **Close parentheses correctly:**
   - Ensure each `generateAsyncValue({` has matching `})`
5. **Save file**
6. **Run test:**
   ```bash
   npm test -- path/to/test-file.test.tsx
   ```
7. **Verify all tests pass** ✅

---

## 🧪 Testing Commands

### Run Individual Files (Recommended During Migration)
```bash
npm test -- app/listings/[slug]/__tests__/page.test.tsx
npm test -- app/__tests__/listings-slug-page.test.tsx
npm test -- app/search/results/page.test.tsx
```

### Run All Tests (After All Files Updated)
```bash
npm test
```

### Run Tests in Watch Mode (For Active Development)
```bash
npm test -- --watch app/__tests__/listings-slug-page.test.tsx
```

---

## 📚 Related Documentation

1. **Helper Implementation:** `/src/test-helpers/async-mock-helpers.ts`
2. **Implementation Guide:** `/ASYNC_MOCK_HELPERS_IMPLEMENTATION_GUIDE.md`
3. **Example Migration:** `/ASYNC_MOCK_HELPERS_EXAMPLE.md`
4. **Summary:** `/ASYNC_MOCK_HELPERS_SUMMARY.md`
5. **Original Documentation:** `/docs/app-next-directory/ADVANCE_MOCKING_STRATEGIES_FOR_NEXTJS_APPLICATION_WITH_JEST.md` (Section 3.2)

---

## ✅ Checklist Template

Use this checklist to track progress:

### Page Tests (params)
- [ ] `/app/listings/[slug]/__tests__/page.test.tsx` (9 updates)
- [ ] `/app/__tests__/listings-slug-page.test.tsx` (5 updates)
- [ ] `/app/city/[slug]/__tests__/page.test.tsx` (1 update)
- [ ] `/app/cities/[slug]/page.test.tsx`
- [ ] `/app/__tests__/cities-slug-page.test.tsx`
- [ ] `/app/__tests__/blog-slug-page.test.tsx`

### Page Tests (searchParams)
- [ ] `/app/search/results/page.test.tsx` (6+ updates)
- [ ] `/app/search/page.test.tsx`
- [ ] `/app/search/__tests__/page.test.tsx`
- [ ] `/app/auth/login/__tests__/page.test.tsx`
- [ ] `/app/auth/signup/__tests__/page.test.tsx`
- [ ] `/app/__tests__/blog-page.test.tsx`
- [ ] `/app/__tests__/auth-login-page.test.tsx`

### API Route Tests (params)
- [ ] `/app/api/listings/manage/[id]/__tests__/route.test.ts` (20+ updates)

### Verification
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Consistent usage across all files

---

**Last Updated:** December 1, 2025
**Version:** 1.0
