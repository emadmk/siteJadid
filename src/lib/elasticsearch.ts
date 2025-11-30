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
    esClientInstance = new Client({
      node: getElasticsearchNode(),
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
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
          mappings: {
            properties: {
              id: { type: 'keyword' },
              sku: { type: 'keyword' },
              name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' }
                }
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
              categoryId: { type: 'keyword' },
              categoryName: { type: 'text' },
              images: { type: 'keyword' },
              isFeatured: { type: 'boolean' },
              isBestSeller: { type: 'boolean' },
              isNewArrival: { type: 'boolean' },
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

      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description', 'shortDescription', 'sku^2'],
            fuzziness: 'AUTO',
          },
        });
      }

      const filter: any[] = [{ term: { status: 'ACTIVE' } }];

      if (filters?.categoryId) {
        filter.push({ term: { categoryId: filters.categoryId } });
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

      const result = await esClient.search({
        index: INDICES.PRODUCTS,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
              filter,
            },
          },
          from: (page - 1) * limit,
          size: limit,
          sort: filters?.sort || [{ _score: 'desc' }, { createdAt: 'desc' }],
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
