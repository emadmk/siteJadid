-- Manual migration for ShippingRule + HandlingTier
-- Safe to run on production: only ADDS new tables/types/indexes.
-- Does NOT touch existing tables or data.
--
-- Apply with:   psql $DATABASE_URL -f prisma/migrations/20260507_add_shipping_rules.sql
-- Or simply run: npx prisma db push    (Prisma will detect and apply it)

BEGIN;

CREATE TYPE "ShippingRuleMode" AS ENUM ('FREE', 'FIXED', 'PERCENT', 'SHIPPO');

CREATE TABLE "ShippingRule" (
    "id"                TEXT NOT NULL,
    "name"              TEXT NOT NULL,
    "description"       TEXT,
    "priority"          INTEGER NOT NULL DEFAULT 0,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "supplierIds"       TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warehouseIds"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode"              "ShippingRuleMode" NOT NULL DEFAULT 'SHIPPO',
    "flatAmount"        DECIMAL(10,2),
    "percentValue"      DECIMAL(6,2),
    "shippoMarkupType"  TEXT,
    "shippoMarkupValue" DECIMAL(10,2),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShippingRule_priority_idx" ON "ShippingRule"("priority");
CREATE INDEX "ShippingRule_isActive_idx" ON "ShippingRule"("isActive");

CREATE TABLE "HandlingTier" (
    "id"            TEXT NOT NULL,
    "minSubtotal"   DECIMAL(10,2) NOT NULL,
    "maxSubtotal"   DECIMAL(10,2),
    "type"          TEXT NOT NULL,
    "value"         DECIMAL(10,2) NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "displayOrder"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HandlingTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HandlingTier_minSubtotal_idx" ON "HandlingTier"("minSubtotal");
CREATE INDEX "HandlingTier_isActive_idx" ON "HandlingTier"("isActive");

COMMIT;
