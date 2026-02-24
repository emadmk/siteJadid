import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const URLS_PER_SITEMAP = 1000;

/**
 * Sanitize a slug for safe use in sitemap XML URLs.
 * Encodes URI components and strips any remaining XML-unsafe characters.
 */
function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  // Encode special characters for URL safety (& -> %26, etc.)
  return encodeURIComponent(slug.trim());
}

/**
 * Generate multiple sitemap IDs for sitemap index.
 * Next.js will generate /sitemap/0.xml, /sitemap/1.xml, etc.
 */
export async function generateSitemaps() {
  try {
    const productCount = await prisma.product.count({
      where: { status: 'ACTIVE' },
    });
    const categoryCount = await prisma.category.count({
      where: { isActive: true },
    });

    // 14 static pages + products + categories
    const totalUrls = 14 + productCount + categoryCount;
    const sitemapCount = Math.max(1, Math.ceil(totalUrls / URLS_PER_SITEMAP));

    return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://safetyequipmentstore.com';

  try {
    // Static pages (only in the first sitemap)
    const staticPages: MetadataRoute.Sitemap =
      id === 0
        ? [
            {
              url: baseUrl,
              lastModified: new Date(),
              changeFrequency: 'daily',
              priority: 1,
            },
            {
              url: `${baseUrl}/products`,
              lastModified: new Date(),
              changeFrequency: 'daily',
              priority: 0.9,
            },
            {
              url: `${baseUrl}/categories`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.8,
            },
            {
              url: `${baseUrl}/about`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.5,
            },
            {
              url: `${baseUrl}/contact`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.5,
            },
            {
              url: `${baseUrl}/faq`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.5,
            },
            {
              url: `${baseUrl}/shipping-info`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.4,
            },
            {
              url: `${baseUrl}/returns`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.4,
            },
            {
              url: `${baseUrl}/terms`,
              lastModified: new Date(),
              changeFrequency: 'yearly',
              priority: 0.3,
            },
            {
              url: `${baseUrl}/privacy`,
              lastModified: new Date(),
              changeFrequency: 'yearly',
              priority: 0.3,
            },
            {
              url: `${baseUrl}/shipping-policy`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.3,
            },
            {
              url: `${baseUrl}/accessibility`,
              lastModified: new Date(),
              changeFrequency: 'yearly',
              priority: 0.3,
            },
            {
              url: `${baseUrl}/cookies`,
              lastModified: new Date(),
              changeFrequency: 'yearly',
              priority: 0.3,
            },
            {
              url: `${baseUrl}/track-order`,
              lastModified: new Date(),
              changeFrequency: 'monthly',
              priority: 0.4,
            },
          ]
        : [];

    const staticCount = id === 0 ? staticPages.length : 0;
    const dynamicLimit = URLS_PER_SITEMAP - staticCount;

    // Calculate offset for dynamic entries across sitemaps
    // First sitemap has fewer dynamic slots because of static pages
    const dynamicOffset =
      id === 0 ? 0 : URLS_PER_SITEMAP - 14 + (id - 1) * URLS_PER_SITEMAP;

    // Fetch all active products (paginated)
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
      orderBy: { id: 'asc' },
      skip: dynamicOffset,
      take: dynamicLimit,
    });

    const productPages: MetadataRoute.Sitemap = products
      .filter((p) => p.slug && p.slug.trim() !== '')
      .map((product) => ({
        url: `${baseUrl}/products/${sanitizeSlug(product.slug)}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

    // If products didn't fill the limit, also fetch categories
    const remaining = dynamicLimit - products.length;
    let categoryPages: MetadataRoute.Sitemap = [];

    if (remaining > 0 && products.length < dynamicLimit) {
      // Calculate how many products there are total to figure out category offset
      const totalProducts = await prisma.product.count({
        where: { status: 'ACTIVE' },
      });

      const categoryOffset = Math.max(
        0,
        dynamicOffset - totalProducts
      );

      if (dynamicOffset + dynamicLimit > totalProducts) {
        const categoryTake = Math.min(
          remaining,
          dynamicLimit
        );

        const categories = await prisma.category.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
          orderBy: { id: 'asc' },
          skip: categoryOffset,
          take: categoryTake,
        });

        categoryPages = categories
          .filter((c) => c.slug && c.slug.trim() !== '')
          .map((category) => ({
            url: `${baseUrl}/categories/${sanitizeSlug(category.slug)}`,
            lastModified: category.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }));
      }
    }

    return [...staticPages, ...productPages, ...categoryPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ];
  }
}
