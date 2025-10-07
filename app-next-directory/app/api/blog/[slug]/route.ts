// import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
// import { groq } from 'next-sanity';
import { NextRequest } from 'next/server';
// import { transformToBlogDetailDTO } from '@/lib/dto-transformer';

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

// GET endpoint for fetching a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // TODO: Re-enable Sanity integration when configured
  // For now, use mock data to demonstrate the new newspaper-style UI
  
  const { slug } = await params;
  
  if (!slug) {
    return ApiResponseHandler.error('Blog post slug is required', 400);
  }
  
  const mockPost = mockPosts[slug];
  
  if (!mockPost) {
    return ApiResponseHandler.notFound('Blog post');
  }

  const formattedPost = {
    id: mockPost._id,
    title: mockPost.title,
    body: mockPost.body,
    imageUrl: mockPost.imageUrl,
    excerpt: mockPost.excerpt,
  };

  return ApiResponseHandler.success({
    post: formattedPost,
    comments: [],
  });
}

// Simple view count tracking (in-memory for demo - consider Redis for production)
const viewCounts = new Map<string, number>();

async function trackViewCount(postId: string): Promise<number> {
  const currentCount = viewCounts.get(postId) || 0;
  const newCount = currentCount + 1;
  viewCounts.set(postId, newCount);

  // TODO: In production, persist this to database
  // await updateViewCount(postId, newCount);

  return newCount;
}

// PUT endpoint for updating view count (optional)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    if (body.action === 'increment_view') {
      // Find post ID by slug
      const post = await sanityClient.fetch(
        groq`*[_type == "blogPost" && slug.current == $slug][0]{ _id, "slug": slug.current }`,
        { slug }
      );

      if (!post) {
        return ApiResponseHandler.notFound('Blog post');
      }

      const viewCount = await trackViewCount(post._id);

      return ApiResponseHandler.success(
        { viewCount },
        'View count updated successfully'
      );
    }

    return ApiResponseHandler.error('Invalid action', 400);

  } catch (error) {
    console.error('Error updating blog post:', error);
    return ApiResponseHandler.error('Failed to update blog post', 500);
  }
}
