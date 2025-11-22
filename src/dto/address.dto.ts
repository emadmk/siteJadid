import { z } from 'zod';
import { AddressType } from '@prisma/client';

// US State codes
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', // District of Columbia
] as const;

// Create address DTO
export const CreateAddressDto = z.object({
  type: z.nativeEnum(AddressType).default(AddressType.BOTH),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(255).optional(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.enum(US_STATES),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/), // US ZIP format: 12345 or 12345-6789
  country: z.string().default('USA'),
  phone: z.string().regex(/^\+?1?\d{10,14}$/),
  isDefault: z.boolean().default(false),
});

// Update address DTO
export const UpdateAddressDto = CreateAddressDto.partial();

// Validate address DTO (for address verification services)
export const ValidateAddressDto = z.object({
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.enum(US_STATES),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

// Type exports
export type CreateAddressInput = z.infer<typeof CreateAddressDto>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressDto>;
export type ValidateAddressInput = z.infer<typeof ValidateAddressDto>;
export type USState = typeof US_STATES[number];
