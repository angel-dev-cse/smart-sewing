"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Unit = {
  id: string;
  ownershipType: string;
  status: string;
  currentLocationId: string | null;
  notes: string | null;
  // Phase 8D.2.1: Identity fields for editing
  brand: string;
  model: string;
  manufacturerSerial: string | null;
  tagCode: string | null;
  uniqueSerialKey: string | null;
};

type Location = { id: string; code: string; name: string };

type Props = {
  unit: Unit;
  locations: Location[];
};

const STATUSES = [
  "AVAILABLE",
  "IN_SERVICE",
  "IDLE_AT_CUSTOMER",
  "RENTED_OUT",
  "RENTED_IN_ACTIVE",
  "SOLD",
  "SCRAPPED",
  "RETURNED_TO_SUPPLIER",
  "RETURNED_TO_CUSTOMER"
] as const;

const TERMINAL_STATUSES = ["SOLD", "SCRAPPED", "RETURNED_TO_SUPPLIER", "RETURNED_TO_CUSTOMER"];

export default function UnitDetail({ unit, locations }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    status: unit.status,
    currentLocationId: unit.currentLocationId || "",
    notes: unit.notes || "",
    // Phase 8D.2.1: Identity fields
    brand: unit.brand,
    model: unit.model,
    manufacturerSerial: unit.manufacturerSerial || "",
    tagCode: unit.tagCode || "",
    changeReason: "",
  });

  // Track if identity fields are being changed
  const identityFieldsChanged =
    formData.brand !== unit.brand ||
    formData.model !== unit.model ||
    formData.manufacturerSerial !== (unit.manufacturerSerial || "") ||
    formData.tagCode !== (unit.tagCode || "");

  const isTerminalStatus = TERMINAL_STATUSES.includes(unit.status);
  const isStatusChangeAllowed = !isTerminalStatus || formData.status === unit.status;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh the page to show updated data
      router.refresh();
      setError(""); // Clear any previous errors
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update unit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/units/${unit.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      router.push("/admin/units");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border bg-white p-4">
      <h2 className="font-semibold mb-3">Edit Unit</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            disabled={!isStatusChangeAllowed}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          {isTerminalStatus && (
            <div className="text-xs text-red-600 mt-1">
              Terminal status cannot be changed
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Location
          </label>
          <select
            value={formData.currentLocationId}
            onChange={(e) => setFormData(prev => ({ ...prev, currentLocationId: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">No Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Phase 8D.2.1: Identity Fields */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Identity Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer Serial
              </label>
              <input
                type="text"
                value={formData.manufacturerSerial}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturerSerial: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="ABC123..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Code
              </label>
              <input
                type="text"
                value={formData.tagCode}
                onChange={(e) => setFormData(prev => ({ ...prev, tagCode: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="SS-M-00001..."
              />
            </div>
          </div>
        </div>

        {/* Change Reason - required when identity fields change */}
        {identityFieldsChanged && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Change Reason *
              <span className="text-xs text-gray-500 ml-2">
                Required when updating identity information
              </span>
            </label>
            <textarea
              value={formData.changeReason}
              onChange={(e) => setFormData(prev => ({ ...prev, changeReason: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Explain why identity information is being changed..."
              required={identityFieldsChanged}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Update notes..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Unit"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Delete Unit
          </button>
        </div>
      </form>
    </div>
  );
}
