import { z } from 'zod';
import { UserRole, AccountType } from '@prisma/client';

// Register user DTO
export const RegisterUserDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255),
  phone: z.string().regex(/^\+?1?\d{10,14}$/).optional(),
  accountType: z.nativeEnum(AccountType).default(AccountType.B2C),
});

// Login DTO
export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Update user profile DTO
export const UpdateUserProfileDto = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?1?\d{10,14}$/).optional(),
  image: z.string().url().optional(),
});

// Change password DTO
export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin create user DTO
export const AdminCreateUserDto = RegisterUserDto.extend({
  role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
});

// Admin update user DTO
export const AdminUpdateUserDto = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?1?\d{10,14}$/).optional(),
  role: z.nativeEnum(UserRole).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

// User query DTO
export const UserQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.nativeEnum(UserRole).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search by name or email
});

// Type exports
export type RegisterUserInput = z.infer<typeof RegisterUserDto>;
export type LoginInput = z.infer<typeof LoginDto>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileDto>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordDto>;
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserDto>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserDto>;
export type UserQueryInput = z.infer<typeof UserQueryDto>;
