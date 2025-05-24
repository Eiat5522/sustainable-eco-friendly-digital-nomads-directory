# Sustainable Eco-Friendly Digital Nomads Directory

A curated directory of sustainable, eco-friendly venues and services for digital nomads in Thailand, built with Next.js 14+ and Sanity CMS.

## 🌱 Features

- **Curated Eco-Friendly Listings**
  - Verified sustainability practices
  - Community-reviewed sustainability scores
- **Advanced Search & Filtering**
  - Full-text search across names and descriptions
  - Category filtering (coworking, cafe, accommodation)
  - Location-based filtering by city/region
  - Eco tag filtering (zero-waste, renewable energy, etc.)
  - Digital nomad feature filtering (fast WiFi, standing desks, etc.)
  - Rating-based filtering (1-5 stars)
  - Price range filtering
- **Interactive Map Integration** with Leaflet.js and OpenStreetMap
- **User Accounts & Authentication** via NextAuth.js
- **Reviews & Favorites System**
- **Responsive Design & Dark Mode Support**
- **SEO-Optimized Listings & Blog**
- **Event Calendar** for sustainability meetups

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **CMS**: Sanity.io (headless CMS)
- **Database**: MongoDB Atlas (user data, auth)
- **Map**: Leaflet.js + OpenStreetMap
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **Deployment**: Vercel Hobby tier
- **CI/CD**: GitHub Actions

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
