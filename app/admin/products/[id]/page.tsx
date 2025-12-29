import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductDetail from "./ui";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      price: true,
      stock: true,
      isActive: true,
      isAssetTracked: true,
      serialRequired: true,
      brand: true,
      model: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-sm text-gray-600">
            {product.brand && product.model ? `${product.brand} ${product.model}` : product.type.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-500 font-mono break-all mt-2">{product.id}</p>
        </div>

        <Link className="text-sm underline" href="/admin/products">
          Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Product Information</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Title</dt>
                <dd>{product.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Slug</dt>
                <dd className="font-mono">{product.slug}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Type</dt>
                <dd>{product.type.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Price</dt>
                <dd className="font-mono">৳{(product.price / 100).toLocaleString('en-IN')}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Current Stock</dt>
                <dd className="font-mono">{product.stock}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Brand</dt>
                <dd>{product.brand || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Model</dt>
                <dd>{product.model || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Asset Tracking Info */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Asset Tracking Settings</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Asset Tracked</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.isAssetTracked ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.isAssetTracked ? 'Yes' : 'No'}
                  </span>
                </dd>
              </div>
              {product.isAssetTracked && (
                <div>
                  <dt className="font-medium text-gray-700">Serial Required</dt>
                  <dd>
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.serialRequired ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {product.serialRequired ? 'Required' : 'Optional'}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-700">Status</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded border bg-white p-4">
              <h2 className="font-semibold mb-3">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Edit Form */}
          <ProductDetail product={product} />

          {/* Metadata */}
          <div className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Metadata</h2>
            <dl className="space-y-1 text-xs text-gray-600">
              <div>
                <dt className="inline font-medium">Created:</dt>
                <dd className="inline ml-2">{new Date(product.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Updated:</dt>
                <dd className="inline ml-2">{new Date(product.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
