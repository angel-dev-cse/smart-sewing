"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "EXPENSE" | "INCOME" };

export default function NewLedgerEntryForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-mm-ddThh:mm (local-ish)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  // auto-suggest direction based on category kind (still editable)
  function onCategoryChange(nextId: string) {
    setCategoryId(nextId);
    const cat = categories.find((c) => c.id === nextId);
    if (cat?.kind === "INCOME") setDirection("IN");
    if (cat?.kind === "EXPENSE") setDirection("OUT");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountId) return setError("Pick an account.");
    if (!categoryId) return setError("Pick a category.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Amount must be a positive number.");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/ledger/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          categoryId,
          direction,
          amount,
          note: note.trim() || null,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed.");
        setLoading(false);
        return;
      }

      router.push("/admin/ledger");
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Add ledger entry</h1>
          <p className="text-sm text-gray-600">Record any expense/income for balance tracking.</p>
        </div>
        <button
          className="text-sm underline text-gray-700"
          onClick={() => router.push("/admin/ledger")}
          type="button"
        >
          Back
        </button>
      </div>

      <form onSubmit={submit} className="rounded border bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Account</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind} — {c.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <p className="text-xs text-gray-600 mt-1">
              Suggested direction: {selectedCategory.kind === "INCOME" ? "IN" : "OUT"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Direction</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "IN" | "OUT")}
            >
              <option value="OUT">OUT (expense)</option>
              <option value="IN">IN (income)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (BDT)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              inputMode="numeric"
              placeholder="e.g. 500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date/time</label>
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid travel cost, salary, parts purchase..."
          />
        </div>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save entry"}
        </button>
      </form>
    </div>
  );
}
