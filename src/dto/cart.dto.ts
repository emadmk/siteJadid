import { z } from 'zod';

// Add to cart DTO
export const AddToCartDto = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
});

// Update cart item DTO
export const UpdateCartItemDto = z.object({
  quantity: z.number().int().min(0), // 0 to remove
});

// Apply discount DTO
export const ApplyDiscountDto = z.object({
  code: z.string().min(1).max(50),
});

// Type exports
export type AddToCartInput = z.infer<typeof AddToCartDto>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemDto>;
export type ApplyDiscountInput = z.infer<typeof ApplyDiscountDto>;
