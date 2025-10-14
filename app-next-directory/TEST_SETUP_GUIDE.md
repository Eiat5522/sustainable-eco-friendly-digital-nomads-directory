# Test Setup Guide

This document explains the testing infrastructure and how to properly write tests for this project.

## Overview

This project uses **Jest** for running tests with two distinct testing modes:

1. **Unit Tests** - Fast tests using mocked dependencies (default)
2. **Integration Tests** - Tests with real database connections using mongodb-memory-server

## Test Structure

### Unit Tests (`.test.ts` / `.test.tsx`)

**Purpose**: Test business logic, schema validation, and component behavior with mocked dependencies.

**Characteristics**:
- Run with mocked mongoose (no real database)
- Fast execution (milliseconds per test)
- Focus on schema structure, validation rules, and model creation
- Test React component rendering and user interactions

**Run Command**:
```bash
npm run test:unit
```

**Example**: `src/models/__tests__/ContactSubmission.test.ts`

### Integration Tests (`.integration.test.ts` / `.int.test.ts`)

**Purpose**: Test database operations with a real MongoDB instance.

**Characteristics**:
- Use mongodb-memory-server for real database operations
- Slower execution (seconds per test)
- Test CRUD operations, queries, indexes, and data persistence
- Run serially to avoid conflicts

**Run Command**:
```bash
npm run test:integration
```

**Example**: `src/models/__tests__/ContactSubmission.integration.test.ts`

## Writing Model Tests

### Unit Test Pattern

Unit tests should focus on **schema validation** without database operations:

```typescript
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import MyModel from '../MyModel';

describe('MyModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should have correct schema structure', () => {
      const schema = MyModel.schema;
      expect(schema.path('fieldName')).toBeDefined();
    });

    it('should have required fields', () => {
      expect(MyModel.schema.path('email').isRequired).toBe(true);
    });
  });

  describe('Model Creation', () => {
    it('should create a model instance with validation', () => {
      const instance = new MyModel({
        email: 'test@example.com',
        name: 'Test User'
      });
      
      expect(instance.email).toBe('test@example.com');
      expect(instance.name).toBe('Test User');
    });

    it('should apply schema transformations', () => {
      const instance = new MyModel({
        email: '  TEST@EXAMPLE.COM  '
      });
      
      // Schema has lowercase and trim
      expect(instance.email).toBe('test@example.com');
    });
  });
});
```

### Integration Test Pattern

Integration tests should test **database operations** with a real MongoDB instance:

```typescript
import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MyModel from '../MyModel';

const getMongoose = async () => {
  const mod = await import('mongoose');
  return mod.default ?? (mod as unknown as typeof import('mongoose'));
};

describe('MyModel Integration Tests', () => {
  let mongo: MongoMemoryServer;
  let mongoose: typeof import('mongoose');

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    mongoose = await getMongoose();
    await mongoose.connect(mongo.getUri(), { bufferCommands: false });
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      await Promise.all(
        Object.values(collections).map(async (collection) => {
          await collection.deleteMany({});
        })
      );
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await mongo.stop();
  });

  describe('Database Operations', () => {
    it('should save to database', async () => {
      const doc = await MyModel.create({
        email: 'test@example.com',
        name: 'Test User'
      });

      expect(doc._id).toBeDefined();
      expect(doc.createdAt).toBeInstanceOf(Date);
    });

    it('should query from database', async () => {
      await MyModel.create({
        email: 'test@example.com',
        name: 'Test User'
      });

      const found = await MyModel.findOne({ email: 'test@example.com' });
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test User');
    });
  });
});
```

## React Component Tests

React component tests use **React Testing Library** and run as unit tests:

```typescript
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

// Mock Next.js dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    // Assert expected behavior
  });
});
```

## Common Pitfalls and Solutions

### ❌ DON'T: Import dbHandler utilities in unit tests

```typescript
// WRONG - This will cause timeouts and MSW conflicts
import { connectInMemoryMongo, disconnectInMemoryMongo } from '../../../tests/utils/dbHandler';

describe('MyModel', () => {
  beforeAll(async () => {
    await connectInMemoryMongo(); // ❌ Don't do this in unit tests
  });
  // ...
});
```

### ✅ DO: Keep unit tests simple with mocked mongoose

```typescript
// CORRECT - Fast unit test with mocked dependencies
import mongoose from 'mongoose';
import MyModel from '../MyModel';

describe('MyModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('tests schema validation', () => {
    const instance = new MyModel({ email: 'test@example.com' });
    expect(instance.email).toBe('test@example.com');
  });
});
```

### ❌ DON'T: Test database operations in unit tests

```typescript
// WRONG - Database operations in unit tests
it('should save to database', async () => {
  const doc = await MyModel.create({ email: 'test@example.com' });
  const found = await MyModel.findById(doc._id); // ❌ Won't work with mocked mongoose
  expect(found).toBeDefined();
});
```

### ✅ DO: Create separate integration tests for database operations

```typescript
// CORRECT - Create a separate .integration.test.ts file
describe('MyModel Integration Tests', () => {
  // Setup mongodb-memory-server as shown above
  
  it('should save to database', async () => {
    const doc = await MyModel.create({ email: 'test@example.com' });
    const found = await MyModel.findById(doc._id);
    expect(found).toBeDefined();
  });
});
```

## Test Configuration

### Environment Variables

- `JEST_UNIT_ONLY=1` - Run unit tests (default)
- `JEST_USE_REAL_MONGOOSE=1` - Use real mongoose for integration tests

### Jest Configuration

- **Unit Tests**: Use `jest.config.cjs` with mocked mongoose
- **Integration Tests**: Use `jest.config.cjs` with real mongoose enabled

### Module Mocking

The project uses automatic mocking for:
- `mongoose` (in unit test mode)
- `next/navigation`
- `next/image`
- `next-auth`
- Various other Next.js and library dependencies

See `jest.config.cjs` for the complete list of mocked modules.

## Running Tests

```bash
# Run all unit tests (fast)
npm run test:unit

# Run specific unit test file
npm run test:unit -- src/models/__tests__/MyModel.test.ts

# Run all integration tests (slower, requires mongodb-memory-server)
npm run test:integration

# Run specific integration test
npm run test:integration -- src/models/__tests__/MyModel.integration.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Best Practices

1. **Separate Concerns**: Keep unit tests focused on logic and schema, integration tests on database operations
2. **Fast Tests**: Unit tests should run in milliseconds
3. **Reliable Integration Tests**: Always clean up database state between tests
4. **Mock External Dependencies**: Don't make real API calls in tests
5. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
6. **Use Descriptive Test Names**: Make it clear what each test is verifying

## Troubleshooting

### Tests Timing Out

**Symptom**: Tests hang or timeout after 5 seconds

**Cause**: Trying to connect to mongodb-memory-server in unit tests

**Solution**: Remove database connection code from unit tests, move to integration tests

### MSW Warnings About MongoDB Downloads

**Symptom**: `[MSW] Warning: intercepted a request without a matching request handler` for MongoDB downloads

**Cause**: mongodb-memory-server trying to download MongoDB binary in unit tests

**Solution**: Don't use mongodb-memory-server in unit tests

### Mocked Mongoose Methods Not Working

**Symptom**: `TypeError: Cannot read properties of undefined`

**Cause**: Database operations being called with mocked mongoose

**Solution**: Move database operation tests to integration test files

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://testingjavascript.com/)
