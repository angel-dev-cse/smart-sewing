import "./globals.css";
import Link from "next/link";
import { CartProvider } from "@/lib/cart-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <CartProvider>
          <header className="border-b bg-white print:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 flex gap-6">
              <Link href="/" className="font-bold">
                Smart Sewing Solutions
              </Link>
              <Link href="/shop" className="text-gray-600 hover:text-black">
                Shop
              </Link>
              <Link href="/cart" className="text-gray-600 hover:text-black">
                Cart
              </Link>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
