-- Additive: adds Order.handlingFee for admin-only breakdown of shipping vs handling.
-- The combined customer-facing charge is still in Order.shipping; this column
-- just records "of that total, how much was handling".
--
-- Safe to run on production: nullable column with no default.
-- Apply with:
--   docker exec -i ecommerce-postgres bash -c \
--     'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' \
--     < prisma/migrations/20260514_order_handling_fee.sql

BEGIN;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "handlingFee" DECIMAL(12, 2);

COMMIT;
