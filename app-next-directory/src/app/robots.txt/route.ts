import { MetadataRoute } from 'next';

export function GET(): Response {
  const robots: MetadataRoute.Robots = {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/private/']
      }
    ],
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }

  // Ensure rules is an array and provide proper typing
  const rulesArray = Array.isArray(robots.rules) ? robots.rules : [robots.rules];

  const robotsText = rulesArray
    .map((rule: any) => {
      let text = `User-agent: ${rule.userAgent}\n`;
      if (rule.allow) {
        if (Array.isArray(rule.allow)) {
          rule.allow.forEach((path: string) => text += `Allow: ${path}\n`);
        } else {
          text += `Allow: ${rule.allow}\n`;
        }
      }
      if (rule.disallow) {
        if (Array.isArray(rule.disallow)) {
          rule.disallow.forEach((path: string) => text += `Disallow: ${path}\n`);
        } else {
          text += `Disallow: ${rule.disallow}\n`;
        }
      }
      return text;
    })
    .join('\n') + (robots.sitemap ? `\nSitemap: ${robots.sitemap}` : '');

  return new Response(robotsText, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
