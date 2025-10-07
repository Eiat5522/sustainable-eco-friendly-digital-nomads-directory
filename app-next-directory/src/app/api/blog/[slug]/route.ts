
// import { client } from '@/lib/sanity/client';
// import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';

// Mock blog posts
const mockPosts: Record<string, any> = {
  'sustainable-digital-nomadism': {
    _id: '1',
    title: 'The Rise of Sustainable Digital Nomadism',
    slug: { current: 'sustainable-digital-nomadism' },
    excerpt: 'Exploring how remote workers are embracing eco-friendly practices while traveling the world.',
    imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=630&fit=crop',
    body: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'The digital nomad lifestyle has undergone a remarkable transformation in recent years. What once was characterized by a focus on finding the cheapest accommodation and fastest wifi has evolved into a movement centered on sustainability and environmental consciousness.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Today\'s digital nomads are increasingly aware of their carbon footprint and the impact their lifestyle has on the communities they visit. This shift represents a maturation of the remote work movement, one that recognizes the privilege of location independence comes with responsibility.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'Sustainable digital nomadism encompasses several key principles: choosing eco-friendly accommodations, supporting local businesses, minimizing waste, using green transportation, and giving back to local communities. These principles aren\'t just good for the planet—they often lead to richer, more meaningful travel experiences.',
          },
        ],
      },
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'The rise of carbon-neutral coworking spaces, eco-hostels, and green coliving spaces demonstrates that the infrastructure for sustainable nomadism is growing. Cities around the world are recognizing the value of attracting environmentally conscious remote workers and are investing in the facilities and policies to support them.',
          },
        ],
      },
    ],
  },
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  // Support both Next.js 14 and 15 params handling
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;
  
  // TODO: Re-enable Sanity integration when configured
  // For now, use mock data to demonstrate the new newspaper-style UI
  
  const mockPost = mockPosts[slug];
  
  if (!mockPost) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const formattedPost = {
    id: mockPost._id,
    title: mockPost.title,
    body: mockPost.body,
    imageUrl: mockPost.imageUrl,
    excerpt: mockPost.excerpt,
  };

  return NextResponse.json({
    success: true,
    data: {
      post: formattedPost,
      comments: [],
    },
  });
}
