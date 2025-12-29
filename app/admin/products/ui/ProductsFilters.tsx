"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Filters = {
  type?: string;
  isActive?: string;
  isAssetTracked?: string;
  serialRequired?: string;
  search?: string;
};

type Props = {
  currentFilters: Filters;
};

const PRODUCT_TYPES = [
  { value: "MACHINE_SALE", label: "Machine Sale" },
  { value: "MACHINE_RENT", label: "Machine Rent" },
  { value: "PART", label: "Part" },
] as const;

export default function ProductsFilters({ currentFilters }: Props) {
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

    router.push(`/admin/products?${params}`);
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
            Search Products
          </label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search title, slug, brand, model..."
              className="border rounded px-3 py-2 text-sm min-w-80"
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
            Type
          </label>
          <select
            value={currentFilters.type || ""}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {PRODUCT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={currentFilters.isActive || ""}
            onChange={(e) => updateFilters({ isActive: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Tracking
          </label>
          <select
            value={currentFilters.isAssetTracked || ""}
            onChange={(e) => updateFilters({ isAssetTracked: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Tracked</option>
            <option value="false">Not Tracked</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serial Required
          </label>
          <select
            value={currentFilters.serialRequired || ""}
            onChange={(e) => updateFilters({ serialRequired: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>
        </div>

        <div>
          <button
            onClick={() => {
              setSearchValue("");
              router.push("/admin/products");
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
