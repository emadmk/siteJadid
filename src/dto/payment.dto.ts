import { z } from 'zod';

// Create payment intent DTO
export const CreatePaymentIntentDto = z.object({
  amount: z.number().positive(),
  orderId: z.string().uuid().optional(),
  currency: z.string().length(3).default('USD'),
  savePaymentMethod: z.boolean().default(false),
});

// Confirm payment DTO
export const ConfirmPaymentDto = z.object({
  paymentIntentId: z.string().min(1),
  orderId: z.string().uuid(),
});

// Process refund DTO
export const ProcessRefundDto = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive().optional(), // Full refund if not specified
  reason: z.string().min(1).max(500),
});

// Create invoice DTO
export const CreateInvoiceDto = z.object({
  orderId: z.string().uuid(),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional(),
  termsConditions: z.string().max(2000).optional(),
});

// Record payment DTO (for manual/offline payments)
export const RecordPaymentDto = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.string().min(1),
  transactionId: z.string().max(255).optional(),
  reference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
  paidAt: z.coerce.date().default(() => new Date()),
});

// Type exports
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentDto>;
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentDto>;
export type ProcessRefundInput = z.infer<typeof ProcessRefundDto>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceDto>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentDto>;
