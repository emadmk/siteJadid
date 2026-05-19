-- Additive migration for marketing collections.
-- Safe to run on production: only CREATEs new tables/indexes. No FKs onto
-- existing rows that aren't already nullable, no column changes on Product.

BEGIN;

CREATE TABLE "Collection" (
    "id"                TEXT NOT NULL,
    "name"              TEXT NOT NULL,
    "slug"              TEXT NOT NULL,
    "description"       TEXT,
    "image"             TEXT,
    "metaTitle"         TEXT,
    "metaDescription"   TEXT,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "displayOrder"      INTEGER NOT NULL DEFAULT 0,
    "filterCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterBrandIds"    TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterSupplierIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterMinPrice"    DECIMAL(12,2),
    "filterMaxPrice"    DECIMAL(12,2),
    "filterTaaOnly"     BOOLEAN NOT NULL DEFAULT false,
    "filterKeywords"    TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");
CREATE INDEX "Collection_isActive_idx" ON "Collection"("isActive");

CREATE TABLE "CollectionProduct" (
    "id"            TEXT NOT NULL,
    "collectionId"  TEXT NOT NULL,
    "productId"     TEXT NOT NULL,
    "isPinned"      BOOLEAN NOT NULL DEFAULT false,
    "isExcluded"    BOOLEAN NOT NULL DEFAULT false,
    "isFeatured"    BOOLEAN NOT NULL DEFAULT false,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId")
      REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId")
      REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CollectionProduct_collectionId_productId_key"
  ON "CollectionProduct"("collectionId", "productId");
CREATE INDEX "CollectionProduct_collectionId_idx" ON "CollectionProduct"("collectionId");
CREATE INDEX "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");

COMMIT;
