/**
 * Custom desk structure for Sanity Studio
 * 
 * This file defines the structure of the studio's content pane and adds features
 * like document previews and custom document groupings.
 */
import { FaLeaf, FaMapMarkerAlt, FaBuilding, FaCoffee, FaBed, FaLaptop, FaList } from 'react-icons/fa';
import { definePlugin, defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { Iframe } from 'sanity-plugin-iframe-pane';
import { previewConfig } from './config/preview';

// Icons for document types (you can replace these with your preferred icons)
const ICONS = {
  listings: '🏠',
  cities: '🌆',
  blog: '📝',
  events: '📅',
  settings: '⚙️',
  users: '👥'
}

// Define structure with custom organization and preview
// Use the S parameter provided by Sanity, do not import StructureBuilder
export const getDefaultDocumentNode = (S) => ({ schemaType }) => {
  // Add preview pane for certain document types
  if (
    ['listing', 'city', 'ecoTag', 'nomadFeature'].includes(schemaType)
  ) {    return S.document().views([
      S.view.form(),
      S.view
        .component(Iframe)
        .options({
          // Preview URL based on document type and slug
          url: (doc) => {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const slug = doc.slug?.current;

            if (!slug) {
              return `${baseUrl}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&id=${doc._id}&type=${doc._type}`;
            }

            if (doc._type === 'listing') {
              return `${baseUrl}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${slug}&type=listing`;
            }

            return `${baseUrl}/api/preview?secret=${process.env.SANITY_PREVIEW_SECRET}&slug=${slug}&type=${doc._type}`;
          },
          defaultSize: 'desktop', // or 'mobile'
          reload: {
            button: true, // show reload button
          },
          attributes: {
            allow: 'fullscreen', // Allow fullscreen mode
            referrerPolicy: 'strict-origin-when-cross-origin',
            sandbox: 'allow-same-origin allow-forms allow-scripts',
          },
        })
        .title('Preview'),
    ]);
  }
  
  return S.document().views([S.view.form()]);
};

// Export structure function
export default (S) =>
  S.list()
    .title('Content')
    .items([
      // Listings section with icon
      S.listItem()
        .title('Listings')
        .icon(() => ICONS.listings)
        .child(
          S.list()
            .title('Listings')
            .items([
              S.listItem()
                .title('All Listings')
                .child(
                  S.documentList()
                    .title('All Listings')
                    .filter('_type == "listing"')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
              S.listItem()
                .title('By Category')
                .child(
                  S.list()
                    .title('Listings by Category')
                    .items([
                      createCategoryList('Coworking Spaces', 'coworking'),
                      createCategoryList('Cafes', 'cafe'),
                      createCategoryList('Accommodations', 'accommodation'),
                      createCategoryList('Restaurants', 'restaurant'),
                      createCategoryList('Activities', 'activity')
                    ])
                ),
              S.divider(),
              S.documentTypeListItem('ecoTag').title('Eco Tags'),
              S.documentTypeListItem('nomadFeature').title('Nomad Features')
            ])
        ),
      
      // Cities Section
      S.listItem()
        .title('Cities')
        .icon(() => ICONS.cities)
        .child(
          S.documentTypeList('city')
            .title('Cities')
            .defaultOrdering([{ field: 'name', direction: 'asc' }])
        ),

      // Content Section
      S.listItem()
        .title('Content')
        .icon(() => ICONS.blog)
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('blogPost').title('Blog Posts'),
              S.documentTypeListItem('event').title('Events')
            ])
        ),

      // Reviews & Comments
      S.listItem()
        .title('User Content')
        .child(
          S.list()
            .title('User Content')
            .items([
              S.documentTypeListItem('review')
                .title('Reviews')
                .child(
                  S.documentList()
                    .title('Reviews')
                    .filter('_type == "review"')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                ),
              S.documentTypeListItem('comment').title('Comments')
            ])
        ),

      // Users Section
      S.listItem()
        .title('Users')
        .icon(() => ICONS.users)
        .child(
          S.documentTypeList('user')
            .title('Users')
            .defaultOrdering([{ field: 'name', direction: 'asc' }])
        ),

      // Divider
      S.divider(),

      // Settings (can be expanded later)
      S.listItem()
        .title('Settings')
        .icon(() => ICONS.settings)
        .child(
          S.list()
            .title('Settings')
            .items([
              // Add settings documents here when needed
            ])
        )
    ])

// Helper function to create category-filtered lists
function createCategoryList(title, categoryValue) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == "listing" && category == $category')
        .params({ category: categoryValue })
        .defaultOrdering([{ field: 'name', direction: 'asc' }])
    )
}
