import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const siteUrl = rawSiteUrl.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/private/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}