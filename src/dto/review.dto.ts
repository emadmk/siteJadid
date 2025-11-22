import { z } from 'zod';
import { ReviewStatus } from '@prisma/client';

// Create review DTO
export const CreateReviewDto = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(255).optional(),
  comment: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

// Update review DTO
export const UpdateReviewDto = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).max(255).optional(),
  comment: z.string().min(1).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

// Admin update review DTO
export const AdminUpdateReviewDto = z.object({
  status: z.nativeEnum(ReviewStatus),
  adminNotes: z.string().max(500).optional(),
});

// Review query DTO
export const ReviewQueryDto = z.object({
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['helpful', 'recent', 'rating_high', 'rating_low']).default('recent'),
});

// Mark review helpful DTO
export const MarkReviewHelpfulDto = z.object({
  reviewId: z.string().uuid(),
});

// Type exports
export type CreateReviewInput = z.infer<typeof CreateReviewDto>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewDto>;
export type AdminUpdateReviewInput = z.infer<typeof AdminUpdateReviewDto>;
export type ReviewQueryInput = z.infer<typeof ReviewQueryDto>;
export type MarkReviewHelpfulInput = z.infer<typeof MarkReviewHelpfulDto>;
