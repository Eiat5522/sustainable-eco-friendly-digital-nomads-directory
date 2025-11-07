# Codebase Summary (Updated: May 19, 2025)

## Overall Project Structure

```text
/app-next-directory            # Main Next.js application directory
  /src
    /app                 # Next.js App Router (pages, layouts)
      /layout.tsx        # Root layout with metadata and common structure
      /page.tsx          # Homepage component with hero section and main content
      /globals.css       # Global styles including Tailwind imports
      /listings          # Listings directory route
        /page.tsx        # Main listings page with filtering/sorting
        /[id]            # Dynamic route for individual listing details
          /page.tsx      # Individual listing detail page
    /components         # Reusable React components
      /layout           # Layout-specific components
        /Header.tsx     # Site header component
        /Footer.tsx     # Site footer component
      /listings         # Listing-specific components
        /ListingCard.tsx # Displays a single listing item in a card format
        /ListingGrid.tsx # Displays a grid of ListingCard components
        /ImageGallery.tsx # Component for displaying listing images
        /CityCarousel.tsx # Dynamic carousel for city displays
      /home             # Homepage-specific components
        /CitiesCarousel.tsx # Cities showcase carousel
        /FeaturedListings.tsx # Featured listings display
        /WhyChooseUs.tsx # Platform features and benefits section
    /lib                # Utility functions
      /listings.ts      # Functions for fetching and processing listing data
      /analytics        # Analytics integration
        /plausible      # Plausible analytics configuration
    /styles             # Additional styles
    /hooks             # Custom React hooks
    /types             # TypeScript type definitions
      /listings.ts     # TypeScript interfaces and enums for listing data
      /react.d.ts      # React type declarations
      /jsx.d.ts        # JSX type declarations
  /public              # Static assets
    /images
      /cities          # City images for carousel
      /listings        # Listing images
  /next.config.mjs     # Next.js configuration
  /postcss.config.mjs  # PostCSS configuration for Tailwind
  /package.json        # Project dependencies and scripts
  /tsconfig.json       # TypeScript configuration
```

## Key Components and Their Interactions

### Homepage Components (New)

- **CitiesCarousel**: Dynamic, auto-playing carousel showcasing cities

  - Uses Embla Carousel for smooth scrolling
  - Responsive design (1/2/3 cards per view)
  - Color placeholders for images
  - Navigation buttons and hover effects

- **FeaturedListings**: Grid display of featured sustainable spaces

  - Responsive card layout
  - Detail-rich listing previews
  - Eco-features and amenities display
  - Rating and pricing information

- **WhyChooseUs**: Platform features showcase
  - Icon-based feature cards
  - Clean, modern design
  - Hover effects
  - Responsive grid layout

### Layout Components

- **Header.tsx**: Navigation and branding
- **Footer.tsx**: Site information and links
- **ClientLayout.tsx**: Client-side layout wrapper

### Listing Components

- **ListingCard.tsx**: Individual listing display
- **ListingGrid.tsx**: Responsive listing grid
- **ImageGallery.tsx**: Optimized image gallery
- **CityCarousel.tsx**: City showcase carousel

## Data Flow

1. **Static Data**:

   - Sample cities and listings in page components
   - Type-safe interfaces for all data structures
   - Placeholder content for development

2. **Component Hierarchy**:

   - Root layout provides base structure
   - Page components compose feature components
   - Dynamic imports for client-side components
   - Proper separation of concerns

3. **Image Handling**:
   - Next.js Image component for optimization
   - Proper sizing and responsive images
   - Lazy loading implementation
   - Placeholder/blur-up loading

## Recent Updates (May 19, 2025)

1. **New Components**:

   - Added CitiesCarousel with Embla Carousel integration
   - Implemented FeaturedListings with detailed cards
   - Created WhyChooseUs component with feature highlights

2. **TypeScript Improvements**:

   - Enhanced type definitions for React
   - Added proper JSX type declarations
   - Improved component props typing

3. **Performance Optimization**:

   - Implemented proper client/server component separation
   - Added dynamic imports for client components
   - Optimized carousel performance

4. **Documentation**:
   - Updated component documentation
   - Added implementation notes
   - Enhanced type documentation

## Next Steps

1. **Data Integration**:

   - Connect components to real data sources
   - Implement data fetching patterns
   - Add loading states and error handling

2. **Testing**:

   - Add component tests
   - Implement integration tests
   - Add visual regression testing

3. **Performance**:

   - Add analytics tracking
   - Implement monitoring
   - Optimize bundle size

4. **Documentation**:

   - Add API documentation
   - Create component storybook
   - Update technical guides

5. **Listing Data Population (In Progress):**
   - Created image subfolders in `app-next-directory/public/images/listings/` for all listings.
   - Sourced and placed images for "Shinei Office Space", "JustCo One City Centre", and "Pier Lab".
