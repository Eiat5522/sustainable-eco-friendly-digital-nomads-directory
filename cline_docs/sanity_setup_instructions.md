# Sanity CMS Setup Instructions

This document provides step-by-step instructions for setting up the Sanity CMS for the Sustainable Eco-Friendly Digital Nomads Directory project.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Sanity.io account (free tier)

## 1. Install Sanity CLI

First, install the Sanity CLI globally:

```bash
npm install -g @sanity/cli
```

## 2. Initialize Sanity Project

Create a new Sanity project:

```bash
cd sanity
sanity login
sanity init
```

Follow the prompts:
1. Create a new project
2. Give your project a name (e.g., "Sustainable Eco Nomad Directory")
3. Use the default dataset configuration
4. Select "Clean project with no predefined schemas" when asked about project template
5. Accept the default path for the studio

## 3. Configure Environment Variables

Create a `.env.local` file in the Next.js app-scaffold directory:

```bash
cd ../app-scaffold
touch .env.local
```

Add the following environment variables to the `.env.local` file:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-05-03
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace `your_project_id` with the actual project ID from your Sanity dashboard.

## 4. Update Sanity Configuration

Open the `sanity.config.js` file in the `sanity` directory and update the `projectId` field with your actual Sanity project ID.

## 5. Install Dependencies

Install the required dependencies for both the Sanity studio and the Next.js app:

```bash
# In the sanity directory
cd ../sanity
npm install

# In the Next.js app directory
cd ../app-scaffold
npm install
```

## 6. Run Data Migration

To migrate the existing listings data to Sanity, first create a Sanity API token:

1. Go to [https://www.sanity.io/manage](https://www.sanity.io/manage)
2. Select your project
3. Navigate to API tab
4. Create a new token with Editor permissions

Set the token as an environment variable and run the migration script:

```bash
cd ../sanity
export SANITY_TOKEN=your_sanity_api_token
node migrations/import-listings.js
```

Replace `your_sanity_api_token` with the actual token from the Sanity dashboard.

## 7. Start the Development Servers

Start the Sanity Studio:

```bash
cd ../sanity
npm run dev
```

This will run the Sanity Studio on http://localhost:3333

In another terminal, start the Next.js development server:

```bash
cd ../app-scaffold
npm run dev
```

This will run the Next.js app on http://localhost:3000

## 8. Access the Studio and CMS

Open your browser and navigate to:
- http://localhost:3333 - to access the Sanity Studio
- http://localhost:3000 - to view your Next.js app

## 9. Frontend Components Overview

The following components have been updated to work with Sanity data:

### ListingCard Component

- Supports both legacy data format and Sanity data format
- Handles Sanity image URLs with proper optimization
- Displays listing data with consistent styling
- Usage: `<ListingCard listing={listing} useSlug={true} />`
  - Set `useSlug={true}` when working with Sanity data to use slugs for URLs

### ListingGrid Component

- Displays a grid of ListingCard components
- Handles both data formats transparently
- Usage: `<ListingGrid listings={listings} useSlug={true} />`

### Listing Detail Pages

- Dynamic route `/listings/[slug]` for Sanity listings using slugs
- Legacy support via `/listings/[id]` for backward compatibility
- Both display consistent UI regardless of data source

### API Routes

- `/api/listings` route now fetches from Sanity by default
- Supports filtering by category, city, eco tags, and nomad features
- Falls back to JSON data if Sanity is not configured
- Example: `/api/listings?category=coworking&city=chiang-mai`

## 9. Deploy the Sanity Studio

When you're ready to deploy the Sanity Studio to production:

```bash
cd ../sanity
sanity deploy
```

This will deploy the studio to a URL like: https://your-project-name.sanity.studio

## 10. Adding Content Editors

To add team members as content editors:

1. Go to [https://www.sanity.io/manage](https://www.sanity.io/manage)
2. Select your project
3. Navigate to the "Members" tab
4. Invite team members with appropriate roles (Editor, Developer, etc.)

## 11. Setting Up Preview Mode

To enable content editors to preview their changes before publishing:

1. Create a secure preview secret and add it to your environment variables:

```
# Add to .env.local
SANITY_PREVIEW_SECRET=your_secure_random_string
SANITY_API_TOKEN=your_api_token_with_viewer_rights
```

2. Configure the Desk structure in Sanity Studio to include preview links:

```js
// In sanity/structure.js, add preview options to document views
S.view
  .component(Iframe)
  .options({
    url: (doc) => {
      const slug = doc.slug?.current;
      if (!slug) return null;
      return `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${slug}&type=${doc._type}`;
    },
    defaultSize: 'desktop',
  })
  .title('Preview')
```

3. Enable CORS for your frontend domain in your Sanity project settings to allow preview mode to work correctly.

## Troubleshooting

- **Image Upload Issues**: Make sure you've configured CORS settings correctly in your Sanity project settings
- **API Connection Problems**: Verify that your environment variables are set correctly
- **Schema Errors**: Check that your schema definitions match the expected structure in your queries

For more detailed instructions, refer to the [Sanity documentation](https://www.sanity.io/docs).
