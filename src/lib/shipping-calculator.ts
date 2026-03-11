// Fallback shipping cost calculator
// Only used when Shippo rate is not available (e.g., API timeout, no rates returned)
// Primary shipping rates come from Shippo via /api/shipping/rates

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
 * Fallback shipping cost calculator - used ONLY when no Shippo rate is selected
 * Primary shipping uses real-time Shippo rates selected during checkout
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
