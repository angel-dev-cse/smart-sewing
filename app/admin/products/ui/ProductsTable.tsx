"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatBdtFromPaisa } from "@/lib/money";

type Product = {
  id: string;
  title: string;
  slug: string;
  type: string;
  price: number;
  stock: number;
  isActive: boolean;
  isAssetTracked: boolean;
  serialRequired: boolean;
  brand: string | null;
  model: string | null;
  createdAt: string;
};

type Filters = {
  type?: string;
  isActive?: string;
  isAssetTracked?: string;
  serialRequired?: string;
  search?: string;
};

type Props = {
  filters: Filters;
};

export default function ProductsTable({ filters }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (filters.type) params.set('type', filters.type);
        if (filters.isActive) params.set('isActive', filters.isActive);
        if (filters.isAssetTracked) params.set('isAssetTracked', filters.isAssetTracked);
        if (filters.serialRequired) params.set('serialRequired', filters.serialRequired);
        if (filters.search) params.set('search', filters.search);

        // For now, we'll fetch all products and filter client-side
        // In a real implementation, this would be server-side filtering
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();

        let filteredProducts = data.products || [];

        // Apply client-side filters
        if (filters.type) {
          filteredProducts = filteredProducts.filter((p: Product) => p.type === filters.type);
        }
        if (filters.isActive !== undefined) {
          const isActive = filters.isActive === 'true';
          filteredProducts = filteredProducts.filter((p: Product) => p.isActive === isActive);
        }
        if (filters.isAssetTracked !== undefined) {
          const isAssetTracked = filters.isAssetTracked === 'true';
          filteredProducts = filteredProducts.filter((p: Product) => p.isAssetTracked === isAssetTracked);
        }
        if (filters.serialRequired !== undefined) {
          const serialRequired = filters.serialRequired === 'true';
          filteredProducts = filteredProducts.filter((p: Product) => p.serialRequired === serialRequired);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.title.toLowerCase().includes(search) ||
            p.slug.toLowerCase().includes(search) ||
            (p.brand && p.brand.toLowerCase().includes(search)) ||
            (p.model && p.model.toLowerCase().includes(search))
          );
        }

        setProducts(filteredProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [filters]);

  const formatPrice = (price: number) => {
    return formatBdtFromPaisa(price);
  };

  if (loading) {
    return (
      <div className="rounded border bg-white p-8 text-center">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="rounded border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Brand/Model</th>
            <th className="px-3 py-2">Asset Tracking</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {product.title}
                </Link>
                <div className="text-xs text-gray-500">{product.slug}</div>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {product.type.replace('_', ' ')}
                </span>
              </td>
              <td className="px-3 py-2 font-mono">
                {formatPrice(product.price)}
              </td>
              <td className="px-3 py-2 font-mono">
                {product.stock}
              </td>
              <td className="px-3 py-2">
                {product.brand && product.model ? (
                  <div>
                    <div className="font-semibold">{product.brand}</div>
                    <div className="text-sm text-gray-600">{product.model}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded ${
                    product.isAssetTracked ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.isAssetTracked ? 'Tracked' : 'Not Tracked'}
                  </div>
                  {product.isAssetTracked && (
                    <div className={`text-xs px-2 py-1 rounded ${
                      product.serialRequired ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {product.serialRequired ? 'Serial Req.' : 'Serial Opt.'}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-600">
                {new Date(product.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-gray-600" colSpan={8}>
                No products found matching the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
