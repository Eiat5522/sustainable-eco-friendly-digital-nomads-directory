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
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Menu, X, Leaf, Map, Calendar, User } from 'lucide-react';

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
              S.documentTypeListItem('nomadFeature').title('Nomad Features'),
              S.documentTypeListItem('review').title('Reviews')
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

/**
 * Main navigation component
 * 
 * This component renders the top navigation bar for the application, including
 * the logo, links to explore, events, community, and a search button. It also
 * handles the mobile menu toggle and scroll-based styling.
 */
export function MainNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Leaf className="h-8 w-8 text-green-500" />
              <span className="ml-2 text-xl font-medium text-gray-900">EcoNomad</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/explore" className="text-gray-700 hover:text-green-600 flex items-center group">
              <Map className="mr-1 h-4 w-4" />
              <span>Explore</span>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-green-600 mt-0.5"></span>
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-green-600 flex items-center group">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Events</span>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-green-600 mt-0.5"></span>
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-green-600 flex items-center group">
              <User className="mr-1 h-4 w-4" />
              <span>Community</span>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-green-600 mt-0.5"></span>
            </Link>
            <button className="ml-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-full px-4 py-2 flex items-center transition">
              <Search className="h-4 w-4 mr-2" />
              <span>Search</span>
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-green-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white shadow-lg"
        >
          <div className="px-4 py-2">
            <Link href="/explore" className="block text-gray-700 hover:text-green-600 py-2">
              <Map className="mr-2 h-5 w-5 inline-block" />
              Explore
            </Link>
            <Link href="/events" className="block text-gray-700 hover:text-green-600 py-2">
              <Calendar className="mr-2 h-5 w-5 inline-block" />
              Events
            </Link>
            <Link href="/community" className="block text-gray-700 hover:text-green-600 py-2">
              <User className="mr-2 h-5 w-5 inline-block" />
              Community
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}
