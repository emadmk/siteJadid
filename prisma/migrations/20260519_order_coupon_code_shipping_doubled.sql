-- Additive migration: Order.couponCode + Order.shippingDoubled
-- Safe to run on production. Nullable strings + boolean default false.

BEGIN;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingDoubled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Order_couponCode_idx" ON "Order" ("couponCode");

COMMIT;
