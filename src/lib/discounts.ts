import { db } from '@/lib/db';

type AccountType = 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT' | 'B2C' | 'B2B' | 'GSA';

interface ProductInfo {
  id: string;
  categoryId?: string | null;
  brandId?: string | null;
  defaultSupplierId?: string | null;
  defaultWarehouseId?: string | null;
  basePrice: number;
  salePrice?: number | null;
  wholesalePrice?: number | null;
  gsaPrice?: number | null;
}

interface DiscountResult {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  discountAmount: number;
  appliedDiscountId: string | null;
  discountSource: 'global' | 'category' | 'brand' | 'supplier' | 'warehouse' | 'tier_price' | null;
}

// Map old account types to new ones
function normalizeAccountType(accountType: AccountType): 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT' {
  switch (accountType) {
    case 'B2C':
    case 'PERSONAL':
      return 'PERSONAL';
    case 'B2B':
    case 'VOLUME_BUYER':
      return 'VOLUME_BUYER';
    case 'GSA':
    case 'GOVERNMENT':
      return 'GOVERNMENT';
    default:
      return 'PERSONAL';
  }
}

/**
 * Calculate the best discount for a product based on user account type
 * Priority: category/brand/supplier/warehouse specific > global
 * For VOLUME_BUYER: compares discount vs wholesale price, uses lower
 * For GOVERNMENT: uses GSA price if available
 */
export async function calculateProductDiscount(
  product: ProductInfo,
  accountType: AccountType,
  subtotal: number = 0
): Promise<DiscountResult> {
  const normalizedType = normalizeAccountType(accountType);

  // Base price calculation
  let originalPrice = Number(product.salePrice || product.basePrice);

  // For GOVERNMENT users, use GSA price if available
  if (normalizedType === 'GOVERNMENT' && product.gsaPrice) {
    const gsaPrice = Number(product.gsaPrice);
    return {
      originalPrice,
      discountedPrice: gsaPrice,
      discountPercentage: ((originalPrice - gsaPrice) / originalPrice) * 100,
      discountAmount: originalPrice - gsaPrice,
      appliedDiscountId: null,
      discountSource: 'tier_price',
    };
  }

  // Fetch all applicable discount settings for this account type
  const discountSettings = await db.userTypeDiscountSettings.findMany({
    where: {
      accountType: normalizedType,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (discountSettings.length === 0) {
    // No discounts configured, return original price
    // But for VOLUME_BUYER, check wholesale price
    if (normalizedType === 'VOLUME_BUYER' && product.wholesalePrice) {
      const wholesalePrice = Number(product.wholesalePrice);
      if (wholesalePrice < originalPrice) {
        return {
          originalPrice,
          discountedPrice: wholesalePrice,
          discountPercentage: ((originalPrice - wholesalePrice) / originalPrice) * 100,
          discountAmount: originalPrice - wholesalePrice,
          appliedDiscountId: null,
          discountSource: 'tier_price',
        };
      }
    }

    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountPercentage: 0,
      discountAmount: 0,
      appliedDiscountId: null,
      discountSource: null,
    };
  }

  // Find the best applicable discount
  // Priority: category > brand > supplier > warehouse > global
  let bestDiscount: typeof discountSettings[0] | null = null;
  let discountSource: DiscountResult['discountSource'] = null;

  // Check for specific discounts first (higher priority)
  for (const discount of discountSettings) {
    // Skip if minimum order not met
    if (Number(discount.minimumOrderAmount) > 0 && subtotal < Number(discount.minimumOrderAmount)) {
      continue;
    }

    // Category match (highest priority for specific)
    if (discount.categoryId && discount.categoryId === product.categoryId) {
      if (!bestDiscount || Number(discount.discountPercentage) > Number(bestDiscount.discountPercentage)) {
        bestDiscount = discount;
        discountSource = 'category';
      }
    }
    // Brand match
    else if (discount.brandId && discount.brandId === product.brandId) {
      if (!bestDiscount || (discountSource !== 'category' && Number(discount.discountPercentage) > Number(bestDiscount.discountPercentage))) {
        bestDiscount = discount;
        discountSource = 'brand';
      }
    }
    // Supplier match
    else if (discount.supplierId && discount.supplierId === product.defaultSupplierId) {
      if (!bestDiscount || (!['category', 'brand'].includes(discountSource || '') && Number(discount.discountPercentage) > Number(bestDiscount.discountPercentage))) {
        bestDiscount = discount;
        discountSource = 'supplier';
      }
    }
    // Warehouse match
    else if (discount.warehouseId && discount.warehouseId === product.defaultWarehouseId) {
      if (!bestDiscount || (!['category', 'brand', 'supplier'].includes(discountSource || '') && Number(discount.discountPercentage) > Number(bestDiscount.discountPercentage))) {
        bestDiscount = discount;
        discountSource = 'warehouse';
      }
    }
    // Global (lowest priority)
    else if (!discount.categoryId && !discount.brandId && !discount.supplierId && !discount.warehouseId) {
      if (!bestDiscount) {
        bestDiscount = discount;
        discountSource = 'global';
      }
    }
  }

  if (!bestDiscount) {
    // No applicable discount found
    // For VOLUME_BUYER, check wholesale price
    if (normalizedType === 'VOLUME_BUYER' && product.wholesalePrice) {
      const wholesalePrice = Number(product.wholesalePrice);
      if (wholesalePrice < originalPrice) {
        return {
          originalPrice,
          discountedPrice: wholesalePrice,
          discountPercentage: ((originalPrice - wholesalePrice) / originalPrice) * 100,
          discountAmount: originalPrice - wholesalePrice,
          appliedDiscountId: null,
          discountSource: 'tier_price',
        };
      }
    }

    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountPercentage: 0,
      discountAmount: 0,
      appliedDiscountId: null,
      discountSource: null,
    };
  }

  // Calculate discounted price
  const discountPercentage = Number(bestDiscount.discountPercentage);
  const discountAmount = originalPrice * (discountPercentage / 100);
  let discountedPrice = originalPrice - discountAmount;

  // For VOLUME_BUYER: compare with wholesale price, use lower
  if (normalizedType === 'VOLUME_BUYER' && product.wholesalePrice) {
    const wholesalePrice = Number(product.wholesalePrice);
    if (wholesalePrice < discountedPrice) {
      return {
        originalPrice,
        discountedPrice: wholesalePrice,
        discountPercentage: ((originalPrice - wholesalePrice) / originalPrice) * 100,
        discountAmount: originalPrice - wholesalePrice,
        appliedDiscountId: null,
        discountSource: 'tier_price',
      };
    }
  }

  return {
    originalPrice,
    discountedPrice,
    discountPercentage,
    discountAmount,
    appliedDiscountId: bestDiscount.id,
    discountSource,
  };
}

/**
 * Calculate discounts for multiple products at once (more efficient)
 */
export async function calculateCartDiscounts(
  products: ProductInfo[],
  accountType: AccountType,
  subtotal: number = 0
): Promise<Map<string, DiscountResult>> {
  const results = new Map<string, DiscountResult>();

  for (const product of products) {
    const discount = await calculateProductDiscount(product, accountType, subtotal);
    results.set(product.id, discount);
  }

  return results;
}
