"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRODUCT_TYPES = [
  { value: "MACHINE_SALE", label: "Machine for Sale" },
  { value: "MACHINE_RENT", label: "Machine for Rent" },
  { value: "PART", label: "Part/Accessory" },
] as const;

export default function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    type: "MACHINE_SALE" as const,
    price: "",
    stock: "0",
    isActive: true,
    isAssetTracked: false,
    serialRequired: false,
    brand: "",
    model: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error("Please enter a valid price");
      }

      const stockValue = parseInt(formData.stock);
      if (isNaN(stockValue) || stockValue < 0) {
        throw new Error("Please enter a valid stock quantity");
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: priceValue,
          stock: stockValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/admin/products/${data.product.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-set serialRequired based on product type and asset tracking
    if (field === 'type' || field === 'isAssetTracked') {
      const newData = { ...formData, [field]: value };
      if (newData.isAssetTracked && (newData.type === 'MACHINE_SALE' || newData.type === 'MACHINE_RENT')) {
        setFormData(prev => ({ ...prev, [field]: value, serialRequired: true }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="e.g., JUKI DDL-8700 Industrial Sewing Machine"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => updateFormData("type", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (৳) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => updateFormData("price", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="25000.00"
          />
          <div className="text-xs text-gray-600 mt-1">
            Price in BDT (e.g., 25000 for ৳25,000)
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Stock
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => updateFormData("stock", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
          />
        </div>

        {/* Active Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="isActive"
                checked={formData.isActive}
                onChange={() => updateFormData("isActive", true)}
                className="mr-2"
              />
              Active
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="isActive"
                checked={!formData.isActive}
                onChange={() => updateFormData("isActive", false)}
                className="mr-2"
              />
              Inactive
            </label>
          </div>
        </div>

        {/* Asset Tracking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asset Tracking
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="isAssetTracked"
                checked={formData.isAssetTracked}
                onChange={() => updateFormData("isAssetTracked", true)}
                className="mr-2"
              />
              Enable (Track individual units)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="isAssetTracked"
                checked={!formData.isAssetTracked}
                onChange={() => updateFormData("isAssetTracked", false)}
                className="mr-2"
              />
              Disable
            </label>
          </div>
        </div>

        {/* Serial Required (conditional) */}
        {formData.isAssetTracked && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="serialRequired"
                  checked={formData.serialRequired}
                  onChange={() => updateFormData("serialRequired", true)}
                  className="mr-2"
                />
                Required (manufacturer serial mandatory)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="serialRequired"
                  checked={!formData.serialRequired}
                  onChange={() => updateFormData("serialRequired", false)}
                  className="mr-2"
                />
                Optional
              </label>
            </div>
            {formData.type.startsWith('MACHINE') && (
              <div className="text-xs text-blue-600 mt-1">
                Note: Machines typically require serial numbers
              </div>
            )}
          </div>
        )}

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => updateFormData("brand", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., JUKI, BROTHER, SINGER"
          />
          <div className="text-xs text-gray-600 mt-1">
            Recommended for machine products
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => updateFormData("model", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., DDL-8700, NX-600, Heavy Duty"
          />
          <div className="text-xs text-gray-600 mt-1">
            Recommended for machine products
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Optional product description..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </div>
    </form>
  );
}
