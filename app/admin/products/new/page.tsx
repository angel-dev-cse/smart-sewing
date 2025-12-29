import Link from "next/link";
import NewProductForm from "./ui";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">New Product</h1>
          <p className="text-sm text-gray-600">
            Add a new product to the catalog with asset tracking settings.
          </p>
        </div>

        <Link className="rounded border px-3 py-2 text-sm" href="/admin/products">
          Back
        </Link>
      </div>

      <div className="rounded border bg-white p-6">
        <NewProductForm />
      </div>
    </div>
  );
}
