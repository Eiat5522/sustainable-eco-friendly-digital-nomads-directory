# Sustainable Eco-Friendly Digital Nomads Directory

A curated monorepo containing a comprehensive platform for sustainable, eco-friendly venues and services for digital nomads, built with Next.js 14+, Sanity CMS, and modern authentication.

## 🏗️ Project Architecture

This is a **monorepo** containing multiple interconnected applications:

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Main Next.js application
├── sanity/                      # Sanity CMS configuration
├── listings/                    # Data processing & migration scripts
├── cline_docs/                  # Project documentation
├── memory-bank/                 # Development notes & session logs
└── tasks/                       # Task management files
```

## 🌱 Features

- **Curated Eco-Friendly Listings**
  - Verified sustainability practices with community-reviewed scores
  - Comprehensive venue data with eco-certifications
- **Advanced Search & Filtering**
  - Full-text search across names, descriptions, and features
  - Multi-category filtering (coworking, cafe, accommodation, events)
  - Geographic filtering by city/region with interactive maps
  - Eco-tag filtering (zero-waste, renewable energy, organic food)
  - Digital nomad features (WiFi speed, workspace quality, community)
  - Price range and rating-based filtering
- **Authentication & User Management**
  - **✅ COMPLETED**: Full NextAuth.js implementation with role-based access
  - Multi-tier user roles (user, editor, venueOwner, admin, superAdmin)
  - Secure password hashing with bcrypt
  - JWT session management with MongoDB storage
- **Interactive Features**
  - Leaflet.js maps with OpenStreetMap integration
  - User reviews and favorites system
  - Event calendar for sustainability meetups
  - Community-driven content submission
- **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Dark mode support with next-themes
  - Framer Motion animations
  - Accessible design with Radix UI components

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** + **Tailwind UI** for styling
- **Framer Motion** for animations
- **Radix UI** for accessible components
- **React Hook Form** + **Zod** for form validation

### Backend & CMS
- **Sanity.io** (Headless CMS) for content management
- **MongoDB Atlas** for user data and authentication
- **NextAuth.js** for authentication and session management
- **bcryptjs** for secure password hashing

### Maps & Integrations
- **Leaflet.js** + **OpenStreetMap** for interactive maps
- **React Leaflet** for React integration
- **Stripe** for payment processing (premium listings)

### Testing & Quality
- **Playwright** for E2E testing (120+ test cases implemented)
- **ESLint** + **Prettier** for code formatting
- **TypeScript** for type safety

### Deployment & DevOps
- **Vercel** for hosting
- **GitHub Actions** for CI/CD
- **MongoDB Atlas** for production database

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm 9.6.7 or later
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/sustainable-eco-friendly-digital-nomads-directory.git
cd sustainable-eco-friendly-digital-nomads-directory
```

2. Install dependencies in both the Next.js app and Sanity:

```bash
# Next.js app
cd app-next-directory
npm install

# Sanity Studio
cd ../sanity
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` in the app-next-directory directory
   - Fill in the required environment variables

4. Run the development servers:

```bash
# Next.js app (http://localhost:3000)
cd app-next-directory
npm run dev

# Sanity Studio (http://localhost:3333)
cd ../sanity
npm run dev
```

## 📁 Project Structure

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/              # Next.js application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript types
│   └── ... config files
├── sanity/                    # Sanity CMS
│   ├── schemas/              # Content models
│   ├── structure/            # Desk structure
│   └── ... config files
└── ... root config files
```

## 🔍 API Routes

The directory exposes several API endpoints:

```
GET /api/listings            # List filtered listings
GET /api/listings/[slug]     # Fetch listing detail
GET /api/blog                # Blog posts feed
GET /api/events              # Upcoming events
POST /api/reviews            # Submit a review
GET /api/user/favorites      # User's saved listings
```

## 🔧 Known Issues & Solutions

### Deprecated Package Dependencies

This workspace may show warnings for deprecated dependencies such as:

- `string-similarity@4.0.4` (replace with `fastest-levenshtein`)
- `inflight@1.0.6` (transitive, resolved by updating other packages)
- `glob@7.2.3` (update to `glob@10.x` or higher)

#### How to fix

From the `app-next-directory` directory, run:

```bash
npm uninstall string-similarity
npm install fastest-levenshtein glob@10.3.10 --save

npm update
```

Repeat for other workspace packages as needed.

#### Workspace Structure

This repository contains:

- `app-next-directory/` – Next.js 14+ frontend (see its README for details)
- `sanity/` – Sanity CMS studio (see its README for details)

For detailed setup, see each subdirectory's README.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

For questions or suggestions, please open an issue on our GitHub repository.
