// import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
// import { transformToBlogSummaryDTO } from '@/lib/dto-transformer';
// import { groq } from 'next-sanity';
// import type { QueryParams } from '@sanity/client';
import { NextRequest } from 'next/server';

// Mock data for development when Sanity is not available
const mockPosts = [
  {
    _id: '1',
    title: 'The Rise of Sustainable Digital Nomadism',
    slug: { current: 'sustainable-digital-nomadism' },
    excerpt: 'Exploring how remote workers are embracing eco-friendly practices while traveling the world. From carbon-neutral accommodations to zero-waste lifestyles, the new generation of nomads is redefining sustainable travel.',
    tags: ['sustainability', 'remote-work', 'eco-travel'],
    imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=450&fit=crop',
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    _id: '2',
    title: 'Top 10 Carbon-Neutral Coworking Spaces in Europe',
    slug: { current: 'carbon-neutral-coworking-europe' },
    excerpt: 'Discover the most environmentally conscious workspaces across Europe that are leading the charge in sustainable business practices and green technology.',
    tags: ['coworking', 'europe', 'sustainability'],
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=450&fit=crop',
    publishedAt: '2024-01-14T10:00:00Z',
  },
  {
    _id: '3',
    title: 'Remote Work and Renewable Energy: A Perfect Match',
    slug: { current: 'remote-work-renewable-energy' },
    excerpt: 'How digital nomads are choosing destinations powered by renewable energy sources and contributing to a greener future for remote work.',
    tags: ['remote-work', 'renewable-energy', 'eco'],
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
    publishedAt: '2024-01-13T10:00:00Z',
  },
  {
    _id: '4',
    title: 'Zero Waste Living: A Digital Nomad\'s Guide',
    slug: { current: 'zero-waste-nomad-guide' },
    excerpt: 'Practical tips and strategies for maintaining a zero-waste lifestyle while constantly on the move. Learn how to minimize your environmental footprint wherever you go.',
    tags: ['zero-waste', 'lifestyle', 'sustainability'],
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=450&fit=crop',
    publishedAt: '2024-01-12T10:00:00Z',
  },
  {
    _id: '5',
    title: 'Building Community: Eco-Conscious Nomad Networks',
    slug: { current: 'eco-conscious-nomad-networks' },
    excerpt: 'The importance of connecting with like-minded travelers who share your values. Explore the growing networks of environmentally conscious digital nomads around the globe.',
    tags: ['community', 'networking', 'eco'],
    imageUrl: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=800&h=450&fit=crop',
    publishedAt: '2024-01-11T10:00:00Z',
  },
  {
    _id: '6',
    title: 'Sustainable Transportation for Digital Nomads',
    slug: { current: 'sustainable-transportation' },
    excerpt: 'From electric vehicles to bike-sharing programs, discover the best eco-friendly transportation options for nomads in major cities worldwide.',
    tags: ['transportation', 'sustainability', 'travel'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
    publishedAt: '2024-01-10T10:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  // TODO: Re-enable Sanity integration when configured
  // For now, return mock data to demonstrate the new newspaper-style UI
  
  const formattedMockPosts = mockPosts.map((post) => ({
    id: post._id,
    title: post.title,
    slug: post.slug.current,
    excerpt: post.excerpt,
    tags: post.tags,
    imageUrl: post.imageUrl,
  }));
  
  return ApiResponseHandler.success({
    posts: formattedMockPosts,
    pagination: {
      page: 1,
      limit: formattedMockPosts.length,
      totalCount: formattedMockPosts.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    },
    filters: { tag: null, search: null },
  });
}
