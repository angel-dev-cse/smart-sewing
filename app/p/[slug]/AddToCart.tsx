"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

export default function AddToCart({
  product,
}: {
  product: { id: string; slug: string; title: string; price: number };
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-6 flex items-center gap-4">
      <button
        onClick={() => {
          addItem({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            price: product.price,
            quantity: 1,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        }}
        className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Add to Cart
      </button>

      <Link href="/cart" className="underline text-gray-700">
        View cart
      </Link>

      {added && <span className="text-sm text-green-700">Added ✅</span>}
    </div>
  );
}
