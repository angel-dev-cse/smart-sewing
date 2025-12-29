"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Location = { id: string; code: string; name: string };
type Product = { id: string; title: string; type: string };

type Filters = {
  ownershipType?: string;
  status?: string;
  locationId?: string;
  productId?: string;
  search?: string;
};

type Props = {
  locations: Location[];
  products: Product[];
  ownershipTypes: readonly string[];
  statuses: readonly string[];
  currentFilters: Filters;
};

export default function UnitsFilters({
  locations,
  products,
  ownershipTypes,
  statuses,
  currentFilters
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  const updateFilters = (updates: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/admin/units?${params}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  return (
    <div className="rounded border bg-white p-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Serial/Tag/Brand/Model
          </label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search..."
              className="border rounded px-3 py-2 text-sm min-w-64"
            />
            <button
              type="submit"
              className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
            >
              Search
            </button>
          </form>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ownership Type
          </label>
          <select
            value={currentFilters.ownershipType || ""}
            onChange={(e) => updateFilters({ ownershipType: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {ownershipTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={currentFilters.status || ""}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            value={currentFilters.locationId || ""}
            onChange={(e) => updateFilters({ locationId: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product
          </label>
          <select
            value={currentFilters.productId || ""}
            onChange={(e) => updateFilters({ productId: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title} ({product.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={() => {
              setSearchValue("");
              router.push("/admin/units");
            }}
            className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
