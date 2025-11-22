import { z } from 'zod';
import { DiscountType, DiscountScope, AccountType, LoyaltyTier } from '@prisma/client';

// Create discount DTO
export const CreateDiscountDto = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(DiscountType),
  scope: z.nativeEnum(DiscountScope),
  value: z.number().positive(),

  // Conditions
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),

  // Applicability
  accountTypes: z.array(z.nativeEnum(AccountType)).default([]),
  loyaltyTiers: z.array(z.nativeEnum(LoyaltyTier)).default([]),

  // Validity
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),

  // Product associations
  productIds: z.array(z.string().uuid()).default([]),
}).refine((data) => {
  if (data.endsAt && data.startsAt) {
    return data.endsAt > data.startsAt;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endsAt"],
});

// Update discount DTO
export const UpdateDiscountDto = CreateDiscountDto.partial().omit({ code: true });

// Validate discount DTO
export const ValidateDiscountDto = z.object({
  code: z.string().min(1),
  cartTotal: z.number().positive(),
  accountType: z.nativeEnum(AccountType).optional(),
  loyaltyTier: z.nativeEnum(LoyaltyTier).optional(),
  productIds: z.array(z.string().uuid()).default([]),
});

// Discount query DTO
export const DiscountQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(DiscountType).optional(),
  scope: z.nativeEnum(DiscountScope).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search by code or name
});

// Type exports
export type CreateDiscountInput = z.infer<typeof CreateDiscountDto>;
export type UpdateDiscountInput = z.infer<typeof UpdateDiscountDto>;
export type ValidateDiscountInput = z.infer<typeof ValidateDiscountDto>;
export type DiscountQueryInput = z.infer<typeof DiscountQueryDto>;
