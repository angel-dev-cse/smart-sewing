"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Unit = {
  id: string;
  ownershipType: string;
  status: string;
  currentLocationId: string | null;
  notes: string | null;
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
  });

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
