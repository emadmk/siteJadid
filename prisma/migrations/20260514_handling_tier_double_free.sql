-- Additive migration: adds doubleShippingWithFreeOption to HandlingTier.
-- Safe to run on production: only ALTER TABLE ADD COLUMN with a default.
-- Apply with: psql $DATABASE_URL -f prisma/migrations/20260514_handling_tier_double_free.sql
-- Or simply:  npx prisma db push  (Prisma will detect the new column.)

BEGIN;

ALTER TABLE "HandlingTier"
  ADD COLUMN IF NOT EXISTS "doubleShippingWithFreeOption" BOOLEAN NOT NULL DEFAULT false;

COMMIT;
