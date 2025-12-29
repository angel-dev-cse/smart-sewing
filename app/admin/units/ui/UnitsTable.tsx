"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Unit = {
  id: string;
  ownershipType: string;
  manufacturerSerial: string | null;
  tagCode: string | null;
  brand: string;
  model: string;
  status: string;
  product: {
    id: string;
    title: string;
    type: string;
  } | null;
  ownerParty: {
    id: string;
    name: string;
    type: string;
  } | null;
  currentLocation: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdAt: string;
};

type Filters = {
  ownershipType?: string;
  status?: string;
  locationId?: string;
  productId?: string;
  search?: string;
};

type Props = {
  filters: Filters;
};

export default function UnitsTable({ filters }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUnits() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.ownershipType) params.set('ownershipType', filters.ownershipType);
        if (filters.status) params.set('status', filters.status);
        if (filters.locationId) params.set('locationId', filters.locationId);
        if (filters.productId) params.set('productId', filters.productId);
        if (filters.search) params.set('search', filters.search);

        const res = await fetch(`/api/admin/units?${params}`);
        if (!res.ok) throw new Error('Failed to load units');
        const data = await res.json();
        setUnits(data.units);
      } catch (error) {
        console.error('Failed to load units:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUnits();
  }, [filters]);

  const getDisplayId = (unit: Unit) => {
    return unit.manufacturerSerial || unit.tagCode || unit.id.slice(0, 8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'IN_SERVICE': return 'text-blue-600';
      case 'SOLD': return 'text-gray-600';
      case 'SCRAPPED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="rounded border bg-white p-8 text-center">
        <div className="text-gray-600">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="rounded border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2">ID/Serial</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Brand/Model</th>
            <th className="px-3 py-2">Owner</th>
            <th className="px-3 py-2">Location</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">
                <Link
                  href={`/admin/units/${unit.id}`}
                  className="font-mono text-blue-600 hover:underline"
                >
                  {getDisplayId(unit)}
                </Link>
              </td>
              <td className="px-3 py-2">
                {unit.product ? (
                  <div>
                    <div className="font-semibold">{unit.product.title}</div>
                    <div className="text-xs text-gray-600">{unit.product.type}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="font-semibold">{unit.brand}</div>
                <div className="text-sm text-gray-600">{unit.model}</div>
              </td>
              <td className="px-3 py-2">
                {unit.ownerParty ? (
                  <div>
                    <div className="font-semibold">{unit.ownerParty.name}</div>
                    <div className="text-xs text-gray-600">{unit.ownerParty.type}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                {unit.currentLocation ? (
                  <div>
                    <div className="font-semibold">{unit.currentLocation.code}</div>
                    <div className="text-xs text-gray-600">{unit.currentLocation.name}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className={`font-mono ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {unit.ownershipType}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-600">
                {new Date(unit.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}

          {units.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-gray-600" colSpan={8}>
                No units found matching the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
