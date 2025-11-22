import { z } from 'zod';

// Enums matching Prisma schema
enum ShipmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
}

// Shipping carriers in USA
export const ShippingCarrier = z.enum(['USPS', 'FEDEX', 'UPS', 'DHL']);
export type ShippingCarrierType = z.infer<typeof ShippingCarrier>;

// USPS service types
export const USPSService = z.enum([
  'PRIORITY_MAIL',
  'PRIORITY_MAIL_EXPRESS',
  'FIRST_CLASS_MAIL',
  'PARCEL_SELECT',
  'MEDIA_MAIL',
  'PRIORITY_MAIL_FLAT_RATE',
]);

// FedEx service types
export const FedExService = z.enum([
  'FEDEX_GROUND',
  'FEDEX_EXPRESS_SAVER',
  'FEDEX_2DAY',
  'FEDEX_STANDARD_OVERNIGHT',
  'FEDEX_PRIORITY_OVERNIGHT',
  'FEDEX_FIRST_OVERNIGHT',
]);

// UPS service types
export const UPSService = z.enum([
  'UPS_GROUND',
  'UPS_3_DAY_SELECT',
  'UPS_2ND_DAY_AIR',
  'UPS_NEXT_DAY_AIR',
  'UPS_NEXT_DAY_AIR_SAVER',
]);

// Calculate shipping rate DTO
export const CalculateShippingRateDto = z.object({
  carrier: ShippingCarrier,
  service: z.string().min(1),
  fromZipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  toZipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  weight: z.number().positive(), // in pounds
  length: z.number().positive().optional(), // in inches
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  declaredValue: z.number().positive().optional(), // for insurance
});

// Create shipment DTO
export const CreateShipmentDto = z.object({
  orderId: z.string().uuid(),
  carrier: ShippingCarrier,
  service: z.string().min(1),
  weight: z.number().positive(),
  declaredValue: z.number().positive().optional(),
  requireSignature: z.boolean().default(false),
  saturdayDelivery: z.boolean().default(false),
  insuranceAmount: z.number().positive().optional(),
});

// Update shipment DTO
export const UpdateShipmentDto = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  trackingNumber: z.string().max(255).optional(),
  labelUrl: z.string().url().optional(),
  estimatedDelivery: z.coerce.date().optional(),
  shippedAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
});

// Track shipment DTO
export const TrackShipmentDto = z.object({
  trackingNumber: z.string().min(1),
  carrier: ShippingCarrier,
});

// Add tracking event DTO
export const AddTrackingEventDto = z.object({
  shipmentId: z.string().uuid(),
  status: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  message: z.string().max(500).optional(),
  timestamp: z.coerce.date(),
});

// Type exports
export type CalculateShippingRateInput = z.infer<typeof CalculateShippingRateDto>;
export type CreateShipmentInput = z.infer<typeof CreateShipmentDto>;
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentDto>;
export type TrackShipmentInput = z.infer<typeof TrackShipmentDto>;
export type AddTrackingEventInput = z.infer<typeof AddTrackingEventDto>;
