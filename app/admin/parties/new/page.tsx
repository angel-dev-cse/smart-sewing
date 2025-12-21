"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPartyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [phone, setPhone] = useState("");

  async function submit() {
    await fetch("/api/admin/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, phone }),
    });

    router.push("/admin/parties");
  }

  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-bold">New Party</h1>

      <input className="w-full border px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input className="w-full border px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />

      <select className="w-full border px-3 py-2" value={type} onChange={e => setType(e.target.value as any)}>
        <option value="CUSTOMER">Customer</option>
        <option value="SUPPLIER">Supplier</option>
      </select>

      <button onClick={submit} className="bg-black text-white px-4 py-2">
        Save
      </button>
    </div>
  );
}
