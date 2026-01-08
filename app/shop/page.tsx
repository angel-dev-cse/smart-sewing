import { db } from "@/lib/db";
import { formatBdtFromPaisa } from "@/lib/money";
import Link from "next/link";

export default async function ShopPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shop</h1>

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/p/${product.slug}`}
              className="border rounded-lg bg-white p-4 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">{product.title}</h2>

              <p className="text-sm text-gray-600 mt-1">
                {product.type.replace("_", " ")}
              </p>

              <p className="mt-3 font-bold">{formatBdtFromPaisa(product.price)}</p>

              <p className="text-xs text-gray-500 mt-1">
                Stock: {product.stock}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
