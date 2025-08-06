# GEMINI Project Context: Sustainable Eco-Friendly Digital Nomads Directory

## Project Overview

This is the Next.js frontend for the "Sustainable Eco-Friendly Digital Nomads Directory." It's a web application designed to help digital nomads find eco-friendly accommodations and resources. The application is built with a modern tech stack, including:

*   **Framework**: Next.js (v15+)
*   **UI**: React, Tailwind CSS
*   **Content Management**: Sanity.io
*   **Database**: MongoDB (with Mongoose)
*   **Authentication**: NextAuth.js with JWT and Role-Based Access Control (RBAC)
*   **Testing**: Playwright for E2E tests and Jest for unit tests.
*   **Deployment**: Vercel

The application features a comprehensive search functionality with geo-search and tag-based filtering, user dashboards, an admin panel for content moderation, and interactive maps using Leaflet.js.

## Building and Running

### Prerequisites

*   Node.js v18.17.0+
*   npm v9.6.7+

### Setup and Configuration

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**: Create a `.env.local` file by copying `.env.example`. This file should contain the necessary credentials and configuration for Sanity, MongoDB, and NextAuth.js. Key variables include:
    *   `NEXT_PUBLIC_SANITY_PROJECT_ID`
    *   `NEXT_PUBLIC_SANITY_DATASET`
    *   `SANITY_API_TOKEN`
    *   `MONGODB_URI`
    *   `NEXTAUTH_URL`
    *   `NEXTAUTH_SECRET`

### Key Commands

*   **Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   **Production Build**:
    ```bash
    npm run build
    ```

*   **Start Production Server**:
    ```bash
    npm run start
    ```

*   **Linting**:
    ```bash
    npm run lint
    ```

*   **Type Checking**:
    ```bash
    npm run typecheck
    ```

*   **Testing**:
    *   Run all tests:
        ```bash
        npm test
        ```
    *   Run tests in watch mode:
        ```bash
        npm run test:watch
        ```
    *   Generate test coverage report:
        ```bash
        npm run test:coverage
        ```
    *   Run tests for CI environment:
        ```bash
        npm run test:ci
        ```
    *   Run Playwright E2E tests:
        ```bash
        npx playwright install --with-deps
        npm run test:e2e
        ```

*   **Sanity Codegen**:
    ```bash
    npm run codegen:sanity
    ```
    This command generates TypeScript types from your Sanity schema, which is crucial for maintaining type safety between the backend and frontend.

## Development Conventions

*   **Styling**: The project uses Tailwind CSS for styling. Utility classes are preferred over custom CSS.
*   **Components**: Reusable UI components are located in `src/components`.
*   **State Management**: Given the use of React, component-level state and hooks are the primary means of state management.
*   **API Routes**: API endpoints are defined in the `app/api` directory, following Next.js conventions.
*   **Testing**: The project has a strong emphasis on testing. New features should be accompanied by both unit and end-to-end tests. Test files are located in the `tests` directory.
*   **Type Safety**: The project uses TypeScript. All new code should be strongly typed.
