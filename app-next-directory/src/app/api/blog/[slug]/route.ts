
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { structuredLogger } from '@/lib/logger';

const CACHE_EXPIRATION_SECONDS = 1800; // 30 minutes

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const redis = getRedisClient();
  const cacheKey = `blog-post:${slug}`;

  if (redis) {
    try {
      const cached = await redis.get<any>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (error) {
      structuredLogger.apiError(`/api/blog/${slug}`, error, {
        message: 'Failed to read from Redis cache, fetching from source',
      });
    }
  }

  try {
    const post = await client.fetch(
      groq`*[_type == "blogPost" && slug.current == $slug][0]`,
      { slug }
    );

    if (!post) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const comments = await client.fetch(
      groq`*[
        _type == "comment" &&
        post._ref == $postId &&
        approved == true &&
        !(_id in path("drafts.**"))
      ] | order(coalesce(createdAt, _createdAt) asc) {
        _id,
        content,
        "createdAt": coalesce(createdAt, _createdAt),
        user->{ name }
      }`,
      { postId: post._id }
    );

    const data = { post, comments };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(data), {
          ex: CACHE_EXPIRATION_SECONDS,
        });
      } catch (error) {
        structuredLogger.apiError(`/api/blog/${slug}`, error, {
          message: 'Failed to write to Redis cache',
        });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    structuredLogger.apiError(`/api/blog/${slug}`, error, {
      message: 'Failed to fetch blog post',
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
