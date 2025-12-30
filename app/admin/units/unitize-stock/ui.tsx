"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  type: string;
  brand: string | null;
  model: string | null;
  unitizationData: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    stockQty: number;
    unitCount: number;
    unitsNeeded: number;
  }>;
};

type Props = {
  products: Product[];
};

type UnitIdentity = {
  manufacturerSerial?: string;
};

type UnitizationData = {
  productId: string;
  locationId: string;
  count: number;
  reasonNote: string;
  unitIdentities: UnitIdentity[];
};

export default function UnitizeStockUI({ products }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitizationData, setUnitizationData] = useState<UnitizationData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    locationId: string;
    unitsNeeded: number;
    productTitle: string;
    locationCode: string;
  } | null>(null);
  const [reasonNote, setReasonNote] = useState("");
  const [unitIdentities, setUnitIdentities] = useState<UnitIdentity[]>([]);

  const handleUnitizeClick = (productId: string, locationId: string, unitsNeeded: number, productTitle: string, locationCode: string) => {
    setSelectedProduct({ productId, locationId, unitsNeeded, productTitle, locationCode });
    setReasonNote("Go-live unitization for existing tracked stock");
    // Initialize unit identities array with empty manufacturer serials
    setUnitIdentities(Array(unitsNeeded).fill({}).map(() => ({ manufacturerSerial: "" })));
    setShowModal(true);
  };

  const handleIdentityChange = (index: number, manufacturerSerial: string) => {
    const newIdentities = [...unitIdentities];
    newIdentities[index] = { manufacturerSerial };
    setUnitIdentities(newIdentities);
  };

  const handleUnitizeConfirm = async () => {
    if (!selectedProduct || !reasonNote.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/units/unitize-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          locationId: selectedProduct.locationId,
          count: selectedProduct.unitsNeeded,
          reasonNote: reasonNote.trim(),
          unitIdentities: unitIdentities.map(identity => ({
            manufacturerSerial: identity.manufacturerSerial?.trim() || null,
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unitize stock');
      }

      setShowModal(false);
      setSelectedProduct(null);
      setReasonNote("");
      router.refresh(); // Refresh to update the UI

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to unitize stock');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setReasonNote("");
    setUnitIdentities([]);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Stock Qty</th>
              <th className="px-3 py-2">Existing Units</th>
              <th className="px-3 py-2">Units Needed</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product =>
              product.unitizationData.map(locationData => (
                <tr key={`${product.id}-${locationData.locationId}`} className="border-t">
                  <td className="px-3 py-2">
                    <div>
                      <div className="font-semibold">{product.title}</div>
                      <div className="text-xs text-gray-600">
                        {product.brand && product.model
                          ? `${product.brand} ${product.model}`
                          : product.type.replace('_', ' ')
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div>
                      <div className="font-semibold">{locationData.locationCode}</div>
                      <div className="text-xs text-gray-600">{locationData.locationName}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-center">
                    {locationData.stockQty}
                  </td>
                  <td className="px-3 py-2 font-mono text-center">
                    {locationData.unitCount}
                  </td>
                  <td className="px-3 py-2 font-mono text-center font-semibold text-orange-600">
                    {locationData.unitsNeeded}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleUnitizeClick(product.id, locationData.locationId, locationData.unitsNeeded, product.title, locationData.locationCode)}
                      disabled={loading || locationData.unitsNeeded === 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : `Create ${locationData.unitsNeeded} Units`}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded border bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Unitization Process</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Creates individual unit records for existing stock</li>
          <li>• Each unit gets a unique shop tag (SS-M-XXXXX or SS-P-XXXXX)</li>
          <li>• Units are marked as OWNED and placed in their respective locations</li>
          <li>• Stock quantities and ledger entries remain unchanged</li>
          <li>• This is required before you can select specific units in sales/transfers</li>
        </ul>
      </div>

      {/* Modal for unit identity collection */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Unitize Stock - Enter Unit Identities</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Create <strong>{selectedProduct.unitsNeeded}</strong> units for:
              </p>
              <p className="font-medium">{selectedProduct.productTitle}</p>
              <p className="text-sm text-gray-600">Location: {selectedProduct.locationCode}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason Note *
              </label>
              <textarea
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="Enter reason for unitization..."
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                This will be stored for audit purposes
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Identities
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Enter manufacturer serial numbers for each unit. Leave blank to auto-generate shop tags (SS-M-XXXXX format).
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unitIdentities.map((identity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                      Unit {index + 1}:
                    </span>
                    <input
                      type="text"
                      value={identity.manufacturerSerial || ""}
                      onChange={(e) => handleIdentityChange(index, e.target.value)}
                      className="flex-1 border rounded px-3 py-1 text-sm"
                      placeholder="Manufacturer serial (optional)"
                    />
                    <span className="text-xs text-gray-500 min-w-[120px]">
                      {identity.manufacturerSerial?.trim()
                        ? `Tag: ${selectedProduct.productTitle.includes('MOTOR') ? 'SS-M-' : 'SS-P-'}XXXXX`
                        : 'Auto-generated tag'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleUnitizeConfirm}
                disabled={loading || !reasonNote.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Units...' : `Create ${selectedProduct.unitsNeeded} Units`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
