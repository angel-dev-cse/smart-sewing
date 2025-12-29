"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Product = {
  id: string;
  title: string;
  type: string;
  price: number;
  stock: number;
  isActive: boolean;
  isAssetTracked: boolean;
  serialRequired: boolean;
  brand: string | null;
  model: string | null;
  description: string | null;
};

type Props = {
  product: Product;
};

const PRODUCT_TYPES = [
  { value: "MACHINE_SALE", label: "Machine for Sale" },
  { value: "MACHINE_RENT", label: "Machine for Rent" },
  { value: "PART", label: "Part/Accessory" },
] as const;

export default function ProductDetail({ product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: product.title,
    type: product.type,
    price: (product.price / 100).toFixed(2), // Convert from paisa to BDT
    stock: product.stock.toString(),
    isActive: product.isActive,
    isAssetTracked: product.isAssetTracked,
    serialRequired: product.serialRequired,
    brand: product.brand || "",
    model: product.model || "",
    description: product.description || "",
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

      // Client-side guardrails: if isAssetTracked=true, brand+model required
      if (formData.isAssetTracked && (!formData.brand.trim() || !formData.model.trim())) {
        throw new Error("Brand and model are required for asset-tracked products");
      }

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: priceValue,
          stock: stockValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh the page to show updated data
      router.refresh();
      setError(""); // Clear any previous errors
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update product");
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push("/admin/products");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border bg-white p-4">
      <h2 className="font-semibold mb-3">Edit Product</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type *
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

        <div className="grid grid-cols-2 gap-4">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => updateFormData("stock", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                Enable
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
        </div>

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
                Required
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand{formData.isAssetTracked ? " *" : ""}
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => updateFormData("brand", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required={formData.isAssetTracked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model{formData.isAssetTracked ? " *" : ""}
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => updateFormData("model", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required={formData.isAssetTracked}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Product"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Delete Product
          </button>
        </div>
      </form>
    </div>
  );
}
