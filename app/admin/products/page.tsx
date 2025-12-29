import Link from "next/link";
import { db } from "@/lib/db";
import ProductsTable from "./ui/ProductsTable";
import ProductsFilters from "./ui/ProductsFilters";

type SearchParams = {
  type?: string;
  isActive?: string;
  isAssetTracked?: string;
  serialRequired?: string;
  search?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-gray-600">
            Manage product catalog, asset tracking settings, and inventory items.
          </p>
        </div>

        <Link className="rounded bg-black px-3 py-2 text-white text-sm" href="/admin/products/new">
          + New product
        </Link>
      </div>

      <ProductsFilters currentFilters={params} />

      <ProductsTable filters={params} />
    </div>
  );
}
