# 🧪 A Developer’s Guide to Testing Asynchronous Components in Next.js 16

## 1.0 Introduction: Navigating the Asynchronous Shift in Next.js Testing

Mastering testing in Next.js is a strategic imperative for building robust, enterprise-grade applications. A significant shift has occurred in recent versions, introducing new complexities for developers.

The **`searchParams`** prop became asynchronous in **Next.js 15**, and with **Next.js 16**, the **`params`** prop is now asynchronous as well. This change, while powerful, breaks conventional synchronous testing patterns.

This document provides a **comprehensive, step-by-step guide** for implementing effective testing strategies using **Jest** and **React Testing Library** to address these modern challenges.

Developers now face the core challenge of mocking and rendering components that rely on these awaited props within a Jest environment. This guide deconstructs the process—from setup to advanced mocking—covering:

- Configuration of a robust testing environment
- Anatomy of testable server and client components
- Unit testing asynchronous server pages
- Integration testing client components that depend on Next.js navigation hooks

We begin with a foundation: understanding why the asynchronous nature of `params` and `searchParams` is key to modern Next.js testing.

---

## 2.0 Core Concepts: Understanding `params` and `searchParams` in Next.js 16

The **`params`** and **`searchParams`** props are central to routing and data fetching in Next.js. Before writing tests, you must understand their function and asynchronous behavior.

### 🧩 Deconstructing the `params` Prop

The `params` prop represents **dynamic segments of a URL**.

For example:

```
app/users/[username]/page.tsx → /users/peter
params = { username: 'peter' }
```

Access patterns:

- **Server Components:** Await `params` since it’s async.
- **Client Components (Prop Passing):** Use the `use()` hook to resolve promises passed from the server.
- **Client Components (Hook):** The `useParams()` hook can be used, but **avoid** in `page.tsx` files that already receive props.

### 🔍 Analyzing the `searchParams` Prop

The `searchParams` prop represents the **query string** (key-value pairs after `?`).

Example:
`http://localhost:3000?s=peter&lang=nl`

```ts
searchParams = { s: "peter", lang: "nl" };
```

Access patterns:

- **Server Components:** Await `searchParams`.
- **Client Components (Prop Passing):** Use `use()` to resolve async props.
- **Client Components (Hook):** Use `useSearchParams()` for client-side access.

### 🧱 TypeScript Integration with `PageProps`

Next.js provides the `PageProps` utility type for strong typing:

```ts
export default async function Page({
    params,
    searchParams,
}: PageProps<"/users/[username]">) {
    // ...
}
```

Type inference:

- `params`: `{ username: string }`
- `searchParams`: `Record<string, string | string[] | undefined>`

If you provide an invalid route, TypeScript raises a compile-time error—preventing runtime issues.

---

## 3.0 Setting Up a Robust Testing Environment

A correctly configured testing environment is the cornerstone of reliable tests.

### ⚙️ Installing Dependencies

```bash
npm install -D jest jest-environment-jsdom \
  @testing-library/react @testing-library/dom \
  @testing-library/jest-dom ts-node @types/jest
```

### 🧩 Jest Configuration (`jest.config.ts`)

```ts
// jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    clearMocks: true,
};

export default createJestConfig(config);
```

### 🧠 ESLint Integration

```bash
npm i -D eslint-plugin-jest eslint-plugin-jest-dom eslint-plugin-testing-library
```

Update your `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jestPlugin from "eslint-plugin-jest";
import jestDomPlugin from "eslint-plugin-jest-dom";
import testingLibraryPlugin from "eslint-plugin-testing-library";

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
        ...jestPlugin.configs["flat/recommended"],
    },
    {
        files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
        ...jestDomPlugin.configs["flat/recommended"],
    },
    {
        files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
        ...testingLibraryPlugin.configs["flat/react"],
    },
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

### ✅ Verification Test

**`components/Hello.tsx`**

```tsx
export default function Hello() {
    return <div>Hello</div>;
}
```

**`components/__test__/Hello.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import Hello from "../Hello";

test("It renders", () => {
    render(<Hello />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

---

## 4.0 The Anatomy of a Testable Next.js Page

We’ll use a sample app—a list page with sorting controls.

### 🧮 Server Component (`app/list/[listSlug]/page.tsx`)

```tsx
import ListControls from "@/components/ListControls";
import { validateSortOrder } from "@/lib/validateSortOrder";
import { PageProps } from "next";
import Link from "next/link";

const data = {
    fruit: ["apple", "banana", "cherry"],
    names: ["Adam", "Bob", "Cole"],
};

const sortCallbacks = {
    asc: (a, b) => (a > b ? 1 : -1),
    desc: (a, b) => (a > b ? -1 : 1),
};

export default async function ListPage({
    params,
    searchParams,
}: PageProps<"/list/[listSlug]">) {
    const { listSlug } = await params;
    if (!(listSlug in data)) return <p>Invalid param.</p>;

    const searchParamsResolved = await searchParams;
    const sortOrder = validateSortOrder(searchParamsResolved);

    return (
        <div>
            <Link
                href="/"
                className="underline text-blue-400 mb-4 inline-block"
            >
                home
            </Link>
            <h1 className="font-bold text-xl mb-2">List of {listSlug}</h1>
            <ListControls />
            <ul>
                {data[listSlug].sort(sortCallbacks[sortOrder]).map((item) => (
                    <li key={item} className="list-disc ml-3">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

### 🎛️ Client Component (`components/ListControls.tsx`)

```tsx
"use client";
import { SortOrderT, validateSortOrder } from "@/lib/validateSortOrder";
import {
    useParams,
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

export default function ListControls() {
    const searchParams = useSearchParams();
    const pathName = usePathname();
    const router = useRouter();
    const params = useParams();

    function handleSort(newSortOrder: SortOrderT) {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set("sortOrder", newSortOrder);
        router.push(`${pathName}?${newSearchParams.toString()}`);
    }

    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = validateSortOrder(
        rawSortOrder ? { sortOrder: rawSortOrder } : {},
    );

    return (
        <>
            <h2 className="font-semibold mb-1">Sort {params.listSlug}</h2>
            <div className="flex gap-2 mb-2">
                <button
                    className={`text-white px-2 py-1 rounded ${
                        sortOrder === "asc" ? "bg-amber-600" : "bg-slate-600"
                    }`}
                    onClick={() => handleSort("asc")}
                >
                    ascending
                </button>
                <button
                    className={`text-white px-2 py-1 rounded ${
                        sortOrder === "desc" ? "bg-amber-600" : "bg-slate-600"
                    }`}
                    onClick={() => handleSort("desc")}
                >
                    descending
                </button>
            </div>
        </>
    );
}
```

---

## 5.0 Unit Testing the Asynchronous Page Component

### ⚡ Core Technique: Awaiting Components and Props

```ts
const component = await ListPage({
    params: Promise.resolve({ listSlug: "fruit" }),
    searchParams: Promise.resolve({}),
});
render(component);
```

### 🧰 Isolating Dependencies with Mocks

```ts
jest.mock('@/components/ListControls', () => jest.fn(() => <div>Mocked Controls</div>));
jest.mock('@/lib/validateSortOrder', () => ({
  validateSortOrder: jest.fn(),
}));
```

Mock return:

```ts
(validateSortOrder as jest.Mock).mockReturnValue("asc");
```

### 🧪 Sample Test Patterns

- ✅ Renders correctly
- ✅ Calls `validateSortOrder` properly
- ✅ Handles invalid params
- ✅ Sorts correctly based on mock return value

This pattern ensures **isolation, predictability, and async compatibility**.

---

## 6.0 Integration Testing the Client Component (`<ListControls />`)

### 🧱 Mocking `next/navigation`

```ts
jest.mock("next/navigation", () => ({
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
    useRouter: jest.fn(),
    useParams: jest.fn(),
}));
```

### ⚙️ Setup Helper

```ts
function setupRender(validateMock: 'asc' | 'desc', toStringMockValue: string) {
  (validateSortOrder as jest.Mock).mockReturnValue(validateMock);
  render(<ListControls />);
  return {
    buttonAsc: screen.getByRole('button', { name: /ascending/i }),
    buttonDesc: screen.getByRole('button', { name: /descending/i }),
  };
}
```

### 👩‍💻 User Interaction Tests

```ts
test("Activates correct button", () => {
    const { buttonAsc, buttonDesc } = setupRender(
        "asc",
        "sortOrder=asc&color=red",
    );
    expect(buttonAsc).toHaveClass("bg-amber-600");
    expect(buttonDesc).not.toHaveClass("bg-amber-600");
});

test("Calls router.push() with correct URL", async () => {
    const user = userEvent.setup();
    const { buttonDesc } = setupRender("asc", "sortOrder=asc");
    await user.click(buttonDesc);
    expect(pushMock).toHaveBeenCalledWith("/test/route?sortOrder=desc");
});

test("Preserves other searchParams", async () => {
    const user = userEvent.setup();
    const { buttonDesc } = setupRender("asc", "sortOrder=asc&color=red");
    await user.click(buttonDesc);
    expect(pushMock).toHaveBeenCalledWith(
        "/test/route?sortOrder=desc&color=red",
    );
});
```

---

## 7.0 Conclusion and Key Takeaways

The asynchronous shift in Next.js 16 demands a rethinking of traditional testing patterns.

### 🧩 Key Lessons

- **Server Components:**
  Treat as async functions (`await Component()`), and wrap props in async helpers.

- **Client Components:**
  Mock `next/navigation` completely, return mock objects with `jest.fn()` methods, and assert navigation behavior.

- **Isolation:**
  Always mock child components and helpers for clean, predictable tests.

> ⚠️ **Limitation:**
> Client-side `page.tsx` components using `use()` are currently not testable with React Testing Library.

By applying these modern testing patterns, developers can confidently write maintainable, async-safe tests for Next.js 16.
