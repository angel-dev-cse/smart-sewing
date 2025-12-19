"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-black px-4 py-2 text-white text-sm"
    >
      Print / Save PDF
    </button>
  );
}
