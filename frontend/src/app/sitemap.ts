import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://taliq.middlemind.ai';
  const now = new Date().toISOString();

  const pages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/candidate`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/employee`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  pages.forEach((page) => {
    sitemap.push(page);
    sitemap.push({
      ...page,
      url: `${baseUrl}/ar${page.url.replace(baseUrl, '')}`,
      alternates: {
        languages: {
          'en': page.url,
          'ar': `${baseUrl}/ar${page.url.replace(baseUrl, '')}`,
        },
      },
    });
  });

  return sitemap;
}
