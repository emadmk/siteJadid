import { z } from 'zod';

// Enums matching Prisma schema
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  NET_TERMS = 'NET_TERMS',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  GSA_SMARTPAY = 'GSA_SMARTPAY',
}

enum AccountType {
  B2C = 'B2C',
  B2B = 'B2B',
  GSA = 'GSA',
}

// Create order DTO
export const CreateOrderDto = z.object({
  billingAddressId: z.string().uuid(),
  shippingAddressId: z.string().uuid(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  shippingMethod: z.string().min(1),
  discountCode: z.string().optional(),
  customerNotes: z.string().max(1000).optional(),
  loyaltyPointsToUse: z.number().int().min(0).default(0),
  purchaseOrderNumber: z.string().max(100).optional(), // B2B only
  gsaContractNumber: z.string().max(100).optional(), // GSA only
});

// Update order DTO
export const UpdateOrderDto = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  shippingCarrier: z.string().optional(),
  shippingMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().optional(),
});

// Order status update DTO
export const UpdateOrderStatusDto = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(500).optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  notifyCustomer: z.boolean().default(true),
});

// Order query DTO
export const OrderQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(), // Search by order number
  userId: z.string().uuid().optional(),
  minTotal: z.coerce.number().positive().optional(),
  maxTotal: z.coerce.number().positive().optional(),
});

// Refund order DTO
export const RefundOrderDto = z.object({
  amount: z.number().positive().optional(), // Partial refund if specified
  reason: z.string().min(1).max(500),
  refundShipping: z.boolean().default(false),
  restockItems: z.boolean().default(true),
  notifyCustomer: z.boolean().default(true),
});

// Cancel order DTO
export const CancelOrderDto = z.object({
  reason: z.string().min(1).max(500),
  refundPayment: z.boolean().default(true),
  restockItems: z.boolean().default(true),
  notifyCustomer: z.boolean().default(true),
});

// Type exports
export type CreateOrderInput = z.infer<typeof CreateOrderDto>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderDto>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusDto>;
export type OrderQueryInput = z.infer<typeof OrderQueryDto>;
export type RefundOrderInput = z.infer<typeof RefundOrderDto>;
export type CancelOrderInput = z.infer<typeof CancelOrderDto>;
