import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 print:hidden">
        <div className="rounded border bg-white p-4">
          <p className="font-bold mb-3">Admin</p>

          <nav className="space-y-2 text-sm">
            <Link className="block underline" href="/admin/orders">
              Orders
            </Link>
            <Link className="block underline" href="/admin/ledger">
              Ledger
            </Link>
            <Link className="block underline" href="/admin/rentals">
              Rentals
            </Link>
            <Link className="block underline" href="/admin/inventory">
              Inventory
            </Link>
            <Link className="block underline" href="/admin/invoices">
              Invoices
            </Link>
            <Link className="block underline" href="/admin/inventory/movements">Movements</Link>
            <Link className="block underline" href="/admin/inventory/adjustments">Adjustments</Link>
            <Link className="block underline" href="/admin/inventory/adjust">Adjust</Link>
            <Link className="block underline" href="/shop">
              Back to shop
            </Link>
            <Link className="block underline" href="/api/admin/logout">
              Logout
            </Link>
          </nav>
        </div>
      </aside>

      <section className="col-span-12 md:col-span-9">{children}</section>
    </div>
  );
}
