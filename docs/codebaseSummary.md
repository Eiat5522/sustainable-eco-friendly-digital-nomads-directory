# Codebase Summary

**Last Updated: June 14, 2025**

This document provides a high-level overview of the codebase for the Sustainable Eco-Friendly Digital Nomads Directory.

## 🚀 Project Overview

The project is a web application built with Next.js (App Router) and Sanity CMS. It aims to be a comprehensive directory for digital nomads seeking sustainable and eco-friendly venues and services, initially focusing on Thailand.

## 🏗️ Monorepo Structure

The project is organized as a monorepo:

-   **`app-next-directory/`**: Contains the main Next.js frontend application.
-   **`sanity/`**: Contains the Sanity CMS configuration and schemas.
-   **`docs/`**: Project documentation.
-   **`memory-bank/`**: Contextual notes and logs.
-   (Other potential folders like `scripts/`, `tasks/` etc.)

## Frontend Structure (`app-next-directory/src`)

-   **`app/`**: Core of the Next.js application using the App Router.
    -   **`api/`**: Backend API route handlers.
        -   `auth/`: Authentication-related endpoints.
        -   `listings/`: Endpoints for listing data (e.g., fetching all, by slug).
        -   `city/[slug]/`: Endpoint for fetching detailed city data.
        -   `user/`: User-specific endpoints (profile, favorites).
        -   `admin/`: Endpoints for administrative functionalities.
        -   Other specific API routes like `blog`, `reviews`, `contact`.
    -   **Dynamic Route Pages**:
        -   `listings/[slug]/page.tsx`: Displays detailed information for a single listing.
        -   `city/[slug]/page.tsx`: Displays detailed information for a specific city.
    -   **Other Pages**: Standard pages like home, login, register, dashboard, etc.
    -   `layout.tsx`: Root layout for the application.
-   **`components/`**: Reusable React components.
    -   `auth/`: Authentication-related UI components.
    -   `listings/`: Components specific to listings (e.g., `ListingDetail.tsx`, `ImageGallery.tsx`, `ListingCard.tsx`).
    -   `city/`: Components specific to city display.
    -   `common/`: Shared components like `Header.tsx`, `Footer.tsx`.
    -   `ui/`: Base UI elements (e.g., buttons, inputs, modals).
-   **`lib/`**: Utility functions and libraries.
    -   `dbConnect.ts`: MongoDB connection helper.
    -   `sanity/`: Sanity client configuration (`client.ts`), image utilities (`image.ts`), and GROQ queries (`queries.ts`).
    -   Other helper modules.
-   **`models/`**: Mongoose schemas for MongoDB (e.g., `User.ts`).
-   **`types/`**: TypeScript type definitions for various parts of the application.
-   **`middleware.ts`**: Next.js middleware, typically used for route protection and role-based access control (RBAC).

## Backend & Data

-   **Sanity CMS**: Headless CMS used for managing content like listings, cities, blog posts, etc. Schemas are defined in the `sanity/` directory.
-   **MongoDB Atlas**: Database used for user data, sessions, and potentially other application-specific data not suitable for Sanity.
-   **NextAuth.js**: Handles authentication and session management.

## Key Features Implemented

-   User authentication and role-based access control.
-   Listing display (cards, detail pages).
    -   Interactive image gallery for listings.
-   City information display (cards, detail pages).
-   Search and filtering capabilities (basic and advanced).
-   User dashboard (profile, favorites).
-   Admin functionalities (analytics, content moderation, bulk operations).
-   Blog and review systems.
-   Contact form.

## Testing

-   Playwright is used for end-to-end testing.
-   Test suites cover authentication, RBAC, API security, and UI interactions.

## Deployment

-   Next.js application is typically deployed to Vercel.
-   Sanity Studio is deployed to Sanity's cloud platform.
-   MongoDB is hosted on MongoDB Atlas.

This summary provides a snapshot of the codebase. For more detailed information, refer to specific documentation files within the `docs/` directory.
