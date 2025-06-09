# Test Utilities Documentation

This directory contains utility functions and helpers used across our Playwright test suite. Each utility module is designed to handle specific testing concerns and promote code reuse.

## 🗺️ Map Test Utilities (`map-test-utils.ts`)

### Functions

#### `waitForMapLoad(page: Page): Promise<void>`
Waits for the Leaflet map to be fully initialized and loaded.
```typescript
await waitForMapLoad(page);
```

#### `getMapBounds(page: Page): Promise<LeafletBounds>`
Retrieves the current visible bounds of the map.
```typescript
const bounds = await getMapBounds(page);
```

#### `panMap(page: Page, lat: number, lng: number): Promise<void>`
Pans the map to specific coordinates.
```typescript
await panMap(page, 13.7563, 100.5018); // Pan to Bangkok
```

#### `getVisibleMarkers(page: Page): Promise<MarkerInfo[]>`
Returns information about all currently visible markers on the map.
```typescript
const markers = await getVisibleMarkers(page);
```

#### `clickMarkerByIndex(page: Page, index: number): Promise<void>`
Clicks a marker at the specified index.
```typescript
await clickMarkerByIndex(page, 0); // Click first marker
```

#### `getPopupContent(page: Page): Promise<PopupContent>`
Retrieves the content of the currently open marker popup.
```typescript
const content = await getPopupContent(page);
```

## 🔍 Filter Test Utilities (`filter-test-utils.ts`)

### Functions

#### `applyFilters(page: Page, filters: FilterOptions): Promise<void>`
Applies specified filters to the listing view.
```typescript
await applyFilters(page, {
  categories: ['coworking'],
  ecoTags: ['zero-waste']
});
```

#### `clearFilters(page: Page): Promise<void>`
Clears all active filters.
```typescript
await clearFilters(page);
```

## ✅ Test Assertions (`test-assertions.ts`)

### Functions

#### `expectLoading(page: Page, state: boolean): Promise<void>`
Verifies loading state of the page.
```typescript
await expectLoading(page, true); // Expect loading
await expectLoading(page, false); // Expect loaded
```

#### `expectEmptyState(page: Page): Promise<void>`
Verifies that the empty state message is displayed.
```typescript
await expectEmptyState(page);
```

## 🔧 Test Fixtures (`test-fixtures.ts`)

### Fixtures

#### `mockListings`
Provides mock listing data for tests.
```typescript
test('my test', async ({ page, mockListings }) => {
  // mockListings is available here
});
```

## 🛠️ Test Setup (`test-setup.ts`)

### Functions

#### `setupMockApi(page: Page, mockData: any): Promise<void>`
Sets up API request interception with mock data.
```typescript
await setupMockApi(page, mockListings);
```

#### `setupViewport(page: Page, device: 'mobile' | 'tablet' | 'desktop'): Promise<void>`
Configures viewport for different device types.
```typescript
await setupViewport(page, 'mobile');
```

## Types and Interfaces

```typescript
interface FilterOptions {
  categories?: string[];
  ecoTags?: string[];
}

interface PopupContent {
  title: string;
  address: string;
  tags: string[];
}

interface MarkerInfo {
  text: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface LeafletBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
```

## Usage Examples

### Complete Test Example
```typescript
test('filter and verify marker', async ({ page, mockListings }) => {
  await setupMockApi(page, mockListings);
  await page.goto('/listings');
  await waitForMapLoad(page);
  
  await applyFilters(page, {
    categories: ['coworking']
  });
  
  const markers = await getVisibleMarkers(page);
  expect(markers.length).toBeGreaterThan(0);
  
  await clickMarkerByIndex(page, 0);
  const content = await getPopupContent(page);
  expect(content.tags).toContain('coworking');
});
```

## Best Practices

1. Always wait for the map to load using `waitForMapLoad()` before interacting with it
2. Use the provided utility functions instead of direct page manipulation
3. Clear filters after tests that apply them
4. Use appropriate timeouts for async operations
5. Handle both success and error states in tests

## Contributing

When adding new utility functions:
1. Follow the existing naming conventions
2. Add TypeScript types/interfaces
3. Include JSDoc comments
4. Update this documentation
5. Add usage examples if appropriate
