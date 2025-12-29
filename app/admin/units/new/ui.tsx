"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Location = { id: string; code: string; name: string };
type Product = { id: string; title: string; type: string; serialRequired: boolean };
type Party = { id: string; name: string; type: string };

type Props = {
  locations: Location[];
  products: Product[];
  parties: Party[];
};

const OWNERSHIP_TYPES = [
  { value: "OWNED", label: "Owned (Shop Inventory)" },
  { value: "CUSTOMER_OWNED", label: "Customer Owned (Service Intake)" },
  { value: "RENTED_IN", label: "Rented In (Supplier Equipment)" },
] as const;

export default function NewUnitForm({ locations, products, parties }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    ownershipType: "OWNED" as const,
    productId: "",
    brand: "",
    model: "",
    manufacturerSerial: "",
    tagCode: "",
    ownerPartyId: "",
    currentLocationId: locations.find(l => l.code === "SHOP")?.id || "",
    notes: "",
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const isSerialRequired = selectedProduct?.serialRequired || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/admin/units/${data.unit.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create unit");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Reset product-specific fields when ownership type changes
    if (field === "ownershipType") {
      if (value === "CUSTOMER_OWNED") {
        setFormData(prev => ({
          ...prev,
          ownershipType: value as any,
          productId: "", // Customer owned can have product or not
        }));
      } else {
        // OWNED and RENTED_IN require product
        setFormData(prev => ({
          ...prev,
          ownershipType: value as any,
        }));
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
        {/* Ownership Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ownership Type *
          </label>
          <select
            value={formData.ownershipType}
            onChange={(e) => updateFormData("ownershipType", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            {OWNERSHIP_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product (conditional) */}
        {(formData.ownershipType === "OWNED" || formData.ownershipType === "RENTED_IN") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => updateFormData("productId", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} ({product.type})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="text-xs text-gray-600 mt-1">
                {selectedProduct.serialRequired ? "Serial number required" : "Serial number optional"}
              </div>
            )}
          </div>
        )}

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand *
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => updateFormData("brand", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model *
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => updateFormData("model", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Manufacturer Serial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturer Serial {isSerialRequired ? "*" : ""}
          </label>
          <input
            type="text"
            value={formData.manufacturerSerial}
            onChange={(e) => updateFormData("manufacturerSerial", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required={isSerialRequired}
            placeholder="e.g., JUKI-12345"
          />
          <div className="text-xs text-gray-600 mt-1">
            Used to generate unique serial key: BRAND-MODEL-SERIAL
          </div>
        </div>

        {/* Tag Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop Tag Code
          </label>
          <input
            type="text"
            value={formData.tagCode}
            onChange={(e) => updateFormData("tagCode", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., SS-M-000001"
          />
          <div className="text-xs text-gray-600 mt-1">
            Internal tag if no manufacturer serial available
          </div>
        </div>

        {/* Owner Party (conditional) */}
        {(formData.ownershipType === "CUSTOMER_OWNED" || formData.ownershipType === "RENTED_IN") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Party *
            </label>
            <select
              value={formData.ownerPartyId}
              onChange={(e) => updateFormData("ownerPartyId", e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Party</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name} ({party.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Location
          </label>
          <select
            value={formData.currentLocationId}
            onChange={(e) => updateFormData("currentLocationId", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Optional notes about the unit..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Unit"}
        </button>
      </div>
    </form>
  );
}
