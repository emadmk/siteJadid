// Server-side shipping cost calculator
// Prevents client-side manipulation of shipping costs

interface ShippingCalculationInput {
  subtotal: number;
  totalWeight: number; // in lbs
  shippingMethod?: string;
  isFreeShippingCoupon?: boolean;
}

interface ShippingCalculationResult {
  cost: number;
  method: string;
  estimatedDays: string;
}

/**
 * Calculate shipping cost server-side based on order parameters
 * This replaces client-supplied shipping cost to prevent manipulation
 */
export function calculateShippingCost(input: ShippingCalculationInput): ShippingCalculationResult {
  // Free shipping coupon overrides everything
  if (input.isFreeShippingCoupon) {
    return {
      cost: 0,
      method: 'Free Shipping (Coupon)',
      estimatedDays: '5-7 business days',
    };
  }

  // Free shipping threshold: orders $99+
  if (input.subtotal >= 99) {
    return {
      cost: 0,
      method: 'Free Standard Shipping',
      estimatedDays: '5-7 business days',
    };
  }

  // Weight-based calculation
  if (input.totalWeight > 20) {
    return {
      cost: 35,
      method: 'Heavy Freight',
      estimatedDays: '7-10 business days',
    };
  }

  // Standard shipping
  return {
    cost: 15,
    method: 'Standard Shipping',
    estimatedDays: '5-7 business days',
  };
}
