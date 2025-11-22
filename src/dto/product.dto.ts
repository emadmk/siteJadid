import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

// Product creation DTO
export const CreateProductDto = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),

  // Pricing
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  wholesalePrice: z.number().positive().optional(),
  gsaPrice: z.number().positive().optional(),

  // GSA
  gsaSin: z.string().max(50).optional(),

  // Inventory
  stockQuantity: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).default(10),
  trackInventory: z.boolean().default(true),
  minimumOrderQty: z.number().int().min(1).default(1),

  // SEO
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(255).optional(),

  // Media
  images: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).default([]),

  // Physical properties
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(), // JSON string: {length, width, height}

  // Category
  categoryId: z.string().uuid().optional(),

  // Flags
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  allowReviews: z.boolean().default(true),
});

// Product update DTO
export const UpdateProductDto = CreateProductDto.partial();

// Product query DTO
export const ProductQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  featured: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'createdAt_asc', 'createdAt_desc']).default('createdAt_desc'),
});

// Product variant DTO
export const CreateProductVariantDto = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  attributes: z.string(), // JSON string
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
});

export const UpdateProductVariantDto = CreateProductVariantDto.partial().omit({ productId: true });

// Type exports
export type CreateProductInput = z.infer<typeof CreateProductDto>;
export type UpdateProductInput = z.infer<typeof UpdateProductDto>;
export type ProductQueryInput = z.infer<typeof ProductQueryDto>;
export type CreateProductVariantInput = z.infer<typeof CreateProductVariantDto>;
export type UpdateProductVariantInput = z.infer<typeof UpdateProductVariantDto>;
