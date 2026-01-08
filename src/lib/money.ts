const BDT_FORMAT = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function bdtFromPaisa(paisa: number) {
  return paisa / 100;
}

export function paisaFromBdt(amount: number) {
  return Math.round(amount * 100);
}

export function formatBdt(amount: number) {
  return `৳ ${BDT_FORMAT.format(amount)}`;
}

export function formatBdtFromPaisa(paisa: number) {
  return formatBdt(bdtFromPaisa(paisa));
}

export function parseBdtToPaisa(
  value: unknown,
  options?: { allowZero?: boolean; minPaisa?: number }
) {
  const raw = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
  if (!Number.isFinite(raw)) return null;

  const paisa = paisaFromBdt(raw);
  if (options?.minPaisa != null && paisa < options.minPaisa) return null;
  if (!options?.allowZero && paisa <= 0) return null;
  return paisa;
}
