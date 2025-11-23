# Next.js Frontend - Sustainable Eco-Friendly Digital Nomads Directory

This is the **Next.js 14+ frontend application** for the Sustainable Eco-Friendly Digital Nomads Directory project. It provides a modern, responsive web interface with authentication, content management, and interactive features.

## ✅ Implementation Status

### **Authentication System - COMPLETED** 🎉
- **Full NextAuth.js implementation** with JWT strategy
- **Role-based access control** (5 user levels: user, editor, venueOwner, admin, superAdmin)
- **MongoDB session management** with secure password hashing
- **Comprehensive Playwright testing** (120+ test cases)
- **Production-ready security** with rate limiting and input validation

### **Current Task Progress**
Based on the task tracking system:
- ✅ **Tasks 1, 2, 4, 7, 14**: Completed (Next.js startup, carousel, TypeScript fixes, auth)
- 🔄 **Tasks 3, 5, 6**: In Progress (Sanity integration, backend APIs, documentation)
- ⏳ **Tasks 8-13**: Planned (API development, CMS integration, testing, optimization)

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
   Create `.env.local` from `.env.example`:

   ```env
   # Sanity CMS Configuration
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_sanity_api_token

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_32_char_secret

   # OAuth Providers (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Sanity Studio: [http://localhost:3333](http://localhost:3333) (from `/sanity` directory)

## 📂 Project Architecture

```text
app-next-directory/
├── public/                     # Static assets
│   ├── images/                 # Image assets
│   ├── icons/                  # Icon files
│   └── fonts/                  # Custom fonts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # NextAuth routes
│   │   │   ├── listings/       # Listings API
│   │   │   └── user/           # User management API
│   │   ├── (auth)/             # Auth-related pages
│   │   ├── listings/           # Listings pages
│   │   ├── cities/             # City pages
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── listings/           # Listing components
│   │   ├── common/             # Shared UI components
│   │   ├── map/                # Map components
│   │   └── ui/                 # Base UI components (Radix)
│   ├── lib/                    # Utility functions
│   │   ├── sanity/             # Sanity client & queries
│   │   ├── mongodb/            # MongoDB connection & models
│   │   ├── auth/               # Auth configuration & helpers
│   │   └── utils/              # General utilities
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles
├── tests/                      # Playwright test suites
│   ├── auth.spec.ts            # Authentication tests
│   ├── rbac.spec.ts            # Role-based access tests
│   └── utils/                  # Test utilities
└── docs/                       # Component documentation
```

## 🔧 Fixing Deprecated Dependencies

If you see warnings for deprecated packages (such as `string-similarity`, `inflight`, or `glob`):

1. Replace `string-similarity` with `fastest-levenshtein`:

```bash
npm uninstall string-similarity
npm install fastest-levenshtein
```

2. Update `glob` to a modern version:

```bash
npm install glob@10.3.10
```

3. The `inflight` package is a transitive dependency. Run:

```bash
npm update
```

If warnings persist, check the root README for workspace-wide instructions.

## 🎭 Testing

This project uses Playwright for end-to-end testing. Our test suite covers:

- Map integration and interactions
- Listing filters and search
- Mobile responsiveness
- API integration
- Error handling

### Running Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/map-integration.spec.ts

# Run tests in debug mode
npm run test:debug
```

### Test Documentation

For detailed information about our testing setup, please refer to:

- [Testing Overview](tests/TESTING.md)
- [Test Writing Guide](tests/WRITING_GUIDE.md)
- [API Mocking Guide](tests/API-MOCKING.md)
- [Test Utilities](tests/utils/README.md)

### Continuous Integration

Tests run automatically on:

- Pull request creation/updates
- Merges to main branch
- Manual trigger via GitHub Actions

## 📝 API Routes Documentation

The Next.js app provides the following API routes:

### Listings

- `GET /api/listings` - List all listings with filtering options
- `GET /api/listings/[slug]` - Get details of a specific listing
- `POST /api/listings` - Create a new listing (authenticated, premium)
- `PUT /api/listings/[slug]` - Update a listing (owner only)
- `DELETE /api/listings/[slug]` - Delete a listing (owner only)

### User

- `GET /api/user/favorites` - Get user's favorite listings
- `POST /api/user/favorites` - Add a listing to favorites
- `DELETE /api/user/favorites/[id]` - Remove a listing from favorites

### Authentication

- `POST /api/auth/signup` - Register a new user
- `GET /api/auth/session` - Get current session information

### Other

- `GET /api/blog` - Get blog posts
- `GET /api/events` - Get upcoming sustainability events
- `POST /api/reviews` - Submit a review for a listing

## 🚀 Deployment

The application is deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Set the environment variables in the Vercel dashboard
3. Deploy from the main branch

For more details, visit our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
