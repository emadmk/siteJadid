import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { db } from '@/lib/db';

async function getProduct(id: string) {
  return await db.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      defaultSupplier: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      defaultWarehouse: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

async function getCategories() {
  return await db.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      parentId: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getBrands() {
  return await db.brand.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getSuppliers() {
  return await db.supplier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

async function getWarehouses() {
  return await db.warehouse.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories, brands, suppliers, warehouses] = await Promise.all([
    getProduct(params.id),
    getCategories(),
    getBrands(),
    getSuppliers(),
    getWarehouses(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Edit Product</h1>
        <p className="text-gray-600">Update product details</p>
      </div>

      <ProductForm
        product={product}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
        warehouses={warehouses}
      />
    </div>
  );
}
