import { ProductForm } from '@/components/admin/ProductForm';
import { db } from '@/lib/db';

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

export default async function NewProductPage() {
  const [categories, brands, suppliers, warehouses] = await Promise.all([
    getCategories(),
    getBrands(),
    getSuppliers(),
    getWarehouses(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Add New Product</h1>
        <p className="text-gray-600">Create a new product in your catalog</p>
      </div>

      <ProductForm
        categories={categories}
        brands={brands}
        suppliers={suppliers}
        warehouses={warehouses}
      />
    </div>
  );
}
