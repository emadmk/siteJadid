export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  SMART_FILTER_PATTERNS,
  buildSmartFilterWhere,
  computeCascadingSmartFilters,
} from '@/lib/smart-filters';


// Category-specific filter configurations
// Defines which filters to include/exclude for specific category slugs
const CATEGORY_FILTER_CONFIG: Record<string, {
  include?: string[];
  exclude?: string[];
}> = {
  // Footwear - use numeric shoe sizes
  'footwear': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'boots': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'shoes': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'safety-footwear': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  'work-boots': {
    include: ['gender', 'toeType', 'material', 'footwearSize', 'color', 'protection', 'style'],
  },
  // Gloves
  'gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'work-gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'hand-protection': {
    include: ['material', 'size', 'color', 'protection'],
  },
  // Abrasives - only material (brand, price, TAA handled by sidebar)
  'abrasives': {
    include: ['material'],
  },
  'abrasive-discs': {
    include: ['material'],
  },
  'abrasive-disks': {
    include: ['material'],
  },
  'abrasive-belts': {
    include: ['material'],
  },
  'specialty-abrasives': {
    include: ['material'],
  },
  'abrasive-sheets-rolls': {
    include: ['material'],
  },
  'abrasive-sheets': {
    include: ['material'],
  },
  'abrasive-wheels': {
    include: ['material'],
  },
  'handheld-abrasives': {
    include: ['material'],
  },
  // EAR Protection - only NRR filter
  'ear-protection': {
    include: ['nrr', 'color'],
  },
  'hearing-protection': {
    include: ['nrr', 'color'],
  },
  // Head Protection - hardHatType
  'head-protection': {
    include: ['hardHatType', 'color'],
  },
  'hard-hats': {
    include: ['hardHatType', 'color'],
  },
  // High Visibility Vests - all variations
  'vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'safety-vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'hi-vis-vests': {
    include: ['gender', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  // High Visibility Shirts - all variations
  'shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  't-shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  't-shirts--shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  'hi-vis-shirts': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisStyle'],
  },
  // High Visibility Jackets - all variations
  'jackets': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  'hi-vis-jackets': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  'coats': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
  },
  // High Visibility parent category
  'high-visibility': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },
  'high-visibility-clothing': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },
  'hi-vis-apparel': {
    include: ['gender', 'hiVisColor', 'hiVisMaterial', 'hiVisSize', 'hiVisProtection', 'hiVisType', 'hiVisStyle'],
    exclude: ['material', 'size', 'color', 'style', 'type', 'toeType', 'nrr', 'protectionType', 'antiFog', 'antiScratch', 'eyewearStyle', 'hardHatType', 'protection'],
  },

  // ========== NEW CATEGORY CONFIGURATIONS ==========

  // Sweatshirts
  'sweatshirts': {
    include: ['taaCompliance', 'gender', 'hiVisMaterial', 'hiVisSize', 'hiVisColor', 'hiVisProtection', 'sweatshirtStyle', 'ansiClass'],
  },
  'hi-vis-sweatshirts': {
    include: ['taaCompliance', 'gender', 'hiVisMaterial', 'hiVisSize', 'hiVisColor', 'hiVisProtection', 'sweatshirtStyle', 'ansiClass'],
  },

  // Trousers
  'trousers': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },
  'hi-vis-trousers': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },
  'pants': {
    include: ['taaCompliance', 'gender', 'hiVisSize', 'extendedHiVisColor', 'trouserProtection', 'trouserStyle', 'trouserType'],
  },

  // Bibs & Coveralls, Insulated Gear
  'bibs-coveralls-insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'bibs---coveralls--insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'coveralls': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'bibs': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },
  'insulated-gear': {
    include: ['gender', 'hiVisSize', 'extendedHiVisColor', 'bibsProtection'],
  },

  // High Visibility Accessories
  'high-visibility-accessories': {
    include: ['hiVisAccessoryColor', 'hiVisAccessoryStyle'],
  },
  'hi-vis-accessories': {
    include: ['hiVisAccessoryColor', 'hiVisAccessoryStyle'],
  },

  // Rain Gear
  'rain-gear': {
    include: ['taaCompliance', 'hiVisMaterial', 'hiVisSize', 'extendedHiVisColor', 'hiVisProtection', 'rainGearStyle', 'ansiClass'],
  },
  'raingear': {
    include: ['taaCompliance', 'hiVisMaterial', 'hiVisSize', 'extendedHiVisColor', 'hiVisProtection', 'rainGearStyle', 'ansiClass'],
  },

  // Eye Protection - updated
  'eye-protection': {
    include: ['taaCompliance', 'gender', 'color', 'lensColor', 'eyewearProtection', 'eyewearStyle'],
  },
  'safety-glasses': {
    include: ['taaCompliance', 'gender', 'color', 'lensColor', 'eyewearProtection', 'eyewearStyle'],
  },

  // Safety Goggles
  'safety-goggles': {
    include: ['taaCompliance', 'eyewearProtection', 'color', 'eyewearStyle', 'type'],
  },
  'goggles': {
    include: ['taaCompliance', 'eyewearProtection', 'color', 'eyewearStyle', 'type'],
  },

  // Eyewear Accessories - only product type
  'eyewear-accessories': {
    include: ['eyewearProduct'],
  },

  // Foam (Ear Protection)
  'foam': {
    include: ['taaCompliance', 'nrr'],
  },
  'foam-ear-plugs': {
    include: ['taaCompliance', 'nrr'],
  },
  'ear-plugs': {
    include: ['taaCompliance', 'nrr'],
  },

  // Ear Accessories
  'ear-accessories': {
    include: ['taaCompliance', 'nrr'],
  },
  'hearing-accessories': {
    include: ['taaCompliance', 'nrr'],
  },

  // Workwear - no style, use hiVisSize for proper S-5XL detection, extendedHiVisColor for more colors
  'workwear': {
    include: ['gender', 'material', 'hiVisSize', 'extendedHiVisColor', 'protection'],
  },

  // Respiratory Protection - no color, no protection
  'respiratory-safety': {
    include: ['type', 'material'],
  },
  'respiratory-protection': {
    include: ['type', 'material'],
  },
  'respiratory': {
    include: ['type', 'material'],
  },

  // Welding/Insulating/Electrical gloves - no style
  'hand-protect-welding-gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'welding-gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'insulating-gloves': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'welding-safety': {
    include: ['material', 'size', 'color', 'protection'],
  },
  'electrical-safety': {
    include: ['material', 'size', 'color', 'protection'],
  },
};

// Keyword-based filter config: if slug CONTAINS any of these keywords, use the config
const KEYWORD_FILTER_CONFIG: { keywords: string[]; config: { include: string[] } }[] = [
  {
    keywords: ['abrasiv'],
    config: { include: ['material'] },
  },
  {
    keywords: ['nozzle', 'adhesive', 'sealant', 'filler', 'structural-adhesive'],
    config: { include: [] },
  },
  {
    keywords: ['tape', 'foil-tape', 'masking'],
    config: { include: ['color'] },
  },
];

// Check if a category or its ancestors match any filter config
function getCategoryFilterConfig(categorySlug: string, hierarchy: { slug: string }[]): { include?: string[]; exclude?: string[] } | null {
  // Normalize slug - lowercase and handle URL encoding
  const normalizedSlug = decodeURIComponent(categorySlug).toLowerCase().replace(/[,\s]+/g, '-');

  // Check current category first (try multiple variations)
  const slugVariations = [
    normalizedSlug,
    normalizedSlug.replace(/-+/g, '-'),
    normalizedSlug.split('-')[0], // First word only (e.g., "vests" from "safety-vests")
  ];

  for (const slug of slugVariations) {
    if (CATEGORY_FILTER_CONFIG[slug]) {
      return CATEGORY_FILTER_CONFIG[slug];
    }
  }

  // Check keyword-based matching (slug contains keyword)
  for (const { keywords, config } of KEYWORD_FILTER_CONFIG) {
    if (keywords.some(kw => normalizedSlug.includes(kw))) {
      return config;
    }
  }

  // Check ancestors (from nearest to root)
  for (let i = hierarchy.length - 1; i >= 0; i--) {
    const ancestorSlug = hierarchy[i].slug.toLowerCase();
    const ancestorVariations = [
      ancestorSlug,
      ancestorSlug.replace(/-+/g, '-'),
      ancestorSlug.split('-')[0],
    ];

    for (const slug of ancestorVariations) {
      if (CATEGORY_FILTER_CONFIG[slug]) {
        return CATEGORY_FILTER_CONFIG[slug];
      }
    }

    // Keyword-based matching for ancestors too
    for (const { keywords, config } of KEYWORD_FILTER_CONFIG) {
      if (keywords.some(kw => ancestorSlug.includes(kw))) {
        return config;
      }
    }
  }

  return null;
}

// Default filters to use when no category-specific config is found
// Excludes all specialized filters (hi-vis, eye, head, ear protection)
const DEFAULT_FILTER_CONFIG = {
  include: ['gender', 'material', 'size', 'color', 'protection', 'style', 'type'],
};


// Recursive function to get full category hierarchy (ancestors)
async function getCategoryHierarchy(categoryId: string | null): Promise<{ id: string; name: string; slug: string }[]> {
  if (!categoryId) return [];

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  });

  if (!category) return [];

  const ancestors = await getCategoryHierarchy(category.parentId);
  return [...ancestors, { id: category.id, name: category.name, slug: category.slug }];
}

// Recursive function to get all descendant category IDs
async function getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: {
      parentId: categoryId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const childIds = children.map(c => c.id);
  const grandchildIds: string[] = [];

  for (const childId of childIds) {
    const descendants = await getAllDescendantCategoryIds(childId);
    grandchildIds.push(...descendants);
  }

  return [...childIds, ...grandchildIds];
}

// Get total product count for a category including all descendants
async function getTotalProductCount(categoryIds: string[]): Promise<number> {
  return db.product.count({
    where: {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: categoryIds },
    },
  });
}

import { cache } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const cacheKey = `cat:${params.slug}:${queryString}`;

    // Try cache first (5 min TTL)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const taaApproved = searchParams.get('taaApproved') === 'true';
    const smartFilters = searchParams.get('filters'); // JSON string of active smart filters
    const subcategories = searchParams.get('subcategories'); // Comma-separated subcategory IDs

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
        parentId: true,
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
            NOT: { slug: 'traffic-safety' },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            children: {
              where: {
                isActive: true,
                NOT: { slug: 'traffic-safety' },
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

    // Get ALL descendant category IDs recursively for product search
    const allDescendantIds = await getAllDescendantCategoryIds(category.id);
    const categoryIds = [category.id, ...allDescendantIds];

    // Calculate total products including all descendants for each child category
    const childrenWithTotals = await Promise.all(
      category.children.map(async (child) => {
        const childDescendants = await getAllDescendantCategoryIds(child.id);
        const totalProducts = await getTotalProductCount([child.id, ...childDescendants]);
        return {
          ...child,
          _count: {
            products: totalProducts,
          },
        };
      })
    );

    // Sort children by product count (most products first)
    childrenWithTotals.sort((a, b) => b._count.products - a._count.products);

    // If subcategory filter is active, narrow down to those subcategories and their descendants
    let filteredCategoryIds = categoryIds;
    if (subcategories) {
      const subIds = subcategories.split(',').filter(Boolean);
      if (subIds.length > 0) {
        const subWithDescendants: string[] = [];
        for (const subId of subIds) {
          subWithDescendants.push(subId);
          const descendants = await getAllDescendantCategoryIds(subId);
          subWithDescendants.push(...descendants);
        }
        // Intersect with categoryIds to ensure we only include valid descendants
        const validSet = new Set(categoryIds);
        filteredCategoryIds = subWithDescendants.filter(id => validSet.has(id));
      }
    }

    // Build product filter
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: filteredCategoryIds },
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
        { vendorPartNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add brand filter
    if (brand) {
      const brandData = await db.brand.findUnique({
        where: { slug: brand },
        select: { id: true },
      });
      if (brandData) {
        where.brandId = brandData.id;
      }
    }

    // Add TAA/BAA filter
    if (taaApproved) {
      where.taaApproved = true;
    }

    // Add smart filters (using shared buildSmartFilterWhere from lib)
    let parsedSmartFilters: Record<string, string[]> = {};
    if (smartFilters) {
      try {
        parsedSmartFilters = JSON.parse(smartFilters) as Record<string, string[]>;
        const filterConditions = buildSmartFilterWhere(parsedSmartFilters);
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
          vendorPartNumber: true,
          name: true,
          slug: true,
          description: true,
          basePrice: true,
          salePrice: true,
          images: true,
          isFeatured: true,
          stockQuantity: true,
          minimumOrderQty: true,
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
      sku: product.vendorPartNumber || product.sku, // Display vendorPartNumber as SKU
      manufacturerPartNumber: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      isFeatured: product.isFeatured,
      stockQuantity: product.stockQuantity,
      minimumOrderQty: product.minimumOrderQty,
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
      brand: product.brand,
    }));

    // Get full hierarchy (all ancestors) - needed for category filter config
    const hierarchy = await getCategoryHierarchy(category.parentId);

    // Get category-specific filter configuration
    const categoryFilterConfig = getCategoryFilterConfig(category.slug, hierarchy);

    // Get all products for cascading smart filter computation (base: category + stock, no smart filters)
    const allProductsForFilters = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        stockQuantity: { gt: 0 },
        categoryId: { in: categoryIds },
      },
      select: { name: true, description: true },
    });

    // Compute cascading smart filters: each facet shows only options available given OTHER active filters
    const availableSmartFilters = computeCascadingSmartFilters(
      allProductsForFilters,
      parsedSmartFilters,
      categoryFilterConfig,
    );

    // Get filter labels for the response
    const smartFilterLabels: Record<string, string> = {};
    for (const key of Object.keys(availableSmartFilters)) {
      if (SMART_FILTER_PATTERNS[key]) {
        smartFilterLabels[key] = SMART_FILTER_PATTERNS[key].label;
      }
    }

    // Fetch brands that have products in this category
    const brands = await db.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            status: 'ACTIVE',
            stockQuantity: { gt: 0 },
            categoryId: { in: categoryIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
                categoryId: { in: categoryIds },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build category response with updated children counts, nested children, and full hierarchy
    const categoryResponse = {
      ...category,
      children: childrenWithTotals, // Include nested children for subcategory display
      hierarchy, // Full path from root to parent (not including current category)
    };

    const responseData = {
      category: categoryResponse,
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      smartFilters: availableSmartFilters,
      smartFilterLabels,
      brands,
    };

    // Cache for 5 minutes
    cache.set(cacheKey, responseData, 300).catch(() => {});

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
