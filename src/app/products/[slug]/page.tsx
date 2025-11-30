import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { ProductDetail } from '@/components/storefront/products/ProductDetail';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: {
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      tieredPrices: {
        orderBy: {
          minQuantity: 'asc',
        },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
    gsaPrice: product.gsaPrice ? Number(product.gsaPrice) : null,
    images: product.images as string[],
    isFeatured: product.isFeatured,
    stockQuantity: product.stockQuantity,
    weight: product.weight ? Number(product.weight) : null,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    status: product.status,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    reviews: product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: {
        name: r.user.name,
      },
    })),
    tieredPrices: product.tieredPrices.map((t) => ({
      id: t.id,
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      price: Number(t.price),
    })),
  };
}

async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];

  const products = await db.product.findMany({
    where: {
      categoryId,
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      id: { not: currentProductId },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      salePrice: true,
      images: true,
    },
    take: 4,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    images: p.images as string[],
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product || product.status !== 'ACTIVE') {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.category?.id || null,
    product.id
  );

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | AdaSupply',
    };
  }

  return {
    title: product.metaTitle || `${product.name} | AdaSupply`,
    description:
      product.metaDescription ||
      product.description ||
      `Buy ${product.name} from AdaSupply. Professional safety equipment and industrial supplies.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}
