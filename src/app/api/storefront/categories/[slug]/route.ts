import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Smart filter keywords - these are extracted from product names/descriptions
// Keywords map to their normalized display value
const SMART_FILTER_PATTERNS: Record<string, { keywords: Record<string, string>; label: string }> = {
  gender: {
    keywords: {
      "men's": "Men",
      "mens": "Men",
      "men": "Men",
      "male": "Men",
      "women's": "Women",
      "womens": "Women",
      "women": "Women",
      "ladies": "Women",
      "female": "Women",
      "unisex": "Unisex",
    },
    label: 'Gender',
  },
  toeType: {
    keywords: {
      'steel toe': 'Steel Toe',
      'soft toe': 'Soft Toe',
      'composite toe': 'Composite Toe',
      'safety toe': 'Safety Toe',
      'alloy toe': 'Alloy Toe',
      'carbon toe': 'Carbon Toe',
    },
    label: 'Toe Type',
  },
  material: {
    keywords: {
      'leather': 'Leather',
      'rubber': 'Rubber',
      'synthetic': 'Synthetic',
      'nylon': 'Nylon',
      'polyester': 'Polyester',
      'cotton': 'Cotton',
      'kevlar': 'Kevlar',
      'neoprene': 'Neoprene',
      'latex': 'Latex',
      'nitrile': 'Nitrile',
      'vinyl': 'Vinyl',
      'fleece': 'Fleece',
    },
    label: 'Material',
  },
  size: {
    keywords: {
      'small': 'Small',
      'medium': 'Medium',
      'large': 'Large',
      'xl': 'XL',
      'xxl': 'XXL',
      'xxxl': 'XXXL',
      'one size': 'One Size',
    },
    label: 'Size',
  },
  color: {
    keywords: {
      'black': 'Black',
      'white': 'White',
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'yellow': 'Yellow',
      'orange': 'Orange',
      'brown': 'Brown',
      'gray': 'Gray',
      'grey': 'Gray',
      'navy': 'Navy',
      'hi-vis': 'Hi-Vis',
      'hi vis': 'Hi-Vis',
      'high visibility': 'Hi-Vis',
    },
    label: 'Color',
  },
  protection: {
    keywords: {
      'waterproof': 'Waterproof',
      'water resistant': 'Water Resistant',
      'fire resistant': 'Fire Resistant',
      'fr': 'Fire Resistant',
      'flame resistant': 'Fire Resistant',
      'cut resistant': 'Cut Resistant',
      'puncture resistant': 'Puncture Resistant',
      'slip resistant': 'Slip Resistant',
      'non-slip': 'Slip Resistant',
      'anti-slip': 'Slip Resistant',
      'insulated': 'Insulated',
      'thermal': 'Thermal',
    },
    label: 'Protection',
  },
  style: {
    keywords: {
      'boot': 'Boot',
      'shoe': 'Shoe',
      'sneaker': 'Sneaker',
      'loafer': 'Loafer',
      'oxford': 'Oxford',
      'hiker': 'Hiker',
      'athletic': 'Athletic',
      'work boot': 'Work Boot',
      '6 inch': '6 Inch',
      '6"': '6 Inch',
      '8 inch': '8 Inch',
      '8"': '8 Inch',
    },
    label: 'Style',
  },
};

function extractSmartFilters(products: { name: string; description: string | null }[]): Record<string, string[]> {
  const filters: Record<string, Set<string>> = {};

  for (const product of products) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();

    for (const [filterKey, { keywords }] of Object.entries(SMART_FILTER_PATTERNS)) {
      if (!filters[filterKey]) {
        filters[filterKey] = new Set();
      }

      // keywords is now a Record<string, string> where key is the search term and value is the normalized display name
      for (const [searchTerm, displayName] of Object.entries(keywords)) {
        if (text.includes(searchTerm.toLowerCase())) {
          // Add the normalized display name (this prevents duplicates like Men/Men's)
          filters[filterKey].add(displayName);
        }
      }
    }
  }

  // Convert sets to arrays and filter out empty categories
  const result: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(filters)) {
    if (values.size > 0) {
      result[key] = Array.from(values).sort();
    }
  }

  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const smartFilters = searchParams.get('filters'); // JSON string of active smart filters

    // Find the category
    const category = await db.category.findUnique({
      where: {
        slug: params.slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            _count: {
              select: {
                products: {
                  where: {
                    status: 'ACTIVE',
                    stockQuantity: { gt: 0 },
                  },
                },
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all child category IDs for product search
    const childCategoryIds = category.children.map((c) => c.id);
    const categoryIds = [category.id, ...childCategoryIds];

    // Build product filter
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: categoryIds },
    };

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add smart filters
    if (smartFilters) {
      try {
        const parsedFilters = JSON.parse(smartFilters) as Record<string, string[]>;
        const filterConditions: any[] = [];

        for (const [, values] of Object.entries(parsedFilters)) {
          if (values && values.length > 0) {
            for (const value of values) {
              filterConditions.push({
                OR: [
                  { name: { contains: value, mode: 'insensitive' } },
                  { description: { contains: value, mode: 'insensitive' } },
                ],
              });
            }
          }
        }

        if (filterConditions.length > 0) {
          where.AND = filterConditions;
        }
      } catch (e) {
        // Invalid JSON, ignore filters
      }
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'price-desc':
        orderBy = { basePrice: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    // Fetch products with reviews aggregation
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          description: true,
          basePrice: true,
          salePrice: true,
          images: true,
          isFeatured: true,
          stockQuantity: true,
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          _count: {
            select: {
              reviews: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Get average ratings for products
    const productIds = products.map((p) => p.id);
    const reviewAggregates = await db.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        status: 'APPROVED',
      },
      _avg: {
        rating: true,
      },
    });

    const ratingMap = new Map(
      reviewAggregates.map((r) => [r.productId, r._avg.rating || 0])
    );

    // Format products with ratings
    const formattedProducts = products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      isFeatured: product.isFeatured,
      stockQuantity: product.stockQuantity,
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
      brand: product.brand,
    }));

    // Get all products for smart filter extraction (without pagination)
    const allProductsForFilters = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        stockQuantity: { gt: 0 },
        categoryId: { in: categoryIds },
      },
      select: {
        name: true,
        description: true,
      },
    });

    // Extract smart filters from all products in this category
    const availableSmartFilters = extractSmartFilters(allProductsForFilters);

    // Get filter labels for the response
    const smartFilterLabels: Record<string, string> = {};
    for (const key of Object.keys(availableSmartFilters)) {
      if (SMART_FILTER_PATTERNS[key]) {
        smartFilterLabels[key] = SMART_FILTER_PATTERNS[key].label;
      }
    }

    return NextResponse.json({
      category,
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      smartFilters: availableSmartFilters,
      smartFilterLabels,
    });
  } catch (error: any) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
