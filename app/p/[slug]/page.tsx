import { db } from "@/lib/db";
import { bdtFromPaisa, formatBdt } from "@/lib/money";
import { notFound } from "next/navigation";
import AddToCart from "./AddToCart";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const priceBDT = bdtFromPaisa(product.price);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">{product.title}</h1>

      <p className="text-gray-600 mt-2">{product.type.replace("_", " ")}</p>

      <p className="text-xl font-semibold mt-4">{formatBdt(priceBDT)}</p>

      <p className="text-sm text-gray-500 mt-1">Stock: {product.stock}</p>

      <AddToCart
        product={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          // Cart and checkout work with BDT; convert from paisa.
          price: priceBDT,
        }}
      />

      {product.description && (
        <p className="mt-6 leading-relaxed">{product.description}</p>
      )}
    </div>
  );
}
