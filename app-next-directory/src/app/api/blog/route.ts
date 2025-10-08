
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { structuredLogger } from '@/lib/logger';

const CACHE_KEY = 'blog-posts';
const CACHE_EXPIRATION_SECONDS = 1800; // 30 minutes

export async function GET(request: Request) {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get<any[]>(CACHE_KEY);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (error) {
      structuredLogger.apiError('/api/blog', error, {
        message: 'Failed to read from Redis cache, fetching from source',
      });
    }
  }

  try {
    const posts = await client.fetch(
      groq`*[
        _type == "blogPost" &&
        !(_id in path('drafts.**')) &&
        defined(publishedAt) &&
        publishedAt <= now()
      ] | order(publishedAt desc, _createdAt desc)`
    );

    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(posts), {
          ex: CACHE_EXPIRATION_SECONDS,
        });
      } catch (error) {
        structuredLogger.apiError('/api/blog', error, {
          message: 'Failed to write to Redis cache',
        });
      }
    }

    return NextResponse.json(posts);
  } catch (error) {
    structuredLogger.apiError('/api/blog', error, {
      message: 'Failed to fetch blog posts',
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
