/**
 * Index all active products into Elasticsearch
 *
 * Usage: node scripts/es-index-products.js
 *
 * Run this after:
 * 1. First setup
 * 2. Bulk product imports
 * 3. Any time ES index needs refresh
 */

const { Client } = require('/var/www/siteJadid/node_modules/@elastic/elasticsearch');
const { PrismaClient } = require('/var/www/siteJadid/node_modules/@prisma/client');

const db = new PrismaClient();

const ES_NODE = process.env.ELASTICSEARCH_NODE || 'http://127.0.0.1:9200';
const ES_USER = process.env.ELASTICSEARCH_USERNAME || 'elastic';
const ES_PASS = process.env.ELASTICSEARCH_PASSWORD || 'L9ycbTXIRfetvmOFcHGVr5EWVOjvqaou';
const INDEX = 'products';
const BATCH_SIZE = 500;

async function main() {
  console.log('=== Elasticsearch Product Indexer ===\n');

  // Connect to ES
  const es = new Client({
    node: ES_NODE,
    auth: { username: ES_USER, password: ES_PASS },
    requestTimeout: 60000,
  });

  // Check connection
  try {
    const info = await es.info();
    console.log(`ES connected: ${info.name} (v${info.version.number})\n`);
  } catch (err) {
    console.error('Cannot connect to Elasticsearch:', err.message);
    process.exit(1);
  }

  // Delete old index if exists
  const exists = await es.indices.exists({ index: INDEX });
  if (exists) {
    console.log('Deleting old index...');
    await es.indices.delete({ index: INDEX });
  }

  // Create index with mappings
  console.log('Creating index with mappings...');
  await es.indices.create({
    index: INDEX,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            ngram_analyzer: {
              type: 'custom',
              tokenizer: 'ngram_tokenizer',
              filter: ['lowercase'],
            },
          },
          tokenizer: {
            ngram_tokenizer: {
              type: 'ngram',
              min_gram: 3,
              max_gram: 4,
              token_chars: ['letter', 'digit'],
            },
          },
        },
        max_ngram_diff: 1,
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          sku: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          vendorPartNumber: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          name: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' },
              ngram: { type: 'text', analyzer: 'ngram_analyzer' },
            },
          },
          slug: { type: 'keyword' },
          description: { type: 'text' },
          shortDescription: { type: 'text' },
          status: { type: 'keyword' },
          basePrice: { type: 'double' },
          salePrice: { type: 'double' },
          gsaPrice: { type: 'double' },
          stockQuantity: { type: 'integer' },
          minimumOrderQty: { type: 'integer' },
          categoryId: { type: 'keyword' },
          categoryName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          categorySlug: { type: 'keyword' },
          brandName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          brandSlug: { type: 'keyword' },
          images: { type: 'keyword' },
          isFeatured: { type: 'boolean' },
          isBestSeller: { type: 'boolean' },
          isNewArrival: { type: 'boolean' },
          taaApproved: { type: 'boolean' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    },
  });
  console.log('Index created!\n');

  // Count products
  const total = await db.product.count({ where: { status: 'ACTIVE', stockQuantity: { gt: 0 } } });
  console.log(`Found ${total} active products to index\n`);

  let indexed = 0;
  let skip = 0;

  while (skip < total) {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE', stockQuantity: { gt: 0 } },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { createdAt: 'desc' },
    });

    if (products.length === 0) break;

    const body = products.flatMap(p => [
      { index: { _index: INDEX, _id: p.id } },
      {
        id: p.id,
        sku: p.sku,
        vendorPartNumber: p.vendorPartNumber,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        status: p.status,
        basePrice: p.basePrice ? parseFloat(p.basePrice.toString()) : 0,
        salePrice: p.salePrice ? parseFloat(p.salePrice.toString()) : null,
        gsaPrice: p.gsaPrice ? parseFloat(p.gsaPrice.toString()) : null,
        stockQuantity: p.stockQuantity,
        minimumOrderQty: p.minimumOrderQty,
        categoryId: p.categoryId,
        categoryName: p.category?.name || null,
        categorySlug: p.category?.slug || null,
        brandName: p.brand?.name || null,
        brandSlug: p.brand?.slug || null,
        images: p.images,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNewArrival: p.isNewArrival,
        taaApproved: p.taaApproved,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    ]);

    const result = await es.bulk({ body, refresh: false });

    if (result.errors) {
      const errors = result.items.filter((i) => i.index?.error);
      console.error(`  ${errors.length} errors in batch`);
      errors.slice(0, 3).forEach((e) => console.error(`    ${e.index.error.reason}`));
    }

    indexed += products.length;
    const pct = ((indexed / total) * 100).toFixed(1);
    console.log(`  Indexed ${indexed}/${total} (${pct}%)`);

    skip += BATCH_SIZE;
  }

  // Refresh index
  console.log('\nRefreshing index...');
  await es.indices.refresh({ index: INDEX });

  // Verify
  const count = await es.count({ index: INDEX });
  console.log(`\n=== Done! ===`);
  console.log(`Products indexed: ${count.count}`);
  console.log(`Index size: check with: curl -s localhost:9200/_cat/indices -u elastic:${ES_PASS}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
