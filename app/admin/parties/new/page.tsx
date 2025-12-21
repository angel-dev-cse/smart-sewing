"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPartyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"CUSTOMER" | "SUPPLIER" | "BOTH">("CUSTOMER");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          type,
          companyName: companyName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          tags,
          notes: notes.trim() || null,
        }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: unknown })?.error === "string"
            ? (data as { error: string }).error
            : "Failed to create contact.";
        throw new Error(msg);
      }

      router.push("/admin/parties");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-bold">New Party</h1>

      <input className="w-full border px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input className="w-full border px-3 py-2" placeholder="Company name (optional)" value={companyName} onChange={e => setCompanyName(e.target.value)} />
      <input className="w-full border px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <input className="w-full border px-3 py-2" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
      <textarea className="w-full border px-3 py-2" placeholder="Address (optional)" value={address} onChange={e => setAddress(e.target.value)} rows={2} />

      <select className="w-full border px-3 py-2" value={type} onChange={e => setType(e.target.value as any)}>
        <option value="CUSTOMER">Customer</option>
        <option value="SUPPLIER">Supplier</option>
        <option value="BOTH">Both</option>
      </select>

      <input
        className="w-full border px-3 py-2"
        placeholder="Tags (comma separated, optional)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <textarea
        className="w-full border px-3 py-2"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
