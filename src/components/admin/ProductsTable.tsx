'use client';

import { EditableProductRow } from './EditableProductRow';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  stockQuantity: number;
  status: string;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Props {
  products: Product[];
  categories: Category[];
  brands: Brand[];
}

export function ProductsTable({ products, categories, brands }: Props) {
  return (
    <tbody className="divide-y divide-gray-200">
      {products.map((product) => (
        <EditableProductRow
          key={product.id}
          product={product}
          categories={categories}
          brands={brands}
        />
      ))}
    </tbody>
  );
}
