# Test Writing Guide

This guide provides best practices and patterns for writing tests in the Sustainable Eco-Friendly Digital Nomads Directory project.

## 📝 Test Structure

### Basic Test Structure

```typescript
import { expect } from '@playwright/test';
import { test } from './utils/test-fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Using Test Fixtures

```typescript
test('using fixtures', async ({ page, mockListings }) => {
  await setupMockApi(page, mockListings);
});
```

## 🎯 Test Categories

### 1. Map Integration Tests

- Map initialization
- Marker interactions
- Clustering behavior
- Viewport changes

### 2. Filter Tests

- Category filters
- Eco tag filters
- Combined filters
- Clear filters

### 3. Responsive Design Tests

- Mobile viewport
- Desktop viewport
- Component scaling

### 4. State Management Tests

- Loading states
- Empty states
- Error states

## 💡 Best Practices

1. **Test Independence**
   - Each test should run independently
   - Clean up after tests
   - Don't rely on other test results

2. **Clear Naming**

   ```typescript
   test('should show popup when marker is clicked');
   test('should filter listings when category is selected');
   ```

3. **Arrange-Act-Assert Pattern**

   ```typescript
   test('should filter by category', async ({ page }) => {
     // Arrange
     await waitForMapLoad(page);

     // Act
     await applyFilters(page, { categories: ['coworking'] });

     // Assert
     const markers = await getVisibleMarkers(page);
     expect(markers.length).toBeGreaterThan(0);
   });
   ```

4. **Use Test Utilities**
   - Prefer helper functions over direct page manipulation
   - Keep selectors in utility files
   - Abstract common patterns

## 🐛 Debugging Tests

### Visual Debugging

```typescript
test('debug example', async ({ page }) => {
  // Add pause for debugging
  await page.pause();

  // Take screenshots
  await page.screenshot({ path: 'debug.png' });
});
```

### Slow Motion Mode

```bash
npx playwright test --debug
```

## 🔄 Common Patterns

### Testing API Responses

```typescript
test('api example', async ({ page }) => {
  await setupMockApi(page, {
    status: 200,
    data: mockListings
  });
});
```

### Testing Responsive Design

```typescript
test('responsive example', async ({ page }) => {
  await setupViewport(page, 'mobile');
  await expect(page.locator('.mobile-menu')).toBeVisible();
});
```

### Testing User Interactions

```typescript
test('interaction example', async ({ page }) => {
  await clickMarkerByIndex(page, 0);
  const popup = await getPopupContent(page);
  expect(popup.title).toBeTruthy();
});
```

## 🚨 Error Handling

### Network Errors

```typescript
test('handles network error', async ({ page }) => {
  await setupMockApi(page, null, { status: 500 });
  await expect(page.locator('.error-message')).toBeVisible();
});
```

### Empty States

```typescript
test('handles no results', async ({ page }) => {
  await applyFilters(page, {
    categories: ['non-existent']
  });
  await expectEmptyState(page);
});
```

## 📝 Documentation

1. Comment complex test scenarios
2. Document custom fixtures
3. Update README when adding new patterns
4. Include examples in documentation

## 🔄 Continuous Integration

1. Tests run on pull requests
2. Tests run on main branch
3. Screenshots on failure
4. Test reports in CI
