# Coding Standards and Guidelines

This document outlines the coding standards and best practices for the Sustainable Eco-Friendly Digital Nomads Directory project.

## Table of Contents
- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [React and Next.js Standards](#react-and-nextjs-standards)
- [Code Style and Formatting](#code-style-and-formatting)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Testing Standards](#testing-standards)
- [Documentation and Comments](#documentation-and-comments)
- [Git Commit Messages](#git-commit-messages)

## General Principles

### Code Quality
- **Write clean, readable code**: Code is read more often than it is written
- **Follow DRY principle**: Don't Repeat Yourself - extract common logic into reusable functions
- **KISS principle**: Keep It Simple, Stupid - avoid unnecessary complexity
- **YAGNI principle**: You Aren't Gonna Need It - don't add functionality until it's needed

### Type Safety
- **Use TypeScript for all new code**: Leverage TypeScript's type system for better code quality
- **Avoid `any` type**: Use specific types or `unknown` when the type is truly unknown
- **Define interfaces and types**: Create clear type definitions for data structures
- **Use type guards**: Implement type guards for runtime type checking

## TypeScript Standards

### Type Definitions
```typescript
// ✅ Good: Specific types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// ❌ Bad: Using any
function processUser(user: any) { }

// ✅ Good: Proper typing
function processUser(user: User): void { }
```

### Avoiding `any`
- **Prefer `unknown`** over `any` when the type is uncertain
- **Use type assertions** only when absolutely necessary and with proper validation
- **Define proper types** for API responses and external data

```typescript
// ✅ Good: Using unknown with type guard
function processData(data: unknown): void {
  if (isValidData(data)) {
    // Now TypeScript knows the type
    console.log(data.name);
  }
}

function isValidData(data: unknown): data is { name: string } {
  return typeof data === 'object' && data !== null && 'name' in data;
}
```

### Unused Variables
- **Remove unused variables** or prefix with underscore if intentionally unused
- **Use destructuring** to ignore unused values

```typescript
// ✅ Good: Prefix with underscore for intentionally unused
const { _id, name } = user;

// ✅ Good: Catch errors properly
try {
  // code
} catch (_error) {
  // error is intentionally ignored
}
```

### Type Imports
- **Use type imports** for type-only imports to improve build performance

```typescript
// ✅ Good: Type-only import
import type { User } from './types';

// ✅ Good: Mixed import
import { validateUser, type User } from './utils';
```

## React and Next.js Standards

### Component Structure
```typescript
// ✅ Good: Typed functional component
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {label}
    </button>
  );
}
```

### Hooks Usage
- **Follow Rules of Hooks**: Only call hooks at the top level
- **Custom hooks**: Prefix custom hooks with `use`
- **Dependencies**: Always specify correct dependencies in `useEffect` and `useCallback`

```typescript
// ✅ Good: Custom hook with proper typing
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]); // Correct dependency

  return { user, loading };
}
```

### Server Components vs Client Components
- **Default to Server Components** in Next.js App Router
- **Use 'use client'** only when necessary (for interactivity, browser APIs, hooks)
- **Keep client components small**: Extract server-rendered parts

## Code Style and Formatting

### Formatting
- **Use Prettier**: All code should be formatted with Prettier
- **Run format on save**: Enable editor integration
- **2-space indentation** for TypeScript/JavaScript
- **Single quotes** for strings (except when avoiding escapes)

### Line Length
- **Maximum 100 characters** per line (soft limit)
- **Break long lines** at logical points

### Import Organization
```typescript
// 1. External imports
import { useState } from 'react';
import Link from 'next/link';

// 2. Internal imports - absolute paths
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/auth';

// 3. Relative imports
import { helper } from './utils';
import styles from './styles.module.css';
```

## Naming Conventions

### Files and Directories
- **PascalCase** for React components: `UserProfile.tsx`, `NavBar.tsx`
- **kebab-case** for utilities and non-component files: `auth-helpers.ts`, `format-date.ts`
- **lowercase** for directories: `components/`, `utils/`, `app/`

### Variables and Functions
- **camelCase** for variables and functions: `userName`, `getUserData()`
- **PascalCase** for classes and types: `User`, `UserProfile`
- **UPPER_SNAKE_CASE** for constants: `API_BASE_URL`, `MAX_RETRY_COUNT`

### Boolean Variables
- **Prefix with is/has/should**: `isLoading`, `hasError`, `shouldUpdate`

```typescript
// ✅ Good: Clear boolean names
const isAuthenticated = checkAuth();
const hasPermission = user.role === 'admin';

// ❌ Bad: Unclear names
const authenticated = checkAuth();
const permission = user.role === 'admin';
```

### Event Handlers
- **Prefix with handle**: `handleClick`, `handleSubmit`, `handleChange`

```typescript
// ✅ Good: Clear event handler names
function handleSubmit(event: FormEvent) {
  event.preventDefault();
  // ...
}
```

## Error Handling

### Error Handling Patterns
```typescript
// ✅ Good: Proper error handling with typed errors
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Use type guard for error handling
    if (error instanceof Error) {
      console.error('Failed to fetch user:', error.message);
    }
    throw error;
  }
}
```

### API Route Error Handling
```typescript
// ✅ Good: Consistent API error responses
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### User-Facing Error Messages
- **Don't expose internal errors** to users
- **Provide actionable feedback**: Tell users what went wrong and how to fix it
- **Log detailed errors** server-side for debugging

## Testing Standards

### Test File Organization
- **Co-locate tests**: Place test files next to the code they test
- **Naming convention**: `ComponentName.test.tsx` or `function-name.test.ts`

### Test Structure
```typescript
describe('UserProfile', () => {
  it('should render user name', () => {
    // Arrange
    const user = { id: '1', name: 'John Doe' };
    
    // Act
    render(<UserProfile user={user} />);
    
    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Test Coverage
- **Write tests for critical functionality**: Authentication, data processing, business logic
- **Test edge cases**: Empty states, error conditions, boundary values
- **Mock external dependencies**: API calls, database queries

## Documentation and Comments

### When to Comment
- **Complex logic**: Explain why, not what
- **Workarounds**: Document why a workaround is needed
- **Public APIs**: Use JSDoc for exported functions

```typescript
/**
 * Formats a date relative to the current time
 * @param date - The date to format
 * @returns A human-readable relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  // Implementation
}
```

### When NOT to Comment
- **Self-explanatory code**: Good naming makes comments unnecessary
- **Commented-out code**: Remove it instead (use version control)

```typescript
// ❌ Bad: Obvious comment
// Set user name to John
const userName = 'John';

// ✅ Good: No comment needed
const userName = 'John';
```

### TODO Comments
- **Use TODO format**: `// TODO: Description of what needs to be done`
- **Include context**: Reference issue numbers when applicable
- **Clean up TODOs**: Regularly review and address or remove

```typescript
// TODO(#123): Implement pagination for large datasets
// FIXME: This breaks when user has no email
```

## Git Commit Messages

### Commit Message Format
Follow the Conventional Commits specification:

```
<type>: <short description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without functionality changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples
```
feat: add user authentication with NextAuth

fix: resolve issue with listing pagination on mobile

docs: update API documentation for user endpoints

refactor: simplify error handling in API routes

test: add integration tests for authentication flow
```

### Best Practices
- **Write in imperative mood**: "Add feature" not "Added feature"
- **Be concise but descriptive**: Explain what and why, not how
- **Reference issues**: Include issue numbers in footer (e.g., "Fixes #123")

## Enforcement

### Automated Checks
These standards are enforced through:
- **ESLint**: Code quality and style rules
- **TypeScript**: Type safety and correctness
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Code Review Checklist
Before approving a PR, ensure:
- [ ] Code follows TypeScript and naming conventions
- [ ] No ESLint warnings or errors
- [ ] TypeScript compilation passes
- [ ] Tests are included for new features
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No commented-out code or console.logs (unless intentional)
- [ ] Error handling is appropriate

## Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Last Updated**: November 2025
**Maintained By**: Development Team
