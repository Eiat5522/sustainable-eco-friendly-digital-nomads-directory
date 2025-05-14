# Sustainable Eco-Friendly Digital Nomads Directory

A curated directory of sustainable, eco-friendly venues and services for digital nomads in Thailand, built with Next.js.

## Features

- 🌱 Curated eco-friendly listings
- 🔍 Advanced search and filter system
  - Full-text search across names and descriptions
  - Category filtering (coworking, cafe, accommodation)
  - Location-based filtering by city
  - Eco tag filtering
  - Digital nomad feature filtering
  - Rating-based filtering (1-5 stars)
  - Price range filtering
- 📍 Interactive map integration
- 🖼️ Optimized image loading
- 📱 Responsive design
- 🌓 Dark mode support
- 🗺️ SEO-friendly

## Tech Stack

- Next.js 15.3.2
- TypeScript
- Tailwind CSS
- Leaflet.js for maps
- Next/Image for optimized images
- Sanity.io for CMS

## Filter System API

The directory supports comprehensive filtering through its API:

```typescript
// Filter Parameters
interface FilterState {
  searchQuery: string;      // Full-text search
  category: string | null;  // Listing category
  city: string | null;     // Location
  ecoTags: string[];       // Sustainability features
  features: string[];      // Digital nomad amenities
  minRating: number | null; // Minimum star rating
  priceRange: [number, number]; // Price range in THB
}

// Example API Usage
GET /api/listings?search=quiet&category=coworking&city=bangkok&minRating=4
```

Filters can be combined and are applied server-side for optimal performance, with client-side fallback if needed.

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd sustainable-eco-friendly-digital-nomads-directory
```

2. Install dependencies:
```bash
cd app-scaffold
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
app-scaffold/
├── public/
│   └── images/
│       └── listings/    # Listing images
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── lib/           # Utility functions
│   └── types/         # TypeScript types
└── ...configuration files
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
