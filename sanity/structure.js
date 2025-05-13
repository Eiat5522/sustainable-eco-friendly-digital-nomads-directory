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
        .icon(FaList)
        .child(
          S.list()
            .title('Listings')
            .items([
              S.listItem()
                .title('All Listings')
                .icon(FaList)
                .child(
                  S.documentTypeList('listing')
                    .title('All Listings')
                    .filter('_type == "listing"')
                ),
              // Filter by category
              S.listItem()
                .title('Listings by Category')
                .icon(FaList)
                .child(
                  S.list()
                    .title('Listings by Category')
                    .items([
                      S.listItem()
                        .title('Coworking Spaces')
                        .icon(FaLaptop)
                        .child(
                          S.documentTypeList('listing')
                            .title('Coworking Spaces')
                            .filter('_type == "listing" && category == "coworking"')
                        ),
                      S.listItem()
                        .title('Cafes')
                        .icon(FaCoffee)
                        .child(
                          S.documentTypeList('listing')
                            .title('Cafes')
                            .filter('_type == "listing" && category == "cafe"')
                        ),
                      S.listItem()
                        .title('Accommodations')
                        .icon(FaBed)
                        .child(
                          S.documentTypeList('listing')
                            .title('Accommodations')
                            .filter('_type == "listing" && category == "accommodation"')
                        ),
                    ])
                ),
            ])
        ),
      
      // Reference data
      S.divider(),
      S.listItem()
        .title('Cities')
        .icon(FaMapMarkerAlt)
        .child(S.documentTypeList('city').title('Cities')),
      S.listItem()
        .title('Eco Tags')
        .icon(FaLeaf)
        .child(S.documentTypeList('ecoTag').title('Eco Tags')),
      S.listItem()
        .title('Digital Nomad Features')
        .icon(FaLaptop)        .child(S.documentTypeList('nomadFeature').title('Digital Nomad Features')),
    ]);

// Export the structure for sanity.config.js
export const structure = (S) => customStructure(S);
