import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import UnitDetail from "./ui";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UnitDetailPage({ params }: Props) {
  const { id } = await params;

  const unit = await db.unit.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, title: true, type: true, isAssetTracked: true, serialRequired: true } },
      ownerParty: { select: { id: true, name: true, type: true, phone: true, address: true } },
      currentLocation: { select: { id: true, code: true, name: true } },
    },
  });

  if (!unit) notFound();

  const locations = await db.location.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Unit</h1>
          <p className="text-sm text-gray-600">
            {unit.brand} {unit.model}
          </p>
          <p className="text-sm text-gray-600">
            Serial: <span className="font-mono">
              {unit.manufacturerSerial || unit.tagCode || "No serial/tag"}
            </span>
          </p>
          <p className="text-xs text-gray-500 font-mono break-all mt-2">{unit.id}</p>
        </div>

        <Link className="text-sm underline" href="/admin/units">
          Back to Units
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Unit Info */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Unit Information</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Ownership Type</dt>
                <dd>{unit.ownershipType.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Status</dt>
                <dd className="font-mono">{unit.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Brand/Model</dt>
                <dd>{unit.brand} {unit.model}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Manufacturer Serial</dt>
                <dd className="font-mono">{unit.manufacturerSerial || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Tag Code</dt>
                <dd className="font-mono">{unit.tagCode || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Unique Serial Key</dt>
                <dd className="font-mono break-all">{unit.uniqueSerialKey || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Product Info */}
          {unit.product && (
            <div className="rounded border bg-white p-4">
              <h2 className="font-semibold mb-3">Product</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Name</dt>
                  <dd>{unit.product.title}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Type</dt>
                  <dd>{unit.product.type}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Asset Tracked</dt>
                  <dd>{unit.product.isAssetTracked ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Serial Required</dt>
                  <dd>{unit.product.serialRequired ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Owner Info */}
          {unit.ownerParty && (
            <div className="rounded border bg-white p-4">
              <h2 className="font-semibold mb-3">Owner</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Name</dt>
                  <dd>{unit.ownerParty.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Type</dt>
                  <dd>{unit.ownerParty.type}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Phone</dt>
                  <dd>{unit.ownerParty.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Address</dt>
                  <dd className="whitespace-pre-wrap">{unit.ownerParty.address || "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Location & Status */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Location & Status</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Current Location</dt>
                <dd>
                  {unit.currentLocation ? (
                    <div>
                      <div className="font-semibold">{unit.currentLocation.code}</div>
                      <div className="text-gray-600">{unit.currentLocation.name}</div>
                    </div>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Edit Form */}
          <UnitDetail unit={unit} locations={locations} />

          {/* Notes */}
          {unit.notes && (
            <div className="rounded border bg-white p-4">
              <h2 className="font-semibold mb-3">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{unit.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Metadata</h2>
            <dl className="space-y-1 text-xs text-gray-600">
              <div>
                <dt className="inline font-medium">Created:</dt>
                <dd className="inline ml-2">{new Date(unit.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Updated:</dt>
                <dd className="inline ml-2">{new Date(unit.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
