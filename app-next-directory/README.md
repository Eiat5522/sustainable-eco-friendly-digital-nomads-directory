# Next.js Frontend – Sustainable Eco-Friendly Digital Nomads Directory

This is the **Next.js 15+ frontend application** for the Sustainable Eco-Friendly Digital Nomads Directory. It delivers a modern, responsive web interface with authentication, content management, advanced search, analytics, and interactive features.

---

## ✅ Implementation Status

- **Authentication System**: NextAuth.js with JWT, 5-tier RBAC, MongoDB session management
- **Admin Dashboard**: Analytics, moderation, bulk operations, user management
- **Advanced Search**: Geo-search, eco-tag filtering, digital nomad features
- **User Dashboard**: Favorites, analytics, preferences
- **Interactive Maps**: Leaflet.js, city carousel, responsive design
- **Testing**: Playwright (120+ E2E tests), Jest (unit tests)
- **Production-Ready**: Rate limiting, input validation, secure deployment

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18.17.0+ required
npm 9.6.7+ required
```

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create `.env.local` from `.env.example` and set:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `SANITY_API_TOKEN`
   - `MONGODB_URI`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - (Optional) `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Sanity Studio: [http://localhost:3333](http://localhost:3333) (from `/sanity`)

---

## 📂 Project Structure

```text
app-next-directory/
├── public/           # Static assets (images, icons, fonts)
├── src/
│   ├── app/          # Next.js App Router, API routes, pages
│   ├── components/   # React components (auth, listings, map, UI)
│   ├── lib/          # Utilities (sanity, mongodb, auth, geocode)
│   ├── types/        # TypeScript type definitions
│   └── styles/       # Global styles
├── tests/            # Playwright and unit test suites
└── docs/             # Component and API documentation
```

---

## 📝 API Routes

- `GET /api/listings` – List all listings with filtering
- `GET /api/listings/[slug]` – Get listing details (via Sanity)
- `POST /api/listings` – Create new listing (admin/venueOwner)
- `GET /api/user/dashboard` – User dashboard data
- `GET /api/admin/stats` – Admin dashboard analytics
- ...and more (see [`docs/API_DOCUMENTATION.md`](../docs/API_DOCUMENTATION.md))

---

## 🎭 Testing

- **Playwright**: E2E tests for authentication, search, dashboard, admin features
- **Jest**: Unit tests for utilities and components

### Running Tests

```bash
npm install
npx playwright install --with-deps
npm run test:e2e
npm run test:unit
```

See [`docs/Testing/`](../docs/Testing/) for details.

---

## 🚀 Deployment

- Deployed via Vercel (see [`docs/DEPLOYMENT_GUIDE.md`](../docs/DEPLOYMENT_GUIDE.md))
- Configure environment variables in Vercel dashboard

---

## 📚 Documentation

- [Frontend Docs](../docs/app-next-directory/)
- [API Reference](../docs/API_DOCUMENTATION.md)
- [Testing Guide](../docs/Testing/)
- [Troubleshooting](../docs/shared/TROUBLESHOOTING.md)

---

_Last updated: July 2025_
