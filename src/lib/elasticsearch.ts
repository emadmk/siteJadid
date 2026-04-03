// Elasticsearch client - optional dependency
// This module is server-only and should never be imported in client components
let esClientInstance: any = null;
let elasticsearchAvailable = false;

const getElasticsearchNode = () => {
  return process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
};

// Lazy load Elasticsearch client
const getClient = async () => {
  if (esClientInstance) return esClientInstance;

  try {
    const { Client } = await import('@elastic/elasticsearch');
    const username = process.env.ELASTICSEARCH_USERNAME || 'elastic';
    const password = process.env.ELASTICSEARCH_PASSWORD;
    esClientInstance = new Client({
      node: getElasticsearchNode(),
      auth: password
        ? { username, password }
        : undefined,
      maxRetries: 3,
      requestTimeout: 30000,
    });
    elasticsearchAvailable = true;
    return esClientInstance;
  } catch (error) {
    console.warn('Elasticsearch not available:', error);
    elasticsearchAvailable = false;
    return null;
  }
};

// Index names
export const INDICES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  USERS: 'users',
};

// Initialize indices
export async function initializeIndices() {
  try {
    const esClient = await getClient();
    if (!esClient) return;

    // Products index
    const productsExists = await esClient.indices.exists({ index: INDICES.PRODUCTS });
    if (!productsExists) {
      await esClient.indices.create({
        index: INDICES.PRODUCTS,
        body: {
          settings: {
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
              sku: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
                analyzer: 'standard',
              },
              vendorPartNumber: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' },
                  ngram: {
                    type: 'text',
                    analyzer: 'ngram_analyzer',
                  },
                },
              },
              slug: { type: 'keyword' },
              description: { type: 'text' },
              shortDescription: { type: 'text' },
              status: { type: 'keyword' },
              basePrice: { type: 'double' },
              salePrice: { type: 'double' },
              wholesalePrice: { type: 'double' },
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
      console.log('✅ Products index created');
    }

    // Orders index
    const ordersExists = await esClient.indices.exists({ index: INDICES.ORDERS });
    if (!ordersExists) {
      await esClient.indices.create({
        index: INDICES.ORDERS,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              orderNumber: { type: 'keyword' },
              userId: { type: 'keyword' },
              status: { type: 'keyword' },
              paymentStatus: { type: 'keyword' },
              total: { type: 'double' },
              accountType: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
      console.log('✅ Orders index created');
    }

    console.log('✅ Elasticsearch indices initialized');
  } catch (error) {
    console.warn('Elasticsearch initialization skipped:', error);
  }
}

// Product search functions
export const productSearch = {
  async index(product: any) {
    try {
      const esClient = await getClient();
      if (!esClient) return;

      await esClient.index({
        index: INDICES.PRODUCTS,
        id: product.id,
        document: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          status: product.status,
          basePrice: parseFloat(product.basePrice.toString()),
          salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
          wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice.toString()) : null,
          gsaPrice: product.gsaPrice ? parseFloat(product.gsaPrice.toString()) : null,
          stockQuantity: product.stockQuantity,
          categoryId: product.categoryId,
          categoryName: product.category?.name,
          images: product.images,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          isNewArrival: product.isNewArrival,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      console.warn('Product indexing skipped:', error);
    }
  },

  async bulkIndex(products: any[]) {
    try {
      const esClient = await getClient();
      if (!esClient) return;

      const body = products.flatMap(product => [
        { index: { _index: INDICES.PRODUCTS, _id: product.id } },
        {
          id: product.id,
          sku: product.sku,
          vendorPartNumber: product.vendorPartNumber,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          status: product.status,
          basePrice: parseFloat(product.basePrice?.toString() || '0'),
          salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : null,
          wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice.toString()) : null,
          gsaPrice: product.gsaPrice ? parseFloat(product.gsaPrice.toString()) : null,
          stockQuantity: product.stockQuantity,
          minimumOrderQty: product.minimumOrderQty,
          categoryId: product.categoryId,
          categoryName: product.category?.name,
          categorySlug: product.category?.slug,
          brandName: product.brand?.name,
          brandSlug: product.brand?.slug,
          images: product.images,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          isNewArrival: product.isNewArrival,
          taaApproved: product.taaApproved,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      ]);

      await esClient.bulk({ body, refresh: true });
      console.log(`✅ Indexed ${products.length} products`);
    } catch (error) {
      console.warn('Bulk product indexing skipped:', error);
    }
  },

  async search(query: string, filters?: any, page: number = 1, limit: number = 20) {
    try {
      const esClient = await getClient();
      if (!esClient) {
        // Fallback to empty results if Elasticsearch not available
        return { hits: [], total: 0, page, limit };
      }

      const must: any[] = [];
      const should: any[] = [];

      if (query) {
        const words = query.trim().split(/\s+/);

        must.push({
          bool: {
            should: [
              // TIER 1: Exact phrase in name (highest relevance)
              { match_phrase: { name: { query, boost: 50 } } },

              // TIER 2: All words must appear in name
              { match: { name: { query, operator: 'and', boost: 30 } } },

              // TIER 3: Name fuzzy (for typos) - all words must match
              { match: { name: { query, fuzziness: 'AUTO', operator: 'and', boost: 15 } } },

              // TIER 4: SKU exact or partial
              { term: { 'sku.keyword': { value: query.toUpperCase(), boost: 40 } } },
              { match: { sku: { query, boost: 20 } } },
              { match: { vendorPartNumber: { query, boost: 15 } } },

              // TIER 5: Brand + product combo (e.g. "3M mask")
              ...(words.length >= 2 ? [{
                bool: {
                  must: [
                    { match: { brandName: { query: words[0], boost: 5 } } },
                    { match: { name: { query: words.slice(1).join(' '), boost: 20 } } },
                  ],
                },
              }] : []),

              // TIER 6: Category match
              { match_phrase: { categoryName: { query, boost: 5 } } },

              // TIER 7: Some words in name (for partial matches)
              { match: { name: { query, minimum_should_match: '50%', boost: 8 } } },

              // TIER 8: Description - all words must appear
              { match: { description: { query, operator: 'and', boost: 2 } } },
            ],
            minimum_should_match: 1,
          },
        });

        // Small boost for featured/bestseller
        should.push(
          { term: { isFeatured: { value: true, boost: 1.3 } } },
          { term: { isBestSeller: { value: true, boost: 1.1 } } },
        );
      }

      const filter: any[] = [
        { term: { status: 'ACTIVE' } },
        { range: { stockQuantity: { gt: 0 } } },
      ];

      if (filters?.categoryId) {
        filter.push({ term: { categoryId: filters.categoryId } });
      }

      if (filters?.brandSlug) {
        filter.push({ term: { brandSlug: filters.brandSlug } });
      }

      if (filters?.minPrice || filters?.maxPrice) {
        const range: any = {};
        if (filters.minPrice) range.gte = filters.minPrice;
        if (filters.maxPrice) range.lte = filters.maxPrice;
        filter.push({ range: { basePrice: range } });
      }

      if (filters?.isFeatured) {
        filter.push({ term: { isFeatured: true } });
      }

      if (filters?.taaApproved) {
        filter.push({ term: { taaApproved: true } });
      }

      const result = await esClient.search({
        index: INDICES.PRODUCTS,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              should,
              filter,
            },
          },
          from: (page - 1) * limit,
          size: limit,
          sort: query ? [{ _score: 'desc' }] : [{ createdAt: 'desc' }],
          highlight: query ? {
            fields: { name: {}, description: { fragment_size: 150 } },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
          } : undefined,
        },
      });

      return {
        hits: result.hits.hits.map((hit: any) => hit._source),
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value || 0,
        page,
        limit,
      };
    } catch (error) {
      console.warn('Product search fallback to empty results:', error);
      return { hits: [], total: 0, page, limit };
    }
  },

  async suggest(query: string, limit: number = 5) {
    try {
      const esClient = await getClient();
      if (!esClient) return [];

      const result = await esClient.search({
        index: INDICES.PRODUCTS,
        body: {
          suggest: {
            products: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: limit,
              },
            },
          },
        },
      });

      return result.suggest?.products[0]?.options?.map((opt: any) => opt.text) || [];
    } catch (error) {
      console.warn('Product suggest skipped:', error);
      return [];
    }
  },

  async delete(productId: string) {
    try {
      const esClient = await getClient();
      if (!esClient) return;

      await esClient.delete({
        index: INDICES.PRODUCTS,
        id: productId,
      });
    } catch (error) {
      console.warn('Product delete skipped:', error);
    }
  },
};

export const esClient = { get: getClient };
export default esClient;
