import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { ProductDetail } from '@/components/storefront/products/ProductDetail';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Helper function to get full category hierarchy
async function getCategoryHierarchy(categoryId: string | null): Promise<Array<{ id: string; name: string; slug: string }>> {
  if (!categoryId) return [];

  const hierarchy: Array<{ id: string; name: string; slug: string }> = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category = await db.category.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
      },
    });

    if (!category) break;

    hierarchy.unshift({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });

    currentId = category.parentId;
  }

  return hierarchy;
}

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
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
      // Include product variants
      variants: {
        where: {
          isActive: true,
        },
        include: {
          attributeValues: {
            include: {
              attribute: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!product) return null;

  // Get full category hierarchy
  const categoryHierarchy = await getCategoryHierarchy(product.categoryId);

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
    gsaPrice: product.gsaPrice ? Number(product.gsaPrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    priceUnit: product.priceUnit || 'ea',
    qtyPerPack: product.qtyPerPack || 1,
    images: product.images as string[],
    colorImages: product.colorImages as Record<string, number[]> | null,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    minimumOrderQty: product.minimumOrderQty || 1,
    weight: product.weight ? Number(product.weight) : null,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    metaKeywords: product.metaKeywords,
    status: product.status,
    categoryId: product.categoryId,
    brandId: product.brandId,
    defaultSupplierId: product.defaultSupplierId,
    defaultWarehouseId: product.defaultWarehouseId,
    complianceCertifications: product.complianceCertifications as string[],
    categoryHierarchy,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
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
    // Map variants
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      color: v.color,
      size: v.size,
      material: v.material,
      basePrice: Number(v.basePrice),
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
      gsaPrice: v.gsaPrice ? Number(v.gsaPrice) : null,
      priceUnit: v.priceUnit || 'ea',
      qtyPerPack: v.qtyPerPack || 1,
      stockQuantity: v.stockQuantity,
      isActive: v.isActive,
      images: v.images as string[],
      attributeValues: v.attributeValues.map((av) => ({
        attributeId: av.attributeId,
        value: av.value,
        attribute: {
          id: av.attribute.id,
          name: av.attribute.name,
          code: av.attribute.code,
        },
      })),
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
      title: 'Product Not Found | ADA Supply',
    };
  }

  return {
    title: product.metaTitle || `${product.name} | ADA Supply`,
    description:
      product.metaDescription ||
      product.description ||
      `Buy ${product.name} from ADA Supply. Professional safety equipment and industrial supplies.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}
